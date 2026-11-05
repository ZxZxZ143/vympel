import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from './offline-browser.mjs';
export {chromium};
export const origin='https://preview.vympel.kz';
export const out=process.env.REVIEW_OUT;
export const save=async(name,data)=>fs.writeFile(path.join(out,name),JSON.stringify(data,null,2)+'\n',{flag:'wx'});
export async function setup(browser,width,options={}){
 const context=await browser.newContext({viewport:{width,height:width<700?844:1000},deviceScaleFactor:width<700?2:1,...options});
 const page=await context.newPage(),cdp=await context.newCDPSession(page);await cdp.send('Network.enable');
 await cdp.send('Fetch.enable',{handleAuthRequests:true});
 cdp.on('Fetch.requestPaused',e=>cdp.send('Fetch.continueRequest',{requestId:e.requestId}).catch(()=>{}));
 cdp.on('Fetch.authRequired',e=>cdp.send('Fetch.continueWithAuth',{requestId:e.requestId,authChallengeResponse:e.authChallenge.origin===origin?{response:'ProvideCredentials',username:'offline',password:'fixture-only'}:{response:'CancelAuth'}}).catch(()=>{}));
 assert.equal((await page.goto(origin+'/robots.txt')).status(),200);
 await page.goto('about:blank');await cdp.send('Fetch.disable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:false});
 await cdp.send('Network.setBlockedURLs',{urls:['*/analytics/products/events*','*/api/telemetry*','*/api/public/requests*','https://vympel.kz/*','https://www.vympel.kz/*']});
 let records=new Map();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 cdp.on('Network.requestWillBeSent',e=>records.set(e.requestId,{id:e.requestId,url:e.request.url,method:e.request.method,type:e.type,start:e.timestamp,priority:e.request.initialPriority,initiator:e.initiator}));
 cdp.on('Network.dataReceived',e=>{const r=records.get(e.requestId);if(r){r.partial=(r.partial||0)+e.encodedDataLength;r.body=(r.body||0)+e.dataLength;}});
 cdp.on('Network.responseReceivedExtraInfo',e=>{const r=records.get(e.requestId);if(r)r.wireStatus=e.statusCode;});
 cdp.on('Network.requestWillBeSentExtraInfo',e=>{const r=records.get(e.requestId);if(r&&e.appliedNetworkConditionsId)r.throttleRuleId=e.appliedNetworkConditionsId;});
 cdp.on('Network.responseReceived',e=>{const r=records.get(e.requestId);if(r){r.status=e.response.status;r.disk=e.response.fromDiskCache;r.responseAt=e.timestamp;r.timing=e.response.timing;r.headers=Object.fromEntries(Object.entries(e.response.headers).filter(([k])=>['cache-control','etag','content-length','content-type'].includes(k.toLowerCase())));}});
 cdp.on('Network.requestServedFromCache',e=>{const r=records.get(e.requestId);if(r)r.direct=true;});
 cdp.on('Network.loadingFinished',e=>{const r=records.get(e.requestId);if(r){r.bytes=e.encodedDataLength;r.end=e.timestamp;}});
 cdp.on('Network.loadingFailed',e=>{const r=records.get(e.requestId);if(r){r.error=e.errorText;r.errorAt=e.timestamp;}});
 await page.addInitScript(()=>{
  window.__measure={lcp:[],cls:0,loaded:[],samples:[]};
  const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
  window.__rails=()=>[...document.querySelectorAll('[id^="goods-carousel-"]')].map(rail=>{
   const vp=rail.parentElement,b=vp.getBoundingClientRect();
   return {id:rail.id,rect:rect(vp),cards:[...rail.children].map((el,index)=>{
    const r=el.getBoundingClientRect(),i=el.querySelector('img');
    const horizontal=r.right>b.left+1&&r.left<b.right-1;
    return {index,href:el.querySelector('a')?.getAttribute('href'),text:el.querySelector('h3')?.textContent,rect:rect(el),horizontal,visible:horizontal&&r.bottom>0&&r.top<innerHeight,hidden:el.getAttribute('aria-hidden'),inert:el.inert,img:i?{src:i.currentSrc||i.src,srcset:i.srcset,sizes:i.sizes,complete:i.complete,naturalWidth:i.naturalWidth,alt:i.alt}:null,noscript:!!el.querySelector('noscript')};
   })};
  });
  new PerformanceObserver(l=>{for(const e of l.getEntries())window.__measure.lcp.push({start:e.startTime,load:e.loadTime,render:e.renderTime,url:e.url,element:e.element?.outerHTML.slice(0,1000)});}).observe({type:'largest-contentful-paint',buffered:true});
  new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__measure.cls+=e.value;}).observe({type:'layout-shift',buffered:true});
  document.addEventListener('load',e=>{if(e.target instanceof HTMLImageElement)window.__measure.loaded.push({at:performance.now(),url:e.target.currentSrc,rail:e.target.closest('[id^="goods-carousel-"]')?.id});},true);
  setInterval(()=>window.__measure.samples.push({at:performance.now(),rails:window.__rails()}),200);
 });
 return {context,page,cdp,errors,records:()=>[...records.values()],reset:()=>{records=new Map();}};
}
export const snapshot=page=>page.evaluate(()=>({at:performance.now(),connection:navigator.connection?.effectiveType,rails:window.__rails(),...window.__measure,navigation:performance.getEntriesByType('navigation').map(e=>e.toJSON()),resources:performance.getEntriesByType('resource').map(e=>e.toJSON()),broken:[...document.images].filter(i=>i.currentSrc&&i.complete&&!i.naturalWidth).map(i=>i.currentSrc),overflow:document.documentElement.scrollWidth>innerWidth}));
export function totals(records){const images=records.filter(r=>r.type==='Image');return {requests:images.length,completedWire:images.filter(r=>r.end&&!r.direct&&!r.disk&&r.wireStatus!==304).reduce((s,r)=>s+r.bytes,0),direct:images.filter(r=>r.direct||r.disk).length,wire304:images.filter(r=>r.wireStatus===304).length,pending:images.filter(r=>!r.end&&!r.error).length,partialWire:images.filter(r=>!r.end).reduce((s,r)=>s+(r.partial||0),0)};}
