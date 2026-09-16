'use strict';
// Drill-down is local presentation state: it never changes the overview's totals.
const distributionState={metric:'tokens',provider:null};
const distributionColors=['#10a37f','#4b83c3','#a282ce','#d89a42','#cf7086','#58a7b0','#869455','#927769'];
const overviewBeforeDistribution=overview;
overview=function(){const html=overviewBeforeDistribution();if(state.multi||(!state.data.settings.roots.length&&!state.data.stats.records))return html;const d=state.data,s=d.summary;
 const modelGroups=d.models.map(g=>({key:g.model,provider:'OpenAI',model:g.model,tokens:g.tokens,requests:g.events,unpriced:g.unpriced,estimated:g.usd,reported:0}));
 const m={groups:[{key:'OpenAI',provider:'OpenAI',tokens:s.tokens,requests:s.events,unpriced:s.unpriced,estimated:s.usd,reported:0}],modelGroups};
 return html.replace('<div class="overview-footer">',monitorDistribution(m)+'<div class="overview-footer">');
};
function monitorDistribution(m){
 const view=distributionState,scope=view.provider,mode=view.metric;
 const groups=scope?m.modelGroups.filter(g=>g.provider===scope):m.groups;
 const costOf=g=>Number(g.estimated||0)+Number(g.reported||0),value=g=>mode==='tokens'?Number(g.tokens):costOf(g);
 const sorted=[...groups].sort((a,b)=>value(b)-value(a));
 const total=sorted.reduce((n,g)=>n+value(g),0),unpriced=groups.reduce((n,g)=>n+g.unpriced,0);
 const known=groups.reduce((n,g)=>n+g.requests-g.unpriced,0);
 const pricedTokensOf=g=>Number(g.pricedTokens??(g.unpriced?0:g.tokens)),pricedTokens=groups.reduce((n,g)=>n+pricedTokensOf(g),0),averageCost=pricedTokens?groups.reduce((n,g)=>n+costOf(g),0)*1000000/pricedTokens:null;
 const perMillion=g=>{const n=pricedTokensOf(g);return n?costOf(g)*1000000/n:null;};
 const color=g=>{const name=scope?g.model:g.key;let hash=0;for(const ch of name)hash=(hash*31+ch.charCodeAt(0))>>>0;return distributionColors[hash%distributionColors.length];};
 const format=n=>mode==='tokens'?fmt.format(n):money(n);
 let angle=-Math.PI/2;
 const point=a=>[100+78*Math.cos(a),100+78*Math.sin(a)];
 const segments=sorted.map((g,i)=>{
  const n=value(g);if(n<=0||total<=0)return '';
  const start=angle,delta=n/total*Math.PI*2;angle+=delta;const a=point(start),b=point(angle);
  // A complete circle needs two arcs; a single SVG arc would have equal endpoints.
  const shape=delta>=Math.PI*2-1e-10?'M100 22 A78 78 0 1 1 100 178 A78 78 0 1 1 100 22 Z':`M100 100 L${a.join(' ')} A78 78 0 ${delta>Math.PI?1:0} 1 ${b.join(' ')} Z`;
  const name=scope?g.model:g.key,label=`${name}: ${format(n)} (${decimal(n/total*100,1)}%)`;
  return `<path d="${shape}" fill="${color(g)}" tabindex="0" role="button" data-distribution-item="${i}" aria-label="${esc(label)}"><title>${esc(label)}</title></path>`;
 }).join('');
 // Names are kept in a render-local list, never put into executable attributes.
 distributionState.items=sorted.map(g=>({provider:g.provider,model:g.model,key:g.key}));
 return `<section class="panel padded distribution-panel"><div class="row between"><h2>${t(scope?'模型用量':'供应商用量')}</h2><div class="segments" aria-label="${t('统计指标')}"><button data-distribution-metric="tokens" aria-pressed="${mode==='tokens'}" class="${mode==='tokens'?'active':''}">Tokens</button><button data-distribution-metric="cost" aria-pressed="${mode==='cost'}" class="${mode==='cost'?'active':''}">${t('费用')}</button></div></div>
 <div class="distribution-breadcrumb"><button class="text-button" data-distribution-back ${scope?'':'disabled'}>${t('全部供应商')}</button>${scope?`<span> / ${esc(scope)}</span>`:''}</div>
 <div class="distribution-body"><div class="distribution-visual"><svg viewBox="0 0 200 200" aria-label="${t(scope?'模型用量':'供应商用量')}">${total?segments:'<circle cx="100" cy="100" r="78" fill="var(--line)"/>'}<circle cx="100" cy="100" r="53" fill="var(--card)" pointer-events="none"/></svg><div class="distribution-center"><strong>${mode==='tokens'?compact(total):money(known?total:null)}</strong><span>${mode==='tokens'?'Tokens':t('已计价费用')}</span></div></div>
 <div class="distribution-legend">${sorted.length?sorted.map((g,i)=>`<button class="distribution-row" data-distribution-item="${i}"><span class="distribution-dot" style="background:${color(g)}"></span><span class="distribution-name">${esc(scope?g.model:g.key)}</span><span class="distribution-values"><strong>${mode==='cost'&&g.unpriced===g.requests?'—':format(value(g))}</strong><small>${total&&!(mode==='cost'&&g.unpriced===g.requests)?decimal(value(g)/total*100,1)+'%':'—'}${perMillion(g)!==null?' · '+money(perMillion(g))+'/1M':''}</small></span></button>`).join(''):`<p class="caption">${t('暂无记录')}</p>`}</div></div>
 <div class="caption distribution-cost-summary"><span>${t('平均成本 / 1M Tokens')}：<strong>${averageCost===null?'—':money(averageCost)}</strong></span><span>${t('已计价 Tokens')} ${pricedTokens?fmt.format(pricedTokens):'—'}${mode==='cost'?` · ${t('未计价')} ${fmt.format(unpriced)}`:''}</span></div></section>`;
}
function distributionAction(target){
 if(target.dataset.distributionMetric){distributionState.metric=target.dataset.distributionMetric;render();}
 else if(target.dataset.distributionBack!==undefined){distributionState.provider=null;render();}
 else if(target.dataset.distributionItem!==undefined){const item=distributionState.items[Number(target.dataset.distributionItem)];if(!item)return;if(distributionState.provider){state.provider=state.multi?item.provider:'';state.model=item.model;state.view='records';state.page='activity';state.offset=0;load();}else{distributionState.provider=item.key;render();}}
}
document.addEventListener('click',event=>{const target=event.target.closest('[data-distribution-item],[data-distribution-metric],[data-distribution-back]');if(!target)return;event.preventDefault();event.stopImmediatePropagation();distributionAction(target);},true);
document.addEventListener('keydown',event=>{if(!['Enter',' '].includes(event.key)||event.target.tagName.toLowerCase()!=='path'||event.target.dataset.distributionItem===undefined)return;event.preventDefault();distributionAction(event.target);});
document.addEventListener('change',event=>{if(['monitor-source','monitor-provider'].includes(event.target.id))distributionState.provider=null;},true);
