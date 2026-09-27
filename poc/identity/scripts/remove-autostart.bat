@echo off
set "ENTRY=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\SportSeek Identity POC.bat"
if exist "%ENTRY%" (del "%ENTRY%" & echo Autostart removed.) else (echo Autostart was not installed.)
pause
