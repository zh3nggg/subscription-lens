'use strict';
const crypto=require('node:crypto');
const path=require('node:path');
const fields=['input_tokens','cached_input_tokens','cache_write_input_tokens','output_tokens','reasoning_output_tokens','total_tokens'];
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const clean=s=>typeof s==='string'?s.slice(0,180):null;
function number(v){return Number.isSafeInteger(v)&&v>=0?v:null;}
function counters(raw){if(!raw)return null;return Object.fromEntries(fields.map(k=>[k,number(raw[k])]));}
function newState(){return {session:null,model:null,project:null,parent:null,turn:null,previous:null,epoch:0,modelChanged:false,seq:0};}
function parseRecord(record,state){
  if(!record||typeof record!=='object')return {};
  const p=record.payload||{};
  if(record.type==='session_meta'){
    state.session=clean(p.id)||state.session;
    state.project=typeof p.cwd==='string'?path.win32.basename(p.cwd.replace(/\//g,'\\')):null;
    state.parent=clean(p.source?.subagent?.thread_spawn?.parent_thread_id)||clean(p.parent_thread_id);
    return {};
  }
  if(record.type==='turn_context'){
    if(state.model&&p.model&&state.model!==p.model)state.modelChanged=true;
    state.model=clean(p.model)||state.model;state.turn=clean(p.turn_id)||state.turn;
    if(typeof p.cwd==='string')state.project=path.win32.basename(p.cwd.replace(/\//g,'\\'));
    return {};
  }
  if(record.type!=='event_msg'||p.type!=='token_count')return {};
  const quota=p.rate_limits?sanitizeQuota(p.rate_limits,record.timestamp,'record'):null;
  if(!p.info||!state.session)return {quota};
  const total=counters(p.info.total_token_usage),last=counters(p.info.last_token_usage);
  if(!total||total.total_tokens===null)return {quota};
  state.seq++;
  const previous=state.previous;let usage=last,quality='complete';
  if(previous){
    if(total.total_tokens===previous.total_tokens&&fields.every(k=>total[k]===previous[k]))return {quota};
    if(total.total_tokens<previous.total_tokens){state.epoch++;quality='reset';}
    else {
      const delta=Object.fromEntries(fields.map(k=>[k,total[k]===null||previous[k]===null?null:total[k]-previous[k]]));
      if(fields.some(k=>delta[k]!==null&&delta[k]<0)){quality='ambiguous';usage=last;}
      else if(!last||delta.total_tokens!==last.total_tokens){quality='ambiguous';usage=delta;}
      else usage=last;
    }
  }else if(!last||last.total_tokens!==total.total_tokens){usage=last||total;quality='partial_history';}
  state.previous=total;
  if(!usage)return {quota};
  const id=hash([state.session,state.epoch,...fields.map(k=>total[k])].join('|'));
  const timestamp=Date.parse(record.timestamp);if(!Number.isFinite(timestamp))return {quota,warning:'timestamp'};
  const e={id,session:state.session,parent:state.parent,turn:state.turn,model:state.model||'unknown',project:clean(state.project)||'未分类',at:new Date(timestamp).toISOString(),input:usage.input_tokens,cached:usage.cached_input_tokens,write:usage.cache_write_input_tokens,output:usage.output_tokens,reasoning:usage.reasoning_output_tokens,total:usage.total_tokens,quality};
  if(e.reasoning===null)e.reasoning=0; // Auxiliary only; output remains authoritative.
  if(e.total===null&&e.input!==null&&e.output!==null)e.total=e.input+e.output;
  if(state.modelChanged&&quality==='ambiguous')e.model='unknown';
  state.modelChanged=false;
  return {event:e,quota};
}
function sanitizeQuota(raw,observedAt,source='account'){
  const windows=[];
  if(!raw||typeof raw!=='object')return null;
  const byLimit=new Map();
  const fallback=raw.rateLimits||raw.rate_limits;
  if(fallback)byLimit.set(clean(fallback.limitId??fallback.limit_id)||'codex',fallback);
  const indexed=raw.rateLimitsByLimitId||raw.rate_limits_by_limit_id;
  if(indexed&&typeof indexed==='object')for(const [id,bucket] of Object.entries(indexed)){
    if(!bucket||typeof bucket!=='object')continue;
    const limit=clean(bucket.limitId??bucket.limit_id)||clean(id)||'codex';
    byLimit.set(limit,{...bucket,limitId:limit});
  }
  const buckets=byLimit.size?[...byLimit.values()]:[raw];
  for(const bucket of buckets){if(!bucket)continue;for(const key of ['primary','secondary']){const v=bucket[key];if(!v)continue;const used=v.usedPercent??v.used_percent,mins=v.windowDurationMins??v.window_minutes,resets=v.resetsAt??v.resets_at;
    if(typeof used!=='number'||!Number.isFinite(used))continue;
    windows.push({limit:clean(bucket.limitId??bucket.limit_id)||'codex',label:clean(bucket.limitName??bucket.limit_name),window:key,used:Math.max(0,used),minutes:number(mins),resetsAt:number(resets),plan:clean(bucket.planType??bucket.plan_type),observedAt});
  }}
  windows.sort((a,b)=>(a.limit==='codex'?-1:0)-(b.limit==='codex'?-1:0)||a.limit.localeCompare(b.limit)||a.window.localeCompare(b.window));
  return windows.length?{windows,observedAt,source}:null;
}
module.exports={parseRecord,newState,sanitizeQuota,hash};
