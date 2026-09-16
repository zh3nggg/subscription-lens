'use strict';
const {mergeQuota}=require('./quota.cjs');
const fs=require('node:fs/promises');
const path=require('node:path');
const {parseRecord,newState}=require('./parser.cjs');
const MAX_LINE=16*1024*1024;
async function filesUnder(root){const result=[];async function walk(dir,depth){if(depth>7)return;let entries;try{entries=await fs.readdir(dir,{withFileTypes:true});}catch(e){if(e.code==='ENOENT')return;throw e;}for(const entry of entries){if(entry.isSymbolicLink())continue;const file=path.join(dir,entry.name);if(entry.isDirectory())await walk(file,depth+1);else if(entry.isFile()&&entry.name.endsWith('.jsonl'))result.push(file);}}await walk(root,0);return result;}
class Scanner{
  constructor(store){this.store=store;this.running=false;this.status={running:false,files:0,processed:0,lastScan:null,errors:0};}
  async scan(roots,onProgress=()=>{}){
    if(this.running)return this.status;this.running=true;this.status={...this.status,running:true,processed:0,errors:0};
    try{
      const all=[];this.status.roots=[];for(const root of roots){try{if(!(await fs.stat(root)).isDirectory())throw new Error('not_directory');const before=all.length;for(const sub of ['sessions','archived_sessions'])all.push(...await filesUnder(path.join(root,sub)));this.status.roots.push({path:root,state:all.length>before?'ready':'empty'});}catch{this.status.errors++;this.status.roots.push({path:root,state:'unavailable'});}}
      const files=[...new Set(all)].sort();this.status.files=files.length;let added=0;
      for(const file of files){try{added+=await this.read(file);}catch{this.status.errors++;}this.status.processed++;if(this.status.processed%5===0)onProgress({...this.status});}
      this.status.lastScan=new Date().toISOString();this.status.added=added;
    }catch{this.status.errors++;}
    finally{this.running=false;this.status.running=false;onProgress({...this.status});}return this.status;
  }
  async read(file){
    const stat=await fs.stat(file);let cp=this.store.checkpoint(file);
    if(cp&&cp.size===stat.size&&cp.mtime===stat.mtimeMs)return 0;
    if(!cp||stat.size<cp.offset||(stat.size===cp.size&&stat.mtimeMs!==cp.mtime))cp={offset:0,state:newState(),errors:0};
    const start=cp.offset,handle=await fs.open(file,'r');let position=start,committed=start,pending=Buffer.alloc(0),discarding=false,events=[],quota=null;
    try{const chunk=Buffer.alloc(256*1024);while(position<stat.size){const {bytesRead}=await handle.read(chunk,0,Math.min(chunk.length,stat.size-position),position);if(!bytesRead)break;position+=bytesRead;pending=Buffer.concat([pending,chunk.subarray(0,bytesRead)]);
      let at;while((at=pending.indexOf(10))>=0){const line=pending.subarray(0,at);pending=pending.subarray(at+1);committed=position-pending.length;
        if(discarding||line.length>MAX_LINE){discarding=false;cp.errors++;continue;}
        if(!line.length)continue;
        try{const r=JSON.parse(line.toString('utf8'));const result=parseRecord(r,cp.state);if(result.event)events.push(result.event);if(result.quota)quota=mergeQuota(quota,result.quota);if(result.warning)cp.errors++;}catch{cp.errors++;}
      }
      if(pending.length>MAX_LINE){pending=Buffer.alloc(0);discarding=true;}
      // Yield so the desktop remains responsive during initial import.
      await new Promise(resolve=>setImmediate(resolve));
    }}finally{await handle.close();}
    // Oversized unfinished records are retried from the last complete line.
    return this.store.commit(file,{offset:committed,size:stat.size,mtime:stat.mtimeMs,state:cp.state,errors:cp.errors},events,quota);
  }
}
module.exports={Scanner,filesUnder};
