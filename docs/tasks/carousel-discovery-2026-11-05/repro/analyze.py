import pathlib,json,collections,statistics,hashlib,datetime
P=pathlib.Path;W=P(__file__).parent.resolve();D=P('docs/tasks/carousel-discovery-2026-11-05')
def read(p):return json.loads(P(p).read_bytes())
def key(c):return (c['route'],c['width'],c['ect'],c['slow'],c['cache'])
index=read(W/'fixture-data/api-index.json')
products={}
for k,f in index.items():
 if k.startswith('/product/ru/') and k.removeprefix('/product/ru/').isdigit():
  obj=read(W/'fixture-data/api'/f);products[int(k.rsplit('/',1)[1])]=obj
def product_url(pid):
 obj=products.get(pid,{})
 if obj.get('imageUrl'):return obj['imageUrl']
 imgs=obj.get('images',[]);return next((x['url'] for x in imgs if x.get('isMain')),imgs[0]['url'] if imgs else '')
def family(url):return url.rsplit('/',1)[0]+'/' if '/responsive-v1/' in url else url
def rail_matches(c,r):
 matches=[]
 for ri,rail in enumerate(c['dom']['rails']):
  for card in rail['cards']:
   try:pid=int(card['href'].split('?')[0].split('/')[-1])
   except (ValueError,AttributeError):continue
   source=product_url(pid)
   if source and r['url'].startswith(family(source)):matches.append((ri,card['index'],pid))
 return matches
def characterize(c):
 doc=next(r for r in c['network'] if r['type']=='Document');rows=[]
 for r in c['network']:
  if r['type']!='Image':continue
  matches=rail_matches(c,r);t=(r['start']-doc['start'])*1000
  samples=c['dom']['samples'];sample=next((s for s in reversed(samples) if s['at']<=t and s['rails']),None)
  if sample is None:sample=next((s for s in samples if s['rails']),None)
  seen=[]
  for ri,idx,pid in matches:
   rail=sample['rails'][ri] if sample and ri<len(sample['rails']) else c['dom']['rails'][ri]
   # No carousel navigation happens in a cold/warm window. Define "far"
   # against the final styled initial view, independently from sampled timing.
   # A preceding sample can still be in Next's hidden stream or before CSS.
   initial=c['dom']['rails'][ri]
   visible=[x['index'] for x in initial['cards'] if x['horizontal']]
   allowed=set(range(min(4,len(rail['cards']))))
   for i in visible:allowed.update(j for j in [i-1,i,i+1] if 0<=j<len(rail['cards']))
   card=rail['cards'][idx]
   seen.append({'rail':ri,'index':idx,'productId':pid,'visible':card['visible'],'horizontal':card['horizontal'],'initialHorizontal':initial['cards'][idx]['horizontal'],'initialViewportVisible':initial['cards'][idx]['visible'],'eligible':idx in allowed,'boundBasis':'final styled initial view; no timed carousel navigation','sampleAt':sample['at'] if sample else None,'sampleLayoutWidth':rail['rect']['width'],'requestApproxAt':t})
  rows.append({**r,'carousel':seen,'far':bool(seen) and all(not x['eligible'] for x in seen)})
 total={**c['summary'],'carouselRequests':sum(bool(r['carousel']) for r in rows),'farRequests':sum(r['far'] for r in rows),'carouselVisible':sum(any(x['visible'] for x in r['carousel']) for r in rows),'carouselHorizontallyVisible':sum(any(x['horizontal'] for x in r['carousel']) for r in rows),'wire304Bytes':sum(r.get('bytes',r.get('partial',0)) for r in rows if r.get('wireStatus')==304),'farWire':sum(r.get('bytes',r.get('partial',0)) for r in rows if r['far']),'totalWire':sum(r.get('bytes',r.get('partial',0)) for r in rows),'lcp':c['dom']['lcp'][-1]['start'] if c['dom']['lcp'] else None,'cls':c['dom']['cls']}
 total['initialHorizontalRequests']=sum(any(x['initialHorizontal'] for x in r['carousel']) for r in rows)
 total['initialViewportVisibleRequests']=sum(any(x['initialViewportVisible'] for x in r['carousel']) for r in rows)
 return total,rows
