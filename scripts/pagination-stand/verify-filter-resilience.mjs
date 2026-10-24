import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:3300/ru/catalog/WATCH_WRIST');
 await page.getByRole('button',{name:'Фильтры',exact:true}).click();
 const form=page.locator('form').filter({has:page.getByRole('button',{name:'Применить',exact:true})});
 const tab=name=>form.getByRole('button',{name,exact:true}).click();
 const toggle=async()=>{await tab('Корпус');await form.getByRole('checkbox',{name:/Керам/}).locator('..').click();};
 await tab('Механизм');await form.getByRole('checkbox',{name:'Кварцевый(41)',exact:true}).waitFor();
 let mode='empty',started,release,finished;
 const oldStarted=new Promise(resolve=>started=resolve),oldGate=new Promise(resolve=>release=resolve),oldDone=new Promise(resolve=>finished=resolve);
 await page.route('**/product/filters/ru?**',async route=>{
  const current=mode;
  if(current==='error'){await route.abort('failed');return;}
  const response=await route.fetch();const body=await response.json();
  const stone=body.filters.find(f=>f.key==='stoneInlay');
  if(current==='empty')stone.options=[];
  if(current==='actual')stone.options=[{value:'1',label:'Тестовая вставка',count:1,disabled:false}];
  if(current==='late'&&new URL(route.request().url()).searchParams.has('caseMaterial')){
   body.filters.find(f=>f.key==='mechanism').options.forEach(o=>o.count=999);
   started();await oldGate;
   try{await route.fulfill({response,json:body});}catch{}finally{finished();}
   return;
  }
  await route.fulfill({response,json:body});
 });
 await toggle();await tab('Камень-вставка');await form.getByText('Сейчас нет доступных вариантов.',{exact:true}).waitFor();
 assert.equal(await form.getByRole('checkbox',{name:'Swarovski',exact:true}).isEnabled(),false);
 mode='actual';await toggle();await tab('Камень-вставка');await form.getByRole('checkbox',{name:'Тестовая вставка(1)',exact:true}).waitFor();
 assert.equal(await form.getByText('Сейчас нет доступных вариантов.',{exact:true}).count(),0);
 assert.equal(await form.getByRole('checkbox',{name:/Swarovski/}).count(),0);
 mode='late';await toggle();await oldStarted;await toggle();await tab('Механизм');await form.getByRole('checkbox',{name:'Кварцевый(41)',exact:true}).waitFor();
 release();await oldDone;await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 assert.equal(await form.getByRole('checkbox',{name:'Кварцевый(41)',exact:true}).count(),1);assert.equal(await form.getByText(/999/).count(),0);
 mode='error';await toggle();await tab('Механизм');
 await page.waitForFunction(()=>[...document.querySelectorAll('.text-error')].some(e=>e.getClientRects().length));
 assert.equal(await form.getByRole('checkbox',{name:'Кварцевый',exact:true}).count(),1,'Unknown counts must not appear current after failure');
 mode='pass';await toggle();await tab('Механизм');await form.getByRole('checkbox',{name:'Кварцевый(41)',exact:true}).waitFor();
 assert.deepEqual(errors,[]);
 await writeFile('docs/tasks/catalog-contextual-filters/resilience-results.json',JSON.stringify({passed:true,mocked:true,emptyDictionaryPlaceholder:true,realOptionsReplacePlaceholder:true,lateResponseIgnored:true,failureHidesStaleCounts:true,recovery:true,errors},null,2));
 console.log('Browser resilience passed (explicit intercepted responses): empty dictionary/replacement, late response ignored, failed counts hidden, recovery.');
}finally{await browser.close();}
