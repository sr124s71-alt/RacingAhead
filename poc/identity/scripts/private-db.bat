@echo off
rem ==========================================================================
rem  Sets up the POC's own private PostgreSQL, once per person (no install, no admin rights).
rem  Called by SportSeek-POC.bat. Uses these variables from the caller:
rem    SSPG_HOME    where it lives   (%USERPROFILE%\SportSeek-POC\private-postgres)
rem    PG_PASSWORD  password for its "postgres" user
rem  Binaries:  %SSPG_HOME%\pgsql   (official EnterpriseDB build of PostgreSQL 16, code-signed)
rem  Data:      %SSPG_HOME%\data    (port 5440, localhost only - started by start-all.bat)
rem  It never touches any other PostgreSQL on this PC.
rem ==========================================================================
setlocal EnableExtensions DisableDelayedExpansion
set "BIN=%SSPG_HOME%\pgsql\bin"
set "DATA=%SSPG_HOME%\data"
set "NPM_PG=@embedded-postgres/windows-x64@16.14.0-beta.17"

rem PostgreSQL refuses to run with administrator rights.
net session >nul 2>&1
if errorlevel 1 goto :notadmin
echo [X] This window has administrator rights, and PostgreSQL refuses to run that way.
echo     Close it and start the SportSeek POC shortcut normally (not "Run as administrator").
exit /b 1
:notadmin

if not exist "%SSPG_HOME%" mkdir "%SSPG_HOME%"
if exist "%BIN%\postgres.exe" goto :haveBinaries

echo.
echo Setting up the POC's private PostgreSQL - first run only, a few minutes...
set "ZIP=%SSPG_HOME%\postgresql.zip"
for %%V in (16.10-1 16.9-1 16.8-1 16.6-1 16.4-1) do (
  if not exist "%BIN%\postgres.exe" call :tryEdb %%V
)
if exist "%BIN%\postgres.exe" goto :haveBinaries

echo [!] The official download did not work. Trying the copy published on npm instead...
call :tryNpm
if exist "%BIN%\postgres.exe" goto :haveBinaries
echo [X] Could not download PostgreSQL. Check the internet connection and try again.
exit /b 1

:haveBinaries
"%BIN%\postgres.exe" --version >nul 2>&1
if not errorlevel 1 goto :binariesRun
echo [X] Windows would not run %BIN%\postgres.exe. Its message:
"%BIN%\postgres.exe" --version
echo.
echo     - If it mentions VCRUNTIME140.dll or MSVCP140.dll, install the Microsoft Visual C++ runtime:
echo         winget install --id Microsoft.VCRedist.2015+.x64 -e
echo       then run the shortcut again.
echo     - If Smart App Control blocked it, delete this folder and run the shortcut again:
echo         %SSPG_HOME%
exit /b 1
:binariesRun
for /f "delims=" %%L in ('call "%BIN%\postgres.exe" --version') do echo [ok] Private database: %%L

if exist "%DATA%\PG_VERSION" goto :done
echo Creating the private database...
set "PWFILE=%SSPG_HOME%\initdb-password.txt"
powershell -NoProfile -Command "Set-Content -Path $env:PWFILE -Value $env:PG_PASSWORD -NoNewline -Encoding ASCII"
"%BIN%\initdb.exe" -D "%DATA%" -U postgres --pwfile="%PWFILE%" -A scram-sha-256 -E UTF8 --locale=C --no-instructions >"%SSPG_HOME%\initdb.log" 2>&1
set "RC=%errorlevel%"
del "%PWFILE%" >nul 2>&1
if "%RC%"=="0" goto :done
echo [X] Creating the private database failed. Details:
type "%SSPG_HOME%\initdb.log"
if exist "%DATA%" rmdir /s /q "%DATA%"
exit /b 1

:done
exit /b 0

rem ---------------------------------------------------------------- helpers

:tryEdb
rem %1 = EnterpriseDB version, e.g. 16.10-1
echo   Downloading PostgreSQL %1 from EnterpriseDB (about 300 MB)...
del "%ZIP%" >nul 2>&1
curl.exe -fL --retry 2 --connect-timeout 20 -o "%ZIP%" "https://get.enterprisedb.com/postgresql/postgresql-%1-windows-x64-binaries.zip" 2>nul
if errorlevel 1 (
  del "%ZIP%" >nul 2>&1
  exit /b 1
)
echo   Unpacking...
tar -xf "%ZIP%" -C "%SSPG_HOME%" --exclude "pgsql/pgAdmin 4" --exclude "pgsql/doc" --exclude "pgsql/symbols" --exclude "pgsql/StackBuilder"
if errorlevel 1 powershell -NoProfile -Command "$ProgressPreference='SilentlyContinue'; Expand-Archive -Path $env:ZIP -DestinationPath $env:SSPG_HOME -Force"
del "%ZIP%" >nul 2>&1
if exist "%SSPG_HOME%\pgsql\pgAdmin 4" rmdir /s /q "%SSPG_HOME%\pgsql\pgAdmin 4"
exit /b 0

:tryNpm
rem Same PostgreSQL build repackaged on npm (37 MB). It is not code-signed, so Smart App Control may block it.
set "NPMDIR=%SSPG_HOME%\npm-download"
if exist "%NPMDIR%" rmdir /s /q "%NPMDIR%"
mkdir "%NPMDIR%"
pushd "%NPMDIR%"
call npm pack "%NPM_PG%" --silent >nul 2>&1
for %%T in (*.tgz) do tar -xzf "%%T"
popd
if not exist "%NPMDIR%\package\native\bin\postgres.exe" exit /b 1
mkdir "%SSPG_HOME%\pgsql" 2>nul
xcopy /e /i /q /y "%NPMDIR%\package\native" "%SSPG_HOME%\pgsql" >nul
rmdir /s /q "%NPMDIR%"
exit /b 0
