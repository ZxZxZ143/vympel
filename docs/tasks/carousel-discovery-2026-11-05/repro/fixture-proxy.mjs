import http from 'node:http';
import {spawn} from 'node:child_process';
import readline from 'node:readline';
const inside=String.raw`const http=require('node:http'), rl=require('node:readline').createInterface({input:process.stdin});
rl.on('line',line=>{
 const {id,path,method,headers}=JSON.parse(line);
 const req=http.request({host:'127.0.0.1',port:3000,path,method,headers},res=>{
  const chunks=[];res.on('data',b=>chunks.push(b));res.on('end',()=>console.log(JSON.stringify({id,status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks).toString('base64')})));
 });req.on('error',e=>console.log(JSON.stringify({id,error:e.message})));req.end();
});`;
const cid=process.argv[2];if(!/^[a-f0-9]{64}$/.test(cid))throw Error('Invalid fixture ID');
const relay=spawn('docker',['exec','-i',cid,'node','-e',inside],{stdio:['pipe','pipe','inherit'],windowsHide:true});
let serial=0;const pending=new Map();
readline.createInterface({input:relay.stdout}).on('line',line=>{
 const m=JSON.parse(line),res=pending.get(m.id);if(!res)return;pending.delete(m.id);
 if(m.error){res.writeHead(502);res.end();return}
 const headers={...m.headers};for(const k of ['connection','transfer-encoding','keep-alive'])delete headers[k];
 res.writeHead(m.status,headers);res.end(Buffer.from(m.body,'base64'));
});
const server=http.createServer((req,res)=>{
 if(!['GET','HEAD'].includes(req.method)||!req.url.startsWith('/')||req.url.startsWith('//')||req.headers.host!=='127.0.0.1:19765'){res.writeHead(400);res.end();return}
 const id=++serial;pending.set(id,res);res.on('close',()=>pending.delete(id));
 relay.stdin.write(JSON.stringify({id,path:req.url,method:req.method,headers:{...req.headers,connection:'close'}})+'\n');
});
server.listen(19765,'127.0.0.1',()=>console.log('Fixture loopback ready'));
relay.on('exit',()=>{server.close();for(const r of pending.values())r.destroy();process.exit()});
process.stdin.resume();process.stdin.on('end',()=>{relay.stdin.end();server.close()});
