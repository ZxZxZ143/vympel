import fs from 'node:fs';
import path from 'node:path';
export function openApi(dir, manifest, mode, log) {
    const files=JSON.parse(fs.readFileSync(path.join(dir,'api-index.json')));
    const canonical=raw=>{const u=new URL(raw,'http://fixture');u.searchParams.sort();return u.pathname+u.search};
    const entries=new Map(Object.entries(files).map(([u,f])=>[canonical(u),f]));
    const root='https://api.vympel.kz/media/vympel-staging/';
    function rewrite(v) {
        if(typeof v==='string' && v.startsWith(root) && mode==='responsive'){
            const url=new URL(v), key=url.pathname.slice('/media/vympel-staging/'.length);
            const family=manifest.images.find(f=>f.oldKey===key);
            if(family){url.pathname='/media/vympel-staging/'+family.originalKey;return url.href;}
        }
        if(Array.isArray(v))return v.map(rewrite);
        if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,rewrite(x)]));
        return v;
    }
    return (req,res)=>{
        const suffix=req.url.replace(/^\/api\/public/,'');const file=entries.get(canonical(suffix));
        if(!['GET','HEAD','OPTIONS'].includes(req.method)||!file){
            log('API_MISS '+req.method+' '+suffix);res.writeHead(404);return res.end();
        }
        const data=Buffer.from(JSON.stringify(rewrite(JSON.parse(fs.readFileSync(path.join(dir,'api',file))))));
        res.writeHead(200,{'Content-Type':'application/json','Content-Length':data.length,'Access-Control-Allow-Origin':'https://preview.vympel.kz','Vary':'Origin','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:data);
    };
}