cases={};navigation={}
for side in ['baseline','candidate']:
 cases[side]={};navigation[side]={}
 for stage in ['matrix-admitted']:
  folder=D/(side+'-'+stage);receipt=read(folder/'receipt.json');assert receipt['status']=='PASS';assert receipt['frozenInputsSha256']==read(D/'frozen-inputs.json')['sha256']
  for p in sorted(folder.glob('[0-9][0-9].json')):
   c=read(p);assert key(c) not in cases[side];cases[side][key(c)]=c
   if c['cache']=='cold':
    for r in c['network']:
     if r['type']=='Image' and (r.get('direct') or r.get('disk')):
      assert any(x['id']!=r['id'] and x['url']==r['url'] and x.get('end',float('inf'))<=r['start'] and x.get('status')==200 and not x.get('direct') and not x.get('disk') and not x.get('error') for x in c['network']), ('Unproven cold cache reuse',p,r['url'])
  for p in folder.glob('nav-*.json'):
   c=read(p);navigation[side][(c['route'],c['width'],c['ect'],c['slow'])]=c
assert cases['baseline'].keys()==cases['candidate'].keys();assert len(cases['baseline'])==48
paired=[];ledger=[]
for k,b in cases['baseline'].items():
 a=cases['candidate'][k];bt,br=characterize(b);at,ar=characterize(a)
 assert at['farRequests']==0,(k,'far candidate request')
 assert not b['errors'] and not a['errors'] and not b['dom']['broken'] and not a['dom']['broken']
 paired.append({'route':k[0],'width':k[1],'ect':k[2],'slow':k[3],'cache':k[4],'baseline':bt,'candidate':at,'lcpBaseline':b['dom']['lcp'][-1] if b['dom']['lcp'] else None,'lcpCandidate':a['dom']['lcp'][-1] if a['dom']['lcp'] else None})
 ledger.append({'tuple':list(k),'baseline':br,'candidate':ar})
(D/'request-ledger.json').write_text(json.dumps(ledger,indent=2)+'\n')
(D/'comparison.json').write_text(json.dumps(paired,indent=2)+'\n')
groups=collections.defaultdict(list)
for p in paired:groups[(p['slow'],p['ect'],p['width'],p['cache'])].append(p)
def sums(rows,side,name):return sum(r[side][name] for r in rows)
def value(rows,side,name):return f'{sums(rows,side,name):,}'
lines=['# Paired local performance — not deployed results','','Three identical page samples per row: home, product 56 and product 46. Normal is unthrottled loopback. Completed wire includes headers; partial/pending bytes are shown separately. Exact request records and actual LCP elements remain in comparison.json and request-ledger.json.','', '| Network / ECT | Width | Cache | Image requests B→A | Far carousel requests B→A | Completed wire bytes B→A | Partial wire B→A | Direct / 304 B→A | Pending B→A | Median LCP ms B→A | Max CLS B→A |','| --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |']
for (slow,ect,width,cache),rows in sorted(groups.items()):
 pair=lambda n:value(rows,'baseline',n)+' → '+value(rows,'candidate',n)
 med=lambda s:statistics.median(r[s]['lcp'] for r in rows if r[s]['lcp'] is not None)
 mx=lambda s:max(r[s]['cls'] for r in rows)
 lines.append(f"| {'slow' if slow else 'normal'} / {ect} | {width} | {cache} | {pair('requests')} | {pair('farRequests')} | {pair('completedWire')} | {pair('partialWire')} | {pair('direct')} / {pair('wire304')} | {pair('pending')} | {med('baseline'):.1f} → {med('candidate'):.1f} | {mx('baseline'):.6f} → {mx('candidate'):.6f} |")
