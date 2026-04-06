param(
  [string]$BackendHost = '127.0.0.1',
  [int]$BackendPort = 8000,
  [string]$FrontendHost = '127.0.0.1',
  [int]$FrontendPort = 5175
)

$ErrorActionPreference = 'Stop'
$scriptDir = if ($PSScriptRoot) {
  $PSScriptRoot
} elseif ($MyInvocation.MyCommand.Path) {
  Split-Path -Parent $MyInvocation.MyCommand.Path
} else {
  (Get-Location).Path
}
$root = Split-Path -Parent $scriptDir

function Get-PortOwnerPid {
  param([int]$Port)
  $line = netstat -ano | Select-String -Pattern ":$Port\s" | Select-Object -First 1
  if (-not $line) {
    return $null
  }
  $parts = ($line.ToString() -replace '\s+', ' ').Trim().Split(' ')
  if ($parts.Length -lt 5) {
    return $null
  }
  return [int]$parts[-1]
}

function Wait-HttpReady {
  param(
    [string]$Url,
    [int]$TimeoutSeconds = 40
  )
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      $resp = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 3
      if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500) {
        return $true
      }
    } catch {}
    Start-Sleep -Milliseconds 900
  }
  return $false
}

$backendPid = Get-PortOwnerPid -Port $BackendPort
if ($backendPid) {
  Write-Output "Backend already running on port $BackendPort (PID $backendPid)."
} else {
  $py = Join-Path $root '.tools\python-3.13.3-embed-amd64\python.exe'
  if (-not (Test-Path $py)) {
    throw "Python runtime not found at $py"
  }
  Start-Process -FilePath $py -ArgumentList @('-m', 'uvicorn', 'backend.main:app', '--host', $BackendHost, '--port', "$BackendPort") -WorkingDirectory $root | Out-Null
  Write-Output "Started backend process on http://${BackendHost}:$BackendPort"
}

$frontendPid = Get-PortOwnerPid -Port $FrontendPort
if ($frontendPid) {
  Write-Output "Frontend already running on port $FrontendPort (PID $frontendPid)."
} else {
  $frontendDir = Join-Path $root 'frontend'
  $npmCandidates = @(
    (Join-Path $root '.tools\node-v24.14.1-win-x64\npm.cmd'),
    (Join-Path $root '.tools\node-v22.17.0-win-x64\npm.cmd')
  )
  $npm = $npmCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
  if (-not $npm) {
    throw "Node npm runtime not found in .tools. Checked: $($npmCandidates -join ', ')"
  }

  if (-not (Test-Path (Join-Path $frontendDir 'node_modules'))) {
    Write-Output 'Installing frontend dependencies (first run)...'
    Push-Location $frontendDir
    try {
      & $npm ci
    } finally {
      Pop-Location
    }
  }

  Start-Process -FilePath $npm -ArgumentList @('run', 'dev', '--', '--host', $FrontendHost, '--port', "$FrontendPort") -WorkingDirectory $frontendDir | Out-Null
  Write-Output "Started frontend process on http://${FrontendHost}:$FrontendPort"
}

$backendOk = Wait-HttpReady -Url "http://${BackendHost}:$BackendPort/health" -TimeoutSeconds 45
$frontendOk = Wait-HttpReady -Url "http://${FrontendHost}:$FrontendPort" -TimeoutSeconds 45

Write-Output ''
if ($backendOk -and $frontendOk) {
  Write-Output 'SkillSync is up and running.'
  Write-Output "Frontend: http://${FrontendHost}:$FrontendPort"
  Write-Output "Backend : http://${BackendHost}:$BackendPort"
  Write-Output "Health  : http://${BackendHost}:$BackendPort/health"
} else {
  Write-Output 'Startup finished with warnings.'
  if (-not $backendOk) { Write-Output "- Backend health check failed on http://${BackendHost}:$BackendPort/health" }
  if (-not $frontendOk) { Write-Output "- Frontend check failed on http://${FrontendHost}:$FrontendPort" }
}
