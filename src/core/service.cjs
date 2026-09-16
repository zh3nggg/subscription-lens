'use strict';
const os=require('node:os'),fs=require('node:fs'),path=require('node:path');
const {EventEmitter}=require('node:events');
const {Monitor}=require('./monitor.cjs');
const {Store}=require('./store.cjs'),{Scanner}=require('./scanner.cjs'),{Account}=require('./account.cjs');
const {price,bundled,validateCatalog}=require('./pricing.cjs');
const {dayKey,cycleWindow,aggregate,continuousDays,quotaOutlook,quotaAdvice,modelMixAdvice,alertCandidates,inQuietHours}=require('./insights.cjs');
const {createDevice,normalizeDevice,safeLabel,packet,importPacket}=require('./devices.cjs');
function validDate(s){return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T00:00:00'))&&dayKey(new Date(s+'T00:00:00'))===s;}
function range(period,settings,now=new Date()){
  let start=new Date(now.getFullYear(),now.getMonth(),now.getDate()),end=new Date(now.getTime()+1);
  if(period==='week')start.setDate(start.getDate()-6);
  else if(period==='month')start=new Date(now.getFullYear(),now.getMonth(),1);
  else if(period==='all')start=new Date('2000-01-01T00:00:00Z');
  else if(period==='cycle'){const c=cycleWindow(settings,now);start=new Date(c.start+'T00:00:00');const e=new Date(c.end+'T00:00:00');if(e<end)end=e;}
  return {from:start.toISOString(),to:end.toISOString()};
}
class Service extends EventEmitter{
  constructor(dir,{home=os.homedir(),now=()=>new Date()}={}){
    super();this.now=now;this.store=new Store(dir);this.scanner=new Scanner(this.store);this.monitor=new Monitor(this.store);this.catalog=this.store.get('catalog',bundled);
    const date=now(),start=dayKey(new Date(date.getFullYear(),date.getMonth(),1)),end=dayKey(new Date(date.getFullYear(),date.getMonth()+1,1));
    this.settings={roots:[],codexPath:null,accountHome:null,accountEnabled:false,cycleStart:start,cycleEnd:end,paid:null,extra:0,language:'system',theme:'system',fontScale:'normal',tray:false,startup:false,cycleMode:'manual',billingDay:1,notifications:false,quietStart:22,quietEnd:8,...this.store.get('settings',{})};
    if(!this.settings.extraCycle)this.settings.extraCycle=this.settings.cycleStart;
    const freshDevice=createDevice(os.hostname());this.device=normalizeDevice(this.store.get('device'),freshDevice);this.store.set('device',this.device);
    this.devices=this.store.get('devices',{});this.devices[this.device.id]={...this.device,lastSeen:new Date().toISOString()};this.store.set('devices',this.devices);
    this.detectedRoot=process.env.CODEX_HOME||path.join(home,'.codex');this.home=home;
    this.account=new Account({home:this.settings.accountHome||this.settings.roots[0]||this.detectedRoot,onChange:status=>this.accountChanged(status)});
    this.timer=null;this.accountTimer=null;
  }
  accountChanged(status){
    if(status.state==='connected'&&status.identity&&status.quota){
      this.store.recordQuota(status.identity,status.quota);
      const key='alerts:'+status.identity;const result=alertCandidates(this.store.get(key,{}),status.quota.windows,{now:this.now().getTime(),enabled:this.settings.notifications,quiet:inQuietHours(this.settings.quietStart,this.settings.quietEnd,this.now())});this.store.set(key,result.state);
      if(result.alerts.length)this.emit('alert',result.alerts);
    }
    this.emit('changed');
  }
  start(){this.scan();this.timer=setInterval(()=>this.scan(),15000);if(this.settings.accountEnabled)this.account.refresh(this.settings.codexPath);this.accountTimer=setInterval(()=>{if(this.settings.accountEnabled)this.account.refresh(this.settings.codexPath);},60000);}
  async scan(){if(this.monitor.running||this.scanner.running)return;if(this.settings.roots.length)await this.scanner.scan(this.settings.roots,()=>this.emit('changed'),this.device.id);await this.monitor.scan();this.emit('changed');}
  effectiveSettings(){const c=cycleWindow(this.settings,this.now());return {...this.settings,cycleStart:c.start,cycleEnd:c.end,extra:this.settings.cycleMode==='monthly'&&this.settings.extraCycle!==c.start?0:this.settings.extra};}
  saveSettings(input){
    const next={...this.settings};
    for(const k of ['cycleStart','cycleEnd'])if(input[k]!==undefined){if(!validDate(input[k]))throw new Error('日期无效');next[k]=input[k];}
    if(next.cycleStart>=next.cycleEnd)throw new Error('结束日期必须晚于开始日期');
    for(const k of ['paid','extra'])if(input[k]!==undefined){if(input[k]===null&&k==='paid')next[k]=null;else{const n=Number(input[k]);if(!Number.isFinite(n)||n<0||n>1000000)throw new Error('实付金额无效');next[k]=Math.round(n*100)/100;}}
    if(input.language!==undefined){if(!['system','zh-CN','en-US','nl-NL'].includes(input.language))throw new Error('语言无效');next.language=input.language;}
    if(input.theme!==undefined){if(!['system','light','dark'].includes(input.theme))throw new Error('主题无效');next.theme=input.theme;}
    if(input.fontScale!==undefined){if(!['normal','large','xlarge'].includes(input.fontScale))throw new Error('文字大小无效');next.fontScale=input.fontScale;}
    if(input.cycleMode!==undefined){if(!['manual','monthly'].includes(input.cycleMode))throw new Error('账期模式无效');next.cycleMode=input.cycleMode;}
    for(const [key,min,max] of [['billingDay',1,31],['quietStart',0,23],['quietEnd',0,23]])if(input[key]!==undefined){const n=Number(input[key]);if(!Number.isInteger(n)||n<min||n>max)throw new Error('设置数值无效');next[key]=n;}
    for(const k of ['tray','startup','notifications'])if(typeof input[k]==='boolean')next[k]=input[k];
    if(input.extra!==undefined)next.extraCycle=cycleWindow(next,this.now()).start;
    this.settings=next;this.store.set('settings',next);this.emit('changed');return this.effectiveSettings();
  }
  async addRoot(root){const resolved=await fs.promises.realpath(root);let found=false;for(const name of ['sessions','archived_sessions']){try{if((await fs.promises.stat(path.join(resolved,name))).isDirectory())found=true;}catch{}}if(!found)throw new Error('请选择包含 sessions 或 archived_sessions 的 Codex 目录');if(!this.settings.roots.some(r=>r.toLowerCase()===resolved.toLowerCase())){this.settings.roots.push(resolved);this.store.set('settings',this.settings);}if(this.settings.roots.length===1&&!this.settings.accountEnabled){this.account.home=resolved;this.settings.accountHome=resolved;this.store.set('settings',this.settings);}await this.scan();return resolved;}
  removeRoot(root){if(this.scanner.running)throw new Error('正在读取，请稍后重试');if(!this.settings.roots.includes(root))throw new Error('目录不存在');this.settings.roots=this.settings.roots.filter(r=>r!==root);this.scanner.status.roots=(this.scanner.status.roots||[]).filter(r=>r.path!==root);this.scanner.status.errors=this.scanner.status.roots.filter(r=>r.state==='unavailable').length;this.store.set('settings',this.settings);this.emit('changed');return true;}
  async enableAccount(){this.settings.accountEnabled=true;this.store.set('settings',this.settings);return this.account.refresh(this.settings.codexPath);}
  disableAccount(){this.settings.accountEnabled=false;this.store.set('settings',this.settings);this.account.stop();this.emit('changed');}
  setCodexPath(exe){this.settings.codexPath=exe;this.store.set('settings',this.settings);this.account.stop();this.account.preferred=exe;this.emit('changed');}
  catalogImport(json){const c=validateCatalog(json);this.store.set('catalogBackup',this.catalog);this.catalog=c;this.store.set('catalog',c);this.emit('changed');}
  catalogReset(){this.store.set('catalogBackup',this.catalog);this.catalog=bundled;this.store.set('catalog',bundled);this.emit('changed');}
  select(events,filters){const query=String(filters.query||'').slice(0,200).toLowerCase();return events.filter(e=>(!filters.device||e.device===filters.device)&&(!filters.model||e.model===filters.model)&&(!filters.project||e.project===filters.project)&&(!filters.session||e.session===filters.session)&&(!filters.unpriced||price(e,this.catalog).amount===null)&&(!query||(e.project+' '+e.model+' '+e.session).toLowerCase().includes(query)));}
  query(filters={}){
    const now=this.now(),settings=this.effectiveSettings();const period=['today','week','month','cycle','all'].includes(filters.period)?filters.period:'month';let r=range(period,settings,now);
    if(filters.day&&validDate(filters.day)){const d=new Date(filters.day+'T00:00:00'),end=new Date(d);end.setDate(end.getDate()+1);r={from:d.toISOString(),to:new Date(Math.min(end.getTime(),now.getTime()+1)).toISOString()};}
    const raw=this.store.events(r.from,r.to,this.device.id),events=this.select(raw,filters),a=aggregate(events,this.catalog);
    for(const event of raw)if(!this.devices[event.device])this.devices[event.device]={id:event.device,label:event.device===this.device.id?this.device.label:'Imported device',createdAt:event.at,lastSeen:event.at};
    this.devices[this.device.id]={...this.devices[this.device.id],lastSeen:new Date().toISOString()};this.store.set('devices',this.devices);
    const deviceRows=Object.values(this.devices).map(device=>{const deviceEvents=raw.filter(event=>event.device===device.id),summary=aggregate(deviceEvents,this.catalog).summary;return {...device,local:device.id===this.device.id,summary,lastSeen:deviceEvents.reduce((last,event)=>last>event.at?last:event.at,device.lastSeen||null)};}).filter(device=>device.local||device.summary.events>0).sort((a,b)=>b.summary.tokens-a.summary.tokens||a.label.localeCompare(b.label));
    const quota=this.account.status.quota||this.store.get('recordQuota');const samples=this.store.quotaSamples(this.account.status.identity);
    const outlooks=(quota?.windows||[]).map(w=>{const outlook=quotaOutlook({...w,observedAt:w.observedAt||quota.observedAt},samples,{now:now.getTime(),live:this.settings.accountEnabled&&this.account.status.state==='connected'&&quota.source==='account'});return {...outlook,advice:quotaAdvice(outlook)};});
    const primaryOutlook=[...(outlooks.filter(w=>w.limit==='codex').length?outlooks.filter(w=>w.limit==='codex'):outlooks)].sort((a,b)=>b.used-a.used)[0];
    const recentFrom=new Date(now.getTime()-14*86400000).toISOString(),recent=aggregate(this.select(this.store.events(recentFrom,new Date(now.getTime()+1).toISOString(),this.device.id),filters),this.catalog);
    const mixAdvice=modelMixAdvice(recent.models,primaryOutlook);
    const c=cycleWindow(settings,now),cycleRaw=period==='cycle'&&!filters.day?raw:this.store.events(new Date(c.start+'T00:00:00').toISOString(),new Date(Math.min(new Date(c.end+'T00:00:00').getTime(),now.getTime()+1)).toISOString(),this.device.id);
    const ca=aggregate(this.select(cycleRaw,filters),this.catalog),paid=settings.paid===null?null:settings.paid+settings.extra;
    const duration=new Date(r.to)-new Date(r.from);let comparison=null;
    if(period!=='all'&&duration>0){const previousRange={from:new Date(new Date(r.from).getTime()-duration).toISOString(),to:r.from};const previous=aggregate(this.select(this.store.events(previousRange.from,previousRange.to),filters),this.catalog).summary;comparison={range:previousRange,usd:previous.usd,tokens:previous.tokens,events:previous.events,change:previous.usd>0?(a.summary.usd-previous.usd)/previous.usd:null};}
    const offset=Math.max(0,Math.min(1000000,Math.floor(Number(filters.offset)||0))),limit=Math.max(1,Math.min(200,Math.floor(Number(filters.limit)||50)));
    const sessionRows=filters.sort==='recent'?[...a.sessions].sort((x,y)=>y.last.localeCompare(x.last)):a.sessions;
    const stats=this.store.stats(),fileStats=this.store.fileStats();
    return {monitor:this.monitor.query(filters,r,this.catalog),period,range:r,summary:{...a.summary,diff:period==='cycle'&&paid!==null&&events.length?a.summary.usd-paid:null,ratio:period==='cycle'&&paid>0&&events.length?a.summary.usd/paid:null},models:a.models,projects:a.projects.slice(0,50),sessions:sessionRows.slice(offset,offset+limit),sessionTotal:a.sessions.length,days:continuousDays(a.days,period==='all'?(a.days[0]?.date?new Date(a.days[0].date+'T00:00:00').toISOString():r.to):r.from,r.to),rows:(filters.sort==='cost'?[...a.rows].sort((x,y)=>(y.price.usd??-1)-(x.price.usd??-1)||y.at.localeCompare(x.at)):a.rows.reverse()).slice(offset,offset+limit),offset,limit,quota,outlooks,comparison,
      cycle:{...c,...ca.summary,paid,extra:settings.extra,diff:paid!==null&&ca.summary.events?ca.summary.usd-paid:null,progress:paid>0?ca.summary.usd/paid:null,remaining:paid!==null?Math.max(0,paid-ca.summary.usd):null,elapsedDays:Math.max(0,(Math.min(now,new Date(c.end+'T00:00:00'))-new Date(c.start+'T00:00:00'))/86400000),days:Math.round((Date.parse(c.end+'T12:00:00Z')-Date.parse(c.start+'T12:00:00Z'))/86400000)},
      health:{reasons:a.reasons,partial:events.filter(e=>['partial_history','ambiguous'].includes(e.quality)).length,readErrors:this.scanner.status.errors,parseErrors:fileStats.errors,priceAgeDays:Math.max(0,Math.floor((now-Date.parse(this.catalog.asOf+'T00:00:00Z'))/86400000))},
      mixAdvice,account:this.account.status,settings,scanner:this.scanner.status,stats,fileStats,allModels:this.store.allModels(),catalog:this.catalog,detectedRoot:this.detectedRoot,devices:deviceRows,currentDevice:this.device,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone};
  }
  renameDevice(id,label){label=safeLabel(label);if(!label)throw Error('设备名称无效');const device=this.devices[id];if(!device)throw Error('设备不存在');this.devices[id]={...device,label};if(id===this.device.id){this.device={...this.device,label};this.store.set('device',this.device);}this.store.set('devices',this.devices);this.emit('changed');return this.devices[id];}
  exportDeviceLedger(){const events=this.store.events('2000-01-01T00:00:00.000Z',new Date(this.now().getTime()+1).toISOString(),this.device.id).filter(event=>event.device===this.device.id).map(event=>({...event,ledgerCost:price(event,this.catalog).amount}));return packet(this.device,events);}
  importDeviceLedger(value){const imported=importPacket(value);if(imported.device.id===this.device.id)throw Error('不能导入当前设备的数据包');this.devices[imported.device.id]={...(this.devices[imported.device.id]||{}),...imported.device,lastSeen:new Date().toISOString()};this.store.set('devices',this.devices);const added=this.store.importEvents('device-ledger:'+imported.device.id,imported.records);this.emit('changed');return {device:this.devices[imported.device.id],added};}
  exportRows(filters){let r=range(filters.period||'month',this.effectiveSettings(),this.now());if(filters.day&&validDate(filters.day)){const start=new Date(filters.day+'T00:00:00'),end=new Date(start);end.setDate(end.getDate()+1);r={from:start.toISOString(),to:new Date(Math.min(end.getTime(),this.now().getTime()+1)).toISOString()};}let rows=this.store.events(r.from,r.to,this.device.id);if(filters.day&&validDate(filters.day))rows=rows.filter(e=>dayKey(e.at)===filters.day);return this.select(rows,filters).map(e=>({...e,price:price(e,this.catalog)}));}
  async close(){clearInterval(this.timer);clearInterval(this.accountTimer);this.account.stop();while(this.scanner.running||this.monitor.running)await new Promise(r=>setTimeout(r,50));this.store.close();}
}
module.exports={Service,range,dayKey,validDate};
