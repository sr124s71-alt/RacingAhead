@echo off
rem Collects what's needed to see why the POC isn't starting, into one report.
rem Run it while the POC is (or should be) running, then send the report.
rem Your PostgreSQL password is used for the test but never written to the report.
setlocal EnableExtensions DisableDelayedExpansion
title SportSeek POC - diagnose
set "POC=%~dp0.."
for %%I in ("%POC%") do set "POC=%%~fI"
set "OUTDIR=%USERPROFILE%\SportSeek-POC"
if not exist "%OUTDIR%" mkdir "%OUTDIR%"
set "REPORT=%OUTDIR%\diagnose-report.txt"
echo Checking the SportSeek POC. This takes up to 2 minutes...
call :main > "%REPORT%" 2>&1
type "%REPORT%"
echo.
echo Report saved to %REPORT%
start "" notepad "%REPORT%"
pause
exit /b 0

:main
echo ===== SportSeek POC diagnose report  %date% %time%
echo Folder: %POC%
ver
echo.
echo ===== Code version
git -C "%POC%" log -1 --format="%%h %%s (%%ci)" 2>&1
echo.
echo ===== Tools
echo --- dotnet --list-sdks
dotnet --list-sdks 2>&1
echo --- node --version
node --version 2>&1
echo --- npm --version
call npm --version 2>&1
echo.
echo ===== Ports (open = something is listening)
for %%P in (5432 5080 8082 8081) do call :port %%P
echo.
echo ===== Web checks
call :http http://127.0.0.1:5080/api/config
call :http http://localhost:5080/api/config
call :http http://127.0.0.1:8082/
call :http http://localhost:8082/
call :http http://127.0.0.1:8081/
echo.
echo ===== Service windows
tasklist /v /fi "WINDOWTITLE eq SportSeek*" 2>&1
echo.
echo ===== Packages installed
if exist "%POC%\web-lit\node_modules" (echo web-lit: yes) else (echo web-lit: NO - npm install did not complete)
if exist "%POC%\app\node_modules" (echo app ^(Expo^): yes) else (echo app ^(Expo^): no)
echo.
echo ===== PostgreSQL settings
if exist "%OUTDIR%\postgres-settings.cmd" (
  call "%OUTDIR%\postgres-settings.cmd"
) else (
  echo No saved settings: run the SportSeek POC shortcut first.
)
if not defined PG_PORT set "PG_PORT=5432"
if defined PG_PASSWORD (echo user=%PG_USER%  port=%PG_PORT%  password: set, hidden) else (echo user=%PG_USER%  port=%PG_PORT%  password: NOT SET)
echo.
echo ===== Restart log (last lines)
if exist "%POC%\logs\restarts.log" (powershell -NoProfile -Command "Get-Content -Tail 15 '%POC%\logs\restarts.log'") else (echo none)
echo.
call :port 5080 >nul && (echo ===== API is listening on 5080: foreground test skipped & exit /b 0)
echo ===== API is NOT listening. Running it once in the foreground for up to 90 seconds:
set "ConnectionStrings__Identity=Host=localhost;Port=%PG_PORT%;Database=sportseek_identity_poc;Username=%PG_USER%;Password=%PG_PASSWORD%"
set "OUT=%TEMP%\sportseek-api-out.txt"
set "ERR=%TEMP%\sportseek-api-err.txt"
pushd "%POC%\api"
powershell -NoProfile -Command "$p = Start-Process dotnet -ArgumentList 'run','--launch-profile','http' -NoNewWindow -PassThru -RedirectStandardOutput $env:OUT -RedirectStandardError $env:ERR; if (-not $p.WaitForExit(90000)) { taskkill /PID $p.Id /T /F | Out-Null; 'API still running after 90 s (it started; stopped for the test).' } else { 'API exited with code ' + $p.ExitCode }; '--- output (last 60 lines)'; Get-Content $env:OUT -Tail 60; '--- errors (last 40 lines)'; Get-Content $env:ERR -Tail 40"
popd
exit /b 0

:port
powershell -NoProfile -Command "try { $c = New-Object Net.Sockets.TcpClient; $c.Connect('127.0.0.1', %1); $c.Close(); 'port %1: open'; exit 0 } catch { 'port %1: closed'; exit 1 }"
exit /b %errorlevel%

:http
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 5 '%~1'; '%~1 -> ' + $r.StatusCode } catch { '%~1 -> FAILED: ' + $_.Exception.Message }"
exit /b 0
