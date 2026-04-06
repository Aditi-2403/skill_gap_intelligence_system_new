@echo off
setlocal
set ROOT=%~dp0
powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%ROOT%scripts\start-dev.ps1"
endlocal
