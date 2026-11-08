import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const base=process.env.BASE_URL||'http://127.0.0.1:3000';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
mkdirSync('artifacts',{recursive:true});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const username='looks'+Date.now(),password='Appearance-fixture-123';await page.goto(base);await page.locator('#register-tab').click();await page.locator('#account-username').fill(username);await page.locator('#account-password').fill(password);await page.locator('#account-confirm').fill(password);await page.locator('#account-submit').click();await page.locator('#avatar-preview svg').waitFor();
 const previews=new Set();
 for(const race of ['muspel','alf','jotun','vanir','nid','skug']){
  console.log('Checking '+race);await page.locator(`[data-race="${race}"]`).click();
  for(const gender of ['male','female']){
   await page.locator('#gender').selectOption(gender);assert.equal(await page.locator('#hair option').count(),5);
   if(race==='muspel')for(let c=0;c<6;c++){await page.locator(`[data-hair-color="${c}"]`).click();assert.equal(await page.locator(`[data-hair-color="${c}"]`).getAttribute('aria-pressed'),'true');}
   for(let i=0;i<5;i++){await page.locator('#hair').selectOption(String(i));previews.add(await page.locator('#avatar-preview').innerHTML());}
   for(let i=0;i<5;i++){await page.locator(`[data-eye="${i}"]`).click();assert.equal(await page.locator(`[data-eye="${i}"]`).getAttribute('aria-pressed'),'true');}
  }
 }
 assert.equal(previews.size,60);
 await page.locator('[data-race="jotun"]').click();await page.locator('#gender').selectOption('female');await page.locator('#hair').selectOption('2');await page.locator('[data-eye="2"]').click();await page.locator('[data-hair-color="1"]').click();
 await page.screenshot({path:'artifacts/05-character-creator.png'});
 // Verify malformed appearance is refused by the actual create endpoint.
 const invalidStatuses=await page.evaluate(async()=>{const values=[{gender:'other',hair:0,eyes:0},{gender:'female',hair:9,eyes:0},{gender:'male',hair:0,eyes:-1},{gender:'female',hair:0,eyes:0,hairColor:6}];const statuses=[];for(const appearance of values){const r=await fetch('/api/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Invalid',race:'jotun',appearance})});statuses.push(r.status);}return statuses;});assert.deepEqual(invalidStatuses,[400,400,400,400]);
 await page.setViewportSize({width:390,height:844});await page.locator('#avatar-preview').scrollIntoViewIfNeeded();await page.screenshot({path:'artifacts/06-creator-mobile-preview.png'});
 await page.locator('#name').fill('ธารชีวิต');await page.locator('#create button[type=submit]').scrollIntoViewIfNeeded();await page.screenshot({path:'artifacts/07-creator-mobile-controls.png'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.locator('#create button[type=submit]').click();await page.locator('#online').filter({hasText:'1 / 10 ONLINE'}).waitFor();await page.waitForTimeout(700);
 const hero=await page.evaluate(async()=> (await(await fetch('/api/me')).json()).hero);assert.deepEqual(hero.appearance,{gender:'female',hair:2,eyes:2,hairColor:1});assert.equal(hero.race,'jotun');
 await page.screenshot({path:'artifacts/08-acolyte-world.png'});
 await page.reload();await page.locator('#online').filter({hasText:'1 / 10 ONLINE'}).waitFor();const restored=await page.evaluate(async()=> (await(await fetch('/api/me')).json()).hero);assert.deepEqual(restored.appearance,hero.appearance);assert.equal(restored.id,hero.id);
 await page.locator('#menu-toggle').click();await page.locator('#exit').click();await page.locator('#account-username').fill(username);await page.locator('#account-password').fill(password);await page.locator('#account-submit').click();await page.locator('#online').filter({hasText:'1 / 10 ONLINE'}).waitFor();const recovered=await page.evaluate(async()=> (await(await fetch('/api/me')).json()).hero);assert.deepEqual(recovered.appearance,hero.appearance);assert.deepEqual(errors,[]);
 console.log(JSON.stringify({previewVariants:previews.size,eyeChoicesPerGender:5,hairColorsPerGender:6,invalidAppearanceRejected:4,persistence:true,accountLogin:true,mobileOverflow:false,pageErrors:errors}));
}finally{await browser.close();}
