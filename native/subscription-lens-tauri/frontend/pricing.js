'use strict';
// Price proposals are read-only until the user explicitly accepts them.
const priceState={provider:'all',query:'',checking:false,checkedAt:null,error:null,proposals:[],started:false};
const priceKeys=[['inputCostPerMillion','普通输入'],['cacheReadCostPerMillion','缓存读取'],['cacheCreationCostPerMillion','缓存写入'],['outputCostPerMillion','输出']];
const priceGroup=id=>distributionProviderForModel(id);
const priceRate=value=>value===null||value===undefined?'—':`$${esc(value)}`;
function priceRows(){return Object.entries(state.data?.catalog?.models||{}).map(([id,rate])=>({id,rate:rate.standard,provider:priceGroup(id)}));}
function monitorPrices(){
 const rates=monitorData().rates||[],providers=[...new Set(rates.map(row=>row.provider))].sort((a,b)=>a.localeCompare(b));
 if(priceState.provider!=='all'&&!providers.includes(priceState.provider))priceState.provider='all';
 const selected=rates.filter(row=>(priceState.provider==='all'||row.provider===priceState.provider)&&(!priceState.query||`${row.provider} ${row.model}`.toLowerCase().includes(priceState.query.toLowerCase())));priceState.monitorRows=selected;
 const tabs=`<div class="price-toolbar"><div class="price-provider-tabs" role="tablist" aria-label="${t('模型供应商')}">${[['all',t('全部')],...providers.map(provider=>[provider,provider])].map(([key,label])=>`<button role="tab" data-price-provider="${esc(key)}" aria-selected="${priceState.provider===key}" class="${priceState.provider===key?'active':''}">${esc(label)}<small>${key==='all'?rates.length:rates.filter(row=>row.provider===key).length}</small></button>`).join('')}</div><input id="price-search" class="input" placeholder="${t('搜索模型')}" aria-label="${t('搜索模型')}" value="${esc(priceState.query)}"></div>`;
 return head(t('价格'),`<button class="button" data-monitor-rate>${t('添加计价规则')}</button>`,t('USD / 百万 Tokens'))+tabs+`<p class="notice">${t('自定义规则仅为未计价记录估算费用，不覆盖来源报告的金额。')} · USD / ${t('百万 Tokens')}</p><section class="panel price-table"><div class="table-wrap"><table><thead><tr><th>${t('供应商')}</th><th>${t('模型')}</th>${priceKeys.map(([,label])=>`<th>${t(label)}</th>`).join('')}<th></th></tr></thead><tbody>${selected.length?selected.map((row,index)=>`<tr><td>${esc(row.provider)}</td><td>${esc(row.model)}</td>${['input','cached','write','output'].map(key=>`<td>${priceRate(row.rates?.[key])}</td>`).join('')}<td><button class="text-button" data-price-monitor-edit="${index}">${t('修改价格')}</button></td></tr>`).join(''):`<tr><td colspan="7"><div class="empty">${t('暂无记录')}</div></td></tr>`}</tbody></table></div></section>`;
}
models=function(){
 if(state.multi)return monitorPrices();
 const rows=priceRows(),providers=[...new Set(rows.map(row=>row.provider))].sort((a,b)=>a.localeCompare(b));
 if(priceState.provider!=='all'&&!providers.includes(priceState.provider))priceState.provider='all';
 const selected=rows.filter(row=>(priceState.provider==='all'||row.provider===priceState.provider)&&(!priceState.query||row.id.toLowerCase().includes(priceState.query.toLowerCase())));
 if(!priceState.started){priceState.started=true;queueMicrotask(()=>checkPrices(false));}
 return head(t('价格'),`<button class="button" data-price-check ${priceState.checking?'disabled':''}>${t(priceState.checking?'正在检查价格…':'检查新价格')}</button><button class="button" data-action="exportPrices">${t('导出')}</button>`,t('USD / 百万 Tokens'))+
  `<div class="price-toolbar"><div class="price-provider-tabs" role="tablist" aria-label="${t('模型供应商')}">${[['all',t('全部')],...providers.map(p=>[p,p])].map(([key,label])=>`<button role="tab" data-price-provider="${esc(key)}" aria-selected="${priceState.provider===key}" class="${priceState.provider===key?'active':''}">${esc(label)}<small>${key==='all'?rows.length:rows.filter(row=>row.provider===key).length}</small></button>`).join('')}</div><input id="price-search" class="input" placeholder="${t('搜索模型')}" aria-label="${t('搜索模型')}" value="${esc(priceState.query)}"></div>`+
  `<div class="notice price-notice"><span>${t('本地价格按 USD / 百万 Tokens 计算；在线价格来自 models.dev，仅在确认后更新。')}</span>${priceState.checkedAt?`<span>${t('最近检查')} ${datetime(priceState.checkedAt)} · ${t('发现 {n} 项差异',{n:priceState.proposals.length})}</span>`:''}${priceState.error?`<span class="price-error">${esc(priceState.error)}</span>`:''}${priceState.proposals.length?`<button class="button small" data-price-review>${t('查看差异并确认')}</button>`:''}</div>`+
  `<section class="panel price-table"><div class="table-wrap"><table><thead><tr><th>${t('模型')}</th>${priceKeys.map(([,label])=>`<th>${t(label)}</th>`).join('')}<th></th></tr></thead><tbody>${selected.length?selected.map(row=>`<tr><td><strong>${esc(row.id)}</strong><div class="sub">${esc(row.provider)}</div></td>${['input','cached','write','output'].map(key=>`<td>${priceRate(row.rate[key])}</td>`).join('')}<td><button class="text-button" data-price-edit="${esc(row.id)}">${t('修改价格')}</button></td></tr>`).join(''):`<tr><td colspan="6"><div class="empty">${t('没有匹配的模型')}</div></td></tr>`}</tbody></table></div></section>`+
  `<div class="footnote"><span>${t('修改价格只会为缺价的历史记录补价；已有费用不会自动重新计价。')}</span><button class="text-button" data-action="openPricing">models.dev ↗</button></div>`;
};
async function checkPrices(showResult=true){
 if(priceState.checking)return;
 priceState.checking=true;priceState.error=null;if(state.page==='models')render();
 try{const result=await api('fetchPriceChanges');priceState.proposals=result.changes||[];priceState.checkedAt=result.checkedAt;if(showResult)toast(t('发现 {n} 项差异',{n:priceState.proposals.length}));}
 catch(error){priceState.error=String(error?.message||error);if(showResult)toast(priceState.error);}
 finally{priceState.checking=false;if(state.page==='models')render();}
}
function openPriceEdit(id){
 const item=priceRows().find(row=>row.id===id);if(!item)return;
 modal(t('修改模型价格'),`<form id="price-edit-form"><p>${esc(item.provider)} · <strong>${esc(id)}</strong></p><input type="hidden" name="modelId" value="${esc(id)}"><div class="price-field-grid">${priceKeys.map(([field,label])=>`<label class="field"><span>${t(label)} · USD / 1M</span><input class="input" type="number" min="0" step="any" required name="${field}" value="${esc(item.rate[({inputCostPerMillion:'input',cacheReadCostPerMillion:'cached',cacheCreationCostPerMillion:'write',outputCostPerMillion:'output'})[field]]??'0')}"></label>`).join('')}</div><p>${t('保存后仅为缺价的历史记录补价；已有费用不会自动重新计价。')}</p><button class="button primary" type="submit">${t('保存')}</button></form>`);
}
function openPriceReview(){
 const proposals=priceState.proposals;
 modal(t('确认价格差异'),`<p>${t('在线价格来自 models.dev。勾选要采用的模型；现有价格在确认前不会变化。')}</p><div class="price-review-list">${proposals.map((change,index)=>`<label class="price-review-item"><input type="checkbox" name="price-change" value="${index}" checked><span><strong>${esc(change.current.modelId)}</strong><small>${esc(change.provider)}</small>${priceKeys.filter(([field])=>Number(change.current[field])!==Number(change.next[field])).map(([field,label])=>`<span>${t(label)}：${priceRate(change.current[field])} → ${priceRate(change.next[field])}</span>`).join('')}</span></label>`).join('')}</div><div class="row between section-gap"><button class="button small" type="button" data-price-select-all>${t('全选 / 全不选')}</button><button class="button primary" type="button" data-price-apply>${t('应用所选价格')}</button></div>`);
}
function openMonitorPriceEdit(index){
 const row=priceState.monitorRows?.[Number(index)];if(!row)return;const {provider,model}=row;
 modal(t('修改模型价格'),`<form id="monitor-rate-form"><p>${esc(provider)} · <strong>${esc(model)}</strong></p><input type="hidden" name="provider" value="${esc(provider)}"><input type="hidden" name="model" value="${esc(model)}"><div class="price-field-grid">${[['input','普通输入'],['cached','缓存读取'],['write','缓存写入'],['output','输出']].map(([field,label])=>`<label class="field"><span>${t(label)} · USD / 1M</span><input class="input" name="${field}" type="number" min="0" max="1000000" step="any" required value="${esc(row.rates?.[field]??'0')}"></label>`).join('')}</div><button class="button primary section-gap" type="submit">${t('保存')}</button></form>`);
}
document.addEventListener('click',event=>{
 const button=event.target.closest('button');if(!button)return;
 if(button.dataset.priceProvider!==undefined){event.stopImmediatePropagation();priceState.provider=button.dataset.priceProvider;render();return;}
 if(button.hasAttribute('data-price-check')){event.stopImmediatePropagation();checkPrices();return;}
 if(button.hasAttribute('data-price-review')){event.stopImmediatePropagation();openPriceReview();return;}
 if(button.dataset.priceEdit!==undefined){event.stopImmediatePropagation();openPriceEdit(button.dataset.priceEdit);return;}
 if(button.dataset.priceMonitorEdit!==undefined){event.stopImmediatePropagation();openMonitorPriceEdit(button.dataset.priceMonitorEdit);return;}
 if(button.hasAttribute('data-price-select-all')){event.stopImmediatePropagation();const boxes=[...document.querySelectorAll('#dialog input[name="price-change"]')],checked=boxes.some(box=>!box.checked);boxes.forEach(box=>box.checked=checked);return;}
 if(button.hasAttribute('data-price-apply')){event.stopImmediatePropagation();const indices=[...document.querySelectorAll('#dialog input[name="price-change"]:checked')].map(box=>Number(box.value)),entries=indices.map(index=>priceState.proposals[index]?.next).filter(Boolean);if(!entries.length){toast(t('请选择价格'));return;}button.disabled=true;action(async()=>{const count=await api('applyPriceChanges',entries);priceState.proposals=priceState.proposals.filter((_,index)=>!indices.includes(index));$('#dialog').close();return count;},n=>t('已更新 {n} 个模型',{n}),button);}
},true);
document.addEventListener('input',event=>{if(event.target.id!=='price-search')return;priceState.query=event.target.value;const old=event.target;const cursor=old.selectionStart;render();const input=$('#price-search');input?.focus();input?.setSelectionRange(cursor,cursor);},true);
document.addEventListener('submit',event=>{if(event.target.id!=='price-edit-form')return;event.preventDefault();event.stopImmediatePropagation();const form=event.target,fields=new FormData(form),entry={modelId:String(fields.get('modelId')),displayName:String(fields.get('modelId'))};for(const[field]of priceKeys)entry[field]=String(fields.get(field));const button=form.querySelector('[type="submit"]');button.disabled=true;action(async()=>{await api('updatePrice',entry);priceState.proposals=priceState.proposals.filter(item=>item.current.modelId!==entry.modelId);$('#dialog').close();},()=>t('价格已保存'),button);},true);