lines+=['','Far/eligible classification uses the final styled initial carousel range plus one neighbour and four SSR bootstrap identities, matching the independent network gate. There is no carousel navigation during cold/warm windows. Request-time visibility separately uses 200ms DOM samples and is approximate: early samples can be in a hidden Next stream or before CSS; their layout width is retained. They must not redefine the final horizontal bound or be described as sub-frame visibility measurements. Pages remain at their initial carousel position throughout these windows.','']
(D/'PERFORMANCE.md').write_text('\n'.join(lines),encoding='utf8')
nav=[];nl=['# Bounded next-navigation observations','','Same configured network as the matched page run. Scroll into view, dwell 1.8 seconds, then press Right. Image-ready delay is separate from the 700ms settling/polling floor. Pending at the 15-second cutoff is not zero delay. Decoding cleanup after the cutoff is unthrottled and excluded.','','| Page | Width | ECT / network | Image delay ms B→A | Pending B→A |','| --- | ---: | --- | --- | --- |']
for k,b in navigation['baseline'].items():
 a=navigation['candidate'][k];row={'route':k[0],'width':k[1],'ect':k[2],'slow':k[3],'baselineDelay':b['visibleImageDelayMs'],'candidateDelay':a['visibleImageDelayMs'],'baselinePending':b['pendingAtCutoff'],'candidatePending':a['pendingAtCutoff']}
 for side,c in [('baseline',b),('candidate',a)]:
  warm=cases[side][(*k,'warm')];oldids={r['id'] for r in warm['network']};doc=next(r for r in warm['network'] if r['type']=='Document');nexttime=doc['start']+c['at']/1000
  extra=[r for r in c['network'] if r['id'] not in oldids and r['type']=='Image'];row[side+'NewAfterScroll']=[r['url'] for r in extra if r['start']<nexttime];row[side+'NewAfterNext']=[r['url'] for r in extra if r['start']>=nexttime]
 nav.append(row)
 nl.append(f"| {k[0]} | {k[1]} | {k[2]} / {'slow' if k[3] else 'normal'} | {b['visibleImageDelayMs']} → {a['visibleImageDelayMs']} | {b['pendingAtCutoff']} → {a['pendingAtCutoff']} |")
(D/'navigation-comparison.json').write_text(json.dumps(nav,indent=2)+'\n');(D/'NAVIGATION.md').write_text('\n'.join(nl)+'\n',encoding='utf8')
totals={side:{name:sums(paired,side,name) for name in ['requests','completedWire','partialWire','totalWire','direct','wire304','pending','carouselRequests','carouselVisible','carouselHorizontallyVisible','initialHorizontalRequests','initialViewportVisibleRequests','farRequests','farWire']} for side in ['baseline','candidate']}
totals['normalNavigationRegressions']=[n for n in nav if not n['slow'] and (n['candidatePending'] or (n['candidateDelay'] or 0)>(n['baselineDelay'] or 0)+100)]
totals['slowNewPending']=[n for n in nav if n['slow'] and n['candidatePending'] and not n['baselinePending']]
(D/'totals.json').write_text(json.dumps(totals,indent=2)+'\n');print(json.dumps(totals,indent=2))
prior=read('docs/tasks/warm-investigation-2026-11-05/next-batch.json');rank=[]
for i,item in enumerate(prior):
 row={'priorRank':i+1,'key':item['key'],'originalSha256':item['originalSha256'],'originalBytes':item['originalBytes'],'dimensions':item['dimensions'],'expectedWidths':item['expectedWidths'],'owners':item['currentPublicOwners'],'oldCodecEstimateOnly':item['estimate']}
 for side in ['baseline','candidate']:
  rr=[r for c in cases[side].values() if c['cache']=='cold' and not c['slow'] for r in c['network'] if r['url']==item['url'] and r['type']=='Image']
  row[side]={'normalColdRequests':len(rr),'normalColdWireBytes':sum(r.get('bytes',r.get('partial',0)) for r in rr),'pending':sum(not r.get('end') and not r.get('error') for r in rr)}
 rank.append(row)
rank.sort(key=lambda r:(-r['candidate']['normalColdWireBytes'],r['priorRank']))
(D/'next-batch-priorities.json').write_text(json.dumps(rank,indent=2)+'\n')
print('PASS',len(paired),'matched observations;',len(nav),'matched next-navigation observations')
