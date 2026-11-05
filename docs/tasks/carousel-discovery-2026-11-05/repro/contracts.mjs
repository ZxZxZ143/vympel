import assert from 'node:assert/strict';
import {chromium,setup,snapshot,save,origin} from './browser-lib.mjs';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const s=await setup(browser,1440,{javaScriptEnabled:false});const nojs=[];
 for(const route of ['/ru/product/56','/ru']){
  await s.page.goto(origin+route,{waitUntil:'domcontentloaded'});await s.page.waitForTimeout(500);
  nojs.push({route,...await s.page.locator('[id^="goods-carousel-"]').evaluate(el=>({cards:el.children.length,images:el.querySelectorAll('img').length,hiddenSlides:[...el.children].filter(c=>c.inert||c.getAttribute('aria-hidden')==='true').length,hiddenAncestor:el.closest('[hidden]')?.outerHTML.slice(0,180)??null,viewportDisplay:getComputedStyle(el.parentElement).display,viewportWidth:el.parentElement.getBoundingClientRect().width,overflow:getComputedStyle(el.parentElement).overflowX}))});
 }
 await save('nojs-contract.json',{side:process.env.REVIEW_SIDE,nojs});await s.context.close();
 const p=await setup(browser,390);await p.page.goto(origin+'/ru/catalog',{waitUntil:'domcontentloaded'});await p.page.waitForTimeout(5000);
 const grid=await p.page.locator('article').evaluateAll(nodes=>nodes.filter(n=>!n.closest('[id^="goods-carousel-"]')).map(n=>({text:n.textContent.slice(0,100),img:!!n.querySelector('img'),noscript:!!n.querySelector('noscript'),srcset:n.querySelector('img')?.srcset,loading:n.querySelector('img')?.loading})));
 assert(grid.length>=9);assert(grid.every(c=>c.img&&!c.noscript));await save('grid-contract.json',{side:process.env.REVIEW_SIDE,grid,errors:p.errors});assert.deepEqual(p.errors,[]);
 await p.page.goto(origin+'/ru/product/56',{waitUntil:'domcontentloaded'});await p.page.waitForTimeout(2500);const consent=p.page.getByRole('button',{name:'Только необходимые',exact:true});if(await consent.isVisible())await consent.click();
 const rail=p.page.locator('[id^="goods-carousel-"]');await rail.scrollIntoViewIfNeeded();await p.page.waitForTimeout(900);const before=await snapshot(p.page),box=await rail.locator('xpath=..').boundingBox();assert(box);
 const x=box.x+box.width*.8,y=box.y+Math.min(140,box.height*.3);
 await p.cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
 for(let i=1;i<=12;i++){await p.cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-box.width*.65*i/12,y}]});await p.page.waitForTimeout(20);}
 await p.cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.page.waitForTimeout(1500);const after=await snapshot(p.page);
 assert.notDeepEqual(after.rails[0].cards.filter(c=>c.horizontal).map(c=>c.index),before.rails[0].cards.filter(c=>c.horizontal).map(c=>c.index));
 assert(after.rails[0].cards.filter(c=>c.horizontal).every(c=>c.img?.complete&&c.img.naturalWidth>0));assert.deepEqual(p.errors,[]);assert.deepEqual(after.broken,[]);
 await save('touch-contract.json',{side:process.env.REVIEW_SIDE,before,after,network:p.records(),errors:p.errors});await p.context.close();console.log('PASS no-JS baseline comparison, unchanged catalog grid, real CDP touch swipe',process.env.REVIEW_SIDE);
}finally{await browser.close();}
