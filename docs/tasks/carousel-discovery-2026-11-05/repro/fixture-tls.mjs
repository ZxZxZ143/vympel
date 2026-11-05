import https from 'node:https';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {openApi} from './api-adapter.mjs';
const W=path.dirname(fileURLToPath(import.meta.url)), F=path.join(W,'fixture-data');
const manifest=JSON.parse(fs.readFileSync('docs/tasks/gallery-retry-2026-11-04/reviewed-manifest.json'));
const api=openApi(F,manifest,process.env.FIXTURE_MODE,console.log);
const media=JSON.parse(fs.readFileSync(path.join(F,'media-index.json')));
const statics=JSON.parse(fs.readFileSync(path.join(F,'static-index.json')));
const auth='Basic '+Buffer.from('offline:fixture-only').toString('base64');
function content(req,res,o){
    const tag=o.etag||'"'+o.sha256+'"';const headers={'Content-Type':o.mime,'Cache-Control':o.cache,'ETag':tag,'Access-Control-Allow-Origin':'*','Timing-Allow-Origin':'*'};
    if(req.headers['if-none-match']===tag){res.writeHead(304,headers);return res.end();}
    res.writeHead(200,{...headers,'Content-Length':fs.statSync(o.file).size});
    if(req.method==='HEAD')res.end();else fs.createReadStream(o.file).on('error',()=>res.destroy()).pipe(res);
}
const srv=https.createServer({key:fs.readFileSync(path.join(W,'fixture.key')),cert:fs.readFileSync(path.join(W,'fixture.crt'))},(req,res)=>{
    const host=req.headers.host;
    if(!['GET','HEAD','OPTIONS'].includes(req.method)){console.log('DENY method',req.method);res.writeHead(405);return res.end();}
    if(host==='api.vympel.kz'){
        if(req.url.startsWith('/api/public/'))return api(req,res);
        const url=new URL(req.url,'https://api.vympel.kz');const key=decodeURIComponent(url.pathname.slice('/media/vympel-staging/'.length));
        if(url.pathname.startsWith('/media/vympel-staging/')&&Object.hasOwn(media,key))return content(req,res,media[key]);
        console.log('MEDIA_MISS',url.pathname);res.writeHead(404);return res.end();
    }
    if(host!=='preview.vympel.kz'){res.writeHead(421);return res.end();}
    if(req.headers.authorization!==auth){res.writeHead(401,{'WWW-Authenticate':'Basic realm="Offline fixture"'});return res.end();}
    if(/^\/__review\/(normal|no-api)\/(index.html|app.js|style.css)(\?.*)?$/.test(req.url)){
        const pathname=new URL(req.url,'https://preview.vympel.kz').pathname;
        const file=path.join(W,'harness',pathname.slice('/__review/'.length));
        const mime=file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html';
        res.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-store'});return fs.createReadStream(file).pipe(res);
    }
    if(req.url.startsWith('/_next/image?')){
        if(Object.hasOwn(statics,req.url))return content(req,res,statics[req.url]);
        console.log('STATIC_MISS',req.url);res.writeHead(404);return res.end();
    }
    const headers={...req.headers,host:'127.0.0.1:19765'};delete headers.authorization;
    const upstream=http.request({host:'127.0.0.1',port:19765,path:req.url,method:req.method,headers},r=>{res.writeHead(r.statusCode,r.headers);r.pipe(res)});
    upstream.on('error',()=>{res.writeHead(502);res.end()});upstream.end();
});
srv.listen(19767,'127.0.0.1',()=>console.log('TLS fixture ready'));
process.stdin.resume();process.stdin.on('end',()=>{srv.closeAllConnections();srv.close();});
