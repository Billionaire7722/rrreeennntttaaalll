@echo off
setlocal

echo ===========================================
echo   Push to GitHub + Deploy to VPS
echo ===========================================
echo.

call "%~dp0push-only.bat"
if errorlevel 1 (
  echo.
  echo [ERROR] Push failed. Deployment skipped.
  pause
  exit /b 1
)

call "%~dp0deploy-vps.bat"
if errorlevel 1 (
  echo.
  echo [ERROR] Deployment failed.
  pause
  exit /b 1
)

echo.
echo ===========================================
echo   All done!
echo ===========================================
pause
