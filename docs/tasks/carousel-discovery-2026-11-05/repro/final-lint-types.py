import subprocess,pathlib,json,sys
W=pathlib.Path(__file__).parent;name=sys.argv[1];assert name in ['lint','typecheck']
r=subprocess.run(['npm.cmd','run',name],cwd='vympel_front',capture_output=True)
(W/(name+'-completion.log')).write_bytes(r.stdout+r.stderr)
(W/(name+'-completion.json')).write_text(json.dumps({'script':name,'exit':r.returncode,'log':str(W/(name+'-completion.log'))})+'\n')
print(name,'exit',r.returncode,flush=True)
if r.returncode:print((r.stdout+r.stderr).decode('utf8','replace'))
raise SystemExit(r.returncode)
