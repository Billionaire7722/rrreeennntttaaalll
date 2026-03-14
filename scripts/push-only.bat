@echo off
setlocal

cd /d "%~dp0\.."

if not exist "scripts\deploy-vps.local.ps1" (
  echo [ERROR] Missing scripts\deploy-vps.local.ps1
  pause
  exit /b 1
)

echo Starting safe push only...
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\deploy-vps.ps1" -Yes -SkipDeploy
set EXIT_CODE=%ERRORLEVEL%

if not "%EXIT_CODE%"=="0" (
  echo.
  echo [ERROR] Push failed with exit code %EXIT_CODE%.
  pause
  exit /b %EXIT_CODE%
)

echo.
echo Push completed successfully.
pause
exit /b 0
