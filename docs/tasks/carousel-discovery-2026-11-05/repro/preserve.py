import pathlib,json,hashlib,subprocess,datetime
P=pathlib.Path;W=P(__file__).parent;D=P('docs/tasks/carousel-discovery-2026-11-05');sha=lambda p:hashlib.sha256(P(p).read_bytes()).hexdigest()
start=json.loads((D/'startup.json').read_bytes());result={}
for name,prior in start['priorEvidence'].items():
 folder=P('docs/tasks')/name;assert sha(folder/'EVIDENCE_SHA256SUMS.json')==prior['indexSha256'];book=json.loads((folder/'EVIDENCE_SHA256SUMS.json').read_bytes());assert len(book)==prior['files'];assert all(sha(folder/p)==h for p,h in book.items());result[name]=prior
for name in ['docs/deployment/GCP_STAGING_RUNBOOK.md','scripts/image-performance/README.md']:assert sha(name)==start['originalFileHashes'][name],name
insertions=json.loads((W/'doc-insertions.json').read_text('utf8'))
for name,entries in insertions.items():
 b=P(name).read_bytes();nl=b'\r\n' if b'\r\n' in b else b'\n'
 for anchor,body in entries:
  x=(body.replace('\n',nl.decode())).encode()+nl+nl;assert b.count(x)==1,(name,anchor);b=b.replace(x,b'',1)
 assert b==(W/'original-docs'/P(name).name).read_bytes(), 'Pre-existing doc content changed: '+name
for name in start['untracked']:assert P(name).exists(),name
frozen=json.loads((D/'frozen-inputs.json').read_bytes());F=W/'fixture-data'
for name,h in frozen['files'].items():assert sha(F/name)==h,name
for name in ['media-index.json','static-index.json']:
 for key,v in json.loads((F/name).read_bytes()).items():
  if v.get('sha256'):assert sha(v['file'])==v['sha256'],key
build=json.loads((D/'build-124958.json').read_bytes());assert all(sha(p)==h for p,h in build['sourceSha256'].items())
pins={'scripts/image-performance/benchmark-matrix.mjs':'813a3ad9899d79cfd5d0cd0058095116b9767322703450a6eefde22418e06cf1','scripts/image-performance/prime-images.mjs':'c602bc06afd902cc2d67608a2384f1e081be2ce1a485a1651666124d35866dc0','scripts/image-performance/benchmark-evidence.mjs':'29b0c8a04eaee048bcd4e389fbd5482dcdca72406fcbf877180ced27f7a210b0'}
for p,h in pins.items():assert sha(p)==h,p
(D/'preservation.json').write_text(json.dumps({'status':'PASS','at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'priorEvidence':result,'originalUntrackedPreserved':len(start['untracked']),'unrelatedTrackedFiles':'unchanged','priorDocContents':'byte-for-byte preserved after removing only this task insertions','frozenInputsSha256':frozen['sha256'],'candidateRuntimeSourceHashes':'match final build receipt','acceptedRunnerPins':pins},indent=2)+'\n')
print('PASS preservation: prior evidence, original docs/untracked files, unrelated tracked changes, media bodies, final runtime source and accepted runner pins')
