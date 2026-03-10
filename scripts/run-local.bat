@echo off
setlocal EnableDelayedExpansion

set "ROOT=%~dp0.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"

echo Starting Docker services (Postgres + Redis)...
docker compose -f "%ROOT%\docker-compose.yml" -f "%ROOT%\docker-compose.local.yml" up -d postgres redis
if errorlevel 1 (
  echo Failed to start Docker services.
  exit /b 1
)

call :ensure_deps "%ROOT%\backend"
call :ensure_deps "%ROOT%\users"
call :ensure_deps "%ROOT%\super-admin-dashboard"

echo Starting Backend (NestJS)...
start "Backend" cmd /k "cd /d %ROOT%\backend && npx prisma migrate deploy && npx prisma db seed && npm run start:dev"

echo Starting Users (Next.js)...
start "Users" cmd /k "cd /d %ROOT%\users && set NEXT_PUBLIC_API_BASE_URL=http://localhost:3000 && npm run dev"

echo Starting Super Admin (Vite)...
start "Super Admin" cmd /k "cd /d %ROOT%\super-admin-dashboard && set VITE_API_BASE_URL=http://localhost:3000 && npm run dev"

echo.
echo Local services:
echo   Backend: http://localhost:3000
echo   Users:   http://localhost:3002
echo   Admin:   http://localhost:5173
exit /b 0

:ensure_deps
set "APP_DIR=%~1"
if not exist "%APP_DIR%\node_modules" (
  echo Installing dependencies in %APP_DIR% ...
  pushd "%APP_DIR%"
  call npm install
  popd
)
exit /b 0
