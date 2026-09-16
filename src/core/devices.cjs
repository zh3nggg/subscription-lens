'use strict';
const crypto=require('node:crypto');
const safeLabel=value=>String(value||'').replace(/[\x00-\x1f]/g,' ').trim().slice(0,80);
const safeId=value=>typeof value==='string'&&/^[a-f0-9-]{16,80}$/i.test(value)?value:null;
const digest=value=>crypto.createHash('sha256').update(String(value)).digest('hex');
function createDevice(label){return {id:crypto.randomUUID(),label:safeLabel(label)||'This device',createdAt:new Date().toISOString()};}
function normalizeDevice(value,fallback){const id=safeId(value?.id),label=safeLabel(value?.label);return id&&label?{id,label,createdAt:typeof value.createdAt==='string'?value.createdAt:fallback.createdAt}:fallback;}
function packet(device,events){return {schema:'subscription-lens.device-ledger.v1',exportedAt:new Date().toISOString(),device:{id:device.id,label:device.label},records:events.map(event=>({
 id:digest(event.id),at:event.at,model:event.model,input:event.input,cached:event.cached,write:event.write,output:event.output,reasoning:event.reasoning,total:event.total,quality:event.quality,
 session:digest(event.session||event.id).slice(0,24),costAmount:typeof event.ledgerCost==='string'&&/^\d{1,30}$/.test(event.ledgerCost)?event.ledgerCost:null
 }))};}
function importPacket(value){
 if(!value||value.schema!=='subscription-lens.device-ledger.v1'||!Array.isArray(value.records)||value.records.length>200000)throw Error('设备数据包格式错误');
 const id=safeId(value.device?.id),label=safeLabel(value.device?.label);if(!id||!label)throw Error('设备数据包格式错误');
 const records=[];
 for(const row of value.records){const numeric=['input','cached','write','output','reasoning','total'];if(!row||typeof row.id!=='string'||!Number.isFinite(Date.parse(row.at))||typeof row.model!=='string'||row.model.length>100||numeric.some(key=>!Number.isSafeInteger(row[key])||row[key]<0)||row.cached+row.write>row.input||row.reasoning>row.output||row.total!==row.input+row.output||row.costAmount!==null&&row.costAmount!==undefined&&(!/^\d{1,30}$/.test(String(row.costAmount))))throw Error('设备数据包记录无效');records.push({id:'device:'+id+':'+digest(row.id),session:'device-'+digest(row.session||row.id).slice(0,24),project:'Imported device',at:new Date(row.at).toISOString(),model:row.model,input:row.input,cached:row.cached,write:row.write,output:row.output,reasoning:row.reasoning,total:row.total,quality:['complete','partial_history','ambiguous','reset'].includes(row.quality)?row.quality:'complete',device:id,importedCost:row.costAmount??null});}
 return {device:{id,label,createdAt:typeof value.exportedAt==='string'?value.exportedAt:new Date().toISOString()},records};
}
module.exports={createDevice,normalizeDevice,safeLabel,packet,importPacket};
