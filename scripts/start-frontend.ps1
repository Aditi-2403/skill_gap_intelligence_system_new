param(
  [string]$BindHost = '127.0.0.1',
  [int]$Port = 5175
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
$frontend = Join-Path $root 'frontend'
Set-Location $frontend

$npmCandidates = @(
  (Join-Path $root '.tools\node-v24.14.1-win-x64\npm.cmd'),
  (Join-Path $root '.tools\node-v22.17.0-win-x64\npm.cmd')
)
$npm = $npmCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $npm) {
  throw "Node npm runtime not found in .tools. Checked: $($npmCandidates -join ', ')"
}

if (-not (Test-Path (Join-Path $frontend 'node_modules'))) {
  Write-Output 'Installing frontend dependencies (first run)...'
  & $npm ci
}

Write-Output "Starting frontend on http://$BindHost:$Port"
& $npm run dev -- --host $BindHost --port $Port
