$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

$backendCmd = "Set-Location '$root'; & '$root\scripts\start-backend.ps1'"
$frontendCmd = "Set-Location '$root'; & '$root\scripts\start-frontend.ps1'"

Start-Process powershell -ArgumentList @('-NoExit','-ExecutionPolicy','Bypass','-Command',$backendCmd)
Start-Process powershell -ArgumentList @('-NoExit','-ExecutionPolicy','Bypass','-Command',$frontendCmd)

Write-Output 'Started backend and frontend in two new PowerShell windows.'
Write-Output 'Backend:  http://127.0.0.1:8000'
Write-Output 'Frontend: http://127.0.0.1:5174'
