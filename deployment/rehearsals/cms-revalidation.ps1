param(
    [string]$BackendImage = 'vympel-backend:rc-rehearsal',
    [string]$StorefrontImage = 'vympel-storefront:rc-rehearsal',
    [int]$StartupTimeoutSeconds = 240
)

$ErrorActionPreference = 'Stop'
$suffix = ([guid]::NewGuid().ToString('N')).Substring(0, 12)
$prefix = "vympel-rc-cms-$suffix"
$network = "$prefix-net"
$postgres = "$prefix-postgres"
$backend = "$prefix-backend"
$storefront = "$prefix-storefront"
$gateway = "$prefix-gateway"
$volume = "$prefix-postgres-data"
$dbName = 'vympel_rc'
$dbUser = 'vympel_rc_user'
$dbPassword = "RcDb_$([guid]::NewGuid().ToString('N'))!"
$adminEmail = "rc-cms-$suffix@example.invalid"
$adminPassword = "RcCmsOnly_$([guid]::NewGuid().ToString('N'))!Aa7#"
$hmacSecret = "RcCmsHmac_$([guid]::NewGuid().ToString('N'))!B9#"
$jwtSecret = "RcCmsJwt_$([guid]::NewGuid().ToString('N'))!C8#"
$rateSecret = "RcCmsRate_$([guid]::NewGuid().ToString('N'))!D7#"
$titleOne = "RC CMS published $suffix"
$titleTwo = "RC CMS retried $suffix"
$titleThree = "RC CMS timeout $suffix"
$blockIds = [System.Collections.Generic.List[long]]::new()
$containers = @($backend, $gateway, $storefront, $postgres)

function Invoke-Docker([string[]]$Arguments) {
    $previousPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $output = @(& docker.exe @Arguments 2>&1 | ForEach-Object { $_.ToString() })
    $exitCode = $LASTEXITCODE
    $ErrorActionPreference = $previousPreference
    if ($exitCode -ne 0) {
        throw "docker $($Arguments[0]) failed with exit code ${exitCode}: $($output -join '; ')"
    }
    return $output
}

function Wait-Postgres {
    $deadline = [DateTime]::UtcNow.AddSeconds($StartupTimeoutSeconds)
    do {
        try {
            Invoke-Docker @('exec', $postgres, 'pg_isready', '-U', $dbUser, '-d', $dbName) | Out-Null
            return
        } catch { Start-Sleep -Milliseconds 500 }
    } while ([DateTime]::UtcNow -lt $deadline)
    throw 'Disposable PostgreSQL did not become ready'
}

function Get-PublishedPort([string]$Container, [string]$ContainerPort) {
    $line = (Invoke-Docker @('port', $Container, $ContainerPort) | Where-Object { $_ -match '^127\.0\.0\.1:' } | Select-Object -First 1)
    if (-not $line) { throw "No loopback port mapping found for $Container $ContainerPort" }
    return [int](($line -split ':')[-1])
}

function Wait-Http([string]$Url, [string]$Label) {
    $deadline = [DateTime]::UtcNow.AddSeconds($StartupTimeoutSeconds)
    do {
        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 5
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) { return $response }
        } catch { Start-Sleep -Seconds 1 }
    } while ([DateTime]::UtcNow -lt $deadline)
    throw "$Label did not become ready at $Url"
}

function Invoke-Psql([string]$Sql) {
    return (Invoke-Docker @('exec', '-e', "PGPASSWORD=$dbPassword", $postgres, 'psql',
        '-v', 'ON_ERROR_STOP=1', '-U', $dbUser, '-d', $dbName, '-At', '-F', '|', '-c', $Sql)) -join "`n"
}

