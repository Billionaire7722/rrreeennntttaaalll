@echo off
setlocal EnableDelayedExpansion

set "ROOT=%~dp0.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"

echo ==========================================
echo   🏠 Rental Platform - Local Setup
echo ==========================================
echo.

:: 1. Check Docker Status
echo [1/4] Checking Docker Status...
docker ps >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERROR] Docker is not running!
    echo Please start Docker Desktop and wait for it to be ready.
    pause
    exit /b 1
)
echo [OK] Docker is running.

:: 2. Start Infrastructure
echo.
echo [2/4] Starting Postgres and Redis...
docker-compose -f "%ROOT%\docker-compose.local.yml" up -d postgres redis
if errorlevel 1 (
    echo [ERROR] Failed to start Docker services.
    pause
    exit /b 1
)

:: 3. Setup Database
echo.
echo [3/4] Setting up Database (Prisma)...
cd /d "%ROOT%\backend"
echo   - Pushing schema...
call npx prisma db push --accept-data-loss
echo   - Seeding data...
call npx ts-node prisma/seed.ts

:: 4. Start Applications
echo.
echo [4/4] Starting applications in new windows...

echo   - Starting Backend (NestJS)...
start "Backend (NestJS)" cmd /k "cd /d %ROOT%\backend && npm run start:dev"

echo   - Starting Users App (Next.js)...
start "Users App (Next.js)" cmd /k "cd /d %ROOT%\users && set NEXT_PUBLIC_API_BASE_URL=http://localhost:3000 && npm run dev"

echo   - Starting Admin Dashboard (Vite)...
start "Admin Dashboard (Vite)" cmd /k "cd /d %ROOT%\super-admin-dashboard && set VITE_API_BASE_URL=http://localhost:3000 && npm run dev"

echo.
echo ==========================================
echo   🎉 SETUP COMPLETE!
echo ==========================================
echo   Backend: http://localhost:3000
echo   Users:   http://localhost:3002
echo   Admin:   http://localhost:5173
echo ==========================================
echo.
pause
exit /b 0
