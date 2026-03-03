@echo off
echo ========================================
echo   Stopping Rental Project Services
echo ========================================
echo.

echo Stopping Docker containers...
docker-compose -f docker-compose.local.yml down

echo.
echo Stopping Node.js processes...
taskkill /F /IM node.exe 2>nul

echo.
echo ========================================
echo   All services stopped!
echo ========================================
pause
