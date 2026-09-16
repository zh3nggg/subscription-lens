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
  let amount=0n,tokens=0,cached=0,output=0,pricedTokens=0,unpriced=0;const models=new Map(),projects=new Map(),sessions=new Map(),days=new Map(),reasons=new Map();
  const put=(map,key,event,p)=>{let group=map.get(key);if(!group){group={key,tokens:0,amount:0n,events:0,unpriced:0,first:event.at,last:event.at,models:new Set(),sessions:new Set()};map.set(key,group);}group.tokens+=event.total??0;group.amount+=BigInt(p.amount??0);group.events++;group.unpriced+=p.amount===null?1:0;group.first=group.first<event.at?group.first:event.at;group.last=group.last>event.at?group.last:event.at;group.models.add(event.model);group.sessions.add(event.session);return group;};
  const rows=events.map(e=>{const p=price(e,catalog);const total=e.total??0;tokens+=total;cached+=e.cached??0;output+=e.output??0;if(p.amount===null){unpriced++;reasons.set(p.reason,(reasons.get(p.reason)||0)+1);}else{amount+=BigInt(p.amount);pricedTokens+=total;}
    put(models,e.model,e,p);put(projects,e.project,e,p);const session=put(sessions,e.session,e,p);session.project=e.project;session.parent=e.parent||null;put(days,dayKey(e.at),e,p);return {...e,price:{...p,usd:dollars(p.amount)}};});
  const finish=map=>[...map.values()].map(g=>({...g,amount:g.amount.toString(),usd:dollars(g.amount.toString()),models:[...g.models],sessions:g.sessions.size}));
  const rank=list=>list.sort((a,b)=>b.usd-a.usd||b.tokens-a.tokens||a.key.localeCompare(b.key));
  return {summary:{tokens,cached,output,pricedTokens,unpriced,events:events.length,sessions:sessions.size,amount:amount.toString(),usd:dollars(amount.toString())},rows,
    models:rank(finish(models)).map(g=>({...g,model:g.key})),projects:rank(finish(projects)),sessions:rank(finish(sessions)),days:finish(days).map(g=>({...g,date:g.key})).sort((a,b)=>a.date.localeCompare(b.date)),reasons:[...reasons].map(([reason,count])=>({reason,count}))};
}
function continuousDays(days,from,to){
  const byDate=new Map(days.map(d=>[d.date,d]));const start=new Date(from),end=new Date(new Date(to).getTime()-1);start.setHours(0,0,0,0);const count=Math.round((Date.UTC(end.getFullYear(),end.getMonth(),end.getDate())-Date.UTC(start.getFullYear(),start.getMonth(),start.getDate()))/86400000)+1;
  if(count<1||count>370)return days;const result=[];for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){const date=dayKey(d);result.push(byDate.get(date)||{date,tokens:0,usd:0,amount:'0',events:0});}return result;
}
function quotaOutlook(window,samples,{now=Date.now(),live=false}={}){
  const at=Date.parse(window.observedAt),reset=window.resetsAt*1000;const remaining=Math.max(0,100-window.used);
  const base={...window,remaining,secondsToReset:Number.isFinite(reset)?Math.max(0,(reset-now)/1000):null,forecast:null};
  if(!Number.isFinite(at)||now-at>180000||at>now+30000||!live)return {...base,state:'stale'};
  if(!Number.isFinite(reset)||reset<=now)return {...base,state:'expired'};
  if(remaining<=0)return {...base,state:'exhausted'};
  let points=samples.filter(s=>s.limit===window.limit&&s.window===window.window&&s.reset===window.resetsAt&&s.at<=at&&s.at>=at-7200000).sort((a,b)=>a.at-b.at);
  // A decrease is a correction/reset: discard the earlier slope.
  for(let i=points.length-1;i>0;i--)if(points[i].used<points[i-1].used){points=points.slice(i);break;}
  if(points.length<3)return {...base,state:'learning'};
  const first=points[0],last=points.at(-1),minutes=(last.at-first.at)/60000,delta=last.used-first.used;
  if(minutes<15||delta<2)return {...base,state:'learning'};
  const rate=delta/minutes;const seconds=remaining/rate*60;
  const fastSeconds=Math.max(0,remaining-1)/((delta+1)/minutes)*60;
  const slowSeconds=delta>1?(remaining+1)/((delta-1)/minutes)*60:null;
  const secondsToReset=(reset-now)/1000;
  return {...base,state:slowSeconds!==null&&slowSeconds<secondsToReset?'risk':fastSeconds>=secondsToReset?'on_track':'uncertain',forecast:{minutes,samples:points.length,percentPerHour:rate*60,seconds,fastSeconds,slowSeconds}};
}
function modelMixAdvice(models,outlook){
  const rows=(models||[]).filter(m=>Number.isFinite(m.tokens)&&m.tokens>0).map(m=>{
    const observed=Number.isFinite(m.usd)&&m.usd>0?m.usd/m.tokens*1e6:null;
    const name=String(m.model||m.key||'');
    return {model:name,tokens:m.tokens,intensity:observed,source:observed!==null?'priced':'unknown'};
  });
  const total=rows.reduce((n,m)=>n+m.tokens,0),forecast=outlook?.forecast,reset=outlook?.secondsToReset;
  const base={state:'learning',basis:'api_equivalent',confidence:'low',paceChange:null,current:rows.map(m=>({model:m.model,share:m.tokens/total})),recommended:[]};
  if(rows.length<2||!forecast||!Number.isFinite(forecast.seconds)||!Number.isFinite(reset)||reset<=0)return base;
  const usable=rows.filter(m=>Number.isFinite(m.intensity)&&m.intensity>0);if(usable.length<2)return base;
  const sum=usable.reduce((n,m)=>n+m.tokens,0),current=usable.map(m=>({...m,share:m.tokens/sum}));
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
module.exports={dayKey,cycleWindow,aggregate,continuousDays,quotaOutlook,modelMixAdvice,alertCandidates,inQuietHours};
