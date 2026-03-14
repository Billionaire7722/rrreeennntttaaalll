# 🏠 Rental Platform Project

[![NestJS](https://img.shields.io/badge/backend-NestJS-E0234E?logo=nestjs)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/frontend-Next.js%2015-000000?logo=nextdotjs)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL-4169E1?logo=postgresql)](https://www.postgresql.org/)

A comprehensive, high-performance property rental ecosystem consisting of a scalable backend API and multiple specialized frontend applications.

---

## 🎯 Project Goal

This project provides a unified rental marketplace with strict role-based access control (RBAC):

-   **👑 SUPER_ADMIN**: Master account for system oversight, user management, and auditing.
-   **👤 USER**: Registered renters/landlords who can post listings, manage profiles, and chat.
-   **🌐 GUEST**: Public access for browsing map pins and property summaries.

All applications share a centralized **PostgreSQL (PostGIS)** database and **Redis** caching layer to ensure data consistency and performance.

---

## 🤖 For AI Agents

This section provides critical context for AI coding assistants working on this codebase.

### 🏗️ Architecture
-   **Backend**: NestJS (TypeScript). Follows a modular architecture. Core logic resides in `src/`. Uses Prisma as the ORM.
-   **Frontend (Users)**: Next.js 15 (App Router). Located in `/users`. Uses React 19 and Tailwind CSS.
-   **Frontend (Admin)**: Vite + React. Located in `/super-admin-dashboard`.

### 🔑 Key Concepts & Contexts
-   **Localization**: Managed via `LanguageContext.tsx` and `useLanguage` hook. Supports 10 dialects with IP-based auto-detection.
-   **Authentication**: Handled by `AuthProvider.tsx` and `useAuth`. Backend uses JWT + Passport. Token includes `firstName` and `lastName`.
-   **User Model**: Names are split into `firstName` and `lastName`. The `name` field is auto-generated for compatibility.
-   **Real-time**: Socket.io for messaging. Private threads are filtered by `senderId` and `receiverId`.

---

## 🚀 Quick Start (Local)

### Prerequisites
-   **Node.js**: v20+
-   **Docker**: For PostgreSQL, PostGIS, and Redis.
-   **NPM**: v10+

### ⚡ One-Click Start (Windows)
If you are on Windows, you can start everything (Docker, Database, and Apps) by simply double-clicking the `run-local.bat` file in the project root.

---

### 1. Infrastructure (Docker)
> [!IMPORTANT]
> Ensure **Docker Desktop** is running before executing these commands.

```bash
# Start Database and Redis
docker-compose -f docker-compose.local.yml up -d postgres redis
```

*Note: The database is exposed on port **5433** for local host access.*

### 2. Backend
```bash
cd backend
npm install
npx prisma db push
npx ts-node prisma/seed.ts # Seeds 500+ properties in Hanoi
npm run start:dev
```
-   **API**: `http://localhost:3000`
-   **Docs**: `http://localhost:3000/docs` (Swagger)

### 3. Users App
```bash
cd users
npm install
# Windows:
set NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
# Mac/Linux:
export NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
# Run:
npm run dev
```
-   **App**: `http://localhost:3002`

---

## ✨ Features

### 🏢 Backend (`/backend`)
-   **Geospatial Search**: Hyper-fast map queries using PostGIS.
-   **Intelligent Caching**: Redis integration with automatic invalidation.
-   **Background Processing**: BullMQ for async property events.
-   **Audit Logs**: Deep system traces with JSON diffs for property edits.

### 🏠 Users App (`/users`)
-   **IP-Based Localization**: Auto-detects user country and sets language (10 dialects supported).
-   **Onboarding Tour**: Interactive step-by-step guide for first-time visitors.
-   **Rich Profiles**: Custom banners, bios, and listing management.
-   **Interactive Map**: Viewport-based property discovery using Leaflet.
-   **Real-time Chat**: Private messaging with unread indicators, thread history, and mobile-optimized UI.
-   **Accounts Center**: Centralized management for personal info (First/Last Name, Email) and password security.
-   **Name Splitting**: Support for separate First and Last Name fields during registration and in user profiles.

### 🛠️ Admin Dashboard (`/super-admin-dashboard`)
-   **System Oversight**: Real-time metrics on users and properties.
-   **User Management**: Ban/unban users and audit login logs.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | NestJS, TypeScript, Prisma ORM, PostGIS, Redis |
| **Frontend** | Next.js 15, React 19, Vite, Tailwind CSS, Leaflet |
| **Jobs/Messaging** | BullMQ, Socket.io |
| **Media** | Cloudinary (WebP optimization, public URLs) |
| **Infra** | Docker, Docker Compose, GitHub Actions |

---

## 📐 Architecture Diagram

```mermaid
graph TD
    subgraph Frontend
        SA[Admin Dashboard]
        UA[Users App]
    end

    subgraph API_Layer
        NEST[NestJS API]
        REDIS[(Redis Cache)]
    end

    subgraph Data_Layer
        DB[(PostgreSQL + PostGIS)]
        CLD[Cloudinary Storage]
    end

    SA --> NEST
    UA --> NEST
    NEST <--> REDIS
    NEST <--> DB
    NEST --> CLD
```

---

## 🌐 Deployment

### VPS Deployment (Recommended)

**Prerequisites:**
- VPS with Docker and Docker Compose installed
- SSH access to the VPS
- Domain name (optional, for HTTPS)

**1. Environment Configuration:**
Create production environment files:

```bash
# Root level .env.production
cp .env.production.example .env.production
# Edit with your VPS settings

# Backend .env.production  
cp backend/.env.production.example backend/.env.production
# Edit with your production secrets
```

**2. Deploy via Script:**
```bash
# From project root
cd scripts
powershell -File deploy-vps.ps1 -CommitMessage "Deploy to VPS" -Services "backend users super-admin" -Yes
```

**3. Manual Deployment:**
```bash
# SSH to your VPS
ssh root@your-vps-ip

# Clone repository
git clone https://github.com/your-username/rrreeennntttaaalll.git
cd rrreeennntttaaalll

# Copy environment files
cp .env.production.example .env.production
cp backend/.env.production.example backend/.env.production

# Edit environment files with your production settings
nano .env.production
nano backend/.env.production

# Deploy
docker compose --env-file .env.production up -d --build
```

**4. Access Your Applications:**
- Backend API: `http://your-vps-ip:3000`
- Users App: `http://your-vps-ip:3002`
- Admin Dashboard: `http://your-vps-ip:5174`

### Docker Compose Services

```yaml
services:
  postgres:           # PostgreSQL + PostGIS database
  redis:              # Redis caching layer
  backend:            # NestJS API server (port 3000)
  users:              # Next.js frontend (port 3002)
  super-admin:        # Admin dashboard (port 5174)
  prisma-migrate:     # Database migration container
```

### Data Persistence (VPS)

Production volumes are external and named (`rental_pg_data_prod`, `rental_redis_data_prod`) to prevent accidental data loss during redeploys. The VPS deploy script creates these volumes if they are missing.

---

## 🔧 Configuration

### Environment Variables

**Root Level (.env.production):**
```bash
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=rental
NEXT_PUBLIC_API_BASE_URL=http://your-vps-ip:3000
TURNSTILE_SECRET_KEY=your-cloudflare-secret
```

**Backend (.env.production):**
```bash
DATABASE_URL="postgresql://postgres:password@postgres:5432/rental?schema=public"
REDIS_HOST=redis
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

### HTTPS Setup (Recommended)

For production, set up HTTPS using Let's Encrypt:

```bash
# Install Certbot
sudo apt install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d your-domain.com

# Update docker-compose.yml to use HTTPS
# Mount SSL certificates
# Update CORS_ORIGIN to use https://
```

---

## 🐛 Known Issues & Fixes

### Map Location Issues (VPS)

**Problem:** The "current location" button and geolocation API don't work on VPS deployment.

**Root Cause:** 
1. Browser geolocation API requires HTTPS
2. Mixed content issues when serving over HTTP
3. CORS restrictions on location API

**Solutions Implemented:**
1. **Fallback Location Detection:** Added IP-based geolocation as fallback
2. **Enhanced Error Handling:** Graceful degradation when geolocation fails
3. **Multiple Location Sources:** Try browser API first, then IP-based, then default

**Code Changes in `users/src/components/Map.tsx`:**
- Added `tryGetUserLocation()` function with multiple fallbacks
- Implemented IP-based location using `ipapi.co`
- Enhanced error handling for geolocation failures
- Default fallback to Hanoi coordinates

**For Better Results:**
1. Set up HTTPS on your VPS
2. Use a domain name instead of IP address
3. Configure proper CORS headers

### Other Common Issues

**1. Database Connection Issues:**
> [!TIP]
> On Windows, ensure Docker Desktop is started. If you see "failed to connect to npipe", Docker is not running.

```bash
# Check if containers are running
docker ps

# If backend cannot connect, ensure port 5433 is used for localhost connections
# Check logs if containers fail to start
docker logs rental_postgres

# Reset database (WARNING: Deletes all data)
docker-compose -f docker-compose.local.yml down -v
docker-compose -f docker-compose.local.yml up -d
```

**2. Redis Connection Issues:**
```bash
# Check Redis status
docker ps | grep redis

# Test Redis connection
docker exec -it rental_redis redis-cli ping
```

**3. Build Issues:**
```bash
# Clean build
cd backend && npm run build
cd ../users && npm run build

# Check environment variables
echo $DATABASE_URL
echo $REDIS_HOST
```

---

## 🧪 Testing

### Local Testing
```bash
# Backend tests
cd backend && npm test

# E2E tests
cd backend && npm run test:e2e

# Frontend tests (if implemented)
cd users && npm test
```

### Production Testing
```bash
# Check service health
curl http://your-vps-ip:3000/health

# Check database connection
curl http://your-vps-ip:3000/api/health/db

# Test map functionality
open http://your-vps-ip:3002
```

---

## 📊 Monitoring

### Health Checks
- Backend: `GET /health` - System health status
- Database: `GET /api/health/db` - Database connection status
- Redis: `GET /api/health/redis` - Cache layer status

### Logs
```bash
# View all service logs
docker compose logs -f

# View specific service logs
docker compose logs backend
docker compose logs users
```

### Metrics
- Admin dashboard shows real-time user and property counts
- Audit logs track all property changes
- Performance metrics available in Swagger docs

---

## 🚨 Troubleshooting

### Common Deployment Issues

**1. Permission Denied Errors:**
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
sudo chmod -R 755 scripts/
```

**2. Port Already in Use:**
```bash
# Check what's using the port
sudo netstat -tlnp | grep :3000

# Stop conflicting services
sudo systemctl stop apache2
```

**3. Docker Build Failures:**
```bash
# Clean Docker cache
docker system prune -af

# Rebuild with no cache
docker compose build --no-cache
```

**4. Environment Variables Not Loading:**
```bash
# Check if .env.production exists
ls -la .env.production
ls -la backend/.env.production

# Verify file content
cat .env.production
```

### Getting Help

1. **Check Logs:** `docker compose logs -f`
2. **Verify Environment:** Ensure all `.env.production` files are configured
3. **Test Connectivity:** Check database and Redis connections
4. **Review Documentation:** This README and inline code comments
5. **Contact Team:** Reach out to development team for complex issues

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Leaflet** - Interactive maps
- **Prisma** - Database ORM
- **Next.js** - React framework
- **NestJS** - Backend framework
- **Cloudinary** - Media management

---

© 2026 Your Home Rental Platform.
