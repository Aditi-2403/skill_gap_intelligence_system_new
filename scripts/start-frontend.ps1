param(
  [string]$BindHost = '0.0.0.0',
  [int]$Port = 5174
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$frontend = Join-Path $root 'frontend'
Set-Location $frontend

$npm = Join-Path $root '.tools\node-v22.17.0-win-x64\npm.cmd'
if (-not (Test-Path $npm)) {
  throw "Node npm not found at $npm"
}

& $npm run dev -- --host $BindHost --port $Port