function New-BlockBody([string]$BlockKey, [string]$Title, [int]$SortOrder) {
    return @{
        pageKey = 'home'
        blockKey = $BlockKey
        blockType = 'HERO_SLIDER'
        sortOrder = $SortOrder
        status = 'DRAFT'
        settingsJson = $null
        mediaId = 1
        mediaKzId = $null
        mediaEnId = $null
        mobileMediaId = $null
        mobileMediaKzId = $null
        mobileMediaEnId = $null
        linkType = 'NONE'
        linkTarget = $null
        linkOpenBehavior = 'SAME_TAB'
        translations = @{
            ru = @{ title = $Title; subtitle = $null; description = $null; buttonText = $null; altText = $Title; extraJson = $null }
            kk = @{ title = $Title; subtitle = $null; description = $null; buttonText = $null; altText = $Title; extraJson = $null }
            en = @{ title = $Title; subtitle = $null; description = $null; buttonText = $null; altText = $Title; extraJson = $null }
        }
    } | ConvertTo-Json -Depth 8 -Compress
}

function Invoke-Crm([string]$Method, [string]$Path, [string]$Body = $null) {
    $parameters = @{
        Uri = "$script:backendUrl$Path"
        Method = $Method
        Headers = @{ Authorization = "Bearer $script:accessToken"; 'X-Request-Id' = "rc-$suffix" }
        TimeoutSec = 15
    }
    if ($null -ne $Body) {
        $parameters.ContentType = 'application/json'
        $parameters.Body = $Body
    }
    return Invoke-RestMethod @parameters
}

function Wait-QueueSucceeded([int]$MinimumAttempts) {
    $deadline = [DateTime]::UtcNow.AddSeconds(45)
    do {
        $state = Invoke-Psql "SELECT status || '|' || attempt_count FROM cms_revalidation_job WHERE page_key='home';"
        if ($state -match '^SUCCEEDED\|(\d+)$' -and [int]$Matches[1] -ge $MinimumAttempts) { return $state }
        Start-Sleep -Milliseconds 500
    } while ([DateTime]::UtcNow -lt $deadline)
    throw "CMS revalidation queue did not complete; last state=$state"
}

function Get-HomeHtml {
    return (Invoke-WebRequest -UseBasicParsing -Uri "$script:storefrontUrl/ru" -TimeoutSec 15).Content
}

