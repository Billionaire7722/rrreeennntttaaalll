@echo off
setlocal EnableDelayedExpansion

set "ROOT=%~dp0.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"

echo ===========================================
echo   Rental Project - Starting All Services
echo ===========================================
echo.

echo [1/5] Starting Docker services...
docker compose version >nul 2>&1
if %errorlevel%==0 (set "DC=docker compose") else set "DC=docker-compose"
%DC% -f "%ROOT%\docker-compose.yml" -f "%ROOT%\docker-compose.local.yml" up -d postgres redis
if errorlevel 1 (
  echo [ERROR] Failed to start Docker services.
  pause
  exit /b 1
)
echo.

echo [2/5] Starting Backend (NestJS) on port 3000...
start "Backend" cmd /k "cd /d %ROOT%\backend && npx prisma migrate deploy && npx prisma db seed && npm run start:dev"
timeout /t 5 /nobreak >nul

echo [3/5] Starting Users (Next.js) on port 3002...
start "Users" cmd /k "cd /d %ROOT%\users && set NEXT_PUBLIC_API_BASE_URL=http://localhost:3000 && npm run dev"
timeout /t 5 /nobreak >nul

echo [4/5] Starting Super Admin (Vite) on port 5173...
start "Super Admin" cmd /k "cd /d %ROOT%\super-admin-dashboard && set VITE_API_BASE_URL=http://localhost:3000 && npm run dev"

echo.
echo ===========================================
echo   All Services Started!
echo ===========================================
echo.
echo Service URLs:
echo   - Backend:      http://localhost:3000
echo   - Users App:    http://localhost:3002
echo   - Super Admin:  http://localhost:5173
echo.
echo Default Accounts (local seed):
echo   - Super Admin: superadmin@local.test / Admin@123
echo   - User:        user1@local.test / User@1234
echo   - User:        user2@local.test / User@1234
echo.
pause
