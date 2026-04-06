param(
  [string]$BindHost = '127.0.0.1',
  [int]$Port = 8000
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
Set-Location $root

$py = Join-Path $root '.tools\python-3.13.3-embed-amd64\python.exe'
if (-not (Test-Path $py)) {
  throw "Python runtime not found at $py"
}

Write-Output "Starting backend on http://$BindHost:$Port"
& $py -m uvicorn backend.main:app --host $BindHost --port $Port
