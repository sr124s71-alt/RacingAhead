@echo off
rem Starts the POC automatically each time you sign in to Windows (no administrator rights needed).
setlocal EnableExtensions
set "ROOT=%~dp0.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "ENTRY=%STARTUP%\SportSeek Identity POC.bat"
(
  echo @echo off
  echo rem Created by poc\identity\scripts\install-autostart.bat
  echo start "SportSeek Identity POC" /min cmd /c ""%ROOT%\start-all.bat" /nobrowser /min"
) > "%ENTRY%"
echo Autostart installed: the POC will start minimised each time you sign in.
echo   %ENTRY%
echo Remove it with scripts\remove-autostart.bat
pause
