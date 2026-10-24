param([ValidateSet('Start','Stop','Restart','Status','Seed','CleanSeed','RefreshFrontend','RefreshBackend')][string]$Action='Start', [switch]$Rebuild)
$ErrorActionPreference='Stop'
$Repo=(Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$Stand=Join-Path $Repo '.cache/pagination-stand'
$Data=Join-Path $Stand 'postgres'
$Marker=Join-Path $Stand 'DISPOSABLE-PAGINATION-STAND.txt'
$StateFile=Join-Path $Stand 'processes.json'
$FrontendPathFile=Join-Path $Stand 'frontend-path.txt'
$Front=if(Test-Path $FrontendPathFile) { (Get-Content $FrontendPathFile -Raw).Trim() } else { Join-Path $Stand 'storefront' }
$resolvedFront=[IO.Path]::GetFullPath($Front)
if(!$resolvedFront.StartsWith($Stand+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) { throw 'Frontend path must stay inside the disposable stand' }
$PgBin=$env:VYMPEL_DEMO_PG_BIN
if (!$PgBin -and (Test-Path (Join-Path $Data 'PG_VERSION'))) {
  $major=(Get-Content (Join-Path $Data 'PG_VERSION') -Raw).Trim()
  $PgBin=Join-Path $env:ProgramFiles ('PostgreSQL/'+$major+'/bin')
}
if (!$PgBin) { $PgBin=@('C:/Program Files/PostgreSQL/16/bin','C:/Program Files/PostgreSQL/18/bin') | Where-Object { Test-Path (Join-Path $_ 'pg_ctl.exe') } | Select-Object -First 1 }
if (!$PgBin) { throw 'Install native PostgreSQL 16 (preferred), or set VYMPEL_DEMO_PG_BIN.' }
function Pg([string]$Tool,[string[]]$Arguments) { & (Join-Path $PgBin ($Tool+'.exe')) @Arguments; if($LASTEXITCODE -ne 0) { throw "$Tool failed ($LASTEXITCODE)" } }
function Sql([string]$Query) { Pg 'psql' @('-X','-h','127.0.0.1','-p','55440','-U','pagination_demo','-d','vympel_pagination_demo','-v','ON_ERROR_STOP=1','-c',$Query) }
function WaitHttp([string]$Url) {
  $deadline=(Get-Date).AddMinutes(3)
  while((Get-Date) -lt $deadline) { try { $r=Invoke-WebRequest -Uri $Url -TimeoutSec 5 -UseBasicParsing; if($r.StatusCode -eq 200) { return } } catch {}; Start-Sleep -Seconds 2 }
  throw "Readiness timeout: $Url. Inspect $Stand logs."
}
function SaveState { $script:state | ConvertTo-Json | Set-Content -LiteralPath $StateFile }
function StopOwned([string]$Name) {
  $entry=$script:state.$Name
  if(!$entry) { return }
  $proc=Get-CimInstance Win32_Process -Filter "ProcessId=$($entry.id)"
  if($proc) {
    if($proc.CommandLine -notlike "*$Stand*" -or $proc.CreationDate.ToUniversalTime().Ticks.ToString() -ne $entry.created) { throw "Refusing to stop unverified PID $($entry.id)" }
    Stop-Process -Id $entry.id
  }
  $script:state.Remove($Name); SaveState
}
function RecordProcess([string]$Name,$Proc) {
  $info=Get-CimInstance Win32_Process -Filter "ProcessId=$($Proc.Id)"
  $script:state[$Name]=@{id=$Proc.Id;created=$info.CreationDate.ToUniversalTime().Ticks.ToString()}; SaveState
}
function SetDemoEnvironment {
  # Never source .env or deployment secrets; remove inherited app configuration in this child shell.
  Get-ChildItem Env: | Where-Object Name -Match '^(VYMPEL_|SPRING_|NEXT_PUBLIC_|BASE_API_|APP_LOG_|JAVA_TOOL_OPTIONS$|JDK_JAVA_OPTIONS$)' | ForEach-Object { Remove-Item -LiteralPath ('Env:'+ $_.Name) }
  $values=@{
    SPRING_PROFILES_ACTIVE='local'; SERVER_PORT='18080'; SERVER_ADDRESS='127.0.0.1';
    VYMPEL_DB_URL='jdbc:postgresql://127.0.0.1:55440/vympel_pagination_demo'; VYMPEL_DB_USERNAME='pagination_demo'; VYMPEL_DB_PASSWORD='pagination-demo-only';
    VYMPEL_JWT_SECRET='local-pagination-demo-signing-key-0000000000000000000000'; VYMPEL_RATE_LIMIT_STORAGE='memory';
    VYMPEL_RATE_LIMIT_HMAC_SECRET='local-pagination-demo-rate-key-0000000000000000000000'; VYMPEL_RL_PUBLIC_CATALOG_CAPACITY='10000';
    VYMPEL_REDIS_URL='redis://127.0.0.1:56379'; VYMPEL_S3_BUCKET='pagination-demo'; VYMPEL_S3_REGION='us-east-1';
    VYMPEL_S3_ENDPOINT='http://127.0.0.1:59000'; VYMPEL_S3_PUBLIC_ENDPOINT='http://127.0.0.1:59000';
    VYMPEL_S3_ACCESS_KEY='pagination-demo'; VYMPEL_S3_SECRET_KEY='pagination-demo-only-000000000000000000';
    VYMPEL_CMS_PUBLIC_REVALIDATE_ENABLED='false'; VYMPEL_CMS_PUBLIC_REVALIDATE_REQUIRED='false'; VYMPEL_CMS_MEDIA_CLEANUP_ENABLED='false';
    VYMPEL_STORAGE_DELETION_ENABLED='false'; VYMPEL_ANALYTICS_CLEANUP_ENABLED='false'; VYMPEL_CRM_ACTIVITY_RETENTION_CLEANUP_ENABLED='false';
    VYMPEL_BOOTSTRAP_ADMIN_ENABLED='false'; VYMPEL_CORS_ALLOWED_ORIGINS='http://127.0.0.1:3300,http://localhost:3300'; VYMPEL_CRM_TRUSTED_ORIGINS='http://127.0.0.1:3300';
    APP_LOG_DIR=(Join-Path $Stand 'logs'); BASE_API_PUBLIC='http://127.0.0.1:18080/api/public'; NEXT_PUBLIC_BASE_API_PUBLIC='http://127.0.0.1:18080/api/public';
    NEXT_PUBLIC_APP_ENV='local'; NEXT_PUBLIC_SITE_URL='http://127.0.0.1:3300'; NEXT_PUBLIC_SITE_INDEXING_ENABLED='false'; NEXT_TELEMETRY_DISABLED='1'
  }
  foreach($key in $values.Keys) { Set-Item -LiteralPath ('Env:'+$key) -Value $values[$key] }
}
if(!(Test-Path $Marker)) {
  if(Test-Path $Stand) { throw "Unmarked directory exists: $Stand. Refusing to adopt it." }
  New-Item -ItemType Directory -Path $Stand | Out-Null
  'Dedicated synthetic pagination stand; database vympel_pagination_demo; loopback:55440.' | Set-Content $Marker
}
$script:state=@{}
if(Test-Path $StateFile) { $obj=Get-Content $StateFile -Raw | ConvertFrom-Json; foreach($prop in $obj.PSObject.Properties) { $script:state[$prop.Name]=$prop.Value } }
if($Action -in @('Stop','Restart')) {
  StopOwned 'frontend'; StopOwned 'backend'
  & (Join-Path $PgBin 'pg_ctl.exe') status -D $Data
  if($LASTEXITCODE -eq 0) { Pg 'pg_ctl' @('stop','-D',$Data,'-m','fast','-w') }
  if($Action -eq 'Stop') { 'Stopped only the owned demo services; data retained.'; exit 0 }
}
if($Action -eq 'Status') {
  Pg 'pg_isready' @('-h','127.0.0.1','-p','55440','-U','pagination_demo','-d','vympel_pagination_demo')
  Sql 'SELECT count(*) AS products,count(DISTINCT sku) AS unique_skus FROM product;'
  Invoke-RestMethod 'http://127.0.0.1:18080/actuator/health/readiness' | ConvertTo-Json -Compress
  Write-Output ('Storefront HTTP '+(Invoke-WebRequest 'http://127.0.0.1:3300/en/catalog' -UseBasicParsing).StatusCode)
  Get-Content $StateFile; exit 0
}
if($Action -in @('Seed','CleanSeed')) { $seedFile=if($Action -eq 'Seed') {'seed.sql'} else {'cleanup.sql'}; Pg 'psql' @('-X','-h','127.0.0.1','-p','55440','-U','pagination_demo','-d','vympel_pagination_demo','-f',(Join-Path $PSScriptRoot $seedFile)); exit 0 }
if($Action -eq 'RefreshBackend') {
  # Use an already verified build; preserve the cluster, fixtures and frontend process.
  $builtJar=Join-Path $Repo 'vympel_back/build/libs/vympel.jar'
  if(!(Test-Path -LiteralPath $builtJar)) { throw 'Run backend tests and bootJar before RefreshBackend.' }
  Pg 'pg_isready' @('-h','127.0.0.1','-p','55440','-U','pagination_demo','-d','vympel_pagination_demo')
  $jar=Join-Path $Stand ('vympel-demo-'+[DateTime]::UtcNow.ToString('yyyyMMddHHmmssfff')+'.jar')
  Copy-Item -LiteralPath $builtJar -Destination $jar
  SetDemoEnvironment
  $jdk=Get-ChildItem (Join-Path $env:USERPROFILE '.jdks') -Directory -Filter '*17*' | Select-Object -First 1
  $java=if($env:JAVA_HOME) { Join-Path $env:JAVA_HOME 'bin/java.exe' } elseif($jdk) { Join-Path $jdk.FullName 'bin/java.exe' } else { (Get-Command java).Source }
  StopOwned 'backend'
  $proc=Start-Process -FilePath $java -ArgumentList '-jar',('"'+$jar+'"') -WorkingDirectory $Stand -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $Stand 'backend.log') -RedirectStandardError (Join-Path $Stand 'backend-error.log')
  RecordProcess 'backend' $proc
  WaitHttp 'http://127.0.0.1:18080/actuator/health/readiness'
  'Backend refreshed; PostgreSQL, all fixtures and frontend preserved.'
  exit 0
}
if($Action -eq 'RefreshFrontend') {
  WaitHttp 'http://127.0.0.1:18080/actuator/health/readiness'
  SetDemoEnvironment
  # Build beside the running copy; switch only the owned frontend after success.
  $Front=Join-Path $Stand ('storefront-'+[DateTime]::UtcNow.ToString('yyyyMMddHHmmssfff'))
} else {
if($state.Count -gt 0) { throw 'Stand has recorded processes. Use Status or Restart; do not start duplicates.' }
foreach($port in @(55440,18080,3300)) { if(Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue) { throw "Port $port is already occupied" } }
if(!(Test-Path (Join-Path $Data 'PG_VERSION'))) { Pg 'initdb' @('-D',$Data,'-U','pagination_demo','-A','trust','--encoding=UTF8','--locale=C') }
# Give the persistent postgres child its own handles; otherwise redirected caller pipes
# can remain open on Windows after pg_ctl and this script have exited.
$pgArgs=@('start','-D',('"'+$Data+'"'),'-l',('"'+(Join-Path $Stand 'postgres.log')+'"'),'-o','"-h 127.0.0.1 -p 55440"','-w')
$pgStart=Start-Process -FilePath (Join-Path $PgBin 'pg_ctl.exe') -ArgumentList $pgArgs -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $Stand 'pg-start.log') -RedirectStandardError (Join-Path $Stand 'pg-start-error.log')
if(!$pgStart.WaitForExit(30000)) { throw 'PostgreSQL startup timed out; inspect pg-start logs.' }
if($null -ne $pgStart.ExitCode -and $pgStart.ExitCode -ne 0) { throw 'PostgreSQL startup failed; inspect pg-start logs.' }
Pg 'pg_isready' @('-h','127.0.0.1','-p','55440','-U','pagination_demo','-d','postgres')
$dbExists=& (Join-Path $PgBin 'psql.exe') -X -h 127.0.0.1 -p 55440 -U pagination_demo -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='vympel_pagination_demo'"
if($dbExists -ne '1') { Pg 'createdb' @('-h','127.0.0.1','-p','55440','-U','pagination_demo','vympel_pagination_demo') }
SetDemoEnvironment
$java=if($env:JAVA_HOME) { Join-Path $env:JAVA_HOME 'bin/java.exe' } else {
  $jdk=Get-ChildItem (Join-Path $env:USERPROFILE '.jdks') -Directory -Filter '*17*' -ErrorAction SilentlyContinue | Select-Object -First 1
  if($jdk) { Join-Path $jdk.FullName 'bin/java.exe' } else { (Get-Command java).Source }
}
$jar=Join-Path $Stand 'vympel-demo.jar'
Copy-Item -LiteralPath (Join-Path $Repo 'vympel_back/build/libs/vympel.jar') -Destination $jar
$proc=Start-Process -FilePath $java -ArgumentList '-jar',('"'+$jar+'"') -WorkingDirectory $Stand -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $Stand 'backend.log') -RedirectStandardError (Join-Path $Stand 'backend-error.log')
RecordProcess 'backend' $proc
WaitHttp 'http://127.0.0.1:18080/actuator/health/readiness'
Pg 'psql' @('-X','-h','127.0.0.1','-p','55440','-U','pagination_demo','-d','vympel_pagination_demo','-f',(Join-Path $PSScriptRoot 'seed.sql'))
}
if($Rebuild -or !(Test-Path (Join-Path $Front '.next/BUILD_ID'))) {
  New-Item -ItemType Directory -Path $Front -Force | Out-Null
  & robocopy (Join-Path $Repo 'vympel_front') $Front /E /XD node_modules .next .git .cache /XF .env .env.* AGENTS.md CLAUDE.md '*.tsbuildinfo' /NFL /NDL /NJH /NJS /NP
  if($LASTEXITCODE -gt 7) { throw 'Storefront source copy failed' }
  if(!(Test-Path (Join-Path $Front 'node_modules'))) { New-Item -ItemType Junction -Path (Join-Path $Front 'node_modules') -Target (Join-Path $Repo 'vympel_front/node_modules') | Out-Null }
  # Turbopack must see both the isolated source and the existing dependency junction.
  # Only the disposable copy is configured; the repository config is untouched.
  $config=Join-Path $Front 'next.config.mjs'
  $text=Get-Content -LiteralPath $config -Raw
  $rootLiteral=ConvertTo-Json ($Repo.Replace('\','/')) -Compress
  $text=$text.Replace('output: "standalone",', ('output: "standalone", turbopack: {root: '+$rootLiteral+'},'))
  [IO.File]::WriteAllText($config,$text,[Text.UTF8Encoding]::new($false))
  Push-Location $Front
  try { $ErrorActionPreference='Continue'; & npm.cmd run build *> (Join-Path $Stand 'frontend-build.log'); $buildCode=$LASTEXITCODE; $ErrorActionPreference='Stop'; if($buildCode -ne 0) { throw "Build failed: $Stand/frontend-build.log" } } finally { $ErrorActionPreference='Stop'; Pop-Location }
}
$node=(Get-Command node).Source
$relativeFront=$Front.Substring($Repo.Length+1)
$standalone=Join-Path (Join-Path $Front '.next/standalone') $relativeFront
$server=Join-Path $standalone 'server.js'
if(!(Test-Path $server)) { throw "Standalone entry point missing: $server. Run Restart -Rebuild." }
foreach($folder in @('public','.next/static')) {
  & robocopy (Join-Path $Front $folder) (Join-Path $standalone $folder) /E /NFL /NDL /NJH /NJS /NP
  if($LASTEXITCODE -gt 7) { throw "Standalone asset copy failed: $folder" }
}
if($Action -eq 'RefreshFrontend') { StopOwned 'frontend' }
$env:PORT='3300'; $env:HOSTNAME='127.0.0.1'
$proc=Start-Process -FilePath $node -ArgumentList ('"'+$server+'"') -WorkingDirectory $standalone -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $Stand 'frontend.log') -RedirectStandardError (Join-Path $Stand 'frontend-error.log')
RecordProcess 'frontend' $proc
WaitHttp 'http://127.0.0.1:3300/en/catalog'
WaitHttp 'http://127.0.0.1:3300/en/brands/romanson?page=2'
$Front | Set-Content -LiteralPath $FrontendPathFile
'Running: http://127.0.0.1:3300/en/catalog and http://127.0.0.1:18080/actuator/health/readiness'
