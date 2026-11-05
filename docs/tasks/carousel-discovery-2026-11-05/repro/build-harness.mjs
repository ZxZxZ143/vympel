import {build} from '../../vympel_front/node_modules/vite/dist/node/index.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const W=path.resolve('.cache/carousel-discovery-20261105'),front=path.resolve('vympel_front');
const index=JSON.parse(await fs.readFile(path.join(W,'fixture-data/api-index.json')));
const data=JSON.parse(await fs.readFile(path.join(W,'fixture-data/api',index['/product/ru/56/recommendations?limit=12'])));
await fs.writeFile(path.join(W,'harness-items.json'),JSON.stringify(data));
for(const variant of ['normal','no-api']){
 const alias=[{find:/^@\/components\/GoodCard$/,replacement:path.join(W,'harness-card.tsx')},{find:'@',replacement:path.join(front,'src')}];
 if(variant==='no-api')alias.unshift({find:'embla-carousel-react',replacement:path.join(W,'harness-no-api.ts')});
 for(const name of ['react','react-dom'])alias.push({find:name,replacement:path.join(front,'node_modules',name)});
 alias.push({find:/^use-intl$/,replacement:createRequire(path.join(front,'package.json')).resolve('use-intl')});
 await build({configFile:false,root:front,publicDir:false,resolve:{alias},define:{'process.env.NODE_ENV':JSON.stringify('production')},build:{outDir:path.join(W,'harness',variant),emptyOutDir:false,minify:true,lib:{entry:path.join(W,'harness.tsx'),formats:['es'],fileName:()=> 'app.js'}}});
 const cssDir=path.join(W,'budget-candidate/vympel_front/.next/static/chunks');const names=(await fs.readdir(cssDir)).filter(n=>n.endsWith('.css'));let css='';for(const name of names)css+=await fs.readFile(path.join(cssDir,name),'utf8');
 await fs.writeFile(path.join(W,'harness',variant,'style.css'),css);
 await fs.writeFile(path.join(W,'harness',variant,'index.html'),`<!doctype html><html lang="ru"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/__review/${variant}/style.css"></head><body><div id="app"></div><script type="module" src="/__review/${variant}/app.js"></script></body></html>`);
}
