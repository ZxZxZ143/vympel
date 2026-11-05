import subprocess,sys
for side in ['baseline','candidate']:
 print('BEGIN',side,'matrix-admitted',flush=True)
 subprocess.run([sys.executable,'-X','utf8','.cache/carousel-discovery-20261105/run.py',side,'matrix-admitted'],check=True)
 print('COMPLETE',side,'matrix-admitted',flush=True)
