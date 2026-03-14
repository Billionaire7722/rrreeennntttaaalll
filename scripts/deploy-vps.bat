@echo off
setlocal

cd /d "%~dp0\.."

if not exist "scripts\deploy-vps.local.ps1" (
  echo [ERROR] Missing scripts\deploy-vps.local.ps1
  echo Copy scripts\deploy-vps.local.example.ps1 and fill in your VPS credentials.
  pause
  exit /b 1
)

echo Starting quick deploy...
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\deploy-vps.ps1" -Yes -SkipCommit -SkipPush
set EXIT_CODE=%ERRORLEVEL%

if not "%EXIT_CODE%"=="0" (
  echo.
  echo [ERROR] Deployment failed with exit code %EXIT_CODE%.
  pause
  exit /b %EXIT_CODE%
)

echo.
echo Deployment completed successfully.
pause
exit /b 0
