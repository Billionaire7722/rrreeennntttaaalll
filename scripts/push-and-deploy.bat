@echo off
setlocal

echo ===========================================
echo   Push + Deploy (One Run)
echo ===========================================
echo.

cd /d "%~dp0\.."

if not exist "scripts\deploy-vps.local.ps1" (
  echo [ERROR] Missing scripts\deploy-vps.local.ps1
  echo Copy scripts\deploy-vps.local.example.ps1 and fill in your VPS credentials.
  pause
  exit /b 1
)

echo Starting push + deploy...
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\deploy-vps.ps1" -Yes
set EXIT_CODE=%ERRORLEVEL%

if not "%EXIT_CODE%"=="0" (
  echo.
  echo [ERROR] Push or deployment failed with exit code %EXIT_CODE%.
  pause
  exit /b %EXIT_CODE%
)

echo.
echo ===========================================
echo   All done!
echo ===========================================
pause
