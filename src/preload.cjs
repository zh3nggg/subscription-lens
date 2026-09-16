'use strict';
const {contextBridge,ipcRenderer}=require('electron');
const call=(name,...args)=>ipcRenderer.invoke('lens:'+name,...args);
contextBridge.exposeInMainWorld('lens',{
  chooseMonitor:kind=>call('chooseMonitor',kind),addDetectedMonitors:kind=>call('addDetectedMonitors',kind),configureMonitor:(id,input)=>call('configureMonitor',id,input),monitorRate:(provider,model,input)=>call('monitorRate',provider,model,input),exportMonitor:filters=>call('exportMonitor',filters),
  setCompact:value=>call('setCompact',value),setPinned:value=>call('setPinned',value),removeRoot:root=>call('removeRoot',root),previewReport:f=>call('previewReport',f),exportReport:f=>call('exportReport',f),
  query:filters=>call('query',filters),saveSettings:settings=>call('saveSettings',settings),
  chooseRoot:()=>call('chooseRoot'),useDetectedRoot:()=>call('useDetectedRoot'),
  connect:()=>call('connect'),login:()=>call('login'),cancelLogin:()=>call('cancelLogin'),disconnect:()=>call('disconnect'),chooseCodex:()=>call('chooseCodex'),
  refresh:()=>call('refresh'),rescan:()=>call('rescan'),exportCsv:filters=>call('exportCsv',filters),
  importPrices:()=>call('importPrices'),exportPrices:()=>call('exportPrices'),resetPrices:()=>call('resetPrices'),
  openHelp:()=>call('openHelp'),openPricing:()=>call('openPricing'),diagnostics:()=>call('diagnostics'),
  changed:callback=>{const listener=()=>callback();ipcRenderer.on('lens:changed',listener);return()=>ipcRenderer.removeListener('lens:changed',listener);}
});
