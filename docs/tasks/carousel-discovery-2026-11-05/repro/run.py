import pathlib,subprocess,os,json,time,urllib.request,secrets,sys,datetime,hashlib
P=pathlib.Path;W=P(__file__).parent.resolve();D=P('docs/tasks/carousel-discovery-2026-11-05').resolve()
side,stage=sys.argv[1:3];assert side in ['baseline','candidate']; assert stage.replace('-','').isalnum()
image='ghcr.io/zxzxz143/vympel-storefront@sha256:1dd91655b7efcf1e56617553c788e11aaf140e67ab3b8a7f4d8e28f72bc4571d' if side=='baseline' else 'vympel-carousel-local:review'
dest=D/(side+'-'+stage);dest.mkdir(exist_ok=False)
env={**os.environ,'FIXTURE_MODE':'current','REVIEW_SIDE':side,'REVIEW_STAGE':stage,'REVIEW_OUT':str(dest)}
frozen=json.loads((D/'frozen-inputs.json').read_bytes())
for relative,sha in frozen['files'].items():assert hashlib.sha256((W/'fixture-data'/relative).read_bytes()).hexdigest()==sha,relative
cid=None;procs=[];logs=[];at=datetime.datetime.now(datetime.timezone.utc).isoformat()
try:
 info=json.loads(subprocess.check_output(['docker','image','inspect',image]))[0];assert info['Architecture']=='amd64'
 args=['docker','run','--detach','--pull=never','--name','vympel-carousel-discovery-'+side,'--label','vympel.task=carousel-discovery','--platform','linux/amd64','--network','none','--env','HOSTNAME=0.0.0.0','--env','BASE_API_PUBLIC=http://127.0.0.1:19746/api/public','--env','FIXTURE_MODE=current','--env','CMS_REVALIDATE_SECRET='+secrets.token_urlsafe(32)]
 for src,target in [(W/'api-adapter.mjs','api-adapter.mjs'),(W/'app-fixture.mjs','app-fixture.mjs'),(W/'fixture-data','data'),(P('docs/tasks/gallery-retry-2026-11-04/reviewed-manifest.json').resolve(),'manifest.json')]:args+=['--mount',f'type=bind,source={src},target=/fixture/{target},readonly']
 cid=subprocess.check_output(args+[image,'node','/fixture/app-fixture.mjs'],text=True).strip()
 for script,params in [('fixture-proxy.mjs',[cid]),('fixture-tls.mjs',[])]:
  log=(dest/(script+'.log')).open('xb');logs.append(log)
  procs.append(subprocess.Popen(['node',str(W/script),*params],env=env,stdin=subprocess.PIPE,stdout=log,stderr=subprocess.STDOUT))
 for _ in range(50):
  try:
   with urllib.request.urlopen('http://127.0.0.1:19765/robots.txt',timeout=3) as r:assert r.status==200
   break
  except OSError:time.sleep(.4)
 else:raise RuntimeError('local server did not start')
 prime="""const c=require('node:crypto');(async()=>{for(const pageKey of ['home','product','catalog']){const timestamp=Math.floor(Date.now()/1000),requestId=c.randomUUID(),p={version:'1',timestamp,requestId,pageKey};const sig=c.createHmac('sha256',process.env.CMS_REVALIDATE_SECRET).update(['1',timestamp,requestId,pageKey].join('\\n')).digest('hex');const r=await fetch('http://127.0.0.1:3000/api/revalidate',{method:'POST',headers:{'content-type':'application/json','x-cms-signature':sig},body:JSON.stringify(p)});if(r.status!==200)throw Error('Local ISR '+r.status)}})()"""
 subprocess.run(['docker','exec',cid,'node','-e',prime],check=True,timeout=35)
 m=json.loads(P('docs/tasks/gallery-retry-2026-11-04/reviewed-manifest.json').read_bytes())
 for route,key in [('/ru',m['images'][9]['originalKey']),('/ru/product/56',m['images'][5]['originalKey']),('/ru/product/46',m['images'][0]['originalKey'])]:
  for _ in range(8):
   with urllib.request.urlopen('http://127.0.0.1:19765'+route,timeout=30) as r:html=r.read()
   if key.encode() in html:break
   time.sleep(.4)
  else:raise RuntimeError('SSR current ref missing '+route)
 print('FIXTURE READY',side,stage,info['Id'],flush=True)
 script='throttle' if stage.startswith('throttle') else 'matrix-gallery' if stage=='matrix-gallery' else 'matrix' if stage.startswith('matrix') else 'regression' if stage.startswith('regression') else 'contracts' if stage.startswith('contracts') else 'browser'
 subprocess.run(['node',str(W/(script+'.mjs'))],env=env,check=True)
 output=subprocess.check_output(['docker','logs',cid],stderr=subprocess.STDOUT);(dest/'app.log').write_bytes(output)
 assert b'API_MISS' not in output,output[-800:]
 assert not any(word in (dest/'fixture-tls.mjs.log').read_text() for word in ['API_MISS','MEDIA_MISS','STATIC_MISS','DENY method']), 'Incomplete fixture inputs; inspect TLS log'
 (dest/'receipt.json').write_text(json.dumps({'status':'PASS','side':side,'stage':stage,'image':image,'imageId':info['Id'],'frozenInputsSha256':frozen['sha256'],'startedAt':at,'finishedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'network':'none','mounts':'read-only','refs':'accepted ten','tls':'loopback + process-scoped SPKI pin; no global trust change'},indent=2)+'\n')
finally:
 for proc in reversed(procs):
  proc.stdin.close()
  try:proc.wait(timeout=6)
  except subprocess.TimeoutExpired:proc.terminate();proc.wait(timeout=15)
 for log in logs:log.close()
 if cid:
  assert subprocess.check_output(['docker','inspect','--format','{{index .Config.Labels "vympel.task"}}',cid],text=True).strip()=='carousel-discovery'
  subprocess.run(['docker','rm','-f',cid],check=True,capture_output=True,timeout=35)
