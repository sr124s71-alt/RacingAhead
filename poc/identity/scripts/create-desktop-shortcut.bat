@echo off
rem Puts a "SportSeek POC" shortcut on your desktop that runs the launcher from this clone.
rem Run once after cloning (the setup command in the README does this for you).
setlocal EnableExtensions DisableDelayedExpansion
set "LAUNCHER=%~dp0..\SportSeek-POC.bat"
for %%I in ("%LAUNCHER%") do set "LAUNCHER=%%~fI"
set "WORKDIR=%~dp0.."
for %%I in ("%WORKDIR%") do set "WORKDIR=%%~fI"
powershell -NoProfile -Command "$d = [Environment]::GetFolderPath('Desktop'); $s = (New-Object -ComObject WScript.Shell).CreateShortcut((Join-Path $d 'SportSeek POC.lnk')); $s.TargetPath = $env:LAUNCHER; $s.WorkingDirectory = $env:WORKDIR; $s.Description = 'Update from GitHub and start the SportSeek Shared Identity POC'; $s.Save(); Write-Host ('Shortcut created: ' + (Join-Path $d 'SportSeek POC.lnk'))" || (echo [X] Could not create the shortcut. & exit /b 1)
echo Double-click "SportSeek POC" on your desktop to update and start the POC.
