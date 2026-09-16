'use strict';
const bundled=require('../../assets/prices.json');
const KEYS=['input','cached','write','output'];
function decimalUnits(value,scale=9){
  const s=String(value);if(!/^\d+(\.\d+)?$/.test(s))throw new Error('价格必须是非负数');
  const [a,b='']=s.split('.');if(b.length>scale)throw new Error('价格精度超出支持范围');return BigInt(a)*10n**BigInt(scale)+BigInt(b.padEnd(scale,'0'));
}
function price(event,catalog=bundled){
  const rate=catalog.models[event.model];
  const unknown=reason=>({amount:null,reason,parts:null,version:catalog.version});
  if(!rate)return unknown('model');
  if(event.quality==='ambiguous')return unknown('counter');
  if(KEYS.some(k=>event[k]===null||!Number.isSafeInteger(event[k])||event[k]<0))return unknown('tokens');
  if(event.cached+event.write>event.input||event.reasoning>event.output)return unknown('invalid');
  const long=rate.threshold!==null&&event.input>rate.threshold;
  const prices=long?rate.long:rate.standard;if(!prices)return unknown('context');
  const amounts={input:event.input-event.cached-event.write,cached:event.cached,write:event.write,output:event.output};
  const parts={};let total=0n;
  for(const k of KEYS){if(prices[k]===null&&amounts[k]>0)return unknown('category');const n=BigInt(amounts[k])*decimalUnits(prices[k]??'0');parts[k]=n.toString();total+=n;}
  // Integer femtodollars: USD / 1e6 tokens * 1e9 decimal price scale.
  return {amount:total.toString(),parts,reason:null,version:catalog.version,context:long?'long':'short'};
}
function dollars(integer){return integer===null?null:Number(BigInt(integer))/1e15;}
function validateCatalog(value){
  if(!value||typeof value.version!=='string'||value.version.length>100||!value.models||typeof value.models!=='object'||Array.isArray(value.models))throw new Error('价格文件格式错误');
  if(Object.keys(value.models).length>500)throw new Error('价格条目过多');
  const models={};for(const [model,r] of Object.entries(value.models)){
    if(!/^[a-zA-Z0-9._:-]{1,100}$/.test(model)||['__proto__','constructor','prototype'].includes(model))throw new Error('模型标识无效');
    if(r.threshold!==null&&(!Number.isSafeInteger(r.threshold)||r.threshold<1))throw new Error('上下文阈值无效');
    const clean={threshold:r.threshold,standard:{},long:r.long===null?null:{}};
    for(const band of ['standard','long']){if(clean[band]===null)continue;if(!r[band])throw new Error('缺少价格档位');for(const k of KEYS){const n=r[band][k];if(n!==null){const v=decimalUnits(n);if(v>1000000n*1000000000n)throw new Error('价格超出范围');}clean[band][k]=n===null?null:String(n);}}
    models[model]=clean;
  }
  if(!Object.keys(models).length)throw new Error('价格目录为空');
  return {version:value.version,asOf:String(value.asOf||'').slice(0,20),source:'用户导入',basis:'standard-current',models};
}
module.exports={price,dollars,decimalUnits,validateCatalog,bundled};
