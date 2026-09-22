'use strict';
const {app,BrowserWindow,ipcMain,dialog,shell,Menu,Tray,nativeImage,nativeTheme,Notification,safeStorage}=require('electron');
const path=require('node:path');const fs=require('node:fs/promises');const {pathToFileURL}=require('node:url');
const APP_USER_MODEL_ID='net.subscriptionlens.desktop';
app.setName('Subscription Lens');
app.setAppUserModelId(APP_USER_MODEL_ID);
const {resolveLanguage,translate}=require('./i18n.js');
const {reportData,reportHtml}=require('./core/report.cjs');
const {Service}=require('./core/service.cjs');const {dollars}=require('./core/pricing.cjs');
const {CCSwitchSidecar,defaultSidecarPath}=require('./core/cc-switch-sidecar.cjs');
const {monitorDefaults,discoverMonitors}=require('./core/discovery.cjs');
if(process.env.LENS_DATA_DIR)app.setPath('userData',path.resolve(process.env.LENS_DATA_DIR));
const lock=app.requestSingleInstanceLock();if(!lock){app.quit();}else{
let win,service,tray,sidecar,quitting=false,changeTimer,lastRefresh=0,compactMode=false,pinned=false,normalBounds=null;
async function hasEmbeddedRouteConfig(){
  if(!service)return false;
  try{
    const configPath=path.join(service.providers.getCodexHome(),'config.toml');
    const text=await fs.readFile(configPath,'utf8');
    return /^\s*model_provider\s*=\s*["']subscription-lens-/m.test(text)
      || /^\s*model_catalog_json\s*=\s*["']cc-switch-model-catalog\.json["']/m.test(text)
      || /base_url\s*=\s*["']http:\/\/127\.0\.0\.1:\d+\/v1["']/m.test(text);
  }catch{return false;}
}
async function restoreEmbeddedRoute(){
  if(!service)return false;
  const routePresent=await hasEmbeddedRouteConfig();
  if(!service.store.get('ccSwitchRoutingActive',false)&&!routePresent)return false;
  // The embedded CCS runtime owns the full takeover transaction, including
  // its live-config and auth-preserving restore snapshot. A second Lens-level
  // config backup can overwrite that transaction with stale state.
  await sidecar.start();
  await sidecar.request({command:'activateCodexOfficial'},60_000);
  await sidecar.stopAndRestore();
  // CCS restores the provider transaction. Always remove Lens-owned catalog
  // directives afterwards because an older or incomplete CCS snapshot can leave
  // cc-switch-model-catalog.json active even after the provider is official.
  // This cleanup is scoped to Lens-owned keys/blocks and never touches auth.json.
  await service.providers.cleanupOfficialRoute();
  service.store.set('ccSwitchRoutingActive',false);
  service.store.set('ccSwitchRoutingRestoreBackup',null);
  return true;
}
const t=(key,params)=>translate(key,resolveLanguage(service?.settings.language,app.getLocale()),params);
const ui=pathToFileURL(path.join(__dirname,'ui','index.html')).href;
// Windows shell identity is keyed from the executable and a real multi-size
// ICO. Keep PNG for platforms/components that prefer raster tray assets.
const iconPng=path.join(__dirname,'../assets/icon.png');
const icon=process.platform==='win32'?path.join(__dirname,'../assets/icon.ico'):iconPng;
function changed(){clearTimeout(changeTimer);changeTimer=setTimeout(()=>{if(win&&!win.isDestroyed())win.webContents.send('lens:changed');updateTray();},250);}
function show(){if(win){if(win.isMinimized())win.restore();win.show();win.focus();}}
function configureDesktop(){nativeTheme.themeSource=service.settings.theme;if(win)win.setBackgroundColor(nativeTheme.shouldUseDarkColors?'#212121':'#ffffff');if(tray){tray.destroy();tray=null;}if(service.settings.tray&&!tray){tray=new Tray(nativeImage.createFromPath(icon));tray.setToolTip(t("余量"));tray.on('double-click',show);tray.on('click',()=>{setCompact(true);show();});updateTray();}if(!service.settings.tray&&tray){tray.destroy();tray=null;}}

function setCompact(value){if(!win||compactMode===value)return;if(value){normalBounds=win.getBounds();win.setMinimumSize(360,400);win.setSize(420,560);}else{win.setMinimumSize(760,560);if(normalBounds)win.setBounds(normalBounds);if(pinned){pinned=false;win.setAlwaysOnTop(false);}}compactMode=value;changed();}
function updateTray(){if(!tray||!service)return;const account=service.account.status;const fresh=account.state==='connected'&&account.quota&&Date.now()-Date.parse(account.quota.observedAt)<180000;const windows=fresh?account.quota.windows.filter(w=>w.resetsAt*1000>Date.now()):[];const primary=(windows.filter(w=>w.limit==='codex').length?windows.filter(w=>w.limit==='codex'):windows).sort((a,b)=>b.used-a.used)[0];const status=primary?Math.max(0,100-primary.used).toFixed(0)+t('% 剩余'):t('未连接');const providers=service.providers?.list?.()||[];tray.setToolTip('Subscription Lens · '+status);tray.setContextMenu(Menu.buildFromTemplate([{label:status,enabled:false},{label:t('打开余量'),click:()=>{setCompact(false);show();}},{label:t('专注窗口'),click:()=>{setCompact(true);show();}},{label:t('刷新用量'),click:()=>{service.scan();if(service.settings.accountEnabled)service.account.refresh(service.settings.codexPath);}},{type:'separator'},{label:t('Codex 供应商'),submenu:providers.length?providers.map(p=>({label:p.name,type:'radio',checked:p.active,click:()=>{const switcher=service.router?.server&&!p.builtIn?service.providerSwitch(p.id):service.providerActivate(p.id);switcher.catch(error=>new Notification({title:t('切换失败'),body:t(error.message)}).show());}})):[{label:t('请先添加供应商'),enabled:false}]},{type:'separator'},{label:t('退出'),click:()=>app.quit()}]));}
function notifyQuota(alerts){if(!Notification.isSupported())return;try{const body=alerts.map(a=>(a.window.label||a.window.limit)+' · '+(a.type==='reset'?t('额度已恢复'):Math.max(0,100-a.window.used).toFixed(0)+t('% 剩余'))).join('\n');const notice=new Notification({title:t('套餐额度'),body,silent:true,icon});notice.on('click',()=>{setCompact(true);show();});notice.show();}catch{/* Notification failures must not break account refresh. */}}

function handler(name,fn){ipcMain.handle('lens:'+name,async(event,...args)=>{if(!win||event.sender!==win.webContents||event.senderFrame!==win.webContents.mainFrame||event.senderFrame.url!==ui)throw new Error('无效窗口');try{return {ok:true,value:await fn(...args)};}catch(e){return {ok:false,error:typeof e.message==='string'?t(e.message).slice(0,200):t("操作失败")};}});}
function csvCell(value){let s=String(value??'');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
function monitorDefault(kind){return monitorDefaults().find(candidate=>candidate.kind===kind)?.path;}
function detectedMonitors(){return discoverMonitors({connected:service.monitor.sources});}
function register(){
  handler('chooseMonitor',async kind=>{if(!['cc-switch','claude','gemini','qwen','kimi','codebuddy','qoder','usage-jsonl'].includes(kind))throw Error('不支持的来源');const folder=['claude','gemini','qwen','kimi','codebuddy','qoder'].includes(kind),candidate=monitorDefault(kind);let defaultPath;try{if(candidate){await fs.access(candidate);defaultPath=candidate;}}catch{/* Start in the system default folder when the client has no data yet. */}const result=await dialog.showOpenDialog(win,{title:t('添加监控来源'),properties:[folder?'openDirectory':'openFile'],...(defaultPath?{defaultPath}:{}),...(folder?{}:{filters:[{name:kind==='cc-switch'?'SQLite':'JSONL',extensions:kind==='cc-switch'?['db','sqlite','sqlite3']:['jsonl']}]})});if(result.canceled)return null;const added=await service.monitor.add(kind,result.filePaths[0]);changed();return added;});
  handler('configureMonitor',(id,input)=>{const result=service.monitor.configure(id,input||{});changed();return result;});
  handler('addDetectedMonitors',async kind=>{const candidates=detectedMonitors().filter(item=>!item.connected&&(!kind||item.kind===kind));const added=[],failed=[];for(const candidate of candidates)try{added.push(await service.monitor.add(candidate.kind,candidate.path));}catch(error){failed.push({kind:candidate.kind,error:error.message});}changed();if(!added.length&&failed.length)throw Error(failed[0].error);return {added:added.length,failed:failed.length};});
  handler('monitorRate',(provider,model,input)=>{const result=service.monitor.setRate(provider,model,input||{});changed();return result;});
  handler('providerList',()=>service.providerList());
  handler('providerSave',input=>service.providerSave(input||{}));
  handler('providerDelete',id=>service.providerDelete(id));
  handler('providerImportCurrent',()=>service.providerImportCurrent());

  async function activateWithCCSwitchCore(id){
    const provider=service.providers.get(id);
    if(provider.builtIn){
      await restoreEmbeddedRoute();
      const result=service.providers.switchActive(id);changed();
      return {...result,mode:'official-restored',needsRestart:true};
    }
    const key=service.providers.resolveCredential(provider);
    if(!key)throw Error('请先在高级设置中保存 API Key');
    const wasRunning=sidecar.status().running;
    await sidecar.start();
    await sidecar.request({command:'activateCodexProvider',providerId:provider.id,name:provider.name,baseUrl:provider.baseUrl,apiKey:key,upstreamModel:provider.model,modelMappings:provider.modelMappings||[],modelCatalog:provider.catalogModels||provider.modelCatalog||[],protocol:provider.protocol},60_000);
    service.store.set('ccSwitchRoutingActive',true);
    const result=service.providers.switchActive(id);changed();
    return {...result,mode:wasRunning?'cc-switch-hot':'cc-switch-takeover',needsRestart:!wasRunning};
  }
  handler('providerActivate',activateWithCCSwitchCore);
  handler('providerActivateProxy',activateWithCCSwitchCore);
  handler('providerSwitch',activateWithCCSwitchCore);
  handler('providerTest',id=>service.providerTest(id));
  handler('providerDiscover',input=>service.providers.discover(input||{}));
  handler('routerStart',async()=>{const result=await sidecar.start();changed();return result;});
  handler('routerStop',async()=>{await restoreEmbeddedRoute();changed();return true;});
  handler('exportMonitor',async filters=>{const selected=service.query(filters||{});const data=service.monitor.query({...filters,export:true},selected.range,service.catalog);const result=await dialog.showSaveDialog(win,{title:t('导出用量'),defaultPath:'provider-usage.csv',filters:[{name:'CSV',extensions:['csv']}]});if(result.canceled)return null;const rows=[['time_utc','provider','model','input_including_cache','cached','cache_write','output_including_reasoning','reasoning','total_tokens','cost_usd','cost_basis','source_amount','source_unit','status','latency_ms','ttft_ms','source_id','overlap_kind','overlap_sources','origin'],...data.rows.map(e=>[e.at,e.provider,e.model,e.input,e.cached,e.write,e.output,e.reasoning,e.total,e.usd??'',e.amount===null?'unpriced':e.basis,e.sourceAmount===null?'':Number(e.sourceAmount)/1e15,e.sourceUnit||'',e.status,e.latencyMs,e.ttftMs,e.sourceId||data.source||'',e.overlap?.kind||'',(e.overlap?.sources||[]).join('|'),e.origin||''])];await fs.writeFile(result.filePath,'\uFEFF'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n'));return data.rows.length;});
  handler('exportDeviceLedger',async()=>{const result=await dialog.showSaveDialog(win,{title:t('导出设备数据'),defaultPath:'subscription-lens-device.json',filters:[{name:'JSON',extensions:['json']}]});if(result.canceled)return null;const data=service.exportDeviceLedger();await fs.writeFile(result.filePath,JSON.stringify(data,null,2));return data.records.length;});
  handler('importDeviceLedger',async()=>{const result=await dialog.showOpenDialog(win,{title:t('导入设备数据'),filters:[{name:'JSON',extensions:['json']}],properties:['openFile']});if(result.canceled)return null;const stat=await fs.stat(result.filePaths[0]);if(stat.size>25*1024*1024)throw Error('设备数据包过大');return service.importDeviceLedger(JSON.parse(await fs.readFile(result.filePaths[0],'utf8')));});
  handler('renameDevice',(id,label)=>service.renameDevice(id,label));
  handler('query',f=>({...service.query(f||{}),router:sidecar?.status()||{embedded:true,running:false},desktop:{compact:compactMode,pinned,version:app.getVersion(),notificationsAvailable:Notification.isSupported(),detectedMonitors:detectedMonitors()}}));
  handler('setCompact',value=>{setCompact(value===true);return true;});
  handler('setPinned',value=>{pinned=value===true;win.setAlwaysOnTop(pinned);changed();return pinned;});
  handler('removeRoot',root=>service.removeRoot(root));
  handler('previewReport',f=>reportData(service.query(f||{}),f||{}));
  handler('exportReport',async f=>{const data=reportData(service.query(f||{}),f||{});const result=await dialog.showSaveDialog(win,{title:t('导出摘要'),defaultPath:'subscription-lens-summary.html',filters:[{name:'HTML',extensions:['html']}]});if(result.canceled)return null;await fs.writeFile(result.filePath,reportHtml(data,resolveLanguage(service.settings.language,app.getLocale())));return true;});
  handler('saveSettings',s=>{const before=service.settings.startup;const result=service.saveSettings(s||{});configureDesktop();if(app.isPackaged&&before!==result.startup)app.setLoginItemSettings({openAtLogin:result.startup,path:app.getPath('exe')});return result;});
  handler('chooseRoot',async()=>{const r=await dialog.showOpenDialog(win,{title:t("选择 Codex 目录"),defaultPath:service.detectedRoot,properties:['openDirectory']});if(r.canceled)return null;return service.addRoot(r.filePaths[0]);});
  handler('useDetectedRoot',()=>service.addRoot(service.detectedRoot));
  handler('chooseCodex',async()=>{const r=await dialog.showOpenDialog(win,{title:t("选择 codex.exe"),filters:[{name:'Codex',extensions:['exe']}],properties:['openFile']});if(r.canceled)return null;const exe=r.filePaths[0];if(path.basename(exe).toLowerCase()!=='codex.exe')throw new Error('请选择 codex.exe');service.setCodexPath(exe);return exe;});
  handler('connect',()=>service.enableAccount());
  handler('login',async()=>{service.settings.accountEnabled=true;service.store.set('settings',service.settings);const url=await service.account.login(service.settings.codexPath);const u=new URL(url);if(u.protocol!=='https:'||!['auth.openai.com','chatgpt.com','auth0.openai.com'].includes(u.hostname))throw new Error('登录地址未通过校验');await shell.openExternal(url);return true;});
  handler('cancelLogin',()=>service.account.cancelLogin());handler('disconnect',()=>service.disableAccount());
  handler('refresh',async()=>{if(Date.now()-lastRefresh<15000)throw new Error('请稍后刷新');lastRefresh=Date.now();await service.scan();if(service.settings.accountEnabled)await service.account.refresh(service.settings.codexPath);return true;});
  handler('rescan',async()=>{if(service.scanner.running)throw new Error('正在读取，请稍后重试');service.store.clearCheckpoints();await service.scan();return true;});
  handler('exportCsv',async filters=>{const r=await dialog.showSaveDialog(win,{title:t("导出用量"),defaultPath:'codex-usage.csv',filters:[{name:'CSV',extensions:['csv']}]});if(r.canceled)return null;const rows=service.exportRows(filters||{});const data=[['time_utc','model','input','cached_input','cache_write_input','output','reasoning_in_output','tokens','api_equivalent_usd','pricing_status','price_version'],...rows.map(e=>[e.at,e.model,e.input,e.cached,e.write,e.output,e.reasoning,e.total,e.price.amount===null?'':dollars(e.price.amount).toFixed(9),e.price.reason||'priced',e.price.version])].map(row=>row.map(csvCell).join(',')).join('\r\n');await fs.writeFile(r.filePath,'\uFEFF'+data,'utf8');return rows.length;});
  handler('exportPrices',async()=>{const r=await dialog.showSaveDialog(win,{title:t("导出价格目录"),defaultPath:'prices.json',filters:[{name:'JSON',extensions:['json']}]});if(r.canceled)return null;await fs.writeFile(r.filePath,JSON.stringify(service.catalog,null,2));return true;});
  handler('importPrices',async()=>{const r=await dialog.showOpenDialog(win,{title:t("导入价格目录"),filters:[{name:'JSON',extensions:['json']}],properties:['openFile']});if(r.canceled)return null;const s=await fs.stat(r.filePaths[0]);if(s.size>1024*1024)throw new Error('价格文件过大');service.catalogImport(JSON.parse(await fs.readFile(r.filePaths[0],'utf8')));return true;});
  handler('resetPrices',()=>{service.catalogReset();return true;});
  handler('openHelp',()=>shell.openExternal('https://learn.chatgpt.com/docs/cli'));
  handler('openPricing',()=>shell.openExternal('https://developers.openai.com/api/docs/pricing'));
  handler('diagnostics',async()=>{const r=await dialog.showSaveDialog(win,{title:t("导出诊断"),defaultPath:'subscription-lens-diagnostics.json',filters:[{name:'JSON',extensions:['json']}]});if(r.canceled)return null;const summary={version:app.getVersion(),platform:process.platform,arch:process.arch,scanner:service.scanner.status,counts:service.store.stats(),fileCounts:service.store.fileStats(),accountState:service.account.status.state,accountError:service.account.status.lastError,priceVersion:service.catalog.version};await fs.writeFile(r.filePath,JSON.stringify(summary,null,2));return true;});
}
async function create(){
  const credentialVault={isAvailable:()=>safeStorage.isEncryptionAvailable(),encrypt:value=>safeStorage.encryptString(value).toString('base64'),decrypt:value=>safeStorage.decryptString(Buffer.from(value,'base64'))};
  service=new Service(app.getPath('userData'),{credentialVault});service.on('changed',changed);service.on('alert',notifyQuota);
  sidecar=new CCSwitchSidecar(defaultSidecarPath(path.resolve(__dirname,'..'),app.isPackaged),{codexHome:service.providers.getCodexHome(),runtimeHome:path.join(app.getPath('userData'),'cc-switch-router-runtime')});sidecar.on('changed',changed);
  win=new BrowserWindow({width:1100,height:720,minWidth:760,minHeight:560,show:false,title:t("余量"),icon,backgroundColor:'#ffffff',autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true,backgroundThrottling:!process.env.LENS_TEST_HIDDEN}});
  if(process.platform==='win32'){
    // Set the icon on the window object as well as the shell metadata. This
    // prevents Windows from deriving the taskbar identity from electron.exe
    // when a shortcut was launched from an older shell cache.
    try{win.setIcon(nativeImage.createFromPath(icon));}catch{/* Keep startup usable if a shell icon API is unavailable. */}
    if(typeof win.setAppDetails==='function')win.setAppDetails({appId:APP_USER_MODEL_ID,appIconPath:icon,appIconIndex:0,relaunchDisplayName:'Subscription Lens',relaunchIcon:icon});
  }
  Menu.setApplicationMenu(null);win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',e=>e.preventDefault());win.webContents.session.setPermissionRequestHandler((_,__,callback)=>callback(false));win.webContents.session.setPermissionCheckHandler(()=>false);
  win.on('close',e=>{if(service.settings.tray&&!quitting){e.preventDefault();win.hide();}});
  register();configureDesktop();await win.loadURL(ui);if(process.env.LENS_TEST_HIDDEN!=='1')win.show();service.start();
}
app.on('second-instance',show);app.whenReady().then(create).catch(()=>{dialog.showErrorBox(t("无法启动"),t("应用数据无法打开。请检查数据目录权限。"));app.exit(1);});
app.on('window-all-closed',()=>{if(!service?.settings.tray)app.quit();});
app.on('before-quit',e=>{if(!quitting&&service){e.preventDefault();quitting=true;clearTimeout(changeTimer);Promise.resolve(restoreEmbeddedRoute()).catch(()=>{}).finally(()=>service.close().finally(()=>app.quit()));}});
}
