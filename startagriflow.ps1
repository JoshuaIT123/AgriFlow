<#
.SYNOPSIS
    Starts AgriFlow and verifies every link in the chain.

.DESCRIPTION
    Brings up the frontend, opens a public tunnel, and checks each dependency
    the demo actually needs: Docker, a started Polar network, a reachable LND
    node with spendable liquidity, the deployed backend, and the public URL.

    Every check prints PASS / FAIL / WARN with the reason, so a broken demo
    tells you which link failed instead of just showing a red dot.

.EXAMPLE
    .\start-agriflow.ps1
    .\start-agriflow.ps1 -SkipBuild
    .\start-agriflow.ps1 -NoTunnel
#>
[CmdletBinding()]
param(
    [string]$Root    = "C:\projects_test\bitcoin\hackhathon\AgriFlow",
    [int]   $Port    = 3001,
    [string]$Api     = "https://02-backend-api-alpha.vercel.app",
    [string]$Prefer  = "alice",
    [switch]$SkipBuild,
    [switch]$NoTunnel
)

$ErrorActionPreference = "Continue"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$script:Failures = 0
$script:Warnings = 0

function Say-Step($text) { Write-Host "`n=== $text ===" -ForegroundColor Cyan }
function Say-Pass($text) { Write-Host "  PASS  $text" -ForegroundColor Green }
function Say-Warn($text) { Write-Host "  WARN  $text" -ForegroundColor Yellow; $script:Warnings++ }
function Say-Fail($text) { Write-Host "  FAIL  $text" -ForegroundColor Red;   $script:Failures++ }
function Say-Info($text) { Write-Host "        $text" -ForegroundColor DarkGray }

function Get-Json($uri, $timeout = 20) {
    try   { return @{ ok = $true;  data = (Invoke-RestMethod -Uri $uri -TimeoutSec $timeout) } }
    catch { return @{ ok = $false; err  = $_.Exception.Message } }
}

function Use-MachinePath {
    $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
                [Environment]::GetEnvironmentVariable("Path", "User")
}

Write-Host ""
Write-Host "AgriFlow preflight" -ForegroundColor White
Write-Host "root: $Root   port: $Port" -ForegroundColor DarkGray

# ---------------------------------------------------------------- repo ----
Say-Step "Repository"
if (-not (Test-Path $Root)) { Say-Fail "Repo not found at $Root"; return }
$frontend = Join-Path $Root "01-frontend-lead"
if (-not (Test-Path $frontend)) { Say-Fail "01-frontend-lead missing"; return }
Say-Pass "repo found"
Push-Location $Root
$branch = (git rev-parse --abbrev-ref HEAD 2>$null)
$head   = (git log --oneline -1 2>$null)
Say-Info "branch $branch  |  $head"
Pop-Location

# -------------------------------------------------------------- docker ----
Say-Step "Docker"
Use-MachinePath
$dockerOk = $false
try {
    $names = docker ps --format "{{.Names}}" 2>$null
    if ($LASTEXITCODE -eq 0) {
        $dockerOk = $true
        $polar = @($names | Where-Object { $_ -like "polar-*" })
        if ($polar.Count -gt 0) {
            Say-Pass "Docker running, $($polar.Count) Polar container(s) up"
            $polar | ForEach-Object { Say-Info $_ }
        } else {
            Say-Fail "Docker is running but no polar-* containers. Start your network in Polar."
        }
    } else {
        Say-Fail "docker ps failed. Is Docker Desktop running?"
    }
} catch {
    Say-Fail "Docker not reachable: $($_.Exception.Message)"
}

# --------------------------------------------------------------- polar ----
Say-Step "Polar network"
$lndDir = $null; $restPort = $null; $nodeName = $null
$networksFile = Join-Path $env:USERPROFILE ".polar\networks\networks.json"

if (-not (Test-Path $networksFile)) {
    Say-Fail "networks.json not found at $networksFile"
} else {
    $nets = (Get-Content $networksFile -Raw | ConvertFrom-Json).networks
    # Polar writes status as a number: 1 = Started.
    $started = @($nets | Where-Object { [int]$_.status -eq 1 })
    if ($started.Count -eq 0) {
        Say-Fail "No started Polar network. Open Polar and press Start."
        $nets | ForEach-Object { Say-Info "network id=$($_.id) '$($_.name)' status=$($_.status) (3=stopped)" }
    } else {
        $net = $started | Sort-Object { [int]$_.id } -Descending | Select-Object -First 1
        Say-Pass "network id=$($net.id) '$($net.name)' is started"

        $lnds = @($net.nodes.lightning | Where-Object {
            $_.implementation -eq "LND" -and [int]$_.status -eq 1
        })
        if ($lnds.Count -eq 0) {
            Say-Fail "No started LND node in that network"
        } else {
            $node = $lnds | Where-Object { $_.name -eq $Prefer } | Select-Object -First 1
            if (-not $node) { $node = $lnds[0] }
            $nodeName = $node.name
            $restPort = $node.ports.rest
            $lndDir   = Join-Path $env:USERPROFILE ".polar\networks\$($net.id)\volumes\lnd\$nodeName"
            Say-Pass "node '$nodeName' rest=$restPort"
            Say-Info "lnddir $lndDir"

            $mac = Join-Path $lndDir "data\chain\bitcoin\regtest\admin.macaroon"
            if (Test-Path $mac) { Say-Pass "admin.macaroon present" }
            else                { Say-Fail "admin.macaroon missing at $mac" }

            $tcp = Test-NetConnection 127.0.0.1 -Port $restPort -WarningAction SilentlyContinue
            if ($tcp.TcpTestSucceeded) { Say-Pass "REST port $restPort open" }
            else                       { Say-Fail "REST port $restPort closed" }
        }
    }
}

