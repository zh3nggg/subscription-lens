'use strict';
const layoutState={tabs:{codex:'summary',multi:'distribution'},pages:{},limit:5};
const filtersBeforeLayout=filters,renderBeforeLayout=render;
filters=()=>({...filtersBeforeLayout(),limit:layoutState.limit});
function pageItems(container,items,key,reserve=56){
 if(!items.length)return;const top=items[0].getBoundingClientRect().top;
 const height=Math.max(...items.map(n=>n.getBoundingClientRect().height),1);
 const size=Math.max(1,Math.floor((innerHeight-top-reserve)/height));
 const count=Math.ceil(items.length/size),page=Math.min(layoutState.pages[key]||0,count-1);layoutState.pages[key]=page;
 items.forEach((n,i)=>n.hidden=i<page*size||i>=(page+1)*size);
 if(count>1){const bar=document.createElement('div');bar.className='pagination local-pagination';bar.innerHTML=`<span>${page+1} / ${count}</span><div class="row"><button class="button small" data-layout-page="${key}" data-delta="-1" ${page===0?'disabled':''}>${t('上一页')}</button><button class="button small" data-layout-page="${key}" data-delta="1" ${page===count-1?'disabled':''}>${t('下一页')}</button></div>`;container.append(bar);}
}
function fitOverview(main){
 const distribution=main.querySelector('.distribution-panel'),two=main.querySelector('.two-col');if(!distribution)return;
 const trend=two?.querySelector(':scope > section:not(.distribution-panel)'),project=two?.querySelector('.project-card'),decision=main.querySelector('.decision-grid'),metrics=main.querySelector(':scope > .metrics');
 let summary=null;if(!state.multi&&decision){summary=document.createElement('div');summary.className='overview-primary';summary.append(decision,distribution);if(metrics)main.insertBefore(metrics,two||main.firstChild);main.insertBefore(summary,two||main.querySelector('.overview-footer'));}
 const expanded=innerHeight>=820&&innerWidth>=980;main.classList.toggle('overview-expanded',expanded);
 if(expanded){return;}
 let performance=null;if(state.multi){const metrics=main.querySelector('.monitor-metrics');if(metrics){performance=document.createElement('section');performance.className='panel performance-panel';const grid=document.createElement('div');grid.className='metrics performance-metrics';[...metrics.children].slice(3).forEach(n=>grid.append(n));performance.append(grid);}}
 const panels=[...(!state.multi?[['summary','总览',summary]]:[['distribution','用量分布',distribution]]),['trend','用量趋势',trend],['projects','项目',project],['performance','性能',performance]].filter(([, ,node])=>node);
 const mode=state.multi?'multi':'codex';if(!panels.some(([key])=>key===layoutState.tabs[mode]))layoutState.tabs[mode]=panels[0][0];
 const active=layoutState.tabs[mode];const tabs=document.createElement('div');tabs.className='segments dashboard-tabs';tabs.innerHTML=panels.map(([key,label])=>`<button data-layout-tab="${key}" class="${active===key?'active':''}" aria-pressed="${active===key}">${t(label)}</button>`).join('');
 const deck=document.createElement('div');deck.className='dashboard-deck';
 for(const[key,,node]of panels){node.hidden=key!==active;deck.append(node);}
 if(two)two.remove();const footer=main.querySelector('.overview-footer,.monitor-footer');main.insertBefore(tabs,footer);main.insertBefore(deck,footer);
 if(project&&!project.hidden)pageItems(project.querySelector('.project-list'),[...project.querySelectorAll('.project-item')],'projects',70);
 if(!distribution.hidden)pageItems(distribution.querySelector('.distribution-legend'),[...distribution.querySelectorAll('.distribution-row')],'legend',100);
}
render=function(){renderBeforeLayout();if(!state.data)return;document.body.dataset.page=state.page;document.body.dataset.multi=String(state.multi);if(state.data.desktop?.compact)return;const main=$('#main');const mode=main.querySelector('.monitor-switch');if(mode){document.querySelector('header .monitor-switch')?.remove();document.querySelector('header').insertBefore(mode,document.querySelector('.header-actions'));}
 if(state.page==='overview')fitOverview(main);
 if(state.page==='activity'){
  const table=main.querySelector('table'),rows=[...main.querySelectorAll('tbody tr')];if(table&&rows.length){const first=rows[0].getBoundingClientRect(),height=Math.max(52,...rows.map(n=>n.getBoundingClientRect().height));const reserve=state.multi?110:76;const limit=Math.max(1,Math.min(50,Math.floor((innerHeight-first.top-reserve)/height)));if(limit!==layoutState.limit){layoutState.limit=limit;state.offset=0;queueMicrotask(load);}}
 }
 if(state.page==='models'){const panel=main.querySelector('section.panel'),rows=[...main.querySelectorAll('tbody tr')];if(panel)pageItems(panel,rows,'prices',state.multi?76:180);}
 if(state.page==='sources'){
  const codex=main.querySelector('.grid-2'),multi=main.querySelector(':scope > section');if(codex)codex.hidden=state.multi;if(multi)multi.hidden=!state.multi;
  if(state.multi&&multi)pageItems(multi,[...multi.querySelectorAll('.monitor-source')],'sources',70);
  if(!state.multi&&codex){const details=codex.querySelector('.full');if(details){const summary=document.createElement('details');summary.className='source-details full';const label=document.createElement('summary');label.textContent=t('数据范围');summary.append(label);summary.append(details);codex.append(summary);}const roots=[...codex.querySelectorAll('.path-item')];if(roots.length>1)pageItems(roots[0].parentNode,roots,'roots',230);}
 }
};
document.addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;const d=button.dataset;
 if(d.layoutTab){event.stopImmediatePropagation();layoutState.tabs[state.multi?'multi':'codex']=d.layoutTab;render();}
 if(d.layoutPage){event.stopImmediatePropagation();layoutState.pages[d.layoutPage]=Math.max(0,(layoutState.pages[d.layoutPage]||0)+Number(d.delta));render();}
 if(['prev','next'].includes(d.action)){event.stopImmediatePropagation();state.offset=Math.max(0,state.offset+(d.action==='next'?layoutState.limit:-layoutState.limit));load();}
},true);
let layoutResize;window.addEventListener('resize',()=>{clearTimeout(layoutResize);layoutResize=setTimeout(()=>{layoutState.pages={};render();},120);});
