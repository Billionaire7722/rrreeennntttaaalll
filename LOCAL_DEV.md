# Local Development Guide

## ✅ All Services Running!

| Service | URL | Port | Status |
|---------|-----|------|--------|
| **Backend (NestJS)** | http://localhost:3000 | 3000 | ✅ Running |
| **Web Viewer (Next.js)** | http://localhost:3002 | 3002 | ✅ Running |
| **Rental Admin (Expo)** | http://localhost:8081 | 8081 | ✅ Running |
| **Super Admin (Vite)** | http://localhost:5173 | 5173 | ✅ Running |
| **PostgreSQL** | localhost:5433 | 5433 | ✅ Running (Docker) |
| **Redis** | localhost:6379 | 6379 | ✅ Running (Docker) |

## 🚀 Quick Start

### Option 1: One-Click (Recommended)
```
double-click start-local.bat
```

### Option 2: Manual
```
bash
# 1. Start Docker Desktop first!

# 2. Start Database + Redis
docker-compose -f docker-compose.local.yml up -d postgres redis

# 3. Terminal 1: Backend
cd backend && npm run start:dev

# 4. Terminal 2: Web Viewer
cd viewer/web-viewer && npm run dev

# 5. Terminal 3: Rental Admin
cd rental-admin && npx expo start --web

# 6. Terminal 4: Super Admin
cd super-admin-dashboard && npm run dev

# 7. Seed dữ liệu (chạy 1 lần)
cd backend && npx prisma db seed
```

## 🌱 Seed Data (Important!)

Sau khi chạy lần đầu, cần seed dữ liệu mẫu:
```
bash
cd backend
npx prisma db seed
```

Đã có sẵn: **12 houses** mẫu trong database!

## 👤 Default Accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | ceo@rentalapp.com | Admin@123 |
| Admin | admin@rental.com | Admin@123 |

## 🐳 Docker Services

```
bash
# Start
docker-compose -f docker-compose.local.yml up -d

# Stop
docker-compose -f docker-compose.local.yml down

# View logs
docker-compose -f docker-compose.local.yml logs -f
```

## ☁️ Deploy to VPS

```
bash
# 1. Push to GitHub
git add .
git commit -m "update"
git push origin main

# 2. On VPS:
ssh root@103.200.22.111
cd /root/rrreeennntttaaalll
git pull origin main

# 3. Rebuild & Deploy
docker-compose build backend web-viewer rental-admin super-admin
docker-compose up -d