# ----------------------------------------------------------- liquidity ----
Say-Step "Lightning liquidity"
if ($dockerOk -and $nodeName) {
    $payers = @()
    foreach ($n in @("alice","bob","carol","dave","erin")) {
        $raw = docker exec "polar-n3-$n" lncli --lnddir=/home/lnd/.lnd --network=regtest channelbalance 2>$null
        if ($LASTEXITCODE -ne 0 -or -not $raw) { continue }
        try   { $bal = $raw | ConvertFrom-Json } catch { continue }
        $local = [int64]$bal.local_balance.sat
        Say-Info ("{0,-6} local={1,-12} remote={2}" -f $n, $local, $bal.remote_balance.sat)
        if ($n -ne $nodeName -and $local -gt 10000) { $payers += $n }
    }
    if ($payers.Count -gt 0) {
        Say-Pass "can pay $nodeName from: $($payers -join ', ')"
    } else {
        Say-Warn "no other node has spendable balance - invoices will generate but cannot be paid"
        Say-Info "fix: have $nodeName pay another node first, e.g."
        Say-Info '  $ci = docker exec polar-n3-carol lncli --lnddir=/home/lnd/.lnd --network=regtest addinvoice --amt 5000000 | ConvertFrom-Json'
        Say-Info ('  docker exec polar-n3-{0} lncli --lnddir=/home/lnd/.lnd --network=regtest payinvoice --force $ci.payment_request' -f $nodeName)
    }
} else {
    Say-Warn "skipped (Docker or Polar not ready)"
}

# ----------------------------------------------------------- env.local ----
Say-Step "Frontend environment"
if ($lndDir -and $restPort) {
    $envPath = Join-Path $frontend ".env.local"
    @"
LND_DIR=$lndDir
REST_HOST=https://127.0.0.1:$restPort
NEXT_PUBLIC_API_BASE_URL=$Api
"@ | Set-Content -Encoding UTF8 $envPath
    Say-Pass ".env.local written"
    Get-Content $envPath | ForEach-Object { Say-Info $_ }
} else {
    Say-Warn ".env.local not written (no LND node detected)"
}

