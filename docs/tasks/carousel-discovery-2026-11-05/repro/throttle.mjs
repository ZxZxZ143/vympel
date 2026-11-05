import assert from 'node:assert/strict';
import {chromium,setup,save} from './browser-lib.mjs';
const results=[];
for(const ect of ['3G','4G']){
 const browser=await chromium.launch({channel:'msedge',headless:true,args:[`--force-effective-connection-type=${ect}`]});
 try{
  const s=await setup(browser,1440);await s.page.goto('https://preview.vympel.kz/robots.txt');
  for(const slow of [false,true]){
   await s.cdp.send('Network.clearBrowserCache');
   const rule=await s.cdp.send('Network.emulateNetworkConditionsByRule',{offline:false,matchedNetworkConditions:slow?[{urlPattern:'',latency:150,downloadThroughput:200000,uploadThroughput:93750}]:[]});
   const state=await s.page.evaluate(async()=>{const before=navigator.connection.effectiveType,at=performance.now();const r=await fetch('https://api.vympel.kz/media/vympel-staging/product/c2d10915-d1d9-422e-b65b-24591fbd7f5d.png',{cache:'reload'});const body=await r.arrayBuffer();return {before,after:navigator.connection.effectiveType,status:r.status,bytes:body.byteLength,ms:performance.now()-at};});
   assert.equal(state.before,ect.toLowerCase());assert.equal(state.after,ect.toLowerCase());assert.equal(state.status,200);assert.equal(state.bytes,2135712);if(slow)assert(state.ms>1000*state.bytes/200000*.9&&state.ms<25000);else assert(state.ms<5000);
   results.push({ect,slow,rule,...state});console.log(JSON.stringify(results.at(-1)));
  }await s.context.close();
 }finally{await browser.close();}
}
await save('throttle-control.json',{status:'PASS',method:'Network.emulateNetworkConditionsByRule',results});
