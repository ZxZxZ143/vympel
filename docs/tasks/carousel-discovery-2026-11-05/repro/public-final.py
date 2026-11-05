import pathlib,json,urllib.request,hashlib,datetime
P=pathlib.Path;D=P('docs/tasks/carousel-discovery-2026-11-05');m=json.loads(P('docs/tasks/gallery-retry-2026-11-04/reviewed-manifest.json').read_bytes());rows=[]
for pid,f in zip([46,54,35,53,7,56,64,37,11],m['images']):
 url='https://api.vympel.kz/api/public/product/ru/'+str(pid)
 with urllib.request.urlopen(url,timeout=25) as r:b=r.read();assert r.status==200
 data=json.loads(b);main=next(x for x in data['images'] if x.get('isMain'));assert f['originalKey'] in main['url'];rows.append({'product':pid,'mainUrl':main['url'],'responseSha256':hashlib.sha256(b).hexdigest()})
with urllib.request.urlopen('https://api.vympel.kz/api/public/cms/pages/home?lang=ru',timeout=25) as r:b=r.read();assert r.status==200
assert m['images'][9]['originalKey'] in b.decode();rows.append({'cms':'home/ru','acceptedKey':m['images'][9]['originalKey'],'responseSha256':hashlib.sha256(b).hexdigest()})
(D/'public-final.json').write_text(json.dumps({'status':'PASS','at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'getOnly':True,'acceptedTenReferencesActive':rows,'privateDatabaseAudit':'not performed; no SQL authorized'},indent=2)+'\n');print('PASS all ten accepted references still active via public GETs')
