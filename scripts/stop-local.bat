@echo off
setlocal EnableDelayedExpansion

set "ROOT=%~dp0.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"

echo ========================================
echo   Stopping Rental Project Services
echo ========================================
echo.

echo Stopping Docker containers...
docker compose version >nul 2>&1
if %errorlevel%==0 (set "DC=docker compose") else set "DC=docker-compose"
%DC% -f "%ROOT%\docker-compose.yml" -f "%ROOT%\docker-compose.local.yml" down

echo.
echo Stopping Node processes on ports 3000, 3002, 5173...
for %%P in (3000 3002 5173) do (
  for /f "tokens=5" %%A in ('netstat -ano ^| findstr /R /C:":%%P .*LISTENING"') do (
    taskkill /F /PID %%A >nul 2>&1
  )
)

echo.
echo ========================================
echo   All services stopped!
echo ========================================
pause
