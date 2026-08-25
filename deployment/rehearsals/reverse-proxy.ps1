param(
    [int]$StartupTimeoutSeconds = 90
)

$ErrorActionPreference = 'Stop'
$dockerCommand = (Get-Command docker.exe -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1).Source
if (-not $dockerCommand) { $dockerCommand = (Get-Command docker -CommandType Application -ErrorAction Stop | Select-Object -First 1).Source }
$curlCommand = (Get-Command curl.exe -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1).Source
if (-not $curlCommand) { $curlCommand = (Get-Command curl -CommandType Application -ErrorAction Stop | Select-Object -First 1).Source }
$suffix = ([guid]::NewGuid().ToString('N')).Substring(0, 12)
$prefix = "vympel-rc-proxy-$suffix"
$network = "$prefix-net"
$storefront = "$prefix-storefront"
$crm = "$prefix-crm"
$backend = "$prefix-backend"
$proxy = "$prefix-nginx"
$tempRoot = Join-Path ([IO.Path]::GetTempPath()) $prefix
$containers = @($proxy, $backend, $crm, $storefront)

function Assert-Equal([string]$Actual, [string]$Expected, [string]$Message) {
    if ($Actual -ne $Expected) { throw "$Message (expected $Expected, got $Actual)" }
}

function Invoke-Curl([string[]]$Arguments) {
    $output = & $curlCommand @Arguments
    if ($LASTEXITCODE -ne 0) { throw "curl failed with exit code $LASTEXITCODE" }
    return ($output -join "`n")
}

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

function Get-PublishedPort([string]$Container, [string]$ContainerPort) {
    $binding = Invoke-Docker -Arguments @('port', $Container, $ContainerPort)
    if (-not $binding) { throw "No published port for $Container $ContainerPort" }
    return [int](($binding | Select-Object -First 1) -split ':')[-1]
}

function Get-NginxServerBlock([string]$Content, [string]$ServerNameToken) {
    $marker = "server_name $ServerNameToken;"
    $markerIndex = $Content.IndexOf($marker, [StringComparison]::Ordinal)
    if ($markerIndex -lt 0) { throw "Missing Nginx server_name marker $ServerNameToken" }
    $blockStart = $Content.LastIndexOf('server {', $markerIndex, [StringComparison]::Ordinal)
    if ($blockStart -lt 0) { throw "Missing server block for $ServerNameToken" }

    $depth = 0
    for ($index = $blockStart; $index -lt $Content.Length; $index++) {
        if ($Content[$index] -eq '{') { $depth++ }
        elseif ($Content[$index] -eq '}') {
            $depth--
            if ($depth -eq 0) {
                return $Content.Substring($blockStart, $index - $blockStart + 1)
            }
        }
    }
    throw "Unterminated server block for $ServerNameToken"
}

function Assert-VersionedRouteContract([string]$TemplatePath, [string]$BackendTarget, [string]$CrmTarget) {
    $content = Get-Content -LiteralPath $TemplatePath -Raw
    $storefrontBlock = Get-NginxServerBlock $content '${STOREFRONT_DOMAIN}'
    $crmBlock = Get-NginxServerBlock $content '${CRM_DOMAIN}'
    $apiBlock = Get-NginxServerBlock $content '${API_DOMAIN}'

    if ($storefrontBlock.Contains('/api/crm')) { throw "$TemplatePath exposes CRM API on storefront host" }
    foreach ($expected in @('location = /api/crm', $BackendTarget, $CrmTarget)) {
        if (-not $crmBlock.Contains($expected)) { throw "$TemplatePath CRM host is missing $expected" }
    }
    if (-not ($crmBlock.Contains('location ^~ /api/crm/') -or $crmBlock.Contains('location /api/crm/'))) {
        throw "$TemplatePath CRM host is missing the /api/crm/ backend location"
    }
    foreach ($expected in @('location = /api/public', 'location ^~ /api/public/', 'location ~ ^/api/auth/(login|register)/email$', $BackendTarget, 'return 404;')) {
        if (-not $apiBlock.Contains($expected)) { throw "$TemplatePath public API host is missing $expected" }
    }
    if ($apiBlock.Contains('location ^~ /api/crm/')) { throw "$TemplatePath exposes CRM API on public API host" }
}

