import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium,setup,snapshot,save,origin,out} from './browser-lib.mjs';
import {verifyGalleryInteraction} from '../../vympel_front/scripts/gallery-interaction.mjs';
const items=JSON.parse(await fs.readFile(new URL('./harness-items.json',import.meta.url)));
const family=url=>url.includes('/responsive-v1/')?url.slice(0,url.lastIndexOf('/')+1):url;
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--force-effective-connection-type=3G']});
const results=[];
const rails='[id^="goods-carousel-"]';
async function consent(page){const b=page.getByRole('button',{name:'Только необходимые',exact:true});if(await b.isVisible())await b.click();}
async function visibleReady(page,index=0){for(let n=0;n<80;n++){if(await page.evaluate(index=>window.__rails()[index]?.cards.filter(c=>c.horizontal).every(c=>c.img?.complete&&c.img.naturalWidth>0),index))return;await page.waitForTimeout(250);}throw Error('Visible images not decoded');}
async function record(name,data){await save(name+'.json',data);results.push({name,status:'PASS'});console.log('PASS',name);}
try{
 for(const width of process.env.REVIEW_STAGE.includes('fallback')?[]:[390,1440]){
  const s=await setup(browser,width);await s.page.goto(origin+'/ru/product/56',{waitUntil:'domcontentloaded'});await s.page.waitForTimeout(6500);
  const initial=await snapshot(s.page),networkInitial=structuredClone(s.records()),count=width===390?4:5;
  assert.equal(initial.rails[0].cards.length,12);assert.deepEqual(initial.rails[0].cards.filter(c=>c.img).map(c=>c.index),Array.from({length:count},(_,i)=>i));
  const far=items.slice(count).map(i=>family(i.imageUrl));assert(!networkInitial.some(r=>r.type==='Image'&&far.some(f=>r.url.startsWith(f))),'Far resource discovered before navigation');
  await consent(s.page);await s.page.locator(rails).scrollIntoViewIfNeeded();await visibleReady(s.page);await s.page.waitForTimeout(700);
  const near=await snapshot(s.page),root=s.page.locator(rails).locator('xpath=../..');
  await s.page.screenshot({path:path.join(out,`initial-${width}.png`)});
  await root.focus();await s.page.keyboard.press('Tab');const focused=await s.page.evaluate(()=>({tag:document.activeElement.tagName,hidden:!!document.activeElement.closest('[inert],[aria-hidden="true"]'),shadow:getComputedStyle(document.activeElement).boxShadow,outline:getComputedStyle(document.activeElement).outlineStyle}));assert.equal(focused.tag,'A');assert(!focused.hidden);assert(focused.shadow!=='none'||focused.outline!=='none');
  const navigation=[];
  for(let i=0;i<13;i++){
   const at=await s.page.evaluate(()=>performance.now());await s.page.keyboard.press('ArrowRight');await s.page.waitForTimeout(600);await visibleReady(s.page);
   const state=await snapshot(s.page);navigation.push({step:i,at,readyAt:state.at,visible:state.rails[0].cards.filter(c=>c.horizontal).map(c=>c.index),mounted:state.rails[0].cards.filter(c=>c.img).map(c=>c.index)});
   assert(!await s.page.evaluate(()=>!!document.activeElement.closest('[inert],[aria-hidden="true"]')));
  }
  assert(navigation.at(-1).visible.includes(11));assert.equal(await root.locator('[data-slot="carousel-next"]').isDisabled(),true);
  await s.page.screenshot({path:path.join(out,`last-${width}.png`)});
  for(let i=0;i<13;i++){await s.page.keyboard.press('ArrowLeft');await s.page.waitForTimeout(120);}
  await s.page.waitForTimeout(800);await visibleReady(s.page);assert((await snapshot(s.page)).rails[0].cards[0].horizontal);assert(await root.locator('[data-slot="carousel-previous"]').isDisabled());
  if(width===1440){await root.locator('[data-slot="carousel-next"]').click();await s.page.waitForTimeout(700);assert(!(await snapshot(s.page)).rails[0].cards[0].horizontal);await root.locator('[data-slot="carousel-previous"]').click();await s.page.waitForTimeout(700);}
  const card=s.page.locator(rails+' [data-slot="carousel-item"]').first();const favorite=card.locator('[data-favorite-product-id]');await favorite.click();assert.equal(await favorite.getAttribute('aria-pressed'),'true');await favorite.click();assert.equal(await favorite.getAttribute('aria-pressed'),'false');
  const cart=card.locator('button:not([data-favorite-product-id])');assert.equal(await cart.count(),1);assert.match(await cart.getAttribute('aria-label'),/корзин/);await cart.click();assert.equal(await cart.getAttribute('aria-pressed'),'true');
  const storage=await s.page.evaluate(()=>({cart:JSON.parse(localStorage.getItem('vympel:cart')),favorites:JSON.parse(localStorage.getItem('vympel:favorites'))}));assert(JSON.stringify(storage.cart).includes('46'));
  const ax=await s.cdp.send('Accessibility.getFullAXTree');assert(ax.nodes.some(n=>n.role?.value==='link'&&!n.ignored));
  const sizes=[];for(const w of [768,1440,390,width]){await s.page.setViewportSize({width:w,height:w<700?844:1000});await s.page.waitForTimeout(1000);await visibleReady(s.page);const d=await snapshot(s.page);assert(!d.overflow);sizes.push({width:w,rail:d.rails[0]});}
  await card.locator('a').first().click();await s.page.waitForURL('**/ru/product/46');await s.page.waitForTimeout(1000);assert.equal(new URL(s.page.url()).pathname,'/ru/product/46');
  const requests=s.records().filter(r=>r.type==='Image').map(r=>r.url);s.page.on('request',r=>{if(r.resourceType()==='image')requests.push(r.url());});
  const gallery=await verifyGalleryInteraction(s.page,{originalUrl:items[0].imageUrl,requests});
  assert.deepEqual(s.errors,[]);await record(`production-${width}`,{initial,networkInitial,near,navigation,focused,storage,sizes,gallery,network:s.records(),errors:s.errors});await s.context.close();
 }
 // True no-JS production document: native overflow, all content and image URLs.
 for(const width of [390,1440]){
  const s=await setup(browser,width,{javaScriptEnabled:false});await s.page.goto(origin+'/ru',{waitUntil:'domcontentloaded'});await s.page.waitForTimeout(1000);
  const rail=s.page.locator(rails);await rail.scrollIntoViewIfNeeded();
  const before=await rail.evaluate(el=>({cards:el.children.length,images:el.querySelectorAll('img').length,hidden:[...el.children].filter(c=>c.inert||c.getAttribute('aria-hidden')==='true').length,overflow:getComputedStyle(el.parentElement).overflowX,links:[...el.querySelectorAll('a')].map(a=>a.getAttribute('href'))}));
  assert.equal(before.cards,20);assert.equal(before.images,20);assert.equal(before.hidden,0);assert.equal(before.overflow,'auto');
  await rail.locator('a').last().focus();await s.page.waitForTimeout(1700);
  const end=await rail.evaluate(el=>({scrollLeft:el.parentElement.scrollLeft,lastImage:el.lastElementChild.querySelector('img').currentSrc,naturalWidth:el.lastElementChild.querySelector('img').naturalWidth}));assert(end.scrollLeft>0);assert(end.naturalWidth>0);
  await s.page.screenshot({path:path.join(out,`nojs-last-${width}.png`)});await record(`nojs-${width}`,{before,end,network:s.records()});await s.context.close();
 }
 for(const failure of ['derivative','original']){
  const s=await setup(browser,1440),prefix=family(items[0].imageUrl);
  await s.cdp.send('Network.setBlockedURLs',{urls:[prefix+'w*.webp',...(failure==='original'?[items[0].imageUrl]:[]),'*/analytics/products/events*','*/api/telemetry*']});
  await s.page.goto(origin+'/ru/product/56',{waitUntil:'domcontentloaded'});await consent(s.page);await s.page.locator(rails).scrollIntoViewIfNeeded();
  const card=s.page.locator(rails+' [data-slot="carousel-item"]').first();
  if(failure==='derivative'){await s.page.waitForFunction(url=>{const i=document.querySelector('[id^="goods-carousel-"] img');return i?.complete&&i.naturalWidth>0&&i.currentSrc===url;},items[0].imageUrl);assert.equal(await card.locator('img').getAttribute('srcset'),null);}
  else await card.locator('.product-image-fallback').waitFor();
  await record('fallback-'+failure,{failure,card:await card.innerHTML(),network:s.records(),errors:s.errors});assert.deepEqual(s.errors,[]);await s.context.close();
 }
 for(const missing of ['none','IntersectionObserver','ResizeObserver','MutationObserver','api']){
  const s=await setup(browser,1440);await s.page.goto(origin+`/__review/${missing==='api'?'no-api':'normal'}/index.html?missing=${missing}`,{waitUntil:'domcontentloaded'});await s.page.waitForTimeout(1500);
  assert.deepEqual(s.errors,[]);assert.equal(await s.page.locator(rails).count(),2);const before=await snapshot(s.page),unsupported=!['none','api'].includes(missing);
  assert.equal(before.rails[0].cards.filter(c=>c.img).length,unsupported?12:5);
  const first=s.page.locator('#first [data-slot="carousel"]'),secondBefore=before.rails[1].cards.filter(c=>c.img).map(c=>c.index);
  for(let i=0;i<12;i++){const next=first.locator('[data-slot="carousel-next"]');if(await next.isDisabled())break;await next.click();await s.page.waitForTimeout(150);}
  await s.page.waitForTimeout(1200);await visibleReady(s.page);const last=await snapshot(s.page);assert(last.rails[0].cards[11].horizontal);assert.deepEqual(last.rails[1].cards.filter(c=>c.img).map(c=>c.index),secondBefore);
  await s.page.locator('#short').click();await s.page.waitForTimeout(600);assert.equal((await snapshot(s.page)).rails[0].cards.length,2);assert(await first.locator('[data-slot="carousel-next"]').isDisabled());
  await s.page.locator('#empty').click();assert.equal(await s.page.locator('#first '+rails).count(),0);
  await s.page.locator('#restore').click();await s.page.waitForTimeout(600);assert.equal(await first.locator('[data-slot="carousel-next"]').isDisabled(),false);await s.page.locator('#reorder').click();await s.page.waitForTimeout(700);await visibleReady(s.page);const reordered=await snapshot(s.page);assert(reordered.rails[0].cards[0].href.endsWith('/60'));
  await record('harness-'+missing,{scope:'actual carousel/Embla/ResponsiveProductImage; thin card for observer/API isolation',before,last,reordered,network:s.records(),errors:s.errors});assert.deepEqual(s.errors,[]);await s.context.close();
 }
 await record('summary',{status:'PASS',results});
}finally{await browser.close();}
