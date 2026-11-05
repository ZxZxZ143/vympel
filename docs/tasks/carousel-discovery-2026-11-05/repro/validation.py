import pathlib,json,hashlib,datetime
P=pathlib.Path;W=P(__file__).parent;D=P('docs/tasks/carousel-discovery-2026-11-05')
read=lambda p:json.loads(P(p).read_bytes())
sha=lambda p:hashlib.sha256(P(p).read_bytes()).hexdigest()
gate=read(D/'network-gate.json');totals=read(D/'totals.json');build=read(D/'build-124958.json')
assert gate['status']=='PASS' and gate['matchedObservations']==48
assert totals['candidate']['farRequests']==0 and not totals['normalNavigationRegressions'] and not totals['slowNewPending']
assert all(sha(p)==s for p,s in build['sourceSha256'].items())
receipts={}
for name in ['baseline-matrix-admitted','candidate-matrix-admitted','candidate-regression-complete','baseline-contracts','candidate-contracts','baseline-throttle2']:
 r=read(D/name/'receipt.json');assert r['status']=='PASS';receipts[name]=r
 if name.startswith('candidate'):assert r['imageId']==build['imageId']
assert all(read(W/(name+'-completion.json'))['exit']==0 for name in ['lint','typecheck'])
unit=(W/'unit-complete.log').read_text('utf8');assert '50 passed (50)' in unit and '283 passed (283)' in unit
assert all(g['exit']==0 for g in read(D/'security-assets-gates.json')['gates'])
assert read(W/'audit-production.json')['metadata']['vulnerabilities']['total']==0
audit=read(W/'audit.json')['metadata']['vulnerabilities'];assert not audit['high'] and not audit['critical']
assert all(x['budgetExit']==0 for x in read(D/'budgets-admission.json'))
for name in ['visual-checks.json','public-final.json','preservation.json']:assert read(D/name)['status']=='PASS'
result={'status':'PASS','at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'local implementation and validation; no publication, deployment, SQL or media mutation','baselineCommit':'292d086d59f4198fb4efb40d48c08630e52e29f5','candidateRuntimeImage':build['imageId'],'sourceSha256':build['sourceSha256'],'tests':{'unitFiles':50,'unitTests':283,'lint':'PASS','typecheck':'PASS','productionBuild':'PASS','browserScenarioGroups':11,'matchedMatrixPairs':48,'navigationPairs':24,'staticWebPIntegrity':206,'originalIntegrity':39,'securityHeaderTests':3,'sharpAndGlobGuards':'PASS','productionAuditVulnerabilities':0,'fullAudit':audit,'unchangedBudgets':'PASS','visualMatchedPairs':4,'acceptedTenPublicReferences':'PASS'},'networkGate':gate,'navigationAdmission':{'normalRegressions':totals['normalNavigationRegressions'],'slowNewPending':totals['slowNewPending']},'receipts':receipts,'limitations':['Single observation per side per tuple; local loopback is not deployed internet performance','Pending/partial bytes are separate from completed bytes','Product-page no-JS Suspense hidden ancestor is unchanged from baseline','DOM/AX/keyboard checks, not a human screen-reader session','Live response-wait cause remains unresolved','Next media batch remains review-only; private ownership not audited in this task']}
(D/'validation.json').write_text(json.dumps(result,indent=2)+'\n');print('PASS full local admission')
