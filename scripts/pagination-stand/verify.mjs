import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {mkdir,readFile,writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../..");
const evidence=path.resolve(process.env.PAGINATION_EVIDENCE_DIR ?? path.join(repo,"docs/tasks/catalog-brand-pagination-search-order/local-stand"));
await mkdir(path.join(evidence,"screenshots"),{recursive:true});
const origin="http://127.0.0.1:3300",api="http://127.0.0.1:18080/api/public";
const pgMajor=(await readFile(path.join(repo,".cache/pagination-stand/postgres/PG_VERSION"),"utf8")).trim();
const pgBin=process.env.VYMPEL_DEMO_PG_BIN ?? path.join(process.env.ProgramFiles??"C:/Program Files","PostgreSQL",pgMajor,"bin");
const pgArgs=["-X","-h","127.0.0.1","-p","55440","-U","pagination_demo","-d","vympel_pagination_demo","-v","ON_ERROR_STOP=1"];
const sql=(text)=>execFileSync(path.join(pgBin,"psql.exe"),[...pgArgs,"-tAc",text],{encoding:"utf8"}).trim();
const snapshot=()=>JSON.parse(sql(`SELECT json_agg(x ORDER BY id) FROM (
 SELECT p.id,p.sku,p.model,p.price,p.stock_quantity,p.status,p.created_at,b.code AS brand,
 (SELECT count(*) FROM product_i18n i WHERE i.product_id=p.id AND i.lang IN ('ru','kk','en')) AS names,
 (SELECT count(*) FROM product_category pc JOIN category c ON c.id=pc.category_id WHERE pc.product_id=p.id AND c.code='WATCH_WRIST') AS categories
 FROM product p JOIN brand b ON b.id=p.brand_id) x`));
const before=snapshot();
if(!process.argv.includes("--skip-seed")) execFileSync(path.join(pgBin,"psql.exe"),[...pgArgs,"-f",path.join(repo,"scripts/pagination-stand/seed.sql")],{encoding:"utf8"});
const db=snapshot(); assert.deepEqual(db,before,"Seed is idempotent, including IDs and timestamps");
assert.equal(db.length,100); assert.equal(new Set(db.map(p=>p.sku)).size,100);
assert.ok(db.every(p=>p.status==='ACTIVE' && p.names===3 && p.categories===1 && p.stock_quantity>=0));
const byId=new Map(db.map(p=>[p.id,p]));
const expectedBrands={romanson:35,adriatica:25,appella:20,"pierre-ricaud":10,rhythm:5,"royal-london":5};
const get=async(url)=>{const r=await fetch(url); assert.equal(r.status,200,url); return r.json();};
assert.equal((await get("http://127.0.0.1:18080/actuator/health/readiness")).status,"UP");
const facets=await get(api+"/product/filters/en");
const normalize=s=>s.toLowerCase().replace(/[^a-z0-9]/g,"");
const brands=Object.entries(expectedBrands).map(([slug,total])=>{
 const option=facets.filters.find(f=>f.key==='brand').options.find(o=>normalize(o.label)===normalize(slug));
 assert.ok(option,slug); assert.equal(option.count,total); assert.equal(db.filter(p=>p.brand===slug).length,total);
 return {slug,total,id:option.value};
});
const catalog=async(params={},locale='en')=>get(api+`/product/catalog/${locale}?`+new URLSearchParams({size:'9',page:'0',...params}));
const scan=async(params={},locale='en')=>{
 const first=await catalog(params,locale),pages=[first];
 for(let i=1;i<first.totalPages;i++) pages.push(await catalog({...params,page:String(i)},locale));
 const products=pages.flatMap(p=>p.content),ids=products.map(p=>p.id);
 assert.equal(products.length,first.totalElements);assert.equal(new Set(ids).size,ids.length);
 return {pages,products,ids};
};
const all=await scan({sort:'priceAsc'}); assert.equal(all.pages.length,12);
assert.deepEqual(all.pages.map(p=>p.content.length),[9,9,9,9,9,9,9,9,9,9,9,1]);
assert.deepEqual([...all.ids].sort((a,b)=>a-b),db.map(p=>p.id));
assert.deepEqual((await catalog({sort:'priceAsc'})).content,all.pages[0].content);
for(const b of brands){b.result=await scan({size:'15',brand:b.id,sort:'newest'});assert.equal(b.result.products.length,b.total);assert.ok(b.result.ids.every(id=>byId.get(id).brand===b.slug));}
assert.deepEqual(brands[0].result.pages.map(p=>p.content.length),[15,15,5]);
const search='Orion Atlas';const exact=db.find(p=>p.sku==='VYMPEL-PAG-DEMO-001').id;
const ranked=await scan({search});assert.equal(ranked.products.length,26);assert.equal(ranked.ids[0],exact);
assert.equal(ranked.products[0].price,999999);assert.equal(ranked.products[0].stockQuantity,0);
const orders={};
for(const sort of ['priceAsc','priceDesc','newest','oldest']){
 const result=await scan({search,sort});orders[sort]=result;
 assert.deepEqual([...result.ids].sort((a,b)=>a-b),[...ranked.ids].sort((a,b)=>a-b));
 assert.notEqual(result.ids[0],exact);
 const available=result.products.filter(p=>p.stockQuantity>0);const unavailable=result.products.filter(p=>p.stockQuantity===0);
 assert.deepEqual(result.ids,[...available,...unavailable].map(p=>p.id));
 for(const group of [available,unavailable]) for(let i=1;i<group.length;i++){
  const key=p=>sort.startsWith('price')?p.price:Date.parse(byId.get(p.id).created_at);
  const delta=key(group[i])-key(group[i-1]);assert.ok(sort==='priceAsc'||sort==='oldest'?delta>=0:delta<=0);
 }
}
for(const locale of ['ru','kz','en']){const p=await catalog({search},locale);assert.equal(p.content[0].id,exact);assert.equal(p.totalElements,26);}
const skuProduct=db.find(p=>p.sku==='VYMPEL-PAG-DEMO-050');assert.equal((await catalog({search:skuProduct.sku})).content[0].id,skuProduct.id);
assert.equal(ranked.products[1].model,search);
const apiEvidence={health:'UP',databaseVersion:sql('SHOW server_version'),seedIdempotent:process.argv.includes("--skip-seed")?"not rerun (read-only verification)":true,products:100,catalogPages:all.pages.map(p=>p.content.map(x=>x.id)),brands:brands.map(b=>({slug:b.slug,id:b.id,total:b.total,pages:b.result.pages.map(p=>p.content.map(x=>x.id))})),search:{query:search,exactId:exact,total:ranked.products.length,relevance:ranked.ids,orders:Object.fromEntries(Object.entries(orders).map(([k,v])=>[k,v.ids]))},database:db};
await writeFile(path.join(evidence,'api-database-results.json'),JSON.stringify(apiEvidence,null,2));
console.log('Database/API passed: 100 unique products, 12 catalog pages, six brands, 26 search matches and all sort overrides.');
if(process.argv.includes('--api-only'))process.exit(0);
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL??'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
let page=await context.newPage();const errors=[],requests=[],results=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('request',r=>{if(r.url().includes('/api/public/'))requests.push(r.url());});
// Intentionally no route interception, response fixtures or mocked APIs.
let nav=page.locator('nav[data-scope="pagination"]');
const ids=async(target='catalog-product-list')=>page.locator(`#${target} a[href*="/product/"]`).evaluateAll(links=>[...new Set(links.map(link=>Number(new URL(link.href).pathname.split('/').at(-1))))]);
const active=async(n)=>page.waitForFunction(n=>[...document.querySelectorAll('nav[data-scope="pagination"] [aria-current="page"]')].length===2 && [...document.querySelectorAll('nav[data-scope="pagination"] [aria-current="page"]')].every(el=>el.getAttribute('data-index')===String(n)),n);
async function content(expected,target='catalog-product-list'){
 await page.waitForFunction(({expected,target})=>JSON.stringify([...new Set([...document.querySelectorAll(`#${target} a[href*="/product/"]`)].map(link=>Number(new URL(link.href).pathname.split('/').at(-1))))])===JSON.stringify(expected),{expected,target});
 assert.deepEqual(await ids(target),expected);
}
async function visit(route,expected,target='catalog-product-list',current=1,multipage=true){
 const response=await page.goto(origin+route);assert.equal(response.status(),200,route);await content(expected,target);
 const consent=page.getByRole('button',{name:'Necessary only',exact:true});if(await consent.isVisible())await consent.click();
 assert.equal(await nav.count(),multipage?1:0);if(multipage)await active(current);
 results.push({route,itemCount:expected.length,page:current});
}
try{
 for(let n=0;n<12;n++)await visit('/en/catalog'+(n?`?page=${n+1}`:''),all.pages[n].content.map(p=>p.id),'catalog-product-list',n+1);
 assert.equal(await nav.locator('[data-part="next-trigger"]').count(),0);
 await visit('/en/catalog',all.pages[0].content.map(p=>p.id));assert.equal(await nav.locator('[data-part="prev-trigger"]').count(),0);
 await nav.getByRole('link',{name:'Next page',exact:true}).click();await active(2);await content(all.pages[1].content.map(p=>p.id));
 assert.equal(new URL(page.url()).hash,'#catalog-product-list');await page.reload();await page.waitForLoadState("networkidle");await active(2);
 await page.goBack();await active(1);await page.goForward();await active(2);
 await nav.getByRole('link',{name:'Previous page',exact:true}).click();await active(1);
 await visit('/en/catalog?page=6',all.pages[5].content.map(p=>p.id),'catalog-product-list',6);
 assert.equal(await nav.locator('[data-pagination-group="pages"] [data-part="ellipsis"]').count(),2);
 for(const b of brands){for(let n=0;n<b.result.pages.length;n++)await visit(`/en/brands/${b.slug}`+(n?`?page=${n+1}`:''),b.result.pages[n].content.map(p=>p.id),'brand-product-list',n+1,b.result.pages.length>1);}
 await visit('/en/brands/romanson',brands[0].result.pages[0].content.map(p=>p.id),'brand-product-list');
 await nav.getByRole('link',{name:'Next page',exact:true}).click();await active(2);await content(brands[0].result.pages[1].content.map(p=>p.id),'brand-product-list');
 await page.reload();await page.waitForLoadState("networkidle");await active(2);await page.goBack();await active(1);await page.goForward();await active(2);
 for(const locale of ['ru','kz','en']){
  await visit(`/${locale}/catalog?page=2`,all.pages[1].content.map(p=>p.id),'catalog-product-list',2);
  await visit(`/${locale}/brands/romanson?page=2`,brands[0].result.pages[1].content.map(p=>p.id),'brand-product-list',2);
  await visit(`/${locale}/catalog?search=Orion%20Atlas`,ranked.pages[0].content.map(p=>p.id));
  const label={ru:'Не выбрано',kz:'Таңдалмаған',en:'Not selected'}[locale];assert.ok(await page.getByRole('button',{name:new RegExp(label)}).count()>0);
 }
 const searchUrl='/en/catalog?search=Orion%20Atlas';
 await visit(searchUrl+'&page=2',ranked.pages[1].content.map(p=>p.id),'catalog-product-list',2);
 await page.getByRole('button',{name:'Sort: Not selected',exact:true}).click();
 assert.equal(await page.locator('form[aria-hidden="false"] input[type="radio"]').count(),4);assert.equal(await page.locator('form[aria-hidden="false"] input:checked').count(),0);
 await page.getByLabel('Price ascending',{exact:true}).check({force:true});await active(1);await content(orders.priceAsc.pages[0].content.map(p=>p.id));
 assert.equal(new URL(page.url()).searchParams.get('search'),search);assert.equal(new URL(page.url()).searchParams.get('sort'),'priceAsc');
 await page.screenshot({path:path.join(evidence,'screenshots/search-price-ascending.png'),fullPage:true});
 await nav.getByRole('link',{name:'Next page',exact:true}).click();await active(2);await content(orders.priceAsc.pages[1].content.map(p=>p.id));
 await page.getByRole('button',{name:'Sort: Price',exact:true}).click();await page.getByLabel('Newest first',{exact:true}).check({force:true});
 await active(1);await content(orders.newest.pages[0].content.map(p=>p.id));
 await page.getByRole('button',{name:'Sort: Newest',exact:true}).click();await page.getByRole('button',{name:'Reset',exact:true}).click();
 await active(1);await content(ranked.pages[0].content.map(p=>p.id));assert.equal(new URL(page.url()).searchParams.get('sort'),null);
 await page.locator('#catalog-product-list').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(evidence,'screenshots/search-relevance.png'),fullPage:true});
 await nav.getByRole('link',{name:'Next page',exact:true}).click();await active(2);await content(ranked.pages[1].content.map(p=>p.id));assert.equal(new URL(page.url()).searchParams.get('search'),search);
 await visit(searchUrl+`&brand=${brands[0].id}&sort=priceAsc&page=2`,orders.priceAsc.pages[1].content.map(p=>p.id),'catalog-product-list',2);
 await page.getByRole('button',{name:'Filters',exact:true}).click();await page.getByPlaceholder('From',{exact:true}).fill('10000');await page.getByPlaceholder('To',{exact:true}).fill('999999');await page.getByRole('button',{name:'Apply',exact:true}).click();await active(1);
 for(const [key,value] of Object.entries({search,sort:'priceAsc',brand:String(brands[0].id),priceMin:'10000',priceMax:'999999'}))assert.equal(new URL(page.url()).searchParams.get(key),value);
 const input=page.locator('input[role="combobox"]:visible').first();await input.fill(search);
 await page.getByRole('dialog').getByRole('link',{name:/Orion Atlas/}).first().waitFor();await input.press('Enter');await active(1);await content(ranked.pages[0].content.map(p=>p.id));assert.equal(new URL(page.url()).searchParams.get('sort'),null);
 // Use a fresh history: Chromium caps history.length at 50 during long matrices.
 await page.close();page=await context.newPage();nav=page.locator('nav[data-scope="pagination"]');
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(r.url().includes('/api/public/'))requests.push(r.url());});
 // Range and number activate exactly the same URLs, products and history entries.
 for(const [route,target,data] of [['/en/catalog','catalog-product-list',all],['/en/brands/romanson','brand-product-list',brands[0].result]]){
  await visit(route,data.pages[0].content.map(p=>p.id),target);
  const range=nav.locator('[data-pagination-group="ranges"] [data-index="2"]');
  const number=nav.locator('[data-pagination-group="pages"] [data-index="2"]');
  assert.equal(await range.getAttribute('href'),await number.getAttribute('href'));
  const historyBefore=await page.evaluate(()=>history.length);
  await range.focus();assert.ok(await range.evaluate(el=>getComputedStyle(el).outlineStyle!=='none'));
  await page.keyboard.press('Enter');await active(2);await content(data.pages[1].content.map(p=>p.id),target);
  assert.equal(await page.evaluate(()=>history.length),historyBefore+1);const rangeUrl=page.url();
  await page.goBack();await active(1);await number.click();await active(2);await content(data.pages[1].content.map(p=>p.id),target);assert.equal(page.url(),rangeUrl);
  await page.reload();await page.waitForLoadState("networkidle");await active(2);await page.goBack();await active(1);await page.goForward();await active(2);
 }
 await visit(searchUrl+`&brand=${brands[0].id}&sort=priceAsc`,orders.priceAsc.pages[0].content.map(p=>p.id));
 await nav.locator('[data-pagination-group="ranges"] [data-index="2"]').click();await active(2);await content(orders.priceAsc.pages[1].content.map(p=>p.id));
 for(const [key,value] of Object.entries({search,sort:'priceAsc',brand:String(brands[0].id)}))assert.equal(new URL(page.url()).searchParams.get(key),value);
 assert.deepEqual(snapshot(),db,'Browser verification preserved the dataset');
 // A real filtered result with seven pages exercises Ark's widest contiguous row.
 const priceMax=[...all.products].sort((a,b)=>a.price-b.price)[62].price;
 const seven=await scan({sort:'priceAsc',priceMax:String(priceMax)});assert.equal(seven.pages.length,7);
 for(const width of [320,360,375,390,430,768,1024,1440]){
  await page.setViewportSize({width,height:1000});
  for(const [label,route,target,data] of [['catalog','/en/catalog','catalog-product-list',all],['brand','/en/brands/romanson','brand-product-list',brands[0].result],['seven-pages',`/en/catalog?priceMax=${priceMax}`,'catalog-product-list',seven]]){
   for(const current of [...new Set([1,Math.ceil(data.pages.length/2),data.pages.length])]){
    // Use page 7 for the 12-page catalog's requested middle example.
    const n=label==='catalog'&&current===6?7:current;
    const url=route+(route.includes('?')?'&':'?')+`page=${n}`;
    await visit(url,data.pages[n-1].content.map(p=>p.id),target,n);
    await nav.evaluate(el=>el.scrollIntoView({block:'center'}));await page.waitForFunction(()=>document.fonts.status==='loaded');
    const geometry=await nav.evaluate(el=>{
     const ranges=el.querySelector('[data-pagination-group="ranges"]'),numbers=el.querySelector('[data-pagination-group="pages"]');
     const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,centerY:r.top+r.height/2};};
     const visible=e=>e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden';
     const links=[...numbers.querySelectorAll('[data-part="item"]')];
     return {overflow:document.documentElement.scrollWidth>innerWidth,rangesVisible:visible(ranges),arrowsVisible:[...numbers.querySelectorAll('[data-part="prev-trigger"], [data-part="next-trigger"]')].filter(visible).length,
      rangeBounds:rect(ranges),numberBounds:rect(numbers),navBounds:rect(el),rowOverflow:numbers.scrollWidth>numbers.clientWidth+1,
      pages:links.map(e=>({page:Number(e.dataset.index),active:e.getAttribute('aria-current')==='page',name:e.getAttribute('aria-label'),href:e.href,...rect(e)})),
      rangeLinks:[...ranges.querySelectorAll('a')].map(e=>({page:Number(e.dataset.index),href:e.href})),
      tokens:[...numbers.querySelectorAll('[data-part="item"], [data-part="ellipsis"]')].map(e=>e.dataset.part==='item'?Number(e.dataset.index):'…'),
      ids:[...el.querySelectorAll('[id]')].map(e=>e.id)};
    });
    assert.equal(geometry.overflow,false);assert.equal(geometry.rowOverflow,false);
    assert.deepEqual(geometry.pages.filter(p=>p.active).map(p=>p.page),[n]);
    assert.equal(new Set(geometry.ids).size,geometry.ids.length);
    assert.equal(geometry.tokens[0],1);assert.equal(geometry.tokens.at(-1),data.pages.length);
    for(const neighbor of [n-1,n,n+1].filter(p=>p>=1&&p<=data.pages.length))assert.ok(geometry.tokens.includes(neighbor));
    for(const link of geometry.pages){assert.ok(link.name);assert.equal(link.href,geometry.rangeLinks.find(r=>r.page===link.page).href);assert.ok(link.width>=(width<1024?35.5:44)-0.1&&link.height>=(width<1024?35.5:44)-0.1);}
    if(width<1024){
     assert.equal(geometry.rangesVisible,false);assert.equal(geometry.arrowsVisible,0);
     assert.equal(await page.getByRole('group',{name:'Product ranges',exact:true}).count(),0);
     assert.equal(await nav.getByRole('link',{name:'Next page',exact:true}).count(),0);
     assert.equal(await nav.getByRole('link',{name:'Previous page',exact:true}).count(),0);
     assert.ok(geometry.pages.every(p=>Math.abs(p.centerY-geometry.pages[0].centerY)<1),'Numeric links must stay on one row');
     assert.ok(geometry.pages.every(p=>p.left>=geometry.numberBounds.left&&p.right<=geometry.numberBounds.right),'Every button must fit without clipping');
     const left=geometry.pages[0].left,right=geometry.pages.at(-1).right;
     assert.ok(Math.abs((left+right)-(geometry.numberBounds.left+geometry.numberBounds.right))<2,'Centered numeric row');
     const focusableHidden=await nav.locator('[data-pagination-group="ranges"] a, [data-part="prev-trigger"], [data-part="next-trigger"]').evaluateAll(es=>es.some(e=>{e.focus();return document.activeElement===e;}));
     assert.equal(focusableHidden,false,'Hidden groups/arrows cannot receive keyboard focus');
    }else{
     assert.equal(geometry.rangesVisible,true);assert.equal(geometry.arrowsVisible,Number(n>1)+Number(n<data.pages.length));
     assert.ok(geometry.rangeBounds.right<=geometry.numberBounds.left);
     assert.ok(Math.abs((geometry.rangeBounds.top+geometry.rangeBounds.bottom)-(geometry.numberBounds.top+geometry.numberBounds.bottom))<2);
    }
    const numeric=nav.locator('[data-pagination-group="pages"] [data-part="item"]');
    await page.keyboard.press('Tab');await numeric.first().focus();assert.ok(await numeric.first().evaluate(el=>getComputedStyle(el).outlineStyle!=='none'));
    for(let i=1;i<await numeric.count();i++){await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>Number(document.activeElement.dataset.index)),geometry.pages[i].page);}
    await page.evaluate(()=>document.activeElement.blur());
    if([320,390,1440].includes(width)){
     await nav.screenshot({path:path.join(evidence,`screenshots/${label}-page-${n}-${width}.png`)});
     if(label==='catalog'&&n===7&&(width===320||width===1440))await page.screenshot({path:path.join(evidence,`screenshots/${label}-page-${n}-${width}-full.png`),fullPage:true});
    }
    results.push({width,label,page:n,...geometry});
    // Real numeric navigation works without arrows, including keyboard activation.
    const nextPage=n<data.pages.length?n+1:n-1;
    const link=nav.locator(`[data-pagination-group="pages"] [data-index="${nextPage}"]`);
    await link.focus();await page.keyboard.press('Enter');await active(nextPage);await content(data.pages[nextPage-1].content.map(p=>p.id),target);
    assert.equal(new URL(page.url()).searchParams.get('page'),nextPage===1?null:String(nextPage));
   }
  }
 }
 assert.deepEqual(snapshot(),db,'Responsive verification preserved all products');
 assert.deepEqual(errors,[]);assert.ok(requests.length>0,'Observe real client API requests');assert.ok(requests.every(url=>new URL(url).origin==='http://127.0.0.1:18080'));
 await writeFile(path.join(evidence,'browser-results.json'),JSON.stringify({passed:true,origin,api,mocked:false,errors,requests,results},null,2));
 console.log('Real browser passed: full catalog/brand traversal, history, search/sort/reset/filter, three locales, eight widths, single-row numeric mobile controls; no runtime errors.');
}catch(error){await page.screenshot({path:path.join(evidence,'screenshots/failure.png'),fullPage:true});await writeFile(path.join(evidence,'browser-failure.json'),JSON.stringify({url:page.url(),error:String(error),errors,results},null,2));throw error;}
finally{await browser.close();}
