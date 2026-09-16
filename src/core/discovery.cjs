'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const folders=new Set(['claude','gemini','qwen','kimi','codebuddy','qoder']);
function monitorDefaults({home=os.homedir(),env=process.env}={}){return [
  {kind:'qwen',path:env.QWEN_HOME||path.join(home,'.qwen')},
  {kind:'kimi',path:env.KIMI_CODE_HOME||path.join(home,'.kimi-code')},
  {kind:'codebuddy',path:path.join(home,'.codebuddy')},
  {kind:'qoder',path:env.QODER_CONFIG_DIR||path.join(home,'.qoder')},
  {kind:'cc-switch',path:path.join(home,'.cc-switch','cc-switch.db')},
  {kind:'claude',path:path.join(home,'.claude','projects')},
  {kind:'gemini',path:path.join(home,'.gemini','tmp')}
];}
function discoverMonitors(options={}){
  const connected=new Set((options.connected||[]).map(s=>String(s.path).toLowerCase()));
  return monitorDefaults(options).flatMap(candidate=>{try{const resolved=fs.realpathSync(candidate.path),stat=fs.statSync(resolved),valid=folders.has(candidate.kind)?stat.isDirectory():stat.isFile();return valid?[{...candidate,path:resolved,connected:connected.has(resolved.toLowerCase())}]:[];}catch{return [];}});
}
module.exports={monitorDefaults,discoverMonitors};
