'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const {_electron:electron}=require('playwright');const {Store}=require('../src/core/store.cjs');
process.env.ELECTRON_CACHE=path.resolve(__dirname,'../.cache/electron');
async function main(){
 const base=path.resolve(__dirname,'../test-results');await fs.mkdir(base,{recursive:true});const dir=await fs.mkdtemp(path.join(base,'i18n-ui-'));const data=path.join(dir,'data'),home=path.join(dir,'codex');await fs.mkdir(path.join(home,'sessions'),{recursive:true});
 // Isolated test data only; never read the tester's actual account or sessions.
 const store=new Store(data);store.set('settings',{roots:[home],language:'en-US',paid:20,theme:'light'});
 const at=new Date().toISOString();const event={id:'localization-test',session:'test-session',project:'Example project',model:'gpt-6-astra',at,input:10000,cached:8000,write:0,output:1000,reasoning:500,total:11000,quality:'complete'};
 store.commit('fixture',{offset:0,size:0,mtime:0,state:{}},[event],{source:'record',observedAt:at,windows:[{limit:'codex',window:'primary',used:25,minutes:300,resetsAt:Math.floor(Date.now()/1000)+3600,observedAt:at}]});store.close();
 const executablePath=process.env.LENS_TEST_EXE||require('electron');const args=process.env.LENS_TEST_EXE?[]:[path.resolve(__dirname,'..')];
 const launch=()=>electron.launch({executablePath,args,env:{...process.env,ELECTRON_RUN_AS_NODE:undefined,LENS_DATA_DIR:data,LENS_TEST_HIDDEN:'1'}});
 const app=await launch();const checks=[];try{const page=await app.firstWindow();page.setDefaultTimeout(20000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.waitForSelector('.metrics');
  for(const [locale,heading] of [['zh-CN','设置'],['en-US','Settings'],['nl-NL','Instellingen']]){
   await page.click('aside [data-page=settings]');await page.waitForSelector('#language');await page.selectOption('#language',locale);await page.click('button[type=submit]');await page.waitForFunction(l=>document.documentElement.lang===l,locale);assert.equal(await page.locator('h1').innerText(),heading);
   for(const section of ['overview','activity','models','sources','settings']){await page.click('aside [data-page='+section+']');await page.waitForTimeout(180);if(locale!=='zh-CN'){const content=await page.locator('main').evaluate(el=>{const copy=el.cloneNode(true);copy.querySelectorAll('select').forEach(s=>s.remove());return copy.textContent;});assert.doesNotMatch(content,/[\u3400-\u9fff]/,locale+'/'+section);}assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,locale+'/'+section+' horizontal overflow');}
   await page.click('aside [data-page=activity]');await page.click('[data-view=records]');await page.locator('[data-detail]').first().click();if(locale!=='zh-CN')assert.doesNotMatch(await page.locator('#dialog-body').innerText(),/[\u3400-\u9fff]/);await page.click('#close-dialog');
   await page.click('#about');if(locale!=='zh-CN')assert.doesNotMatch(await page.locator('#dialog-body').innerText(),/[\u3400-\u9fff]/);await page.click('#close-dialog');
   const invalid=await page.evaluate(()=>window.lens.saveSettings({cycleStart:'bad'}));assert.equal(invalid.ok,false);assert.equal(invalid.error,locale==='zh-CN'?'日期无效':locale==='en-US'?'Invalid date':'Ongeldige datum');
   await page.click('aside [data-page=overview]');await page.screenshot({path:path.join(base,'i18n-'+locale+'.png'),fullPage:true});checks.push(locale+': all pages, detail, about, validation errors and layout');
  }
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(820,700));await page.click('aside [data-page=settings]');await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:path.join(base,'i18n-nl-narrow.png'),fullPage:true});checks.push('Dutch layout at minimum window size');
  assert.deepEqual(errors,[]);
 }finally{await app.close();}
 const reopened=await launch();try{const page=await reopened.firstWindow();page.setDefaultTimeout(20000);await page.waitForSelector('.metrics');assert.equal(await page.locator('html').getAttribute('lang'),'nl-NL');assert.equal(await page.locator('h1').innerText(),'Overzicht');checks.push('Dutch preference preserved after app restart');}finally{await reopened.close();}
 await fs.writeFile(path.join(base,'i18n-smoke'+(process.env.LENS_TEST_EXE?'-packaged':'')+'.json'),JSON.stringify({at:new Date().toISOString(),packaged:!!process.env.LENS_TEST_EXE,checks},null,2));console.log(JSON.stringify(checks,null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
