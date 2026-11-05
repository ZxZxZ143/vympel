import assert from 'node:assert/strict';
import path from 'node:path';
import {chromium,setup,snapshot,save,origin,out,totals} from './browser-lib.mjs';
import {primeImages} from '../../scripts/image-performance/prime-images.mjs';
const slowLink={offline:false,latency:150,downloadThroughput:200000,uploadThroughput:93750};
const normalLink={offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1};
const setLink=(cdp,link)=>cdp.send('Network.emulateNetworkConditionsByRule',{offline:false,matchedNetworkConditions:link===slowLink?[{urlPattern:'',latency:150,downloadThroughput:200000,uploadThroughput:93750}]:[]});
const configs=[];for(const ect of ['4G','3G'])for(const slow of [false,true])for(const width of [390,1440])for(const route of ['/ru/product/56','/ru','/ru/product/46'])configs.push({ect,slow,width,route});
let serial=0;
for(const c of configs){
 const browser=await chromium.launch({channel:'msedge',headless:true,args:[`--force-effective-connection-type=${c.ect}`]});
 try{
  const s=await setup(browser,c.width);let cold,prime;
  for(const cache of ['cold','warm']){
   s.reset();const throttle=await setLink(s.cdp,c.slow?slowLink:normalLink);
   const ectBefore=await s.page.evaluate(()=>navigator.connection.effectiveType);assert.equal(ectBefore,c.ect.toLowerCase());
   if(cache==='cold')await s.cdp.send('Network.clearBrowserCache');
   const response=await s.page.goto(origin+c.route,{waitUntil:'domcontentloaded',timeout:60000});assert.equal(response.status(),200);
   await s.page.waitForTimeout(c.slow?30000:6500);
   const dom=await snapshot(s.page),network=structuredClone(s.records()),summary=totals(network);
   assert.equal(dom.connection,c.ect.toLowerCase());assert.deepEqual(s.errors,[]);assert.deepEqual(dom.broken,[]);assert(!dom.overflow);
   assert(dom.rails.length>0);
   const name=String(++serial).padStart(2,'0');
   await save(name+'.json',{...c,cache,at:new Date().toISOString(),side:process.env.REVIEW_SIDE,browser:browser.version(),throttleMethod:'Network.emulateNetworkConditionsByRule',throttle,ectBefore,observationMs:c.slow?30000:6500,dom,network,summary,errors:s.errors,prime:cache==='warm'?prime:undefined});
   console.log(JSON.stringify({side:process.env.REVIEW_SIDE,name,...c,cache,...summary,lcp:dom.lcp.at(-1)?.start,cls:dom.cls,active:dom.rails.map(r=>r.cards.filter(c=>c.img).length)}));
   if(cache==='cold'){
    cold=network.filter(r=>r.type==='Image');
    await setLink(s.cdp,normalLink);
    // Preserve the accepted protocol: prime only URLs actually requested in the
    // cold window, outside measurement. Never prefetch every DOM/noscript URL.
    const adapt=()=>s.records().map(r=>({...r,receivedBytes:r.partial,servedFromCache:r.direct,response:{status:r.status,fromDiskCache:r.disk,cacheControl:r.headers?.['cache-control']??r.headers?.['Cache-Control'],etag:r.headers?.etag??r.headers?.ETag}}));
    prime=await primeImages({page:s.page,origin,route:c.route,width:c.width,coldRecords:adapt().filter(r=>r.type==='Image'),liveRecords:adapt});
    assert.equal(prime.status,'PASS',JSON.stringify(prime.resources.filter(r=>r.browser.outcome!=='decoded')));
   }
  }
  // Interaction is after both measured windows, so it cannot contaminate warm.
  await s.page.locator('[id^="goods-carousel-"]').first().scrollIntoViewIfNeeded();await s.page.waitForTimeout(1800);
  const pageLabel=c.route==='/ru'?'home':c.route.split('/').at(-1);
  const before=await snapshot(s.page);await s.page.screenshot({path:path.join(out,`${c.ect}-${c.slow?'slow':'normal'}-${c.width}-${pageLabel}-rail.png`)});
  const root=s.page.locator('[id^="goods-carousel-"]').first().locator('xpath=../..');await root.focus();
  const at=await s.page.evaluate(()=>performance.now());await s.page.keyboard.press('ArrowRight');
  await s.page.waitForTimeout(700);
  let readyAt=null;const checks=[];
  for(let n=0;n<58;n++){
   const check=await s.page.evaluate(()=>({at:performance.now(),visible:window.__rails()[0].cards.filter(c=>c.horizontal)}));checks.push(check);
   if(check.visible.every(c=>c.img?.complete&&c.img.naturalWidth>0)){readyAt=check.at;break;}
   await s.page.waitForTimeout(250);
  }
  const after=await snapshot(s.page);
  const initialSources=new Set(before.rails[0].cards.filter(c=>c.img?.complete&&c.img.naturalWidth>0).map(c=>c.img.src));
  const finalSources=after.rails[0].cards.filter(c=>c.horizontal).map(c=>c.img?.src);
  const visibleImageDelayMs=readyAt===null?null:Math.max(0,...finalSources.map(url=>initialSources.has(url)?0:(after.loaded.find(e=>e.url===url&&e.at>=at)?.at??readyAt)-at));
  await save(`nav-${c.ect}-${c.slow?'slow':'normal'}-${c.width}-${pageLabel}.json`,{...c,measurementNetwork:c.slow?slowLink:normalLink,at,readyAt,visibleImageDelayMs,pendingAtCutoff:readyAt===null,checks,before,after,network:structuredClone(s.records())});
  assert.deepEqual(after.broken,[]);
  // Finish functional decoding outside the bounded interaction observation.
  await setLink(s.cdp,normalLink);
  await s.page.waitForFunction(()=>window.__rails()[0].cards.filter(c=>c.horizontal).every(c=>c.img?.complete&&c.img.naturalWidth>0),{},{timeout:20000});
  await s.context.close();
 }finally{await browser.close();}
}
