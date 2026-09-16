'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {Service}=require('../src/core/service.cjs');
const base=path.resolve(__dirname,'../test-results');fs.mkdirSync(base,{recursive:true});
const temp=()=>fs.mkdtempSync(path.join(base,'devices-'));
const event=(id,device)=>({id,session:'session-'+id,project:'private-project',model:'gpt-6-astra',at:'2026-09-16T12:00:00.000Z',input:100,cached:10,write:0,output:20,reasoning:0,total:120,quality:'complete',device});
test('device ledger assigns legacy records locally and imports only anonymous fields',()=>{const a=new Service(temp(),{now:()=>new Date('2026-09-16T13:00:00.000Z')});const b=new Service(temp(),{now:()=>new Date('2026-09-16T13:00:00.000Z')});try{
 a.store.commit('legacy',{offset:0,size:0,mtime:0,state:{}},[event('one',a.device.id)],null);const packet=a.exportDeviceLedger();assert.equal(packet.schema,'subscription-lens.device-ledger.v1');assert.equal(packet.records.length,1);assert.match(packet.records[0].costAmount,/^\d+$/);assert.equal(JSON.stringify(packet).includes('private-project'),false);assert.equal(JSON.stringify(packet).includes('session-one'),false);
 const result=b.importDeviceLedger(packet);assert.equal(result.added,1);const query=b.query({period:'all',device:a.device.id});assert.equal(query.summary.tokens,120);assert.ok(query.summary.usd>0);assert.equal(query.devices.find(d=>d.id===a.device.id).label,a.device.label);assert.throws(()=>b.importDeviceLedger({...packet,records:[{...packet.records[0],total:1}]}),/设备数据包记录无效/);
}finally{a.store.close();b.store.close();}});
