'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');const {_electron:electron}=require('playwright');
process.env.ELECTRON_CACHE=path.resolve(__dirname,'../.cache/electron');
async function main(){const base=path.resolve(__dirname,'../test-results');await fs.mkdir(base,{recursive:true});const dir=await fs.mkdtemp(path.join(base,'quota-ui-'));const exe=process.env.LENS_TEST_EXE||require('electron');const app=await electron.launch({executablePath:exe,args:process.env.LENS_TEST_EXE?[]:[path.resolve(__dirname,'..')],env:{...process.env,ELECTRON_RUN_AS_NODE:undefined,LENS_DATA_DIR:dir,LENS_TEST_HIDDEN:'1'}});
 try{const page=await app.firstWindow();page.setDefaultTimeout(20000);await page.waitForSelector('h1');
  await app.evaluate(({app,Notification})=>{
   // Mock the official account source and native delivery only inside this test process.
   const load=process.getBuiltinModule('module').createRequire(app.getAppPath()+'/src/main.cjs');const path=load('node:path');const {Service}=load(path.join(app.getAppPath(),'src/core/service.cjs'));const original=Service.prototype.query;
   global.testNotices=[];global.testQuotaUsed=80;global.testQuotaReset=Math.floor(Date.now()/1000)+7200;global.testForceSnapshot=true;
   Notification.prototype.show=function(){global.testNotices.push({title:this.title,body:this.body});};
   Service.prototype.query=function(filters){const prior=this.account.status,settings={...this.settings};const now=Date.now();const win={limit:'codex',window:'primary',minutes:300,used:global.testQuotaUsed,resetsAt:global.testQuotaReset,observedAt:new Date(now).toISOString()};const quota={source:'account',observedAt:win.observedAt,windows:[win]};
    this.settings.accountEnabled=true;this.settings.notifications=true;this.settings.quietStart=0;this.settings.quietEnd=0;this.settings.language='en-US';this.settings.roots=['fixture'];
    this.account.status={state:'connected',identity:'test-account',quota,plan:'plus',usage:null};
    for(let i=0;i<3;i++)this.store.recordQuota('test-account',{...quota,windows:[{...win,used:Math.max(0,win.used-30+i*15),observedAt:new Date(now-(2-i)*15*60000).toISOString()}]});
    if(global.testForceSnapshot){global.testForceSnapshot=false;this.accountChanged(this.account.status);}
    try{return original.call(this,filters);}finally{this.account.status=prior;this.settings=settings;}
   };
  });
  await page.evaluate(()=>window.lens.query({}));await page.waitForSelector('.quota-number');await page.waitForFunction(()=>document.querySelector('.pace-line')?.textContent.includes('May run out'));
  assert.match(await page.locator('.quota-number').innerText(),/20/);assert.match(await page.locator('.pace-detail').innerText(),/30 minutes/);assert.equal(await app.evaluate(()=>global.testNotices.length),1);
  await app.evaluate(()=>global.testForceSnapshot=true);await page.evaluate(()=>window.lens.query({}));assert.equal(await app.evaluate(()=>global.testNotices.length),1);
  await page.screenshot({path:path.join(base,'product-forecast-fixture.png'),fullPage:true});
  await app.evaluate(()=>{global.testQuotaUsed=96;global.testForceSnapshot=true;});await page.evaluate(()=>window.lens.query({}));assert.equal(await app.evaluate(()=>global.testNotices.length),2);
  await app.evaluate(()=>{global.testQuotaUsed=1;global.testQuotaReset+=18000;global.testForceSnapshot=true;});await page.evaluate(()=>window.lens.query({}));assert.equal(await app.evaluate(()=>global.testNotices.length),3);
  const notices=await app.evaluate(()=>global.testNotices);assert.match(notices[2].body,/Quota restored/);await fs.writeFile(path.join(base,'quota-ui'+(process.env.LENS_TEST_EXE?'-packaged':'')+'.json'),JSON.stringify({at:new Date().toISOString(),packaged:!!process.env.LENS_TEST_EXE,checks:['Conservative forecast displayed from same-account observations','Native delivery called once at 20%, once at 5%, once on confirmed recovery','Duplicate snapshots produce no repeated notice'],nativeDeliveryMocked:true},null,2));console.log('Quota UI and notification integration passed; native delivery was intercepted.');
 }finally{await app.close();}}
main().catch(e=>{console.error(e);process.exitCode=1;});
