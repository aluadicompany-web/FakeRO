import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {Store} from '../server/store.js';
import {newHero,RACES} from '../shared/rules.js';
const dir=mkdtempSync(join(tmpdir(),'fakero-final-')),origin='http://127.0.0.1:3367',db=join(dir,'world.sqlite'),store=new Store(db);
const account=await store.register('final-outfit-gm','final-art-fixture','Art-fixture-123','gm'),hero=newHero('final-art-hero','Outfit Inspector','skug');
store.createCharacter(account.id,hero,'fixture');const cookie=store.accountSession(account.id);store.db.close();
const output='artifacts/final-outfits';mkdirSync(output,{recursive:true});
const child=spawn(process.execPath,['--import','tsx','server/index.ts'],{env:{...process.env,NODE_ENV:'production',PORT:'3367',DB_PATH:db},stdio:['ignore','pipe','pipe']});let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
try{
 await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('startup timeout')),15000);child.stdout.on('data',b=>{if(b.toString().includes('listening')){clearTimeout(timer);resolve();}});child.once('exit',()=>reject(Error('server exited')));});
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});const context=await browser.newContext({viewport:{width:1440,height:1100}});await context.addCookies([{name:'fakero',value:cookie,url:origin}]);const page=await context.newPage(),errors:string[]=[],missing:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().includes('/art/'))missing.push(r.url());});await page.goto(origin);await page.waitForFunction(()=>document.body.dataset.worldRendered==='central_city',undefined,{timeout:60000});
 const before=await context.request.get(origin+'/api/me').then(r=>r.json());
 await page.locator('#gm-open').click();await page.locator('#gm-character-studio').click();await page.locator('#studio-final-outfits').click();
 const races=process.argv.includes('--smoke')?[RACES[5]]:RACES,hashes=new Set<string>();let views=0;
 for(const gender of ['male','female']){
  await page.selectOption('#final-gender',gender);
  for(const race of races){
   await page.locator(`[data-final-race="${race.id}"]`).click();assert.equal(await page.locator(`[data-final-race="${race.id}"]`).getAttribute('aria-pressed'),'true');
   await page.waitForFunction(async()=>{const urls=Array.from(document.querySelectorAll('#final-design image')).map(e=>e.getAttribute('href')!);await Promise.all(urls.map(src=>new Promise<void>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve();image.onerror=()=>reject(Error(src));image.src=src;})));return true;});
   for(const view of ['front','side','back']){const figure=page.locator(`[data-final-view="${view}"]`);assert.equal(await figure.locator('svg[data-outfit]').getAttribute('data-outfit'),`final-${race.id}-${gender}`);hashes.add(createHash('sha256').update(await figure.screenshot()).digest('hex'));views++;}
   await page.locator('.final-wardrobe').screenshot({path:`${output}/${race.id}-${gender}.png`});
  }
 }
 assert.equal(views,races.length*6);assert.equal(hashes.size,races.length*6,'every painted race/sex/view should be distinct');
 const front=page.locator('[data-final-view="front"]');const baseline=createHash('sha256').update(await front.screenshot()).digest('hex');await page.selectOption('#final-hair','3');await page.selectOption('#final-hair-color','0');await page.waitForTimeout(150);assert.notEqual(createHash('sha256').update(await front.screenshot()).digest('hex'),baseline,'modular hairstyle changes actual preview');await page.locator('#final-body-only').check();assert.equal(await page.locator('#final-design image').count(),3,'body only removes every head layer');
 for(const [width,height]of [[390,844],[844,390]]){await page.setViewportSize({width,height});await page.screenshot({path:`${output}/mobile-${width}.png`});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
 await page.locator('#final-back').click();assert.equal(await page.locator('#studio-canvas').count(),1);await page.locator('.panel-close').click();
 const after=await context.request.get(origin+'/api/me').then(r=>r.json());for(const key of ['id','name','race','level','stats','appearance','loot','armor','equippedItem','coins'])assert.deepEqual(after.hero[key],before.hero[key],key+' unchanged by wardrobe');assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
 console.log(JSON.stringify({outfits:views/3,paintedViews:views,distinctPreviews:hashes.size,modularHeads:true,bodyOnly:true,mobileOverflow:false,liveCharacterPreserved:true,pageErrors:errors,missingAssets:missing}));
}finally{await browser?.close();child.kill('SIGTERM');await new Promise<void>(resolve=>child.exitCode!==null?resolve():child.once('exit',()=>resolve()));rmSync(dir,{recursive:true,force:true});}
