import pathlib,subprocess,hashlib,json,datetime
P=pathlib.Path;W=P(__file__).parent;D=P('docs/tasks/carousel-discovery-2026-11-05')
args=['docker','build','--platform','linux/amd64','--tag','vympel-carousel-local:review']
inputs={'BASE_API_PUBLIC':'https://api.vympel.kz/api/public','NEXT_PUBLIC_BASE_API_PUBLIC':'https://api.vympel.kz/api/public','NEXT_PUBLIC_MEDIA_ORIGINS':'https://api.vympel.kz','NEXT_PUBLIC_SITE_URL':'https://preview.vympel.kz','NEXT_PUBLIC_APP_ENV':'staging','NEXT_PUBLIC_APP_RELEASE':'292d086d59f4198fb4efb40d48c08630e52e29f5','NEXT_PUBLIC_TELEMETRY_ENABLED':'false','SITE_INDEXING_ENABLED':'false'}
for k,v in inputs.items():args+=['--build-arg',k+'='+v]
stamp=datetime.datetime.now(datetime.timezone.utc).strftime('%H%M%S');log=W/('build-'+stamp+'.log')
with log.open('xb') as f:r=subprocess.run(args+['vympel_front'],stdout=f,stderr=subprocess.STDOUT)
print('BUILD EXIT',r.returncode,log,flush=True);r.check_returncode()
files=subprocess.check_output(['git','diff','--name-only','--','vympel_front/src'],text=True).splitlines()
files+=subprocess.check_output(['git','ls-files','--others','--exclude-standard','--','vympel_front/src'],text=True).splitlines()
info=json.loads(subprocess.check_output(['docker','image','inspect','vympel-carousel-local:review']))[0]
(D/('build-'+stamp+'.json')).write_text(json.dumps({'status':'PASS','imageId':info['Id'],'inputs':inputs,'sourceSha256':{p:hashlib.sha256(P(p).read_bytes()).hexdigest() for p in files},'logSha256':hashlib.sha256(log.read_bytes()).hexdigest(),'localOnly':True,'releaseLabel':'accepted baseline metadata retained for matched fixture; not a published candidate'},indent=2)+'\n')
