@echo off
setlocal

cd /d "%~dp0\.."

if not exist "scripts\deploy-vps.local.ps1" (
  echo [ERROR] Missing scripts\deploy-vps.local.ps1
  echo Copy scripts\deploy-vps.local.example.ps1 to scripts\deploy-vps.local.ps1 and fill your real VPS values.
  pause
  exit /b 1
)

echo Starting safe deploy...
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\deploy-vps.ps1" -Yes
set EXIT_CODE=%ERRORLEVEL%

if not "%EXIT_CODE%"=="0" (
  echo.
  echo [ERROR] Deploy failed with exit code %EXIT_CODE%.
  pause
  exit /b %EXIT_CODE%
)

echo.
echo Deploy completed successfully.
pause
exit /b 0