try {
    $workspace = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
    $gatewaySource = (Resolve-Path (Join-Path $PSScriptRoot 'cms-revalidation-gateway.mjs')).Path

    Invoke-Docker @('build', '--pull', '--tag', $BackendImage, (Join-Path $workspace 'vympel_back')) | Out-Null
    Invoke-Docker @('build', '--pull', '--tag', $StorefrontImage,
        '--build-arg', 'BASE_API_PUBLIC=http://backend:8080/api/public',
        '--build-arg', 'NEXT_PUBLIC_BASE_API_PUBLIC=http://backend:8080/api/public',
        '--build-arg', 'NEXT_PUBLIC_MEDIA_ORIGINS=http://storefront-app:3000',
        '--build-arg', 'NEXT_PUBLIC_SITE_URL=http://storefront-app:3000',
        '--build-arg', 'NEXT_PUBLIC_APP_ENV=production',
        '--build-arg', "NEXT_PUBLIC_APP_RELEASE=rc-cms-$suffix",
        (Join-Path $workspace 'vympel_front')) | Out-Null

    Invoke-Docker @('network', 'create', $network) | Out-Null
    Invoke-Docker @('volume', 'create', $volume) | Out-Null
    Invoke-Docker @('run', '-d', '--name', $postgres, '--network', $network, '--network-alias', 'postgres',
        '-e', "POSTGRES_DB=$dbName", '-e', "POSTGRES_USER=$dbUser", '-e', "POSTGRES_PASSWORD=$dbPassword",
        '-v', "${volume}:/var/lib/postgresql/data", 'postgres:16-alpine') | Out-Null
    Wait-Postgres

    Invoke-Docker @('run', '-d', '--name', $storefront, '--network', $network, '--network-alias', 'storefront-app',
        '-p', '127.0.0.1::3000', '-e', 'BASE_API_PUBLIC=http://backend:8080/api/public',
        '-e', 'NEXT_PUBLIC_SITE_URL=http://storefront-app:3000', '-e', "CMS_REVALIDATE_SECRET=$hmacSecret",
        $StorefrontImage) | Out-Null

    Invoke-Docker @('run', '-d', '--name', $gateway, '--network', $network, '--network-alias', 'revalidation-target',
        '-v', "${gatewaySource}:/gateway.mjs:ro", '-e', 'REHEARSAL_TARGET_URL=http://storefront-app:3000/api/revalidate',
        'node:22-alpine', 'node', '/gateway.mjs') | Out-Null

    $backendEnvironment = @(
        '-e', 'SPRING_PROFILES_ACTIVE=local', '-e', "VYMPEL_DB_URL=jdbc:postgresql://postgres:5432/$dbName",
        '-e', "VYMPEL_DB_USERNAME=$dbUser", '-e', "VYMPEL_DB_PASSWORD=$dbPassword",
        '-e', "VYMPEL_JWT_SECRET=$jwtSecret", '-e', "VYMPEL_RATE_LIMIT_HMAC_SECRET=$rateSecret",
        '-e', 'VYMPEL_RATE_LIMIT_STORAGE=memory', '-e', 'VYMPEL_REDIS_URL=redis://127.0.0.1:6379',
        '-e', 'VYMPEL_S3_BUCKET=rc-cms', '-e', 'VYMPEL_S3_REGION=us-east-1',
        '-e', 'VYMPEL_S3_ENDPOINT=http://127.0.0.1:9000', '-e', 'VYMPEL_S3_PUBLIC_ENDPOINT=http://127.0.0.1:9000',
        '-e', 'VYMPEL_S3_ACCESS_KEY=rc-only-access', '-e', 'VYMPEL_S3_SECRET_KEY=rc-only-secret-not-real',
        '-e', 'VYMPEL_CORS_ALLOWED_ORIGINS=http://127.0.0.1:3000', '-e', 'VYMPEL_CRM_REFRESH_COOKIE_SECURE=false',
        '-e', 'VYMPEL_CMS_PUBLIC_REVALIDATE_ENABLED=true', '-e', 'VYMPEL_CMS_REVALIDATE_REQUIRED=true',
        '-e', 'VYMPEL_CMS_PUBLIC_REVALIDATE_URL=http://revalidation-target:3000/api/revalidate',
        '-e', "VYMPEL_CMS_REVALIDATE_SECRET=$hmacSecret", '-e', 'VYMPEL_CMS_PUBLIC_REVALIDATE_TIMEOUT_MS=500',
        '-e', 'VYMPEL_CMS_PUBLIC_REVALIDATE_RETRY_BASE_DELAY=1s', '-e', 'VYMPEL_CMS_PUBLIC_REVALIDATE_RETRY_MAX_DELAY=1s',
        '-e', 'VYMPEL_CMS_PUBLIC_REVALIDATE_RETRY_POLL_MS=500', '-e', 'VYMPEL_CMS_PUBLIC_REVALIDATE_MAX_ATTEMPTS=8',
        '-e', 'VYMPEL_CMS_MEDIA_CLEANUP_ENABLED=false', '-e', 'VYMPEL_BOOTSTRAP_ADMIN_ENABLED=true',
        '-e', "VYMPEL_BOOTSTRAP_ADMIN_EMAIL=$adminEmail", '-e', "VYMPEL_BOOTSTRAP_ADMIN_PASSWORD=$adminPassword",
        '-e', 'VYMPEL_BOOTSTRAP_ADMIN_NAME=RC CMS Admin'
    )
    Invoke-Docker (@('run', '-d', '--name', $backend, '--network', $network, '--network-alias', 'backend',
        '-p', '127.0.0.1::8080') + $backendEnvironment + @($BackendImage)) | Out-Null

    $backendPort = Get-PublishedPort $backend '8080/tcp'
    $storefrontPort = Get-PublishedPort $storefront '3000/tcp'
    $script:backendUrl = "http://127.0.0.1:$backendPort"
    $script:storefrontUrl = "http://127.0.0.1:$storefrontPort"
    Wait-Http "$script:backendUrl/actuator/health/readiness" 'backend' | Out-Null
    Wait-Http "$script:storefrontUrl/ru" 'storefront' | Out-Null

    $loginBody = @{ email = $adminEmail; password = $adminPassword } | ConvertTo-Json -Compress
    $login = Invoke-RestMethod -Uri "$script:backendUrl/api/crm/auth/login" -Method Post -ContentType 'application/json' -Body $loginBody -TimeoutSec 15
    $script:accessToken = $login.accessToken
    if (-not $script:accessToken) { throw 'ADMIN login did not return an access token' }

    $initialHtml = Get-HomeHtml
    $first = Invoke-Crm Post '/api/crm/cms/blocks' (New-BlockBody "rc.cms.$suffix.1" $titleOne 900000)
    $blockIds.Add([long]$first.id)
    $publishOne = Invoke-Crm Patch "/api/crm/cms/blocks/$($first.id)/publish"
    if ($publishOne.publicCacheRefresh.status -ne 'SUCCESS') { throw "Initial publish was not revalidated: $($publishOne.publicCacheRefresh.status)" }
    $freshOne = Get-HomeHtml
    if ($initialHtml.Contains($titleOne) -or -not $freshOne.Contains($titleOne)) { throw 'First published title freshness was not proven through storefront HTML' }

    $second = Invoke-Crm Post '/api/crm/cms/blocks' (New-BlockBody "rc.cms.$suffix.2" $titleTwo 900001)
    $blockIds.Add([long]$second.id)
    Invoke-Docker @('pause', $storefront) | Out-Null
    $publishTwo = Invoke-Crm Patch "/api/crm/cms/blocks/$($second.id)/publish"
    if ($publishTwo.publicCacheRefresh.status -ne 'FAILED_RETRY_SCHEDULED') { throw "Unavailable storefront did not schedule retry: $($publishTwo.publicCacheRefresh.status)" }
    $retryState = Invoke-Psql "SELECT status || '|' || attempt_count FROM cms_revalidation_job WHERE page_key='home';"
    if ($retryState -notmatch '^RETRY\|\d+$') { throw "Retry state was not recorded: $retryState" }
    Invoke-Docker @('unpause', $storefront) | Out-Null
    Wait-Http "$script:storefrontUrl/ru" 'resumed storefront' | Out-Null
    $retryComplete = Wait-QueueSucceeded 2
    $freshTwo = Get-HomeHtml
    if (-not $freshTwo.Contains($titleTwo)) { throw 'Retried publish was not fresh in storefront HTML' }

    $timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    $invalidPayload = @{ version = '1'; timestamp = $timestamp; requestId = [guid]::NewGuid().ToString(); pageKey = 'home' } | ConvertTo-Json -Compress
    $invalidStatus = 0
    try {
        Invoke-WebRequest -UseBasicParsing -Uri "$script:storefrontUrl/api/revalidate" -Method Post -ContentType 'application/json' -Headers @{ 'X-CMS-Signature' = ('0' * 64) } -Body $invalidPayload -TimeoutSec 10 | Out-Null
    } catch { $invalidStatus = [int]$_.Exception.Response.StatusCode }
    if ($invalidStatus -ne 401) { throw "Invalid HMAC returned $invalidStatus instead of 401" }

    $third = Invoke-Crm Post '/api/crm/cms/blocks' (New-BlockBody "rc.cms.$suffix.3" $titleThree 900002)
    $blockIds.Add([long]$third.id)
    Invoke-Docker @('exec', $gateway, 'touch', '/tmp/vympel-revalidation-delay') | Out-Null
    $timer = [Diagnostics.Stopwatch]::StartNew()
    $publishThree = Invoke-Crm Patch "/api/crm/cms/blocks/$($third.id)/publish"
    $timer.Stop()
    if ($publishThree.publicCacheRefresh.status -ne 'FAILED_RETRY_SCHEDULED') { throw "Timeout did not schedule retry: $($publishThree.publicCacheRefresh.status)" }
    if ($timer.Elapsed.TotalSeconds -ge 3) { throw "Bounded request exceeded 3 seconds: $($timer.Elapsed.TotalSeconds)" }
    Invoke-Docker @('exec', $gateway, 'rm', '-f', '/tmp/vympel-revalidation-delay') | Out-Null
    $timeoutComplete = Wait-QueueSucceeded 2
    if (-not (Get-HomeHtml).Contains($titleThree)) { throw 'Timeout retry did not refresh public content' }

    foreach ($blockId in $blockIds) { Invoke-Crm Delete "/api/crm/cms/blocks/$blockId" | Out-Null }
    Wait-QueueSucceeded 1 | Out-Null
    $cleanupCounts = Invoke-Psql "SELECT (SELECT COUNT(*) FROM cms_block WHERE block_key LIKE 'rc.cms.$suffix.%') || '|' || (SELECT COUNT(*) FROM cms_media WHERE original_filename LIKE 'rc.cms.$suffix.%');"
    if ($cleanupCounts -ne '0|0') { throw "Disposable CMS cleanup failed: $cleanupCounts" }
    Invoke-Psql "DELETE FROM cms_revalidation_job WHERE page_key='home';" | Out-Null

    $storefrontHtml = Get-HomeHtml
    if ($storefrontHtml.Contains($hmacSecret)) { throw 'CMS HMAC secret appeared in rendered HTML' }
    $staticSecretName = (Invoke-Docker @('exec', $storefront, 'sh', '-c', 'if grep -R -F "CMS_REVALIDATE_SECRET" .next/static >/dev/null; then exit 7; fi')) -join ''

    $backendLogs = (Invoke-Docker @('logs', $backend)) -join "`n"
    $storefrontLogs = (Invoke-Docker @('logs', $storefront)) -join "`n"
    foreach ($secret in @($hmacSecret, $adminPassword, $dbPassword, $jwtSecret, $rateSecret, $script:accessToken)) {
        if ($backendLogs.Contains($secret) -or $storefrontLogs.Contains($secret)) { throw 'A disposable secret appeared in application logs' }
    }

    Write-Output "PASS cms-revalidation integration id=$suffix"
    Write-Output 'initial_publish=SUCCESS'
    Write-Output "unavailable_publish=$($publishTwo.publicCacheRefresh.status)"
    Write-Output "retry_completion=$retryComplete"
    Write-Output 'public_content_after_retry=FRESH'
    Write-Output 'invalid_hmac_status=401'
    Write-Output "timeout_publish=$($publishThree.publicCacheRefresh.status)"
    Write-Output "timeout_elapsed_ms=$([math]::Round($timer.Elapsed.TotalMilliseconds))"
    Write-Output "timeout_retry_completion=$timeoutComplete"
    Write-Output 'secret_exposure=NONE'
    Write-Output 'disposable_cms_cleanup=COMPLETE'
}
finally {
    $cleanupErrorPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $existingContainers = @(docker ps -a --format '{{.Names}}' 2>$null)
    foreach ($container in $containers) {
        if ($container -notlike 'vympel-rc-cms-*') { throw "Refusing unsafe cleanup target: $container" }
        if ($existingContainers -contains $container) { docker rm -f $container 2>$null | Out-Null }
    }
    $existingVolumes = @(docker volume ls --format '{{.Name}}' 2>$null)
    if ($volume -notlike 'vympel-rc-cms-*-postgres-data') { throw "Refusing unsafe volume cleanup target: $volume" }
    if ($existingVolumes -contains $volume) { docker volume rm $volume 2>$null | Out-Null }
    $existingNetworks = @(docker network ls --format '{{.Name}}' 2>$null)
    if ($network -notlike 'vympel-rc-cms-*-net') { throw "Refusing unsafe network cleanup target: $network" }
    if ($existingNetworks -contains $network) { docker network rm $network 2>$null | Out-Null }
    $ErrorActionPreference = $cleanupErrorPreference
}
