'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const {spawn}=require('node:child_process');
const {sanitizeQuota,hash}=require('./parser.cjs');
async function exists(p){try{return (await fs.stat(p)).isFile();}catch{return false;}}
async function discoverCodex(preferred){
  if(preferred&&await exists(preferred))return preferred;
  for(const dir of (process.env.PATH||'').split(path.delimiter)){const p=path.join(dir,'codex.exe');if(await exists(p))return p;}
  const base=path.join(process.env.LOCALAPPDATA||path.join(os.homedir(),'AppData','Local'),'OpenAI','Codex','bin');
  try{const dirs=await fs.readdir(base,{withFileTypes:true});const list=[];for(const d of dirs){if(!d.isDirectory())continue;const p=path.join(base,d.name,'codex.exe');if(await exists(p))list.push({p,mtime:(await fs.stat(p)).mtimeMs});}list.sort((a,b)=>b.mtime-a.mtime);if(list.length)return list[0].p;}catch{}
  const npm=path.join(process.env.APPDATA||path.join(os.homedir(),'AppData','Roaming'),'npm','node_modules','@openai');
  for(const p of [path.join(npm,'codex','vendor','x86_64-pc-windows-msvc','codex','codex.exe'),path.join(npm,'codex-win32-x64','vendor','x86_64-pc-windows-msvc','codex','codex.exe')])if(await exists(p))return p;
  return null;
}
class Account{
  constructor({home,onChange=()=>{}}){this.home=home;this.onChange=onChange;this.seq=0;this.pending=new Map();this.child=null;this.ready=null;this.status={state:'disconnected',plan:null,identity:null,quota:null,usage:null,lastError:null};this.preferred=null;this.loginId=null;}
  emit(){this.onChange(this.status);}
  async connect(preferred){if(this.ready)return this.ready;const generation=this.generation;this.preferred=preferred||this.preferred;this.ready=this.start(generation).catch(e=>{if(generation===this.generation){this.ready=null;this.status.state='error';this.status.lastError=e.code||'unavailable';this.emit();}throw e;});return this.ready;}
  async start(generation){
    const exe=await discoverCodex(this.preferred);if(!exe){const e=new Error('未找到 Codex');e.code='missing_codex';throw e;}
    if(generation!==this.generation)throw new Error('连接已取消');
    this.status.state='connecting';this.emit();
    const env={...process.env,CODEX_HOME:this.home,HOME:path.dirname(this.home),USERPROFILE:path.dirname(this.home)};
    this.child=spawn(exe,['app-server','--stdio'],{windowsHide:true,stdio:['pipe','pipe','pipe'],env});let buffer='';
    this.child.stdout.setEncoding('utf8');this.child.stdout.on('data',chunk=>{buffer+=chunk;if(buffer.length>8*1024*1024){this.stop();return;}let i;while((i=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,i);buffer=buffer.slice(i+1);try{this.message(JSON.parse(line));}catch{}}});
    this.child.stderr.resume(); // Never persist upstream stderr or authentication material.
    this.child.on('error',()=>this.fail('process'));this.child.on('exit',()=>this.fail('closed'));
    const init=await this.call('initialize',{clientInfo:{name:'subscription_lens',title:'Subscription Lens',version:'1.4.0-beta.4'},capabilities:{experimentalApi:true}});
    this.status.version=typeof init?.userAgent==='string'?init.userAgent.slice(0,180):null;
    this.send({method:'initialized'});return true;
  }
  send(data){if(!this.child?.stdin.writable)throw new Error('Codex 未连接');this.child.stdin.write(JSON.stringify(data)+'\n');}
  call(method,params={},timeout=20000){return new Promise((resolve,reject)=>{const id=++this.seq;const timer=setTimeout(()=>{this.pending.delete(id);const e=new Error('查询超时');e.code='timeout';reject(e);},timeout);this.pending.set(id,{resolve,reject,timer});try{this.send({id,method,params});}catch(e){clearTimeout(timer);this.pending.delete(id);reject(e);}});}
  message(msg){
    if(msg.id!==undefined&&this.pending.has(msg.id)){const p=this.pending.get(msg.id);clearTimeout(p.timer);this.pending.delete(msg.id);if(msg.error){const e=new Error('账户接口暂不可用');e.code=msg.error.code===-32601?'unsupported':'upstream';p.reject(e);}else p.resolve(msg.result);return;}
    if(msg.method==='account/login/completed'){this.loginId=null;if(msg.params?.success)this.refresh().catch(()=>{});else{this.status.state='disconnected';this.status.lastError='login_failed';this.emit();}}
    if(msg.method==='account/updated'){this.status.quota=null;this.status.usage=null;this.status.identity=null;this.refresh().catch(()=>{});}
    if(msg.method==='account/rateLimits/updated'){const q=sanitizeQuota(msg.params,new Date().toISOString());if(q&&this.status.identity){this.status.quota=q;this.emit();}}
  }
  async refresh(preferred){
    if(this.refreshing)return this.status;this.refreshing=true;const generation=this.generation;
    try{await this.connect(preferred);const r=await this.call('account/read',{});const acc=r.account;
      if(generation!==this.generation)return this.status;
      if(!acc||acc.type!=='chatgpt'){this.status={...this.status,state:'signed_out',plan:null,identity:null,quota:null,usage:null,lastError:null};this.emit();return this.status;}
      const identity=hash((acc.email||'unknown')+'|'+this.home+'|'+acc.planType);if(this.status.identity!==identity){this.status.quota=null;this.status.usage=null;}
      this.status.identity=identity;this.status.plan=acc.planType;this.status.state='connected';this.status.lastError=null;
      try{const raw=await this.call('account/rateLimits/read',{});if(generation!==this.generation)return this.status;this.status.quota=sanitizeQuota(raw,new Date().toISOString());if(!this.status.quota)this.status.lastError='no_quota';}catch(e){if(generation!==this.generation)return this.status;this.status.lastError=e.code||'upstream';this.status.state='degraded';}
      // Usage summary is optional and has a slower cadence than quota.
      if(!this.usageUnsupported&&(!this.status.usage||Date.now()-Date.parse(this.status.usage.observedAt)>600000)){
        try{const raw=await this.call('account/usage/read',{},12000);if(generation!==this.generation)return this.status;const n=x=>Number.isSafeInteger(x)&&x>=0?x:null;this.status.usage={observedAt:new Date().toISOString(),lifetimeTokens:n(raw.summary?.lifetimeTokens),daily:Array.isArray(raw.dailyUsageBuckets)?raw.dailyUsageBuckets.slice(-365).map(d=>({date:String(d.startDate).slice(0,10),tokens:n(d.tokens)})):null};}catch(e){if(generation!==this.generation)return this.status;if(e.code==='unsupported')this.usageUnsupported=true;}
      }
      this.status.updatedAt=new Date().toISOString();this.emit();return this.status;
    }catch(e){if(generation===this.generation){this.status.state='error';this.status.lastError=e.code||'unavailable';this.emit();}return this.status;}finally{this.refreshing=false;}
  }
  async login(preferred){await this.connect(preferred);const r=await this.call('account/login/start',{type:'chatgpt'},20000);this.loginId=r.loginId;this.status.state='awaiting_login';this.emit();return r.authUrl;}
  async cancelLogin(){if(this.loginId){await this.call('account/login/cancel',{loginId:this.loginId}).catch(()=>{});this.loginId=null;this.status.state='disconnected';this.emit();}}
  fail(code){for(const p of this.pending.values()){clearTimeout(p.timer);const e=new Error('Codex 连接已关闭');e.code=code;p.reject(e);}this.pending.clear();this.ready=null;if(this.status.state!=='disconnected'){this.status.state='error';this.status.lastError=code;this.emit();}}
  stop(){this.generation=(this.generation||0)+1;const child=this.child;this.child=null;this.status.state='disconnected';this.ready=null;if(child){child.removeAllListeners('exit');child.removeAllListeners('error');child.stdin?.end();child.kill();}this.fail('closed');}
}
module.exports={Account,discoverCodex};
