'use strict';
const fs=require('node:fs'),fsp=fs.promises,path=require('node:path'),crypto=require('node:crypto');
const {DatabaseSync}=require('node:sqlite');
const {price,dollars,decimalUnits}=require('./pricing.cjs');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const label=(s,fallback='unknown')=>typeof s==='string'&&s.trim()?s.replace(/[\x00-\x1f]/g,' ').slice(0,180):fallback;
const count=v=>Number.isSafeInteger(v)&&v>=0?v:null;
const cost=v=>{if(v===null||v===undefined||v==='')return null;try{const n=decimalUnits(v,15);return n<=1000000000n*10n**15n?n.toString():null;}catch{return null;}};
const instant=v=>{const n=typeof v==='number'?(v<1e12?v*1000:v):Date.parse(v);return Number.isFinite(n)&&n>0&&n<=8640000000000000?new Date(n).toISOString():null;};
function providerIdentity(provider,model,authoritative=false){
 const p=String(provider||'').trim().toLowerCase(),m=String(model||'').trim().toLowerCase();
 if(authoritative)return label(provider);
 const modelRules=[
  [/^(?:qwen(?:\d|[./:_-]|$)|qwq(?:\d|[./:_-]|$))/,'Alibaba Cloud'],[/^(?:kimi-code\/|kimi(?:[./:_-]|$)|moonshot(?:[./:_-]|$))/,'Moonshot AI'],
  [/^(?:glm(?:\d|[./:_-]|$)|zhipu(?:[./:_-]|$)|zai(?:[./:_-]|$))/,'Zhipu AI'],[/^minimax(?:\d|[./:_-]|$)/,'MiniMax'],[/^deepseek(?:\d|[./:_-]|$)/,'DeepSeek'],
  [/^(?:gpt|o[134])(?:[./:_-]|$)/,'OpenAI'],[/^claude(?:[./:_-]|$)/,'Anthropic'],[/^gemini(?:[./:_-]|$)/,'Google']
 ];
 for(const [pattern,name] of modelRules)if(pattern.test(m))return name;
 const providerRules=[
  [/(?:^|[^a-z0-9])(?:qwen|dashscope|aliyun|alibaba)(?:$|[^a-z0-9])|通义|阿里/,'Alibaba Cloud'],
  [/(?:^|[^a-z0-9])(?:kimi|moonshot)(?:$|[^a-z0-9])|月之暗面/,'Moonshot AI'],
  [/(?:^|[^a-z0-9])(?:zhipu|bigmodel|z\.ai|glm)(?:$|[^a-z0-9])|智谱/,'Zhipu AI'],
  [/(?:^|[^a-z0-9])minimax(?:$|[^a-z0-9])/,'MiniMax'],[/(?:^|[^a-z0-9])deepseek(?:$|[^a-z0-9])|深度求索/,'DeepSeek']
 ];
 for(const [pattern,name] of providerRules)if(pattern.test(p))return name;
 return label(provider);
}
function normalized(raw){
 const at=instant(raw.at),input=count(raw.input),output=count(raw.output),cached=count(raw.cached??0),write=count(raw.write??0),reasoning=count(raw.reasoning??0);
 if(!at||!raw.id||input===null||output===null||cached===null||write===null||reasoning===null||cached+write>input||reasoning>output||!Number.isSafeInteger(input+output))return null;
 return {id:hash(String(raw.id)),at,provider:providerIdentity(raw.provider,raw.model,raw.providerAuthoritative),model:label(raw.model),session:label(raw.session,''),project:label(raw.project,''),input,output,cached,write,reasoning,total:input+output,tokenBasis:raw.tokenBasis==='estimated'?'estimated':'measured',
  status:count(raw.status),latencyMs:count(raw.latencyMs),ttftMs:count(raw.ttftMs),amount:cost(raw.usd),sourceAmount:cost(raw.sourceAmount),sourceUnit:label(raw.sourceUnit,''),basis:raw.basis==='reported'?'reported':'estimate',origin:label(raw.origin),pricingModel:label(raw.pricingModel,raw.model||'unknown')};
}
function ccRecord(r,provider){
 const input=count(r.input_tokens),cached=count(r.cache_read_tokens??0),write=count(r.cache_creation_tokens??0);if(input===null||cached===null||write===null)return null;
 const inclusive=['codex','gemini','grokbuild'].includes(r.app_type);
 const semantics=Number(r.input_token_semantics||0);
 // Legacy inclusive rows included cache reads only; v11 total rows include both subsets.
 const totalInput=semantics===1?input:semantics===2?input+cached+write:inclusive?input+write:input+cached+write;
 // Zero costs with tokens and no pricing identity are unknown, not evidence of free usage.
 let usd=r.total_cost_usd;if(Number(usd)===0&&input+Number(r.output_tokens)>0)usd=null;
 return normalized({id:r.request_id,at:r.created_at,provider:provider||r.provider_id,model:r.model,pricingModel:r.pricing_model||r.request_model||r.model,
  input:totalInput,cached,write,output:r.output_tokens,session:r.session_id,project:r.app_type,status:r.status_code,latencyMs:r.latency_ms,ttftMs:r.first_token_ms,usd,basis:'estimate',origin:'cc-switch:'+label(r.data_source,'proxy')});
}
function jsonRecord(r){if(!r||r.schema!=='subscription-lens.usage.v1'||r.currency&&r.currency!=='USD')return null;return normalized({id:r.id,at:r.at,provider:r.provider,providerAuthoritative:true,model:r.model,session:r.session,project:r.project,input:r.usage?.input,output:r.usage?.output,cached:r.usage?.cached,write:r.usage?.write,reasoning:r.usage?.reasoning,status:r.status,latencyMs:r.latencyMs,ttftMs:r.ttftMs,usd:r.cost?.usd,basis:r.cost?.basis,origin:'usage-jsonl'});}
function claudeRecord(r,project){
 if(r.type!=='assistant'||!r.message?.id||!r.sessionId||!r.message.usage)return null;const u=r.message.usage;
 const input=count(u.input_tokens),cached=count(u.cache_read_input_tokens??0),write=count(u.cache_creation_input_tokens??0);if(input===null||cached===null||write===null)return null;
 return normalized({id:r.sessionId+':'+r.message.id,at:r.timestamp,provider:'Anthropic',model:r.message.model,session:r.sessionId,project,input:input+cached+write,cached,write,output:u.output_tokens,origin:'claude-code'});
}
function geminiRecords(r,project){if(!r.sessionId||!Array.isArray(r.messages))return [];return r.messages.filter(m=>m.type==='gemini'&&m.id&&m.tokens).map(m=>{const u=m.tokens,output=count(u.output),thoughts=count(u.thoughts??0);if(output===null||thoughts===null)return null;return normalized({id:r.sessionId+':'+m.id,at:m.timestamp,provider:'Google',model:m.model,session:r.sessionId,project,input:u.input,cached:u.cached??0,output:output+thoughts,reasoning:thoughts,origin:'gemini-cli'});}).filter(Boolean);}
function qwenRecord(r){
 if(!r||r.schemaVersion!==1||!r.id||!r.sessionId)return null;const input=count(r.inputTokens),cached=count(r.cachedTokens),output=count(r.outputTokens),thoughts=count(r.thoughtsTokens);if([input,cached,output,thoughts].includes(null))return null;
 return normalized({id:r.id,at:r.timestamp,provider:'Qwen Code',model:r.model,session:r.sessionId,project:r.source||'Qwen Code',input,cached,output:output+thoughts,reasoning:thoughts,latencyMs:r.apiDurationMs,origin:'qwen-code'});
}
function kimiRecord(r,meta={}){
 if(!r||r.type!=='usage.record'||r.usageScope!=='turn'||!r.usage)return null;const u=r.usage,inputOther=count(u.inputOther),cached=count(u.inputCacheRead),write=count(u.inputCacheCreation),output=count(u.output);if([inputOther,cached,write,output].includes(null))return null;
 const identity=r.id||[meta.relative||'',r.time,r.model,JSON.stringify(u)].join('|');
 return normalized({id:identity,at:r.time,provider:'Kimi Code',model:r.model,session:meta.session,project:meta.project,input:inputOther+cached+write,cached,write,output,origin:'kimi-code'});
}
function codebuddyRecord(r,meta={}){
 if(!r||!['message','function_call','assistant'].includes(r.type)||r.type==='message'&&r.role!=='assistant')return null;const raw=r.providerData?.rawUsage,u=r.message?.usage;if(!raw&&!u)return null;
 let input,cached,write,output,reasoning;if(raw){const hit=count(raw.prompt_cache_hit_tokens??raw.prompt_tokens_details?.cached_tokens??0),created=count(raw.prompt_cache_write_tokens??0),prompt=count(raw.prompt_tokens),explicitMiss=count(raw.prompt_cache_miss_tokens),completion=count(raw.completion_tokens),thinking=count(raw.completion_thinking_tokens??0);if([hit,created,completion,thinking].includes(null))return null;const miss=explicitMiss??(prompt===null?null:prompt-hit-created);if(miss===null||miss<0)return null;input=miss+hit+created;cached=hit;write=created;output=completion;reasoning=thinking;}else{input=count(u.input_tokens);cached=count(u.cache_read_input_tokens??0);write=count(u.cache_creation_input_tokens??0);output=count(u.output_tokens);reasoning=count(u.reasoning_output_tokens??0);if([input,cached,write,output,reasoning].includes(null)||cached+write>input)return null;}
 const model=r.providerData?.model||r.message?.model||r.model,identity=r.id||r.providerData?.messageId||[meta.relative||'',meta.offset||0,r.timestamp,model].join('|');
 return normalized({id:identity,at:r.timestamp,provider:'CodeBuddy',model,session:r.sessionId||meta.session,project:meta.project,input,cached,write,output,reasoning,latencyMs:r.providerData?.latencyMs,origin:'codebuddy-code'});
}
function qoderRecord(r,meta={}){
 if(!r||typeof r!=='object'||r.type==='result'||r.type==='system')return null;
 // Quest writes cumulative context snapshots to the IDE agent log rather than
 // a per-request usage file. Keep one latest row per session so snapshots and
 // resumed prompts do not become duplicate requests.
 if(Number.isSafeInteger(r.usedTokens)&&r.usedTokens>=0&&r.sessionId)return normalized({id:'quest-context:'+r.sessionId,at:r._logAt||meta.lineAt,provider:'Qoder',model:'Qoder Quest',session:r.sessionId,project:'Qoder Quest',input:r.usedTokens,output:0,tokenBasis:'estimated',origin:'qoder-quest-context',basis:'estimate'});
 const envelope=r.message?.message||r.message;
 const u=envelope?.usage||r.message?.usage||r.usage||r.data?.usage;if(!u||typeof u!=='object')return null;
 const n=(...keys)=>{for(const key of keys)if(u[key]!==undefined)return u[key];return 0;};
 const input=count(n('input_tokens','inputTokens','prompt_tokens')),cached=count(n('cache_read_input_tokens','cacheReadInputTokens','cached_tokens')),write=count(n('cache_creation_input_tokens','cacheCreationInputTokens','cache_write_input_tokens')),output=count(n('output_tokens','outputTokens','completion_tokens')),reasoning=count(n('reasoning_tokens','reasoningTokens','reasoning_output_tokens'));
 const credits=u.credits??u.original_credits??r.credits??r.original_credits;
 if([input,cached,write,output,reasoning].includes(null)||cached+write>input||reasoning>output)return null;
 if(credits===undefined&&input===0&&output===0)return null;
 const model=envelope?.model||r.message?.model||r.model||r.data?.model||'unknown',session=r.session_id||r.sessionId||r.data?.session_id||meta.session;
 const id=envelope?.id||r.message?.id||r.id||[meta.relative||'',meta.offset||0,r.timestamp||r.created_at,model,credits].join('|');
 return normalized({id,at:r.timestamp||r.created_at||r.at,provider:'Qoder',model,session,project:r.project||meta.project,input,cached,write,output,reasoning,sourceAmount:credits,sourceUnit:'Credits',origin:'qoder-cli',basis:'reported'});
}
function qoderLine(line){
 const at=(line.match(/^(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)/)||[])[1]||null;
 try{const r=JSON.parse(line);if(r&&at)r._logAt=at;return r;}catch{}
 const start=line.indexOf('{');if(start<0)return null;try{const r=JSON.parse(line.slice(start));if(r&&at)r._logAt=at;return r;}catch{return null;}
}
function qoderRoots(root){
 const roots=[root],roaming=process.env.APPDATA&&path.join(process.env.APPDATA,'Qoder','logs');
 if(roaming&&path.resolve(root).toLowerCase()===path.join(require('node:os').homedir(),'.qoder').toLowerCase()&&fs.existsSync(roaming))roots.push(roaming);
 return roots;
}
async function listFiles(root,kind){const out=[],codebuddyProjects=path.basename(root).toLowerCase()==='projects';async function walk(dir,depth){if(depth>10||out.length>=25000)return;for(const item of await fsp.readdir(dir,{withFileTypes:true})){if(item.isSymbolicLink())continue;const file=path.join(dir,item.name);if(item.isDirectory())await walk(file,depth+1);else if(item.isFile()){
  const rel=path.relative(root,file).replaceAll('\\','/');const match=kind==='gemini'?/^session-.*\.json$/.test(item.name):kind==='qwen'?/^token-usage-\d{4}-\d{2}\.jsonl$/.test(item.name):kind==='kimi'?item.name==='wire.jsonl'&&/(^|\/)agents\/[^/]+\/wire\.jsonl$/.test(rel):kind==='codebuddy'?item.name.endsWith('.jsonl')&&!/(^|\/)tool-results\//.test(rel)&&(codebuddyProjects||rel.startsWith('projects/')):kind==='qoder'?/^(qodercli\.log|agent\.log|quest\.log|renderer\.log|usage.*\.jsonl|events.*\.jsonl|subscription-lens\.jsonl)$/i.test(item.name):item.name.endsWith('.jsonl');if(match)out.push(file);
 }}}await walk(root,0);return out.sort();}
