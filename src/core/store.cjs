'use strict';
const {mergeQuota}=require('./quota.cjs');
const fs=require('node:fs');
const path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
class Store{
  constructor(dir){fs.mkdirSync(dir,{recursive:true});this.dir=dir;this.db=new DatabaseSync(path.join(dir,'usage.sqlite'));this.db.exec(`PRAGMA journal_mode=WAL;PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY,session TEXT NOT NULL,at TEXT NOT NULL,model TEXT NOT NULL,project TEXT NOT NULL,total INTEGER,source TEXT NOT NULL,data TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS event_time ON events(at);
    CREATE TABLE IF NOT EXISTS files(path TEXT PRIMARY KEY,offset INTEGER NOT NULL,size INTEGER NOT NULL,mtime REAL NOT NULL,state TEXT NOT NULL,errors INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS quota_samples(identity TEXT NOT NULL,limit_id TEXT NOT NULL,window_id TEXT NOT NULL,reset INTEGER NOT NULL,bucket INTEGER NOT NULL,at INTEGER NOT NULL,used REAL NOT NULL,PRIMARY KEY(identity,limit_id,window_id,reset,bucket));
    CREATE INDEX IF NOT EXISTS quota_time ON quota_samples(at);
    PRAGMA user_version=2;`);
    this.put=this.db.prepare('INSERT OR IGNORE INTO events VALUES(?,?,?,?,?,?,?,?)');
  }
  get(key,fallback=null){const row=this.db.prepare('SELECT value FROM meta WHERE key=?').get(key);try{return row?JSON.parse(row.value):fallback;}catch{return fallback;}}
  set(key,value){this.db.prepare('INSERT INTO meta VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key,JSON.stringify(value));}
  checkpoint(file){const r=this.db.prepare('SELECT * FROM files WHERE path=?').get(file);return r?{...r,state:JSON.parse(r.state)}:null;}
  commit(file,cp,events,quota){this.db.exec('BEGIN IMMEDIATE');let added=0;try{for(const e of events)added+=Number(this.put.run(e.id,e.session,e.at,e.model,e.project,e.total,file,JSON.stringify(e)).changes);this.db.prepare('INSERT INTO files VALUES(?,?,?,?,?,?) ON CONFLICT(path) DO UPDATE SET offset=excluded.offset,size=excluded.size,mtime=excluded.mtime,state=excluded.state,errors=excluded.errors').run(file,cp.offset,cp.size,cp.mtime,JSON.stringify(cp.state),cp.errors||0);if(quota)this.set('recordQuota',mergeQuota(this.get('recordQuota'),quota));this.db.exec('COMMIT');return added;}catch(e){this.db.exec('ROLLBACK');throw e;}}
  events(from,to,defaultDevice=null){return this.db.prepare('SELECT data FROM events WHERE at>=? AND at<? ORDER BY at,id').all(from,to).map(r=>{const event=JSON.parse(r.data);if(!event.device&&defaultDevice)event.device=defaultDevice;return event;});}
  importEvents(source,events){this.db.exec('BEGIN IMMEDIATE');let added=0;try{for(const event of events)added+=Number(this.put.run(event.id,event.session,event.at,event.model,event.project,event.total,source,JSON.stringify(event)).changes);this.db.exec('COMMIT');return added;}catch(error){this.db.exec('ROLLBACK');throw error;}}
  stats(){return this.db.prepare('SELECT COUNT(*) AS records,COUNT(DISTINCT session) AS sessions,MIN(at) AS earliest,MAX(at) AS latest FROM events').get();}
  allModels(){return this.db.prepare('SELECT DISTINCT model FROM events ORDER BY model').all().map(x=>x.model);}
  fileStats(){return this.db.prepare('SELECT COUNT(*) AS files,COALESCE(SUM(errors),0) AS errors FROM files').get();}
  clearCheckpoints(){this.db.exec('DELETE FROM files');}
  recordQuota(identity,quota){
    const put=this.db.prepare('INSERT INTO quota_samples VALUES(?,?,?,?,?,?,?) ON CONFLICT(identity,limit_id,window_id,reset,bucket) DO UPDATE SET at=excluded.at,used=excluded.used WHERE excluded.at>=quota_samples.at');
    for(const w of quota.windows){const at=Date.parse(w.observedAt||quota.observedAt);if(!Number.isFinite(at)||!Number.isFinite(w.resetsAt))continue;put.run(identity,w.limit,w.window,w.resetsAt,Math.floor(at/60000),at,w.used);}
    // Keep observations for the complete active quota window. A fixed
    // three-day retention window truncated weekly quotas before the forecast
    // could learn their true average pace. Expire only windows that ended more
    // than two days ago; the reset epoch keeps storage bounded without cutting
    // off an active window early.
    this.db.prepare('DELETE FROM quota_samples WHERE reset<?').run(Math.floor(Date.now()/1000)-2*86400);
    this.db.exec('DELETE FROM quota_samples WHERE rowid IN (SELECT rowid FROM quota_samples ORDER BY at DESC LIMIT -1 OFFSET 25000)');
  }
  quotaSamples(identity){return identity?this.db.prepare('SELECT limit_id AS "limit",window_id AS "window",reset,at,used FROM quota_samples WHERE identity=? ORDER BY at').all(identity):[];}
  close(){this.db.close();}
}
module.exports={Store};
