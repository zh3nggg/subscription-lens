'use strict';
const {price,dollars}=require('./pricing.cjs');
const dayKey=d=>{d=new Date(d);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
function cycleWindow(settings,now=new Date()){
  if(settings.cycleMode!=='monthly')return {start:settings.cycleStart,end:settings.cycleEnd};
  const anchor=Number(settings.billingDay)||1;
  const at=month=>{const d=new Date(now.getFullYear(),month,1);d.setDate(Math.min(anchor,new Date(d.getFullYear(),d.getMonth()+1,0).getDate()));return d;};
  let month=now.getMonth();if(at(month)>now)month--;
  return {start:dayKey(at(month)),end:dayKey(at(month+1))};
}
function aggregate(events,catalog){
  let amount=0n,tokens=0,cached=0,output=0,pricedTokens=0,unpriced=0;const models=new Map(),modelProviders=new Map(),projects=new Map(),sessions=new Map(),days=new Map(),modelsByDay=new Map(),reasons=new Map();
  // Codex session records do not persist the selected upstream provider. Keep
  // an explicit provider when one is available; otherwise only classify model
  // families whose provider is unambiguous. This prevents a routed model from
  // being presented as OpenAI merely because it came through the Codex client.
  const providerFor=event=>{
    if(typeof event.provider==='string'&&event.provider.trim())return event.provider.trim();
    const model=String(event.model||'').trim().toLowerCase();
    const rules=[[/^deepseek(?:[./:_-]|$)/,'DeepSeek'],[/^(?:qwen|qwq)(?:[./:_-]|$)/,'Alibaba Cloud'],[/^(?:kimi|moonshot)(?:[./:_-]|$)/,'Moonshot AI'],[/^(?:glm|zhipu|zai)(?:[./:_-]|$)/,'Zhipu AI'],[/^minimax(?:[./:_-]|$)/,'MiniMax'],[/^claude(?:[./:_-]|$)/,'Anthropic'],[/^gemini(?:[./:_-]|$)/,'Google'],[/^(?:gpt|o[134])(?:[./:_-]|$)/,'OpenAI']];
    return rules.find(([pattern])=>pattern.test(model))?.[1]||'Unknown';
  };
  const put=(map,key,event,p)=>{let group=map.get(key);if(!group){group={key,tokens:0,amount:0n,events:0,unpriced:0,first:event.at,last:event.at,models:new Set(),sessions:new Set()};map.set(key,group);}group.tokens+=event.total??0;group.amount+=BigInt(p.amount??0);group.events++;group.unpriced+=p.amount===null?1:0;group.first=group.first<event.at?group.first:event.at;group.last=group.last>event.at?group.last:event.at;group.models.add(event.model);group.sessions.add(event.session);return group;};
  const rows=events.map(e=>{const p=price(e,catalog);const total=e.total??0;tokens+=total;cached+=e.cached??0;output+=e.output??0;if(p.amount===null){unpriced++;reasons.set(p.reason,(reasons.get(p.reason)||0)+1);}else{amount+=BigInt(p.amount);pricedTokens+=total;}
    put(models,e.model,e,p);const provider=providerFor(e),providerModel=put(modelProviders,JSON.stringify([provider,e.model]),e,p);providerModel.provider=provider;providerModel.model=e.model;put(projects,e.project,e,p);const session=put(sessions,e.session,e,p);session.project=e.project;session.parent=e.parent||null;const day=dayKey(e.at);put(days,day,e,p);if(!modelsByDay.has(day))modelsByDay.set(day,new Map());put(modelsByDay.get(day),e.model,e,p);return {...e,price:{...p,usd:dollars(p.amount)}};});
  const finish=map=>[...map.values()].map(g=>({...g,amount:g.amount.toString(),usd:dollars(g.amount.toString()),models:[...g.models],sessions:g.sessions.size}));
  const modelDays=[...modelsByDay].map(([date,map])=>({date,models:finish(map).map(g=>({...g,model:g.key}))})).sort((a,b)=>a.date.localeCompare(b.date));
  const rank=list=>list.sort((a,b)=>b.usd-a.usd||b.tokens-a.tokens||a.key.localeCompare(b.key));
  return {summary:{tokens,cached,output,pricedTokens,unpriced,events:events.length,sessions:sessions.size,amount:amount.toString(),usd:dollars(amount.toString())},rows,
    models:rank(finish(models)).map(g=>({...g,model:g.key})),modelProviders:rank(finish(modelProviders)).map(g=>({...g,provider:g.provider,model:g.model})),projects:rank(finish(projects)),sessions:rank(finish(sessions)),days:finish(days).map(g=>({...g,date:g.key})).sort((a,b)=>a.date.localeCompare(b.date)),modelsByDay:modelDays,reasons:[...reasons].map(([reason,count])=>({reason,count}))};
}
function continuousDays(days,from,to){
  const byDate=new Map(days.map(d=>[d.date,d]));const start=new Date(from),end=new Date(new Date(to).getTime()-1);start.setHours(0,0,0,0);const count=Math.round((Date.UTC(end.getFullYear(),end.getMonth(),end.getDate())-Date.UTC(start.getFullYear(),start.getMonth(),start.getDate()))/86400000)+1;
  if(count<1||count>370)return days;const result=[];for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){const date=dayKey(d);result.push(byDate.get(date)||{date,tokens:0,usd:0,amount:'0',events:0});}return result;
}
function stableQuotaPoints(points){
  for(let i=points.length-1;i>0;i--)if(points[i].used<points[i-1].used)return points.slice(i);
  return points;
}
function forecastFromQuotaPoints(points,remaining,reset,now,scope){
  if(points.length<3)return null;
  const first=points[0],last=points.at(-1),minutes=(last.at-first.at)/60000,delta=last.used-first.used;
  if(minutes<15||delta<0)return null;
  const secondsToReset=(reset-now)/1000;
  if(delta===0)return {minutes,samples:points.length,percentPerHour:0,seconds:secondsToReset,fastSeconds:secondsToReset,slowSeconds:secondsToReset,scope,from:new Date(first.at).toISOString(),to:new Date(last.at).toISOString()};
  const rate=delta/minutes,seconds=remaining/rate*60;
  const fastSeconds=Math.max(0,remaining-1)/((delta+1)/minutes)*60;
  const slowSeconds=delta>1?(remaining+1)/((delta-1)/minutes)*60:null;
  return {minutes,samples:points.length,percentPerHour:rate*60,seconds,fastSeconds,slowSeconds,scope,from:new Date(first.at).toISOString(),to:new Date(last.at).toISOString()};
}
function quotaOutlook(window,samples,{now=Date.now(),live=false}={}){
  const at=Date.parse(window.observedAt),reset=window.resetsAt*1000;const remaining=Math.max(0,100-window.used);
  const windowStart=Number.isFinite(reset)&&Number.isFinite(window.minutes)&&window.minutes>0?reset-window.minutes*60000:null;
  const emptyForecasts={quota_window:null,recent_24h:null,recent_2h:null};
  const base={...window,remaining,windowStartAt:windowStart,secondsToReset:Number.isFinite(reset)?Math.max(0,(reset-now)/1000):null,forecast:null,forecasts:emptyForecasts};
  if(!Number.isFinite(at)||now-at>180000||at>now+30000||!live)return {...base,state:'stale'};
  if(!Number.isFinite(reset)||reset<=now)return {...base,state:'expired'};
  if(remaining<=0)return {...base,state:'exhausted'};
  // Rate-limit notifications can carry an observation timestamp that is a few
  // seconds behind the local sample write. Keep the upper bound tolerant while
  // using every observation belonging to this exact quota window. The reset
  // epoch isolates samples from previous windows, so no rolling 120-minute
  // cutoff is needed for the full-window estimate.
  const latestAt=Math.max(at,now), upperAt=now-at>30000?latestAt+30000:at;
  let points=samples.filter(s=>s.limit===window.limit&&s.window===window.window&&s.reset===window.resetsAt&&s.at<=upperAt&&(!windowStart||s.at>=windowStart)).sort((a,b)=>a.at-b.at);
  points=stableQuotaPoints(points);
  const full=forecastFromQuotaPoints(points,remaining,reset,now,'quota_window');
  const anchor=points.at(-1)?.at||at;
  const recent=(hours,scope)=>forecastFromQuotaPoints(points.filter(p=>p.at>=anchor-hours*3600000),remaining,reset,now,scope);
  const forecasts={quota_window:full,recent_24h:recent(24,'recent_24h'),recent_2h:recent(2,'recent_2h')};
  if(!full)return {...base,state:'learning',forecasts};
  const secondsToReset=(reset-now)/1000;
  return {...base,state:full.slowSeconds!==null&&full.slowSeconds<secondsToReset?'risk':full.fastSeconds>=secondsToReset?'on_track':'uncertain',forecast:full,forecasts};
}
function quotaAdvice(outlook){const reset=Number(outlook?.secondsToReset),forecast=outlook?.forecast;if(!forecast||!Number.isFinite(reset)||reset<=0)return null;const early=Number.isFinite(forecast.fastSeconds)&&forecast.fastSeconds<reset;const underuse=Number.isFinite(forecast.seconds)&&forecast.seconds>reset*1.25;return early?'early':underuse?'underuse':null;}
function modelMixAdvice(models,outlook){
  const rows=(models||[]).filter(m=>Number.isFinite(m.tokens)&&m.tokens>0).map(m=>{
    const observed=Number.isFinite(m.usd)&&m.usd>0?m.usd/m.tokens*1e6:null;
    const name=String(m.model||m.key||'');
    return {model:name,tokens:m.tokens,intensity:observed,source:observed!==null?'priced':'unknown'};
  });
  const total=rows.reduce((n,m)=>n+m.tokens,0),forecast=outlook?.forecast,reset=outlook?.secondsToReset;
  const base={state:'learning',basis:'api_equivalent',confidence:'low',paceChange:null,current:rows.map(m=>({model:m.model,share:m.tokens/total})),recommended:[]};
  if(rows.length<2)return base;
  const usable=rows.filter(m=>Number.isFinite(m.intensity)&&m.intensity>0);if(usable.length<2)return base;
  const sum=usable.reduce((n,m)=>n+m.tokens,0),current=usable.map(m=>({...m,share:m.tokens/sum}));
  // Local history can still provide a useful baseline while the account
  // quota observer is warming up. Mark it low-confidence and keep the
  // observed mix unchanged until a live pace is available.
  if(!outlook)return base;
  if(!forecast||!Number.isFinite(forecast.seconds)||!Number.isFinite(reset)||reset<=0)return {state:'ready',basis:'local_history',confidence:'low',paceChange:null,current:current.map(({model,share})=>({model,share})),recommended:current.map(({model,share})=>({model,share})),direction:'maintain'};
  const currentIntensity=current.reduce((n,m)=>n+m.share*m.intensity,0),pace=Math.max(.55,Math.min(1.6,forecast.seconds/reset));
  const direction=pace<.95?'reduce':pace>1.05?'increase':'maintain';
  if(direction==='maintain')return {...base,state:'ready',confidence:usable.every(m=>m.source==='priced')?'medium':'low',paceChange:0,current:current.map(({model,share})=>({model,share})),recommended:current.map(({model,share})=>({model,share}))};
  const extreme=[...current].sort((a,b)=>direction==='reduce'?a.intensity-b.intensity:b.intensity-a.intensity)[0];
  const target=currentIntensity*pace,denominator=extreme.intensity-currentIntensity;
  if(Math.abs(denominator)<1e-9)return base;
  const alpha=Math.max(0,Math.min(.6,(target-currentIntensity)/denominator));
  if(alpha<.025)return {...base,state:'ready',confidence:'low',paceChange:Math.round((pace-1)*100),current:current.map(({model,share})=>({model,share})),recommended:current.map(({model,share})=>({model,share}))};
  const recommended=current.map(m=>({model:m.model,share:m.share*(1-alpha)+(m.model===extreme.model?alpha:0)}));
  return {state:'ready',basis:'api_equivalent',confidence:usable.every(m=>m.source==='priced')?'medium':'low',direction,paceChange:Math.round((pace-1)*100),targetModel:extreme.model,current:current.map(({model,share})=>({model,share})),recommended};
}
function alertCandidates(previous,windows,{now=Date.now(),enabled=false,quiet=false}={}){
  const state={...previous};const alerts=[];
  for(const w of windows){const at=Date.parse(w.observedAt);if(!Number.isFinite(at)||now-at>180000||at>now+30000||!w.resetsAt||w.resetsAt*1000<=now)continue;
    const key=w.limit+':'+w.window,old=state[key];if(old?.at>at)continue;const level=w.used>=95?5:w.used>=80?20:null;const resetChanged=old&&old.reset!==w.resetsAt;
    let sent=resetChanged?[]:[...(old?.sent||[])];
    if(enabled){if(resetChanged&&old.used>=80&&w.used<80&&!quiet)alerts.push({type:'reset',window:w});if(level!==null&&!sent.includes(level)){if(!quiet)alerts.push({type:'low',level,window:w});sent.push(level);if(level===5&&!sent.includes(20))sent.push(20);}}
    state[key]={reset:w.resetsAt,used:w.used,sent,at};
  }
  return {state,alerts};
}
function inQuietHours(start,end,now=new Date()){if(start===end)return false;const hour=now.getHours();return start<end?hour>=start&&hour<end:hour>=start||hour<end;}
module.exports={dayKey,cycleWindow,aggregate,continuousDays,quotaOutlook,quotaAdvice,modelMixAdvice,alertCandidates,inQuietHours};
