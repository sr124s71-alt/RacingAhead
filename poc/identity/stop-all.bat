@echo off
rem Stops every service started by start-all.bat (the windows and their restart loops).
setlocal EnableExtensions DisableDelayedExpansion
echo Stopping the SportSeek Identity POC...
for %%T in ("SportSeek - Identity API" "SportSeek - Web app" "SportSeek - Expo app") do (
  taskkill /FI "WINDOWTITLE eq %%~T*" /T /F >nul 2>nul && echo   stopped %%~T
)
rem Anything still listening on the POC ports (for example started by hand) is stopped too.
powershell -NoProfile -Command "Get-NetTCPConnection -State Listen -LocalPort 5080,8081,8082 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"
echo Done. PostgreSQL is left running.
if /i not "%~1"=="/quiet" pause
