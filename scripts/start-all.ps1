# ============================================
# Rental Project - Start All Services
# ============================================

Write-Host "🚀 Starting Rental Project..." -ForegroundColor Green

# 1. Start Docker containers (Database + Redis)
Write-Host "`n📦 Starting Docker services..." -ForegroundColor Cyan
docker-compose -f docker-compose.local.yml up -d postgres redis

# Wait for database
Write-Host "⏳ Waiting for database..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 2. Start Backend (NestJS)
Write-Host "`n🔥 Starting Backend (NestJS)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\rental\backend'; npm run start:dev"

# 3. Start Users (Next.js) 
Write-Host "🌐 Starting Users (Next.js)..." -ForegroundColor Cyan
Start-Sleep -Seconds 3
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\rental\users'; `$env:NEXT_PUBLIC_API_BASE_URL='http://localhost:3000'; npm run dev"

# 4. Start Super Admin Dashboard (Vite)
Write-Host "👑 Starting Super Admin (Vite)..." -ForegroundColor Cyan
Start-Sleep -Seconds 5
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\rental\super-admin-dashboard'; `$env:VITE_API_BASE_URL='http://localhost:3000'; npm run dev"

Write-Host "`n✅ All services started!" -ForegroundColor Green
Write-Host "`n📋 Service URLs:" -ForegroundColor White
Write-Host "  - Backend:     http://localhost:3000" -ForegroundColor Yellow
Write-Host "  - Users App:     http://localhost:3002" -ForegroundColor Yellow
Write-Host "  - Super Admin:   http://localhost:5173" -ForegroundColor Yellow
Write-Host "`n👤 Default Accounts:" -ForegroundColor White
Write-Host "  - Super Admin: ceo@rentalapp.com / Admin@123" -ForegroundColor Yellow
