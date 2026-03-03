@echo off
echo ===========================================
echo   Rental Project - Starting All Services
echo ===========================================
echo.

echo [1/5] Starting Docker services...
docker-compose -f docker-compose.local.yml up -d postgres redis
echo.

echo [2/5] Starting Backend (NestJS) on port 3000...
start "Backend" cmd /k "cd /d d:\rental\backend && npm run start:dev"
timeout /t 5 /nobreak >nul

echo [3/5] Starting Web Viewer (Next.js) on port 3002...
start "Web Viewer" cmd /k "cd /d d:\rental\viewer\web-viewer && set NEXT_PUBLIC_API_BASE_URL=http://localhost:3000 && npm run dev"
timeout /t 5 /nobreak >nul

echo [4/5] Starting Rental Admin (Expo) on port 8081...
start "Rental Admin" cmd /k "cd /d d:\rental\rental-admin && set EXPO_PUBLIC_API_BASE_URL=http://localhost:3000 && npx expo start --web"
timeout /t 5 /nobreak >nul

echo [5/5] Starting Super Admin (Vite) on port 5173...
start "Super Admin" cmd /k "cd /d d:\rental\super-admin-dashboard && set VITE_API_BASE_URL=http://localhost:3000 && npm run dev"

echo.
echo ===========================================
echo   All Services Started!
echo ===========================================
echo.
echo Service URLs:
echo   - Backend:      http://localhost:3000
echo   - Web Viewer:   http://localhost:3002
echo   - Rental Admin: http://localhost:8081
echo   - Super Admin:  http://localhost:5173
echo.
echo Default Accounts:
echo   - Super Admin: ceo@rentalapp.com / Admin@123
echo   - Admin:       admin@rental.com / Admin@123
echo.
pause