function Assert-HostCrmHttpsContract([string]$TemplatePath) {
    $content = Get-Content -LiteralPath $TemplatePath -Raw
    foreach ($expected in @(
        'listen 443 ssl;',
        'auth_basic "Vympel CRM";',
        'auth_basic_user_file ${CRM_HTPASSWD_PATH};',
        'location ~ ^/api/crm/auth/(login|refresh|logout)$',
        'location = /api/crm',
        'location /api/crm/',
        'location ~ ^/api/crm/products/[0-9]+/images$',
        'location = /api/crm/cms/media/upload',
        'auth_basic off;',
        'proxy_pass http://127.0.0.1:8080',
        'proxy_pass http://127.0.0.1:3001',
        'ssl_certificate ${TLS_CERT_DIR}/fullchain.pem;',
        'ssl_certificate_key ${TLS_CERT_DIR}/privkey.pem;'
    )) {
        if (-not $content.Contains($expected)) { throw "$TemplatePath is missing protected CRM HTTPS policy: $expected" }
    }
}

function Wait-MockUpstream([string]$Container, [string]$Port, [DateTime]$Deadline) {
    do {
        try {
            Invoke-Docker -Arguments @('exec', $Container, 'python', '-c',
                "import urllib.request; urllib.request.urlopen('http://127.0.0.1:$Port', timeout=1).read()") | Out-Null
            return
        }
        catch {
            Start-Sleep -Milliseconds 250
        }
    } while ([DateTime]::UtcNow -lt $Deadline)
    throw "Mock upstream $Container did not become ready before the bounded deadline"
}