class Monitor{
 constructor(store){this.store=store;this.running=false;this.sources=store.get('monitorSources',[]);this.states={};store.db.exec(`CREATE TABLE IF NOT EXISTS monitor_events(connection TEXT NOT NULL,id TEXT NOT NULL,at TEXT NOT NULL,provider TEXT NOT NULL,model TEXT NOT NULL,data TEXT NOT NULL,PRIMARY KEY(connection,id));CREATE INDEX IF NOT EXISTS monitor_time ON monitor_events(connection,at);CREATE TABLE IF NOT EXISTS monitor_files(connection TEXT NOT NULL,path TEXT NOT NULL,offset INTEGER NOT NULL,mtime REAL NOT NULL,size INTEGER NOT NULL,PRIMARY KEY(connection,path));`);
 this.put=store.db.prepare('INSERT INTO monitor_events VALUES(?,?,?,?,?,?) ON CONFLICT(connection,id) DO UPDATE SET at=excluded.at,provider=excluded.provider,model=excluded.model,data=excluded.data WHERE data<>excluded.data');}
 save(){this.store.set('monitorSources',this.sources);}
 setRate(provider,model,input){provider=label(provider);model=label(model);const rates={};for(const key of ['input','cached','write','output']){const v=String(input[key]??'');if(decimalUnits(v)>1000000n*1000000000n)throw Error('价格超出范围');rates[key]=v;}const all=this.store.get('monitorRates',{});all[hash(JSON.stringify([provider,model]))]={provider,model,rates,updatedAt:new Date().toISOString()};this.store.set('monitorRates',all);return true;}
 async add(kind,file){if(!['cc-switch','claude','gemini','qwen','kimi','codebuddy','qoder','usage-jsonl'].includes(kind))throw Error('不支持的来源');const resolved=await fsp.realpath(file),st=await fsp.stat(resolved);if(['claude','gemini','qwen','kimi','codebuddy','qoder'].includes(kind)?!st.isDirectory():!st.isFile())throw Error('来源类型不匹配');
 if(this.sources.some(s=>s.path.toLowerCase()===resolved.toLowerCase()))throw Error('来源已添加');
 if(kind==='cc-switch'){const db=new DatabaseSync(resolved,{readOnly:true});try{this.columns(db);}finally{db.close();}}
 const s={id:hash(kind+'|'+resolved).slice(0,24),kind,path:resolved,enabled:true,budget:null};this.sources.push(s);this.save();await this.scan();return s;
 }
 configure(id,input){const s=this.sources.find(s=>s.id===id);if(!s)throw Error('来源不存在');if(typeof input.enabled==='boolean')s.enabled=input.enabled;if(input.budget!==undefined){if(input.budget!==null&&(!Number.isFinite(input.budget)||input.budget<0||input.budget>1000000))throw Error('预算金额无效');s.budget=input.budget;}this.save();return s;}
 columns(db){const columns=new Set(db.prepare('PRAGMA table_info(proxy_request_logs)').all().map(c=>c.name));for(const k of ['request_id','provider_id','app_type','model','input_tokens','output_tokens','created_at'])if(!columns.has(k))throw Error('不支持的用量数据库');return columns;}
 async scan(){if(this.running)return;this.running=true;try{for(const s of this.sources){if(!s.enabled)continue;this.states[s.id]={...this.states[s.id],state:'reading'};try{const stats=s.kind==='cc-switch'?await this.readCC(s):await this.readLocal(s);this.states[s.id]={state:'ready',at:new Date().toISOString(),...stats};}catch(e){this.states[s.id]={...this.states[s.id],state:'error',error:['SQLITE_BUSY','ERR_SQLITE_ERROR'].includes(e.code)?'来源暂不可用':'读取来源失败'};}}}finally{this.running=false;}}
 async readCC(s){const db=new DatabaseSync(s.path,{readOnly:true});let imported=0,invalid=0;try{db.exec('PRAGMA query_only=ON; PRAGMA busy_timeout=1000;');const cols=this.columns(db);
 const allowed=['request_id','provider_id','app_type','model','request_model','pricing_model','input_tokens','output_tokens','cache_read_tokens','cache_creation_tokens','input_token_semantics','total_cost_usd','status_code','session_id','latency_ms','first_token_ms','created_at','data_source'];
 const selected=allowed.filter(c=>cols.has(c)).map(c=>'"'+c+'"').join(',');const names=new Map();
 const providerColumns=new Set(db.prepare('PRAGMA table_info(providers)').all().map(c=>c.name));if(['id','name','app_type'].every(k=>providerColumns.has(k)))for(const p of db.prepare('SELECT id,name,app_type FROM providers').all())names.set(p.app_type+'|'+p.id,p.name);
 // Keyset batches keep the UI responsive. Re-read history so upstream cost corrections are reflected.
 let after='';for(;;){const rows=db.prepare(`SELECT ${selected} FROM proxy_request_logs WHERE request_id>? ORDER BY request_id LIMIT 1000`).all(after);if(!rows.length)break;this.store.db.exec('BEGIN');try{for(const row of rows){const e=ccRecord(row,names.get(row.app_type+'|'+row.provider_id));if(e)imported+=Number(this.put.run(s.id,e.id,e.at,e.provider,e.model,JSON.stringify(e)).changes);else invalid++;}this.store.db.exec('COMMIT');}catch(e){this.store.db.exec('ROLLBACK');throw e;}after=rows.at(-1).request_id;await new Promise(r=>setImmediate(r));}
 return {imported,invalid};}finally{db.close();}}
 async readLocal(s){let imported=0,invalid=0;const roots=s.kind==='qoder'?qoderRoots(s.path):[s.path],files=s.kind==='usage-jsonl'?[s.path]:(await Promise.all(roots.map(root=>listFiles(root,s.kind)))).flat();for(const file of files){const st=await fsp.stat(file),cp=this.store.db.prepare('SELECT * FROM monitor_files WHERE connection=? AND path=?').get(s.id,file);if(cp&&cp.size===st.size&&cp.mtime===st.mtimeMs)continue;const project=path.basename(path.dirname(file));
 if(s.kind==='gemini'){if(st.size>32*1024*1024){invalid++;continue;}const r=JSON.parse(await fsp.readFile(file,'utf8'));const events=geminiRecords(r,project);for(const e of events)imported+=Number(this.put.run(s.id,e.id,e.at,e.provider,e.model,JSON.stringify(e)).changes);this.checkpoint(s,file,st.size,st);continue;}
 const start=cp&&st.size>=cp.offset&&!(st.size===cp.size&&st.mtimeMs!==cp.mtime)?cp.offset:0;let offset=start,pending=Buffer.alloc(0),discard=false;const stream=fs.createReadStream(file,{start,highWaterMark:256*1024});
 for await(const chunk of stream){pending=Buffer.concat([pending,chunk]);let pos;while((pos=pending.indexOf(10))>=0){const line=pending.subarray(0,pos);pending=pending.subarray(pos+1);offset+=pos+1;if(discard){discard=false;continue;}if(line.length>8*1024*1024){invalid++;continue;}try{const text=line.toString('utf8'),r=s.kind==='qoder'?qoderLine(text):JSON.parse(text),relative=path.relative(s.path,file).replaceAll('\\','/'),parts=relative.split('/'),agents=parts.lastIndexOf('agents'),meta={relative,offset,lineAt:r?._logAt||null,session:agents>0?parts[agents-1]:path.basename(file,'.jsonl'),project:agents>1?parts[agents-2]:project};const e=s.kind==='claude'?claudeRecord(r,project):s.kind==='qwen'?qwenRecord(r):s.kind==='kimi'?kimiRecord(r,meta):s.kind==='codebuddy'?codebuddyRecord(r,meta):s.kind==='qoder'?qoderRecord(r,meta):jsonRecord(r);if(e)imported+=Number(this.put.run(s.id,e.id,e.at,e.provider,e.model,JSON.stringify(e)).changes);else if(s.kind==='usage-jsonl'||s.kind==='qwen'||s.kind==='kimi'&&r.type==='usage.record'&&r.usageScope==='turn'||s.kind==='codebuddy'&&r.providerData?.rawUsage)invalid++;}catch{invalid++;}}
 if(pending.length>8*1024*1024){offset+=pending.length;pending=Buffer.alloc(0);discard=true;invalid++;}}
 // Never commit past an unfinished record, including oversized records.
 this.checkpoint(s,file,discard?start:offset,st);
 }return {imported,invalid,files:files.length};}
 checkpoint(s,file,offset,st){this.store.db.prepare('INSERT INTO monitor_files VALUES(?,?,?,?,?) ON CONFLICT(connection,path) DO UPDATE SET offset=excluded.offset,mtime=excluded.mtime,size=excluded.size').run(s.id,file,offset,st.mtimeMs,st.size);}
 sourcesInfo(){return this.sources.map(s=>({...s,...(this.states[s.id]||{state:'idle'}),records:this.store.db.prepare('SELECT COUNT(*) n FROM monitor_events WHERE connection=?').get(s.id).n}));}
 query(filters,range,catalog){const source=this.sources.find(s=>s.id===filters.connection)||this.sources[0];const rows=source?this.store.db.prepare('SELECT data FROM monitor_events WHERE connection=? AND at>=? AND at<? ORDER BY at DESC,id').all(source.id,range.from,range.to).map(r=>JSON.parse(r.data)):[];
 const providers=[...new Set(rows.map(r=>r.provider))].sort(),models=[...new Set(rows.map(r=>r.model))].sort();const search=String(filters.query||'').slice(0,200).toLowerCase();
 const selected=rows.filter(e=>(!filters.provider||e.provider===filters.provider)&&(!filters.model||e.model===filters.model)&&(!filters.failed||e.status!==null&&(e.status<200||e.status>=400))&&(!search||[e.provider,e.model,e.session,e.project].join(' ').toLowerCase().includes(search)));
 const groups=new Map(),modelGroups=new Map(),days=new Map();let tokens=0,input=0,cached=0,output=0,estimated=0n,reported=0n,sourceCredits=0n,sourceCreditRecords=0,estimatedRecords=0,reportedRecords=0,unpriced=0,knownStatus=0,failed=0;const latency=[],ttft=[];
 const rates=this.store.get('monitorRates',{});
 const priced=selected.map(e=>{let amount=e.amount,basis=e.basis,priceSource=e.amount===null?null:e.origin;const custom=rates[hash(JSON.stringify([e.provider,e.model]))];if(amount===null&&custom){const usage={input:e.input-e.cached-e.write,cached:e.cached,write:e.write,output:e.output};amount=Object.entries(usage).reduce((n,[key,tokens])=>n+BigInt(tokens)*decimalUnits(custom.rates[key]),0n).toString();basis='estimate';priceSource='custom';}if(amount===null&&e.provider==='OpenAI'){amount=price({...e,model:e.pricingModel,quality:'complete'},catalog).amount;basis='estimate';priceSource=amount===null?null:'catalog';}return {...e,amount,basis,priceSource,usd:dollars(amount)};});
 const filtered=filters.unpriced?priced.filter(e=>e.amount===null):priced;
 for(const e of filtered){tokens+=e.total;input+=e.input;cached+=e.cached;output+=e.output;if(e.sourceAmount!==null){sourceCredits+=BigInt(e.sourceAmount);sourceCreditRecords++;}if(e.amount===null)unpriced++;else if(e.basis==='reported'){reported+=BigInt(e.amount);reportedRecords++;}else {estimated+=BigInt(e.amount);estimatedRecords++;}if(e.status!==null){knownStatus++;if(e.status<200||e.status>=400)failed++;}if(e.latencyMs!==null)latency.push(e.latencyMs);if(e.ttftMs!==null)ttft.push(e.ttftMs);
 const day=new Date(e.at);const date=`${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`;
 for(const [map,key] of [[groups,e.provider],[modelGroups,JSON.stringify([e.provider,e.model])],[days,date]]){const g=map.get(key)||{key,provider:e.provider,model:e.model,tokens:0,requests:0,estimated:0n,reported:0n,estimatedRecords:0,reportedRecords:0,unpriced:0};g.tokens+=e.total;g.requests++;if(e.amount===null)g.unpriced++;else {const basis=e.basis==='reported'?'reported':'estimated';g[basis]+=BigInt(e.amount);g[basis+'Records']++;}map.set(key,g);}}
 const finish=map=>[...map.values()].map(g=>({...g,estimated:dollars(g.estimated.toString()),reported:dollars(g.reported.toString())}));const percentile=(v,p)=>v.length?[...v].sort((a,b)=>a-b)[Math.ceil(v.length*p)-1]:null;
 const limit=Math.max(1,Math.min(200,Math.floor(Number(filters.limit)||50))),offset=Math.max(0,Math.floor(Number(filters.offset)||0)),sorted=filters.sort==='cost'?[...filtered].sort((a,b)=>(b.usd??-1)-(a.usd??-1)):filtered;
 return {source:source?.id||null,sources:this.sourcesInfo(),providers,models,rates:Object.values(rates),summary:{estimatedRecords,reportedRecords,sourceCreditRecords,sourceCredits:dollars(sourceCredits.toString()),requests:filtered.length,tokens,input,cached,output,estimated:dollars(estimated.toString()),reported:dollars(reported.toString()),unpriced,knownStatus,failed,successRate:knownStatus?(knownStatus-failed)/knownStatus:null,p50:percentile(latency,.5),p95:percentile(latency,.95),ttft:percentile(ttft,.5)},groups:finish(groups),modelGroups:finish(modelGroups),days:finish(days).sort((a,b)=>a.key.localeCompare(b.key)),rows:filters.export?sorted:sorted.slice(offset,offset+limit),offset,limit,range};
 }
}
module.exports={Monitor,normalized,providerIdentity,ccRecord,jsonRecord,claudeRecord,geminiRecords,qwenRecord,kimiRecord,codebuddyRecord,qoderRecord,cost};
