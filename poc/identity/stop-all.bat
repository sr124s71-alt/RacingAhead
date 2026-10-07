@echo off
rem Stops every service started by start-all.bat (the windows and their restart loops).
setlocal EnableExtensions DisableDelayedExpansion
echo Stopping the SportSeek Identity POC...
for %%T in ("SportSeek - Identity API" "SportSeek - Web app" "SportSeek - Expo app") do (
  taskkill /FI "WINDOWTITLE eq %%~T*" /T /F >nul 2>nul && echo   stopped %%~T
)
rem The private database (if used) is shut down cleanly before its window is closed.
set "SSPG=%USERPROFILE%\SportSeek-POC\private-postgres"
if exist "%SSPG%\data\postmaster.pid" (
  "%SSPG%\pgsql\bin\pg_ctl.exe" -D "%SSPG%\data" stop -m fast >nul 2>nul && echo   stopped the private database
)
for %%T in ("SportSeek - Database") do (
  taskkill /FI "WINDOWTITLE eq %%~T*" /T /F >nul 2>nul && echo   stopped %%~T
)
rem Anything still listening on the POC ports (for example started by hand) is stopped too.
powershell -NoProfile -Command "Get-NetTCPConnection -State Listen -LocalPort 5080,8081,8082,5440 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"
echo Done. A PostgreSQL installed on this PC is left running.
if /i not "%~1"=="/quiet" pause
