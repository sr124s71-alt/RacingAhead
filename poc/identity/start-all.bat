@echo off
rem ==========================================================================
rem  SportSeek Shared Identity POC - start everything, keep it running.
rem
rem    start-all.bat              start all services and open the demo
rem    start-all.bat /noexpo      skip the Expo (React Native) app
rem    start-all.bat /nobrowser   don't open the browser (used by autostart)
rem    start-all.bat /min         start the service windows minimised
rem
rem  Each service runs in its own window and restarts automatically if it
rem  stops. Close a window (or run stop-all.bat) to stop it for good.
rem ==========================================================================
setlocal EnableExtensions
title SportSeek Identity POC - launcher
set "ROOT=%~dp0"
set "NOBROWSER="
set "NOEXPO="
set "MIN="
for %%A in (%*) do (
  if /i "%%~A"=="/nobrowser" set "NOBROWSER=1"
  if /i "%%~A"=="/noexpo" set "NOEXPO=1"
  if /i "%%~A"=="/min" set "MIN=/min"
)
if not exist "%ROOT%logs" mkdir "%ROOT%logs"

echo.
echo  SportSeek Shared Identity POC
echo  -----------------------------
echo.
echo Checking prerequisites...
where dotnet >nul 2>nul || (echo [X] The .NET SDK was not found. Install the .NET 8 SDK and run this again. & goto :fail)
where node >nul 2>nul || (echo [X] Node.js was not found. Install Node.js 20 or later and run this again. & goto :fail)
echo [ok] .NET SDK and Node.js

call :portopen 5432 && goto :pgok
echo PostgreSQL is not answering on port 5432. Trying to start its Windows service...
powershell -NoProfile -Command "Get-Service -Name 'postgresql*' -ErrorAction SilentlyContinue | Where-Object Status -ne 'Running' | Start-Service -ErrorAction SilentlyContinue"
call :sleep 5
call :portopen 5432 && goto :pgok
echo [X] PostgreSQL is not running on localhost:5432.
echo     Start it from Services (services.msc), or run this file once as administrator.
goto :fail
:pgok
echo [ok] PostgreSQL

if not exist "%ROOT%web-lit\node_modules" (
  echo Installing web app packages - first run only...
  pushd "%ROOT%web-lit" & call npm install --no-audit --no-fund & popd
)
if not defined NOEXPO if not exist "%ROOT%app\node_modules" (
  echo Installing Expo app packages - first run only...
  pushd "%ROOT%app" & call npm install --no-audit --no-fund & popd
)

echo.
call :launch 5080 "SportSeek - Identity API" api
call :launch 8082 "SportSeek - Web app" web
if not defined NOEXPO call :launch 8081 "SportSeek - Expo app" expo

echo.
echo Waiting for the Identity API. The first start builds it and creates the database...
set /a TRIES=0
:waitapi
call :httpok http://127.0.0.1:5080/api/config && goto :apiup
set /a TRIES+=1
if %TRIES% geq 180 (
  echo [!] The API is not up after 3 minutes. Check the "SportSeek - Identity API" window.
  goto :summary
)
call :sleep 1
goto :waitapi
:apiup
echo [ok] Identity API is up

:summary
echo.
echo  Running (each window restarts its service if it stops):
echo    Demo stage (Lit web app)   http://localhost:8082
echo    Identity API               http://localhost:5080/api/config
if not defined NOEXPO echo    Expo app (React Native)    http://localhost:8081/?app=stage
echo.
echo  Admin demo number: +91 90000 00001
echo  Stop everything:   stop-all.bat
echo  Restart log:       %ROOT%logs\restarts.log
echo.
if not defined NOBROWSER (
  call :sleep 3
  start "" http://localhost:8082
  pause
)
exit /b 0

:fail
echo.
pause
exit /b 1

rem ---------------------------------------------------------------- helpers

:launch
rem %1 port  %2 window title  %3 service name
call :portopen %1 && (
  echo [ok] %~2 is already running on port %1
  exit /b 0
)
echo Starting %~2 on port %1...
start "%~2" %MIN% cmd /k ""%ROOT%scripts\run-forever.bat" %3"
exit /b 0

:portopen
powershell -NoProfile -Command "try { $c = New-Object Net.Sockets.TcpClient; $c.Connect('127.0.0.1', %1); $c.Close(); exit 0 } catch { exit 1 }" >nul 2>nul
exit /b %errorlevel%

:httpok
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 3 '%~1'; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>nul
exit /b %errorlevel%

:sleep
ping -n %~1 127.0.0.1 >nul
ping -n 2 127.0.0.1 >nul
exit /b 0
