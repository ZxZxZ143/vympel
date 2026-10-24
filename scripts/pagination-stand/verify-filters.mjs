import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const origin='http://127.0.0.1:3300',api='http://127.0.0.1:18080/api/public';
const evidence='docs/tasks/catalog-contextual-filters';await mkdir(`${evidence}/screenshots`,{recursive:true});
const metadata=async(params='')=>{const r=await fetch(`${api}/product/filters/ru?categoryCode=WATCH_WRIST&${params}`);assert.equal(r.status,200);return r.json();};
const initial=await metadata();const facet=(data,key)=>data.filters.find(f=>f.key===key);
const quartz=facet(initial,'mechanism').options.find(o=>o.count===41),mechanical=facet(initial,'mechanism').options.find(o=>o.count===2),ceramic=facet(initial,'caseMaterial').options.find(o=>o.count===9);
assert.ok(quartz&&mechanical&&ceramic,'Apply seed-filter-details.sql to the existing 100-product demo first');
const selected=await metadata(`caseMaterial=${ceramic.value}`);
assert.equal(facet(selected,'mechanism').options.find(o=>o.value===quartz.value).count,8);
assert.equal(facet(selected,'mechanism').options.find(o=>o.value===mechanical.value).count,1);
assert.ok(facet(initial,'stoneInlay').options.every(o=>o.disabled&&o.count===0));
const errors=[],requests=[],results=[];
const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL??'msedge',headless:true});
try {
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(r.url().includes('/product/filters/'))requests.push(r.url());});
  await page.goto(`${origin}/ru/catalog/WATCH_WRIST`);
  const consent=page.getByRole('button',{name:'Только необходимые',exact:true});if(await consent.isVisible())await consent.click();
  const open=async()=>{await page.getByRole('button',{name:'Фильтры',exact:true}).click();};
  await open();
  const form=page.locator('form').filter({has:page.getByRole('button',{name:'Применить',exact:true})});
  const tab=async key=>form.getByRole('button',{name:facet(initial,key).label,exact:true}).click();
  const count=async(option,n)=>{await form.getByRole('checkbox',{name:`${option.label}(${n})`,exact:true}).waitFor();};
  const choose=async option=>form.getByRole('checkbox',{name:new RegExp(option.label)}).locator('..').click();
  await tab('mechanism');await count(quartz,41);await count(mechanical,2);
  await tab('stoneInlay');await form.getByRole('checkbox',{name:'Swarovski(0)',exact:true}).waitFor();assert.equal(await form.getByRole('checkbox',{name:'Swarovski(0)',exact:true}).isEnabled(),false);
  await form.screenshot({path:`${evidence}/screenshots/stone-fallback-${width}.png`});
  await tab('caseMaterial');await count(ceramic,9);await choose(ceramic);
  await tab('mechanism');await count(quartz,8);await count(mechanical,1);
  assert.equal(new URL(page.url()).searchParams.has('caseMaterial'),false,'Draft must not change URL before Apply');
  await form.screenshot({path:`${evidence}/screenshots/ceramic-mechanisms-${width}.png`});
  await choose(quartz);await count(quartz,8);await count(mechanical,1);
  await tab('caseMaterial');await count(ceramic,8);assert.equal(await form.getByRole('checkbox',{name:new RegExp(ceramic.label)}).isChecked(),true);
  await form.getByRole('button',{name:'Применить',exact:true}).click();
  await page.waitForURL(u=>u.searchParams.get('caseMaterial')===ceramic.value&&u.searchParams.get('mechanism')===quartz.value);
  await page.waitForFunction(()=>new Set([...document.querySelectorAll('#catalog-product-list a[href*="/product/"]')].map(e=>e.pathname)).size===8);
  await open();await tab('mechanism');await count(quartz,8);assert.equal(await form.getByRole('checkbox',{name:new RegExp(quartz.label)}).isChecked(),true);
  await form.getByRole('button',{name:'Сбросить',exact:true}).click();
  await page.waitForURL(u=>!u.searchParams.has('caseMaterial')&&!u.searchParams.has('mechanism'));
  await open();await tab('mechanism');await count(quartz,41);await count(mechanical,2);
  // History must restore the applied filters and their contextual counts.
  await page.goBack();await page.waitForURL(u=>u.searchParams.get('caseMaterial')===ceramic.value);
  // Direct reload also reconstructs the complete draft.
  await page.reload();await open();await tab('mechanism');await count(quartz,8);await count(mechanical,1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  // A valid broad price range must not become an invalid HTML input when facet bounds narrow.
  await form.getByRole('button',{name:'Сбросить',exact:true}).click();
  await page.waitForURL(u=>!u.searchParams.has('caseMaterial')&&!u.searchParams.has('mechanism'));
  await open();await tab('price');await form.getByPlaceholder('До',{exact:true}).fill('500000');
  await tab('mechanism');await count(mechanical,2);await choose(mechanical);await count(quartz,40);
  await tab('price');assert.equal(await form.getByPlaceholder('До',{exact:true}).inputValue(),'500000');
  assert.equal(await form.getByPlaceholder('До',{exact:true}).evaluate(e=>e.checkValidity()),true);
  await form.getByRole('button',{name:'Применить',exact:true}).click();
  await page.waitForURL(u=>u.searchParams.get('priceMax')==='500000'&&u.searchParams.get('mechanism')===mechanical.value);
  await page.waitForFunction(()=>new Set([...document.querySelectorAll('#catalog-product-list a[href*="/product/"]')].map(e=>e.pathname)).size===2);
  results.push({width,baseline:[41,2],ceramic:[8,1],appliedProducts:8,draftTabPreserved:true,priceRangeStillApplicable:true,reset:true,history:true,overflow:false});
  await context.close();
 }
 assert.deepEqual(errors,[]);
 assert.ok(requests.some(url=>new URL(url).searchParams.get('caseMaterial')===ceramic.value));
 await writeFile(`${evidence}/browser-results.json`,JSON.stringify({passed:true,mocked:false,results,errors,requests,initial,selected},null,2));
 console.log('Real browser passed: desktop/mobile fallback, 41/2 -> 8/1 live counts, multi-select alternatives, Apply, Reset, reload/history, no overflow.');
}finally{await browser.close();}