try {
    $workspace = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
    Assert-VersionedRouteContract `
        (Join-Path $workspace 'infrastructure/reverse-proxy/default.conf.template') `
        'proxy_pass http://vympel_backend' 'proxy_pass http://vympel_crm'
    Assert-VersionedRouteContract `
        (Join-Path $workspace 'infrastructure/reverse-proxy/single-vm-staging.conf.template') `
        'proxy_pass http://127.0.0.1:8080' 'proxy_pass http://127.0.0.1:3001'
    Assert-VersionedRouteContract `
        (Join-Path $workspace 'infrastructure/reverse-proxy/oracle-staging.conf.template') `
        'proxy_pass http://127.0.0.1:8080' 'proxy_pass http://127.0.0.1:3001'
    Assert-HostCrmHttpsContract `
        (Join-Path $workspace 'infrastructure/reverse-proxy/host-crm-https.server.template')

    New-Item -ItemType Directory -Path (Join-Path $tempRoot 'tls') -Force | Out-Null
    $mockServer = @'
import http.server
import os
import time

service = os.environ["MOCK_SERVICE"]
port = int(os.environ["MOCK_PORT"])

class Handler(http.server.BaseHTTPRequestHandler):
    def handle_request(self):
        if self.path.startswith("/slow") or self.path.startswith("/api/public/slow"):
            time.sleep(1)
        length = int(self.headers.get("content-length", "0"))
        if length:
            self.rfile.read(length)
        body = f"service={service}\npath={self.path}\n".encode()
        self.send_response(200)
        self.send_header("Content-Type", "text/plain")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Content-Security-Policy", "default-src 'self'")
        self.send_header("X-Mock-Service", service)
        for source, target in [
            ("x-forwarded-proto", "X-Received-Proto"),
            ("x-forwarded-host", "X-Received-Host"),
            ("x-forwarded-port", "X-Received-Port"),
            ("x-forwarded-for", "X-Received-For"),
            ("x-real-ip", "X-Received-Real-Ip"),
            ("x-request-id", "X-Received-Request-Id"),
        ]:
            value = self.headers.get(source)
            if value:
                self.send_header(target, value)
        authorization = self.headers.get("authorization", "")
        if authorization:
            self.send_header("X-Received-Authorization-Scheme", authorization.split(" ", 1)[0])
        self.end_headers()
        self.wfile.write(body)

    do_GET = handle_request
    do_POST = handle_request
    def log_message(self, *_):
        pass

http.server.ThreadingHTTPServer(("0.0.0.0", port), Handler).serve_forever()
'@
    Set-Content -LiteralPath (Join-Path $tempRoot 'mock.py') -Value $mockServer -Encoding utf8

    Invoke-Docker -Arguments @('network', 'create', $network) | Out-Null

    Invoke-Docker -Arguments @('run', '--rm', '-v', "${tempRoot}:/work", 'alpine/openssl',
        'req', '-x509', '-nodes', '-newkey', 'rsa:2048', '-days', '1',
        '-subj', '/CN=vympel-rehearsal.invalid', '-keyout', '/work/tls/privkey.pem',
        '-out', '/work/tls/fullchain.pem') | Out-Null
    $crmPasswordHash = (Invoke-Docker -Arguments @('run', '--rm', 'alpine/openssl',
        'passwd', '-apr1', 'rehearsal-password') | Select-Object -First 1)
    Set-Content -LiteralPath (Join-Path $tempRoot 'crm.htpasswd') -Value "rehearsal:$crmPasswordHash" -Encoding ascii

    foreach ($definition in @(
        @{Name=$storefront; Service='storefront'; Port='3000'},
        @{Name=$crm; Service='crm'; Port='3001'},
        @{Name=$backend; Service='backend'; Port='8080'}
    )) {
        Invoke-Docker -Arguments @('run', '-d', '--name', $definition.Name, '--network', $network,
            '--network-alias', $definition.Service, '-v', "${tempRoot}/mock.py:/mock.py:ro",
            '-e', "MOCK_SERVICE=$($definition.Service)", '-e', "MOCK_PORT=$($definition.Port)",
            'python:3.13-alpine', 'python', '/mock.py') | Out-Null
        Wait-MockUpstream -Container $definition.Name -Port $definition.Port -Deadline ([DateTime]::UtcNow.AddSeconds($StartupTimeoutSeconds))
    }

    Invoke-Docker -Arguments @('run', '-d', '--name', $proxy, '--network', $network,
        '-p', '127.0.0.1::80', '-p', '127.0.0.1::443', '-p', '127.0.0.1::8080',
        '-e', 'STOREFRONT_DOMAIN=shop.rehearsal.test', '-e', 'CRM_DOMAIN=crm.rehearsal.test',
        '-e', 'API_DOMAIN=api.rehearsal.test',
        '-v', "${workspace}/infrastructure/reverse-proxy/nginx.conf:/etc/nginx/nginx.conf:ro",
        '-v', "${workspace}/infrastructure/reverse-proxy/default.conf.template:/etc/nginx/templates/default.conf.template:ro",
        '-v', "${tempRoot}/tls:/etc/nginx/tls:ro",
        '-v', "${tempRoot}/crm.htpasswd:/etc/nginx/auth/crm.htpasswd:ro", 'nginx:1.28-alpine') | Out-Null

    $httpPort = Get-PublishedPort $proxy '80/tcp'
    $httpsPort = Get-PublishedPort $proxy '443/tcp'
    $healthPort = Get-PublishedPort $proxy '8080/tcp'
    $deadline = [DateTime]::UtcNow.AddSeconds($StartupTimeoutSeconds)
    $healthCode = $null
    do {
        try {
            $healthCode = Invoke-Curl @('-sS', '-o', 'NUL', '-w', '%{http_code}', "http://127.0.0.1:$healthPort/healthz")
        }
        catch {
            $healthCode = $null
        }
        if ($healthCode -eq '200') { break }
        Start-Sleep -Milliseconds 500
    } while ([DateTime]::UtcNow -lt $deadline)
    Assert-Equal $healthCode '200' 'Reverse-proxy health endpoint did not become ready'

    $httpHeaders = Join-Path $tempRoot 'http-headers.txt'
    $redirectCode = Invoke-Curl @('-sS', '-o', 'NUL', '-D', $httpHeaders, '-w', '%{http_code}', '-H', 'Host: shop.rehearsal.test', "http://127.0.0.1:$httpPort/ru")
    Assert-Equal $redirectCode '308' 'HTTP did not redirect to HTTPS'
    if (-not (Select-String -LiteralPath $httpHeaders -Pattern '^Location: https://shop\.rehearsal\.test/ru' -Quiet)) { throw 'HTTPS redirect location is incorrect' }

    foreach ($route in @(
        @{Host='shop.rehearsal.test'; Path='/ru'; Service='storefront'},
        @{Host='crm.rehearsal.test'; Path='/login'; Service='crm'; Basic=$true},
        @{Host='crm.rehearsal.test'; Path='/api/crm/auth/login'; Service='backend'; Basic=$true},
        @{Host='crm.rehearsal.test'; Path='/api/crm/products'; Service='backend'; Bearer=$true},
        @{Host='api.rehearsal.test'; Path='/api/public/ping'; Service='backend'},
        @{Host='api.rehearsal.test'; Path='/api/auth/login/email'; Service='backend'; Post=$true},
        @{Host='api.rehearsal.test'; Path='/api/auth/register/email'; Service='backend'; Post=$true}
    )) {
        $headers = Join-Path $tempRoot "$($route.Service)-headers.txt"
        $body = Join-Path $tempRoot "$($route.Service)-body.txt"
        $curlArguments = @('-k', '-sS', '-D', $headers, '-o', $body, '-w', '%{http_code}', '-H', "Host: $($route.Host)")
        if ($route.Basic) { $curlArguments += @('-u', 'rehearsal:rehearsal-password') }
        if ($route.Bearer) { $curlArguments += @('-H', 'Authorization: Bearer rehearsal-token') }
        if ($route.Post) { $curlArguments += @('-X', 'POST', '-H', 'Content-Type: application/json', '--data', '{}') }
        $curlArguments += "https://127.0.0.1:$httpsPort$($route.Path)"
        $code = Invoke-Curl $curlArguments
        Assert-Equal $code '200' "$($route.Service) routing failed"
        if (-not (Select-String -LiteralPath $body -Pattern "service=$($route.Service)" -Quiet)) { throw "$($route.Service) reached the wrong upstream" }
        foreach ($pattern in @('^Content-Security-Policy:', '^Strict-Transport-Security:', '^X-Received-Proto: https', "^X-Received-Host: $([regex]::Escape($route.Host))", '^X-Received-Port: 443', '^X-Received-For:', '^X-Received-Real-Ip:', '^X-Received-Request-Id:')) {
            if (-not (Select-String -LiteralPath $headers -Pattern $pattern -Quiet)) { throw "$($route.Service) is missing expected header $pattern" }
        }
        if ($route.Bearer -and -not (Select-String -LiteralPath $headers -Pattern '^X-Received-Authorization-Scheme: Bearer' -Quiet)) {
            throw 'CRM Bearer authorization was consumed or changed by Nginx Basic Auth'
        }
    }

    foreach ($protectedPath in @('/login', '/api/crm/auth/login', '/api/crm/auth/refresh', '/api/crm/auth/logout')) {
        $protectedCode = Invoke-Curl @('-k', '-sS', '-o', 'NUL', '-w', '%{http_code}', '-H', 'Host: crm.rehearsal.test', "https://127.0.0.1:$httpsPort$protectedPath")
        Assert-Equal $protectedCode '401' "CRM Basic Auth did not protect $protectedPath"
    }

    $actuatorCode = Invoke-Curl @('-k', '-sS', '-o', 'NUL', '-w', '%{http_code}', '-H', 'Host: api.rehearsal.test', "https://127.0.0.1:$httpsPort/actuator/prometheus")
    Assert-Equal $actuatorCode '404' 'Public Actuator route was not blocked'
    foreach ($privatePath in @('/api/crm', '/api/crm/products', '/api/admin/users', '/api/auth/login', '/v3/api-docs', '/swagger-ui/index.html')) {
        $privateCode = Invoke-Curl @('-k', '-sS', '-o', 'NUL', '-w', '%{http_code}', '-H', 'Host: api.rehearsal.test', "https://127.0.0.1:$httpsPort$privatePath")
        Assert-Equal $privateCode '404' "Public API exposed private or operational route $privatePath"
    }
    $invalidCode = Invoke-Curl @('-k', '-sS', '-o', 'NUL', '-w', '%{http_code}', '-H', 'Host: invalid.rehearsal.test', "https://127.0.0.1:$httpsPort/")
    Assert-Equal $invalidCode '421' 'Invalid HTTPS host was not rejected'

    $oversize = Join-Path $tempRoot 'oversize.bin'
    [IO.File]::WriteAllBytes($oversize, [byte[]]::new(11MB))
    $uploadCode = Invoke-Curl @('-k', '-sS', '-o', 'NUL', '-w', '%{http_code}', '-H', 'Host: shop.rehearsal.test', '--data-binary', "@$oversize", "https://127.0.0.1:$httpsPort/upload")
    Assert-Equal $uploadCode '413' 'Storefront upload limit did not reject an 11 MiB body'

    $twoMiB = Join-Path $tempRoot 'two-mib.bin'
    [IO.File]::WriteAllBytes($twoMiB, [byte[]]::new(2MB))
    $genericCrmBodyCode = Invoke-Curl @('-k', '-sS', '-o', 'NUL', '-w', '%{http_code}', '-H', 'Host: crm.rehearsal.test', '-H', 'Authorization: Bearer rehearsal-token', '--data-binary', "@$twoMiB", "https://127.0.0.1:$httpsPort/api/crm/products/42/price")
    Assert-Equal $genericCrmBodyCode '413' 'Generic CRM JSON route accepted an upload-sized body'
    $productUploadCode = Invoke-Curl @('-k', '-sS', '-o', 'NUL', '-w', '%{http_code}', '-H', 'Host: crm.rehearsal.test', '-H', 'Authorization: Bearer rehearsal-token', '--data-binary', "@$twoMiB", "https://127.0.0.1:$httpsPort/api/crm/products/42/images")
    Assert-Equal $productUploadCode '200' 'Dedicated product image route did not retain its bounded upload allowance'

    $authOversize = Join-Path $tempRoot 'auth-oversize.bin'
    [IO.File]::WriteAllBytes($authOversize, [byte[]]::new(17KB))
    $authBodyCode = Invoke-Curl @('-k', '-sS', '-o', 'NUL', '-w', '%{http_code}', '-X', 'POST', '-H', 'Host: api.rehearsal.test', '--data-binary', "@$authOversize", "https://127.0.0.1:$httpsPort/api/auth/login/email")
    Assert-Equal $authBodyCode '413' 'Customer auth endpoint accepted a body above 16 KiB'

    $telemetryLimited = $false
    for ($attempt = 0; $attempt -lt 12; $attempt++) {
        $telemetryCode = Invoke-Curl @('-k', '-sS', '-o', 'NUL', '-w', '%{http_code}', '-X', 'POST', '-H', 'Host: shop.rehearsal.test', '--data', '{}', "https://127.0.0.1:$httpsPort/api/telemetry")
        if ($telemetryCode -eq '429') { $telemetryLimited = $true; break }
    }
    if (-not $telemetryLimited) { throw 'Storefront telemetry ingress did not enforce its per-source rate limit' }

    $slowCode = Invoke-Curl @('-k', '-sS', '--max-time', '5', '-o', 'NUL', '-w', '%{http_code}', '-H', 'Host: api.rehearsal.test', "https://127.0.0.1:$httpsPort/api/public/slow")
    Assert-Equal $slowCode '200' 'API proxy did not permit a bounded one-second upstream response'

    Invoke-Docker -Arguments @('exec', $proxy, 'nginx', '-t') | Out-Null
    Write-Output "PASS reverse-proxy rehearsal id=$suffix"
    Write-Output 'Verified storefront, CRM UI and same-origin API, public API allowlist, forwarding, client IP chain, upload limit, security headers, operational-route blocking, invalid host, redirect, TLS syntax, and bounded API response.'
}
finally {
    $cleanupErrorPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $existingContainers = @(docker ps -a --format '{{.Names}}' 2>$null)
    foreach ($container in $containers) {
        if ($container -notlike 'vympel-rc-proxy-*') { throw "Refusing unsafe cleanup target: $container" }
        if ($existingContainers -contains $container) {
            docker rm -f $container 2>$null | Out-Null
        }
    }
    if ($network -notlike 'vympel-rc-proxy-*-net') { throw "Refusing unsafe network cleanup target: $network" }
    $existingNetworks = @(docker network ls --format '{{.Name}}' 2>$null)
    if ($existingNetworks -contains $network) {
        docker network rm $network 2>$null | Out-Null
    }
    if ((Test-Path -LiteralPath $tempRoot) -and $tempRoot -like "*$prefix") {
        Remove-Item -LiteralPath $tempRoot -Recurse -Force
    }
    $ErrorActionPreference = $cleanupErrorPreference
}