# ------------------------------------------------------------- backend ----
Say-Step "Backend API"
$health = Get-Json "$Api/api/health"
if ($health.ok) {
    Say-Pass "health ok ($($health.data.service))"

    $phone = "+2507" + (Get-Random -Minimum 10000000 -Maximum 99999999)
    $body  = @{ name = "Preflight Check"; phone = $phone; password = "test123456"
                role = "FARMER"; location = "Musanze" } | ConvertTo-Json
    try {
        $reg = Invoke-RestMethod -Method POST "$Api/api/auth/register" -Body $body `
                                 -ContentType "application/json" -TimeoutSec 30
        Say-Pass "register + Neon write ok"

        $hdr = @{ Authorization = "Bearer $($reg.accessToken)" }
        $lst = Invoke-RestMethod "$Api/api/products" -Headers $hdr -TimeoutSec 30
        Say-Pass "products list ok ($($lst.products.Count) rows)"

        if ($lst.products.Count -gt 0) {
            if ($lst.products[0].PSObject.Properties.Name -contains "farmer") {
                Say-Pass "products include farmer (latest backend deployed)"
            } else {
                Say-Warn "products have no farmer field - redeploy the backend (vercel --prod)"
            }
        }

        $off = Invoke-RestMethod "$Api/api/offers/received" -Headers $hdr -TimeoutSec 30
        if ($null -ne $off.offers) { Say-Pass "offers/received ok" }
        else                       { Say-Warn "offers/received returned an unexpected shape" }
    } catch {
        Say-Fail "backend auth/products failed: $($_.Exception.Message)"
    }
} else {
    Say-Fail "backend unreachable: $($health.err)"
}

# ---------------------------------------------------------------- app ----
Say-Step "Frontend app"
if (-not (Test-Path (Join-Path $frontend "node_modules"))) {
    Say-Info "installing dependencies (first run)..."
    Push-Location $frontend; npm install --no-audit --no-fund | Out-Null; Pop-Location
}

if (-not $SkipBuild) {
    Say-Info "building..."
    Push-Location $frontend
    npm run build 2>&1 | Out-Null
    $buildCode = $LASTEXITCODE
    Pop-Location
    if ($buildCode -eq 0) { Say-Pass "build succeeded" }
    else                  { Say-Fail "build failed - run 'npm run build' in $frontend to see why" }
} else {
    Say-Info "build skipped (-SkipBuild)"
}

$listening = (Test-NetConnection 127.0.0.1 -Port $Port -WarningAction SilentlyContinue).TcpTestSucceeded
if ($listening) {
    Say-Info "port $Port already in use - restarting it"
    Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique |
        ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Seconds 2
}

Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command", "cd '$frontend'; npm run start -- -p $Port"
) -WindowStyle Normal | Out-Null
Say-Info "app starting in its own window..."

$deadline = (Get-Date).AddSeconds(60)
do {
    Start-Sleep -Milliseconds 1000
    $up = (Test-NetConnection 127.0.0.1 -Port $Port -WarningAction SilentlyContinue).TcpTestSucceeded
} while (-not $up -and (Get-Date) -lt $deadline)

if ($up) { Say-Pass "listening on http://localhost:$Port" }
else     { Say-Fail "app did not come up on port $Port within 60s" }

# ----------------------------------------------------------- lightning ----
Say-Step "Lightning through the app"
if ($up) {
    $ln = Get-Json "http://localhost:$Port/api/lightning" 30
    if ($ln.ok -and $ln.data.available) {
        $n = $ln.data.node
        Say-Pass "LND reachable: alias=$($n.alias) channels=$($n.channels) balance=$($n.balance) sats"
        if ([int]$n.channels -eq 0) { Say-Warn "0 channels - invoices cannot be paid" }
    } elseif ($ln.ok) {
        Say-Fail "app cannot reach LND: $($ln.data.error)"
    } else {
        Say-Fail "/api/lightning failed: $($ln.err)"
    }
} else {
    Say-Warn "skipped (app not listening)"
}

# -------------------------------------------------------------- tunnel ----
$demoUrl = $null
if (-not $NoTunnel) {
    Say-Step "Public tunnel"
    Use-MachinePath
    $cf = Get-Command cloudflared -ErrorAction SilentlyContinue
    if (-not $cf) {
        Say-Fail "cloudflared not found. Install: winget install --id Cloudflare.cloudflared"
    } else {
        $log = Join-Path $env:TEMP "agriflow-tunnel.log"
        Remove-Item $log -ErrorAction SilentlyContinue
        Start-Process -FilePath $cf.Source `
            -ArgumentList @("tunnel", "--url", "http://127.0.0.1:$Port") `
            -RedirectStandardError $log -RedirectStandardOutput "$log.out" `
            -WindowStyle Minimized | Out-Null
        Say-Info "waiting for the tunnel URL..."

        $deadline = (Get-Date).AddSeconds(45)
        do {
            Start-Sleep -Milliseconds 1500
            if (Test-Path $log) {
                $m = Select-String -Path $log -Pattern "https://[a-z0-9-]+\.trycloudflare\.com" -ErrorAction SilentlyContinue |
                     Select-Object -First 1
                if ($m) { $demoUrl = $m.Matches[0].Value }
            }
        } while (-not $demoUrl -and (Get-Date) -lt $deadline)

        if ($demoUrl) {
            Say-Pass "tunnel up: $demoUrl"
            Start-Sleep -Seconds 4
            $pub = Get-Json "$demoUrl/api/lightning" 30
            if ($pub.ok -and $pub.data.available) { Say-Pass "public URL serves Lightning" }
            elseif ($pub.ok)                      { Say-Warn "public URL up but LND unavailable" }
            else                                  { Say-Warn "public URL not ready yet: $($pub.err)" }
        } else {
            Say-Fail "no tunnel URL after 45s (see $log)"
        }
    }
}

# ------------------------------------------------------------- summary ----
Write-Host ""
Write-Host "======================= SUMMARY =======================" -ForegroundColor White
if ($script:Failures -eq 0 -and $script:Warnings -eq 0) {
    Write-Host " ALL CHECKS PASSED" -ForegroundColor Green
} elseif ($script:Failures -eq 0) {
    Write-Host " READY, with $($script:Warnings) warning(s)" -ForegroundColor Yellow
} else {
    Write-Host " $($script:Failures) FAILURE(S), $($script:Warnings) warning(s)" -ForegroundColor Red
}
Write-Host ""
Write-Host " Local    http://localhost:$Port" -ForegroundColor Gray
if ($demoUrl) { Write-Host " Public   $demoUrl" -ForegroundColor Cyan }
Write-Host " Backend  $Api" -ForegroundColor Gray
Write-Host ""
Write-Host " Lightning only works on the local/tunnel URL - a Vercel-hosted" -ForegroundColor DarkGray
Write-Host " frontend cannot reach Polar on this machine." -ForegroundColor DarkGray
Write-Host " Keep this window, the app window and Polar open for the demo." -ForegroundColor DarkGray
Write-Host "======================================================" -ForegroundColor White
