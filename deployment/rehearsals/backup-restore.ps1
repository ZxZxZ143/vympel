param(
    [string]$BackendImage = 'vympel-backend:rc-rehearsal',
    [int]$StartupTimeoutSeconds = 180
)

$ErrorActionPreference = 'Stop'
$dockerCommand = (Get-Command docker.exe -CommandType Application -ErrorAction SilentlyContinue).Source
if (-not $dockerCommand) { $dockerCommand = (Get-Command docker -CommandType Application -ErrorAction Stop).Source }
$suffix = ([guid]::NewGuid().ToString('N')).Substring(0, 12)
$prefix = "vympel-rc-backup-$suffix"
$network = "$prefix-net"
$source = "$prefix-source"
$restore = "$prefix-restore"
$backend = "$prefix-backend"
$sourceVolume = "$prefix-source-data"
$restoreVolume = "$prefix-restore-data"
$tempRoot = Join-Path ([IO.Path]::GetTempPath()) $prefix
$backupPath = Join-Path $tempRoot 'vympel-rc.dump'
$dbName = 'vympel_rc'
$dbUser = 'vympel_rc_user'
$dbPassword = "RcOnly_$([guid]::NewGuid().ToString('N'))!"
$countryCode = "RC$($suffix.Substring(0, 6).ToUpperInvariant())"
$pageKey = "rc_backup_$suffix"
$userEmail = "rc-backup-$suffix@example.invalid"
$containers = @($backend, $restore, $source)
$volumes = @($restoreVolume, $sourceVolume)

function Invoke-Docker([string[]]$Arguments) {
    $previousPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $output = @(& $dockerCommand @Arguments 2>&1 | ForEach-Object { $_.ToString() })
    $exitCode = $LASTEXITCODE
    $ErrorActionPreference = $previousPreference
    if ($exitCode -ne 0) {
        throw "docker $($Arguments[0]) failed with exit code ${exitCode}: $($output -join '; ')"
    }
    return $output
}

function Invoke-Psql([string]$Container, [string]$Sql) {
    return (Invoke-Docker -Arguments @('exec', '-e', "PGPASSWORD=$dbPassword", $Container,
        'psql', '-v', 'ON_ERROR_STOP=1', '-U', $dbUser, '-d', $dbName,
        '-P', 'pager=off', '-At', '-F', '|', '-c', $Sql)) -join "`n"
}

function Wait-Postgres([string]$Container) {
    $deadline = [DateTime]::UtcNow.AddSeconds($StartupTimeoutSeconds)
    do {
        try {
            Invoke-Docker -Arguments @('exec', $Container, 'pg_isready', '-U', $dbUser, '-d', $dbName) | Out-Null
            return
        } catch {
            Start-Sleep -Milliseconds 500
        }
    } while ([DateTime]::UtcNow -lt $deadline)
    throw "PostgreSQL container $Container did not become ready"
}

function BackendEnvironment([string]$DatabaseHost) {
    return @(
        '-e', 'SPRING_PROFILES_ACTIVE=local',
        '-e', "VYMPEL_DB_URL=jdbc:postgresql://${DatabaseHost}:5432/$dbName",
        '-e', "VYMPEL_DB_USERNAME=$dbUser",
        '-e', "VYMPEL_DB_PASSWORD=$dbPassword",
        '-e', 'VYMPEL_JWT_SECRET=RcRehearsalJwt_2026!OnlyTemporary#A7xQ2mN9pR4sT8vK6',
        '-e', 'VYMPEL_RATE_LIMIT_HMAC_SECRET=RcRehearsalLimiter_2026!OnlyTemporary#B8zW3nK6uS9qP2',
        '-e', 'VYMPEL_RATE_LIMIT_STORAGE=memory',
        '-e', 'VYMPEL_REDIS_URL=redis://127.0.0.1:6379',
        '-e', 'VYMPEL_S3_BUCKET=rc-rehearsal',
        '-e', 'VYMPEL_S3_REGION=us-east-1',
        '-e', 'VYMPEL_S3_ENDPOINT=http://127.0.0.1:9000',
        '-e', 'VYMPEL_S3_PUBLIC_ENDPOINT=http://127.0.0.1:9000',
        '-e', 'VYMPEL_S3_ACCESS_KEY=rc-only-access',
        '-e', 'VYMPEL_S3_SECRET_KEY=rc-only-secret-not-real',
        '-e', 'VYMPEL_CORS_ALLOWED_ORIGINS=http://127.0.0.1:3000',
        '-e', 'VYMPEL_CRM_REFRESH_COOKIE_SECURE=false',
        '-e', 'VYMPEL_CMS_PUBLIC_REVALIDATE_ENABLED=false',
        '-e', 'VYMPEL_CMS_REVALIDATE_REQUIRED=false',
        '-e', 'VYMPEL_BOOTSTRAP_ADMIN_ENABLED=false'
    )
}

