param(
    [int]$StartupTimeoutSeconds = 90
)

$ErrorActionPreference = 'Stop'
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
    $output = & curl.exe @Arguments
    if ($LASTEXITCODE -ne 0) { throw "curl failed with exit code $LASTEXITCODE" }
    return ($output -join "`n")
}

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

function Get-PublishedPort([string]$Container, [string]$ContainerPort) {
    $binding = Invoke-Docker -Arguments @('port', $Container, $ContainerPort)
    if (-not $binding) { throw "No published port for $Container $ContainerPort" }
    return [int](($binding | Select-Object -First 1) -split ':')[-1]
}

try {
    New-Item -ItemType Directory -Path (Join-Path $tempRoot 'tls') -Force | Out-Null
    $mockServer = @'
import http.server
import os
import time

service = os.environ["MOCK_SERVICE"]
port = int(os.environ["MOCK_PORT"])

class Handler(http.server.BaseHTTPRequestHandler):
    def handle_request(self):
        if self.path.startswith("/slow"):
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

    foreach ($definition in @(
        @{Name=$storefront; Service='storefront'; Port='3000'},
        @{Name=$crm; Service='crm'; Port='3001'},
        @{Name=$backend; Service='backend'; Port='8080'}
    )) {
        Invoke-Docker -Arguments @('run', '-d', '--name', $definition.Name, '--network', $network,
            '--network-alias', $definition.Service, '-v', "${tempRoot}/mock.py:/mock.py:ro",
            '-e', "MOCK_SERVICE=$($definition.Service)", '-e', "MOCK_PORT=$($definition.Port)",
            'python:3.13-alpine', 'python', '/mock.py') | Out-Null
    }

    $workspace = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
    Invoke-Docker -Arguments @('run', '-d', '--name', $proxy, '--network', $network,
        '-p', '127.0.0.1::80', '-p', '127.0.0.1::443', '-p', '127.0.0.1::8080',
        '-e', 'STOREFRONT_DOMAIN=shop.rehearsal.test', '-e', 'CRM_DOMAIN=crm.rehearsal.test',
        '-e', 'API_DOMAIN=api.rehearsal.test',
        '-v', "${workspace}/infrastructure/reverse-proxy/nginx.conf:/etc/nginx/nginx.conf:ro",
        '-v', "${workspace}/infrastructure/reverse-proxy/default.conf.template:/etc/nginx/templates/default.conf.template:ro",
        '-v', "${tempRoot}/tls:/etc/nginx/tls:ro", 'nginx:1.28-alpine') | Out-Null

    $httpPort = Get-PublishedPort $proxy '80/tcp'
    $httpsPort = Get-PublishedPort $proxy '443/tcp'
    $healthPort = Get-PublishedPort $proxy '8080/tcp'
    $deadline = [DateTime]::UtcNow.AddSeconds($StartupTimeoutSeconds)
    do {
        $healthCode = Invoke-Curl @('-sS', '-o', 'NUL', '-w', '%{http_code}', "http://127.0.0.1:$healthPort/healthz")
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
        @{Host='crm.rehearsal.test'; Path='/login'; Service='crm'},
        @{Host='api.rehearsal.test'; Path='/api/public/ping'; Service='backend'}
    )) {
        $headers = Join-Path $tempRoot "$($route.Service)-headers.txt"
        $body = Join-Path $tempRoot "$($route.Service)-body.txt"
        $code = Invoke-Curl @('-k', '-sS', '-D', $headers, '-o', $body, '-w', '%{http_code}', '-H', "Host: $($route.Host)", "https://127.0.0.1:$httpsPort$($route.Path)")
        Assert-Equal $code '200' "$($route.Service) routing failed"
        if (-not (Select-String -LiteralPath $body -Pattern "service=$($route.Service)" -Quiet)) { throw "$($route.Service) reached the wrong upstream" }
        foreach ($pattern in @('^Content-Security-Policy:', '^Strict-Transport-Security:', '^X-Received-Proto: https', "^X-Received-Host: $([regex]::Escape($route.Host))", '^X-Received-Port: 443', '^X-Received-For:', '^X-Received-Real-Ip:', '^X-Received-Request-Id:')) {
            if (-not (Select-String -LiteralPath $headers -Pattern $pattern -Quiet)) { throw "$($route.Service) is missing expected header $pattern" }
        }
    }

    $actuatorCode = Invoke-Curl @('-k', '-sS', '-o', 'NUL', '-w', '%{http_code}', '-H', 'Host: api.rehearsal.test', "https://127.0.0.1:$httpsPort/actuator/prometheus")
    Assert-Equal $actuatorCode '404' 'Public Actuator route was not blocked'
    $invalidCode = Invoke-Curl @('-k', '-sS', '-o', 'NUL', '-w', '%{http_code}', '-H', 'Host: invalid.rehearsal.test', "https://127.0.0.1:$httpsPort/")
    Assert-Equal $invalidCode '421' 'Invalid HTTPS host was not rejected'

    $oversize = Join-Path $tempRoot 'oversize.bin'
    [IO.File]::WriteAllBytes($oversize, [byte[]]::new(11MB))
    $uploadCode = Invoke-Curl @('-k', '-sS', '-o', 'NUL', '-w', '%{http_code}', '-H', 'Host: shop.rehearsal.test', '--data-binary', "@$oversize", "https://127.0.0.1:$httpsPort/upload")
    Assert-Equal $uploadCode '413' 'Storefront upload limit did not reject an 11 MiB body'

    $slowCode = Invoke-Curl @('-k', '-sS', '--max-time', '5', '-o', 'NUL', '-w', '%{http_code}', '-H', 'Host: api.rehearsal.test', "https://127.0.0.1:$httpsPort/slow")
    Assert-Equal $slowCode '200' 'API proxy did not permit a bounded one-second upstream response'

    Invoke-Docker -Arguments @('exec', $proxy, 'nginx', '-t') | Out-Null
    Write-Output "PASS reverse-proxy rehearsal id=$suffix"
    Write-Output 'Verified storefront, CRM, API, forwarding, client IP chain, upload limit, security headers, Actuator blocking, invalid host, redirect, TLS syntax, and bounded API response.'
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
