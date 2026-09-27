@echo off
rem ==========================================================================
rem  SportSeek Shared Identity POC - desktop launcher
rem
rem  Set up with one command (see README) that clones the repo and puts a shortcut to this
rem  file on your desktop, or copy this file to your desktop. Double-click it. It:
rem    1. clones the POC from GitHub the first time (needs Git and access to the repo)
rem    2. updates it to the latest version from GitHub every time after that
rem    3. asks for your PostgreSQL user and password once, and remembers them for you only
rem    4. runs start-all.bat from the downloaded copy
rem
rem    SportSeek-POC.bat            update and start
rem    SportSeek-POC.bat /config    stop, enter your PostgreSQL details again, then start
rem    SportSeek-POC.bat /stop      stop everything
rem    Other options (/noexpo /nobrowser /min) are passed on to start-all.bat.
rem
rem  The downloaded copy (%USERPROFILE%\SportSeek-POC) is managed by this launcher:
rem  local edits there are replaced by the GitHub version on the next update.
rem ==========================================================================
rem Run from a temporary copy: the update below can replace this very file, and cmd reads a
rem batch file while it runs.
if /i "%~1"=="/fromcopy" goto :fromcopy
copy /y "%~f0" "%TEMP%\SportSeek-POC-launcher.bat" >nul 2>nul || goto :main
"%TEMP%\SportSeek-POC-launcher.bat" /fromcopy %*
:fromcopy
shift
:main
setlocal EnableExtensions DisableDelayedExpansion
title SportSeek Identity POC

rem ---- Settings shared by everyone (change BRANCH to main once the POC is merged)
set "REPO=https://github.com/sr124s71-alt/RacingAhead.git"
set "BRANCH=claude/busy-hopper-sbfu76"
set "HOME_DIR=%USERPROFILE%\SportSeek-POC"
set "CHECKOUT=%HOME_DIR%\RacingAhead"
set "POC=%CHECKOUT%\poc\identity"
set "SETTINGS=%HOME_DIR%\postgres-settings.cmd"

set "MODE=start"
set "PASS_ON="
:args
if "%~1"=="" goto :argsdone
if /i "%~1"=="/config" (set "MODE=config") else if /i "%~1"=="/stop" (set "MODE=stop") else set "PASS_ON=%PASS_ON% %~1"
shift
goto :args
:argsdone

echo.
echo  SportSeek Shared Identity POC
echo  -----------------------------

if /i not "%MODE%"=="stop" goto :notstop
if exist "%POC%\stop-all.bat" (call "%POC%\stop-all.bat") else (echo Nothing to stop: the POC has not been downloaded yet.)
exit /b 0
:notstop

where git >nul 2>nul && goto :gitok
echo [X] Git is not installed. Install it from https://git-scm.com/download/win
echo     or run:  winget install --id Git.Git -e
echo     then double-click this file again.
goto :fail
:gitok

if not exist "%HOME_DIR%" mkdir "%HOME_DIR%"

rem ---- 1. Get or update the code from GitHub
if exist "%CHECKOUT%\.git" goto :update
echo Downloading the POC from GitHub - first run only...
git clone --branch "%BRANCH%" --single-branch "%REPO%" "%CHECKOUT%" && goto :codeready
echo [X] Could not download from GitHub. Check your internet connection and that your
echo     GitHub account has access to %REPO%
goto :fail

:update
echo Updating to the latest version from GitHub...
git -C "%CHECKOUT%" fetch --quiet origin "%BRANCH%" || goto :offline
git -C "%CHECKOUT%" checkout --quiet -B "%BRANCH%" "origin/%BRANCH%" || goto :offline
git -C "%CHECKOUT%" reset --quiet --hard "origin/%BRANCH%" || goto :offline
echo [ok] Up to date with %BRANCH%
goto :codeready
:offline
echo [!] Could not update from GitHub. Starting the copy you already have.

:codeready
for /f "delims=" %%C in ('git -C "%CHECKOUT%" log -1 "--format=%%h %%s"') do echo     Version: %%C
if exist "%POC%\start-all.bat" goto :haspoc
echo [X] %POC%\start-all.bat was not found. Check BRANCH at the top of this file.
goto :fail
:haspoc

rem ---- 2. Your PostgreSQL details (kept in your user profile, never in git)
if /i not "%MODE%"=="config" goto :notconfig
rem Services already running keep the old password until they are restarted, so stop them first.
if exist "%POC%\stop-all.bat" call "%POC%\stop-all.bat" /quiet
if exist "%SETTINGS%" del "%SETTINGS%"
:notconfig
if not exist "%SETTINGS%" goto :asksettings
call "%SETTINGS%"
if defined PG_PASSWORD goto :havesettings
echo.
echo [!] Your saved PostgreSQL password is empty. Please enter it again.
del "%SETTINGS%"
:asksettings
echo.
echo Your PostgreSQL details are needed once. They are saved only for you, in
echo   %SETTINGS%
echo The password is the one you chose when you installed PostgreSQL (for the user "postgres").
set "PG_USER="
set "PG_PASSWORD="
set "PG_PORT="
set /p "PG_USER=PostgreSQL user [postgres]: "
:askpassword
set /p "PG_PASSWORD=PostgreSQL password: "
if defined PG_PASSWORD goto :passwordok
echo [!] The password can't be empty: PostgreSQL on Windows always has one. Type it and press Enter.
goto :askpassword
:passwordok
set /p "PG_PORT=PostgreSQL port [5432]: "
if not defined PG_USER set "PG_USER=postgres"
if not defined PG_PORT set "PG_PORT=5432"
rem PowerShell writes the file so any character in the password survives (% is doubled for cmd).
powershell -NoProfile -Command "function E($v) { $v -replace '%%','%%%%' }; $q = [char]34; $lines = @('@rem SportSeek POC PostgreSQL settings for ' + $env:USERNAME + '. Run the launcher with /config to change them.', ('set ' + $q + 'PG_USER=' + (E $env:PG_USER) + $q), ('set ' + $q + 'PG_PASSWORD=' + (E $env:PG_PASSWORD) + $q), ('set ' + $q + 'PG_PORT=' + (E $env:PG_PORT) + $q)); Set-Content -Path $env:SETTINGS -Value $lines -Encoding ASCII" || (echo [X] Could not save %SETTINGS% & goto :fail)
echo [ok] Saved.
call "%SETTINGS%"
:havesettings
if not defined PG_PORT set "PG_PORT=5432"

rem The API reads this ahead of appsettings.json, so nobody has to edit files that come from git.
set "ConnectionStrings__Identity=Host=localhost;Port=%PG_PORT%;Database=sportseek_identity_poc;Username=%PG_USER%;Password=%PG_PASSWORD%"

rem ---- 3. Start everything from the downloaded copy
echo.
call "%POC%\start-all.bat" %PASS_ON%
exit /b %errorlevel%

:fail
echo.
pause
exit /b 1
