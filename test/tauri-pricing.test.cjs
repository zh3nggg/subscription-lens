'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const frontend=path.join(__dirname,'../native/subscription-lens-tauri/frontend');

test('online price check only proposes exact same-provider matches, preserving missing cache rates',async()=>{
 const commands=[];
 const current=[{modelId:'gpt-4.1',displayName:'GPT 4.1',inputCostPerMillion:'2',outputCostPerMillion:'8',cacheReadCostPerMillion:'1',cacheCreationCostPerMillion:'3'},
  {modelId:'claude-4',displayName:'Claude 4',inputCostPerMillion:'4',outputCostPerMillion:'12',cacheReadCostPerMillion:'1',cacheCreationCostPerMillion:'2'}];
 const storage=new Map();
 const window={addEventListener(){},__TAURI_INTERNALS__:{invoke:async(command,args)=>{commands.push([command,args]);if(command==='get_model_pricing')return current;if(command==='update_model_pricing_batch')return args.entries.length;return null;}}};
 const source={openai:{models:{'gpt-4.1':{cost:{input:3,output:9}},'claude-4':{cost:{input:99,output:99}}}},anthropic:{models:{'claude-4':{cost:{input:5,output:15,cache_read:0.5}}}}};
 const context={window,navigator:{userAgent:'Windows'},localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},fetch:async()=>({ok:true,json:async()=>source}),AbortController,setTimeout,clearTimeout,URL,Blob,console};
 vm.runInNewContext(fs.readFileSync(path.join(frontend,'tauri-bridge.js'),'utf8'),context);
 const result=await window.lens.fetchPriceChanges();
 assert.equal(result.ok,true,result.error);
 assert.equal(result.value.changes.length,2);
 const gpt=result.value.changes.find(change=>change.current.modelId==='gpt-4.1');
 assert.equal(gpt.next.inputCostPerMillion,'3');
 assert.equal(gpt.next.cacheReadCostPerMillion,'1');
 assert.equal(gpt.next.cacheCreationCostPerMillion,'3');
 assert.equal(commands.some(([command])=>command.startsWith('update_model_pricing')),false);
 const applied=await window.lens.applyPriceChanges([gpt.next]);
 assert.equal(applied.ok,true);assert.equal(applied.value,1);
 assert.equal(commands.filter(([command])=>command==='update_model_pricing_batch').length,1);
});

test('distribution colors stay with identities when metric order changes',()=>{
 const document={addEventListener(){}};
 const context={document,overview:()=>'',state:{},t:value=>value,fmt:{format:String},money:value=>`$${value}`,decimal:(value)=>value.toFixed(1),compact:String,esc:String};
 vm.runInNewContext(fs.readFileSync(path.join(frontend,'distribution.js'),'utf8'),context);
 const data={groups:[{key:'OpenAI',provider:'OpenAI',tokens:100,requests:1,unpriced:0,estimated:1},{key:'Anthropic',provider:'Anthropic',tokens:10,requests:1,unpriced:0,estimated:10}],modelGroups:[]};
 const colors=html=>Object.fromEntries([...html.matchAll(/<span class="distribution-dot" style="background:([^"]+)"><\/span><span class="distribution-name">([^<]+)<\/span>/g)].map(match=>[match[2],match[1]]));
 const first=colors(context.monitorDistribution(data));
 vm.runInNewContext("distributionState.metric='cost'",context);
 const second=colors(context.monitorDistribution(data));
 assert.deepEqual(first,second);
});

test('local and multi-device cost donuts show their summed amount in the center',()=>{
 const context={document:{addEventListener(){}},overview:()=>'<div class="overview-footer">',state:{multi:false,deviceView:'local',data:{settings:{roots:['codex']},stats:{records:1},modelProviders:[{key:'OpenAI:gpt-6',provider:'OpenAI',model:'gpt-6',tokens:100,events:2,usd:12.5}]}},
  t:value=>value,fmt:{format:String},money:value=>value===null?'—':`$${value.toFixed(2)}`,decimal:value=>value.toFixed(1),compact:String,esc:String};
 vm.runInNewContext(fs.readFileSync(path.join(frontend,'distribution.js'),'utf8'),context);
 vm.runInNewContext("distributionState.metric='cost'; distributionState.provider='OpenAI'",context);
 const local=context.overview();
 assert.match(local,/<div class="distribution-center"><strong>\$12\.50<\/strong>/);
 assert.doesNotMatch(local,/NaN/);
 context.state.deviceView='multi';context.state.data.deviceCloud={models:[{model:'gpt-6',tokens:80,events:1,usd:7.25}]};
 const multi=context.overview();
 assert.match(multi,/<div class="distribution-center"><strong>\$7\.25<\/strong>/);
 context.state.data.deviceCloud={models:[{model:'gpt-6',tokens:80,events:1,usd:null}]};
 assert.match(context.overview(),/<div class="distribution-center"><strong>—<\/strong>/);
});

test('pricing view groups models by supplier and exposes editing',()=>{
 const context={document:{addEventListener(){}},models:()=>'',state:{page:'models',data:{catalog:{models:{'gpt-4.1':{standard:{input:'2',cached:'1',write:'3',output:'8'}},'claude-4':{standard:{input:'4',cached:'1',write:'2',output:'12'}}}}}},
  distributionProviderForModel:id=>id.startsWith('gpt')?'OpenAI':'Anthropic',head:(_title,actions)=>actions,t:value=>value,esc:String,datetime:String,queueMicrotask:()=>{}};
 vm.runInNewContext(fs.readFileSync(path.join(frontend,'pricing.js'),'utf8'),context);
 const html=context.models();
 assert.match(html,/data-price-provider="OpenAI"/);
 assert.match(html,/data-price-provider="Anthropic"/);
 assert.match(html,/data-price-edit="gpt-4\.1"/);
 assert.match(html,/data-price-review|data-price-check/);
});

test('multi-provider pricing keeps local monitor rules and groups them by supplier',()=>{
 const context={document:{addEventListener(){}},models:()=>'',state:{page:'models',multi:true,data:{}},monitorData:()=>({rates:[{provider:'Qoder',model:'qoder-x',rates:{input:'1',cached:'0',write:'0',output:'2'}},{provider:'CodeBuddy',model:'buddy-x',rates:{input:'2',cached:'0',write:'0',output:'4'}}]}),
  distributionProviderForModel:()=>'',head:(_title,actions)=>actions,t:value=>value,esc:String,datetime:String,queueMicrotask:()=>{}};
 vm.runInNewContext(fs.readFileSync(path.join(frontend,'pricing.js'),'utf8'),context);
 const html=context.models();
 assert.match(html,/data-price-provider="Qoder"/);
 assert.match(html,/data-price-provider="CodeBuddy"/);
 assert.match(html,/data-monitor-rate/);
 assert.match(html,/data-price-monitor-edit="0"/);
});
