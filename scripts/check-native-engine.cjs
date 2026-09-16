'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const base=path.resolve(__dirname,'../test-results');
const dir=fs.mkdtempSync(path.join(base,'native-fixture-')),root=path.join(dir,'codex'),sessions=path.join(root,'sessions');
fs.mkdirSync(sessions,{recursive:true});
const vector=n=>({input_tokens:n,cached_input_tokens:0,cache_write_input_tokens:0,output_tokens:0,reasoning_output_tokens:0,total_tokens:n});
const record=(type,payload)=>JSON.stringify({timestamp:'2026-09-15T12:00:00Z',type,payload})+'\n';
const lines=record('session_meta',{id:'fixture-session',cwd:'D:/Synthetic/Project',source:'cli'})+
 record('turn_context',{turn_id:'fixture-turn',model:'gpt-5',service_tier:'fast'})+
 record('token_usage_record',{thread_id:'fixture-session',turn_id:'fixture-turn',response_id:'response-1',usage:vector(100),turn_token_usage:vector(100)})+
 record('token_usage_record',{thread_id:'fixture-session',turn_id:'fixture-turn',response_id:'response-compaction',usage:vector(50),turn_token_usage:vector(150)})+
 record('event_msg',{type:'token_count',info:{total_token_usage:vector(150),last_token_usage:vector(50)}});
fs.writeFileSync(path.join(sessions,'fixture.jsonl'),lines);
const invoke=()=>{const p=spawnSync(path.join(base,'lens-engine.exe'),[],{input:JSON.stringify({database:path.join(dir,'engine','usage.sqlite'),roots:[root]}),encoding:'utf8',windowsHide:true,timeout:60000,maxBuffer:8*1024*1024});assert.equal(p.status,0,p.stdout+p.stderr);return p.stdout.trim().split('\n').map(x=>JSON.parse(x));};
const first=invoke(),events=first.filter(x=>x.type==='event');
assert.equal(first.at(-1).type,'complete');assert.equal(events.reduce((n,x)=>n+x.event.usage.total,0),150);
assert.ok(events.every(x=>x.event.service_mode==='fast'));assert.ok(events.every(x=>!x.event.thread_title));
fs.writeFileSync(path.join(sessions,'restored.jsonl'),lines);
const second=invoke();assert.equal(second.filter(x=>x.type==='event').reduce((n,x)=>n+x.event.usage.total,0),150);
assert.equal(second.at(-1).scan.events_inserted,0);
console.log(JSON.stringify({ok:true,tests:['request and compaction accounting','legacy mirror suppression','explicit Fast mode','copied-file deduplication','restart persistence','metadata-only protocol'],upstream:first.at(-1).upstream}));