function DatabaseSummary([string]$Container) {
    $sql = @"
SELECT
  (SELECT COUNT(*) FROM databasechangelog),
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'),
  (SELECT COUNT(*) FROM country WHERE code='$countryCode'),
  (SELECT COUNT(*) FROM country_i18n ci JOIN country c ON c.id=ci.country_id WHERE c.code='$countryCode' AND ci.lang='en'),
  (SELECT COUNT(*) FROM cms_page WHERE page_key='$pageKey' AND status='INACTIVE'),
  (SELECT COUNT(*) FROM users WHERE email='$userEmail' AND enabled=false),
  (SELECT COUNT(*) FROM pg_constraint WHERE NOT convalidated),
  (SELECT id FROM databasechangelog ORDER BY orderexecuted DESC LIMIT 1);
"@
    return Invoke-Psql $Container $sql
}

try {
    New-Item -ItemType Directory -Path $tempRoot -Force | Out-Null
    $workspace = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
    Invoke-Docker -Arguments @('build', '--pull', '--tag', $BackendImage, (Join-Path $workspace 'vympel_back')) | Out-Null
    Invoke-Docker -Arguments @('network', 'create', $network) | Out-Null
    foreach ($volume in $volumes) { Invoke-Docker -Arguments @('volume', 'create', $volume) | Out-Null }

    Invoke-Docker -Arguments @('run', '-d', '--name', $source, '--network', $network,
        '--network-alias', 'postgres-source', '-e', "POSTGRES_DB=$dbName", '-e', "POSTGRES_USER=$dbUser",
        '-e', "POSTGRES_PASSWORD=$dbPassword", '-v', "${sourceVolume}:/var/lib/postgresql/data",
        'postgres:16-alpine') | Out-Null
    Wait-Postgres $source

    $migrationArgs = @('run', '--rm', '--network', $network) + (BackendEnvironment 'postgres-source') + @(
        '-e', 'VYMPEL_MIGRATION_ONLY=true', $BackendImage, '--spring.task.scheduling.enabled=false')
    Invoke-Docker -Arguments $migrationArgs | Out-Null

    $insertSql = @"
BEGIN;
WITH inserted_country AS (
  INSERT INTO country(code, iso2, active) VALUES ('$countryCode', NULL, false) RETURNING id
)
INSERT INTO country_i18n(country_id, lang, name)
SELECT id, 'en', 'RC backup restore proof $suffix' FROM inserted_country;
INSERT INTO cms_page(page_key, title, status) VALUES ('$pageKey', 'RC backup restore proof', 'INACTIVE');
INSERT INTO users(email, password_hash, first_name, enabled)
VALUES ('$userEmail', 'NOT_A_REAL_CREDENTIAL', 'RC Backup Proof', false);
COMMIT;
"@
    Invoke-Psql $source $insertSql | Out-Null
    $sourceSummary = DatabaseSummary $source
    $postgresVersion = Invoke-Psql $source 'SHOW server_version;'

    Invoke-Docker -Arguments @('exec', '-e', "PGPASSWORD=$dbPassword", $source, 'pg_dump',
        '-U', $dbUser, '-d', $dbName, '--format=custom', '--no-owner', '--no-acl',
        '--file=/tmp/vympel-rc.dump') | Out-Null
    Invoke-Docker -Arguments @('cp', "${source}:/tmp/vympel-rc.dump", $backupPath) | Out-Null
    $backupSize = (Get-Item -LiteralPath $backupPath).Length
    $backupChecksum = (Get-FileHash -LiteralPath $backupPath -Algorithm SHA256).Hash.ToLowerInvariant()

    Invoke-Docker -Arguments @('run', '-d', '--name', $restore, '--network', $network,
        '--network-alias', 'postgres-restore', '-e', "POSTGRES_DB=$dbName", '-e', "POSTGRES_USER=$dbUser",
        '-e', "POSTGRES_PASSWORD=$dbPassword", '-v', "${restoreVolume}:/var/lib/postgresql/data",
        'postgres:16-alpine') | Out-Null
    Wait-Postgres $restore
    Invoke-Docker -Arguments @('cp', $backupPath, "${restore}:/tmp/vympel-rc.dump") | Out-Null
    Invoke-Docker -Arguments @('exec', '-e', "PGPASSWORD=$dbPassword", $restore, 'pg_restore',
        '-U', $dbUser, '-d', $dbName, '--no-owner', '--no-acl', '--exit-on-error',
        '/tmp/vympel-rc.dump') | Out-Null
    $restoreSummary = DatabaseSummary $restore
    if ($sourceSummary -ne $restoreSummary) {
        throw "Source and restored database summaries differ: source=$sourceSummary restore=$restoreSummary"
    }

    $backendArgs = @('run', '-d', '--name', $backend, '--network', $network) +
        (BackendEnvironment 'postgres-restore') + @('-e', 'SPRING_LIQUIBASE_ENABLED=true', $BackendImage)
    Invoke-Docker -Arguments $backendArgs | Out-Null
    $deadline = [DateTime]::UtcNow.AddSeconds($StartupTimeoutSeconds)
    $ready = $false
    do {
        try {
            Invoke-Docker -Arguments @('exec', $backend, 'curl', '-fsS',
                'http://127.0.0.1:8080/actuator/health/readiness') | Out-Null
            $ready = $true
            break
        } catch {
            Start-Sleep -Seconds 1
        }
    } while ([DateTime]::UtcNow -lt $deadline)
    if (-not $ready) {
        $tail = (Invoke-Docker -Arguments @('logs', '--tail', '80', $backend)) -join "`n"
        throw "Backend did not become ready against restored database: $tail"
    }
    $backendLogs = (Invoke-Docker -Arguments @('logs', $backend)) -join "`n"
    if ($backendLogs.Contains($dbPassword)) { throw 'Disposable database password appeared in backend logs' }

    Write-Output "PASS backup-restore rehearsal id=$suffix"
    Write-Output "postgres_version=$postgresVersion"
    Write-Output 'backup_command=pg_dump --format=custom --no-owner --no-acl'
    Write-Output 'backup_format=PostgreSQL custom'
    Write-Output "backup_size_bytes=$backupSize"
    Write-Output "backup_sha256=$backupChecksum"
    Write-Output "database_summary=$restoreSummary"
    Write-Output 'backend_readiness=UP'
}
finally {
    $cleanupErrorPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $existingContainers = @(docker ps -a --format '{{.Names}}' 2>$null)
    foreach ($container in $containers) {
        if ($container -notlike 'vympel-rc-backup-*') { throw "Refusing unsafe cleanup target: $container" }
        if ($existingContainers -contains $container) { docker rm -f $container 2>$null | Out-Null }
    }
    $existingVolumes = @(docker volume ls --format '{{.Name}}' 2>$null)
    foreach ($volume in $volumes) {
        if ($volume -notlike 'vympel-rc-backup-*-data') { throw "Refusing unsafe volume cleanup target: $volume" }
        if ($existingVolumes -contains $volume) { docker volume rm $volume 2>$null | Out-Null }
    }
    if ($network -notlike 'vympel-rc-backup-*-net') { throw "Refusing unsafe network cleanup target: $network" }
    $existingNetworks = @(docker network ls --format '{{.Name}}' 2>$null)
    if ($existingNetworks -contains $network) { docker network rm $network 2>$null | Out-Null }
    if ((Test-Path -LiteralPath $tempRoot) -and $tempRoot -like "*$prefix") {
        Remove-Item -LiteralPath $tempRoot -Recurse -Force
    }
    $ErrorActionPreference = $cleanupErrorPreference
}
