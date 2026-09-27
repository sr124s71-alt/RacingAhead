@echo off
rem Runs one POC service and restarts it whenever it stops. Used by start-all.bat.
rem   run-forever.bat api | web | expo
setlocal EnableExtensions
set "SVC=%~1"
set "ROOT=%~dp0.."
set "LOG=%ROOT%\logs\restarts.log"
set "CMD="
if /i "%SVC%"=="api" (
  set "DIR=%ROOT%\api"
  set "CMD=dotnet run --launch-profile http"
)
if /i "%SVC%"=="web" (
  set "DIR=%ROOT%\web-lit"
  set "CMD=npm run serve"
)
if /i "%SVC%"=="expo" (
  set "DIR=%ROOT%\app"
  set "CMD=npx expo start --web --port 8081"
  set "CI=1"
)
if not defined CMD (
  echo Unknown service "%SVC%". Use api, web or expo.
  exit /b 1
)

set /a RUNS=0
:loop
set /a RUNS+=1
echo.
echo ===== %date% %time%  starting %SVC% (run %RUNS%) =====
echo %date% %time%  start %SVC% (run %RUNS%)>>"%LOG%"
pushd "%DIR%"
call %CMD%
set "CODE=%errorlevel%"
popd
echo %date% %time%  %SVC% stopped, exit code %CODE%>>"%LOG%"
echo.
echo ===== %SVC% stopped (exit code %CODE%). Restarting in 5 seconds. Close this window to stop it. =====
ping -n 6 127.0.0.1 >nul
goto :loop
