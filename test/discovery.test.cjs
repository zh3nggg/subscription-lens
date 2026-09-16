'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {monitorDefaults,discoverMonitors}=require('../src/core/discovery.cjs');
const base=path.resolve(__dirname,'../test-results');
test('standard provider installations are discovered without reading credentials',()=>{fs.mkdirSync(base,{recursive:true});const home=fs.mkdtempSync(path.join(base,'discover-'));fs.mkdirSync(path.join(home,'.qwen'),{recursive:true});fs.mkdirSync(path.join(home,'.cc-switch'),{recursive:true});fs.writeFileSync(path.join(home,'.cc-switch','cc-switch.db'),'fixture');const found=discoverMonitors({home,env:{},connected:[{path:path.join(home,'.qwen')}]});assert.deepEqual(found.map(x=>x.kind),['qwen','cc-switch']);assert.equal(found[0].connected,true);assert.equal(found[1].connected,false);});
test('environment overrides remain the preferred one-click path',()=>{const home=fs.mkdtempSync(path.join(base,'discover-')),custom=path.join(home,'custom-qwen');fs.mkdirSync(custom);assert.equal(monitorDefaults({home,env:{QWEN_HOME:custom}})[0].path,custom);assert.equal(discoverMonitors({home,env:{QWEN_HOME:custom}})[0].kind,'qwen');});
