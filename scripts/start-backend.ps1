param(
  [string]$BindHost = '0.0.0.0',
  [int]$Port = 8000
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$py = Join-Path $root '.tools\python-3.13.3-embed-amd64\python.exe'
if (-not (Test-Path $py)) {
  throw "Python runtime not found at $py"
}

& $py -m uvicorn backend.main:app --host $BindHost --port $Port
