# Deploy Guide (Local -> GitHub -> VPS)

## 0) Sensitive Info Rules
- Do not commit real passwords/secrets into Git.
- Keep real credentials only on VPS (`backend/.env.production`) or local private `.env`.
- `deploy.md` is local operational note. Do not push this file.

Optional: keep local changes to `deploy.md` out of git tracking:
```bash
git update-index --skip-worktree deploy.md
```
To re-enable tracking later:
```bash
git update-index --no-skip-worktree deploy.md
```

---

## 1) Current Infrastructure
- VPS IP: `103.200.22.111`
- SSH user: `root`
- GitHub repo: `https://github.com/Billionaire7722/rrreeennntttaaalll`
- Production stack (Docker Compose):
  - `backend` (NestJS, port `3000`)
  - `web-viewer` (Next.js, port `3002`)
  - `rental-admin` (Expo web/nginx, port `8081`)
  - `super-admin` (Vite/nginx, port `5174`)
  - `postgres`, `redis`

---

## 2) Local Development & Test Before Push

### 2.1 Prerequisites
- Node.js 20+
- npm
- Docker Desktop (or Docker Engine)
- Git

### 2.2 Install dependencies
Run once in each app:
```bash
cd backend && npm ci
cd ../viewer/web-viewer && npm ci
cd ../../rental-admin && npm install --legacy-peer-deps
cd ../super-admin-dashboard && npm ci
```

### 2.3 Start local services (recommended)
From repo root:
```bash
docker-compose up -d postgres redis
```

### 2.4 Local env setup (backend)
Create local env (example):
`backend/.env`:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/rental?schema=public
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=local_dev_secret
PORT=3000
```

### 2.5 Run backend locally
```bash
cd backend
npx prisma generate
npm run start:dev
```
Smoke checks:
- `GET http://localhost:3000/health` -> 200
- `POST /auth/login` works

### 2.6 Run web-viewer locally
```bash
cd viewer/web-viewer
# PowerShell:
$env:NEXT_PUBLIC_API_BASE_URL="http://localhost:3000"
npm run dev
```
Check:
- `http://localhost:3002`
- `http://localhost:3002/about`
- Login + property detail works

### 2.7 Run super-admin dashboard locally
```bash
cd super-admin-dashboard
# PowerShell:
$env:VITE_API_BASE_URL="http://localhost:3000"
npm run dev
```
Check:
- login super-admin
- admin management
- live monitor

### 2.8 Run rental-admin locally (web mode)
```bash
cd rental-admin
# PowerShell:
$env:EXPO_PUBLIC_API_BASE_URL="http://localhost:3000"
npx expo start --web
```
Check:
- admin login
- add/edit/delete house

### 2.9 Build checks before commit (required)
```bash
cd backend && npm run build
cd ../viewer/web-viewer && npm run build
cd ../../super-admin-dashboard && npm run build
```

---

## 3) Git Workflow (After Local Test Passes)
```bash
git status
git add .
git commit -m "your message"
git push origin <branch>
```
If deploying from `main`, merge PR first, then push `main`.

---

## 4) Deploy to VPS

### 4.1 SSH to VPS
```bash
ssh root@103.200.22.111
```

### 4.2 Pull latest code
```bash
cd /root/rrreeennntttaaalll
git fetch --all
git checkout main
git pull origin main
```

### 4.3 If Prisma schema/manual migration changed
Run SQL migrations manually if needed:
```bash
docker exec -i rental_postgres psql -U postgres -d rental -f /root/rrreeennntttaaalll/backend/prisma/manual-migrations/<migration_file>.sql
```

### 4.4 Rebuild only changed services (fast + stable)
Example if backend and web-viewer changed:
```bash
cd /root/rrreeennntttaaalll
docker-compose build backend web-viewer
docker-compose rm -sf backend web-viewer
docker-compose up -d --no-deps backend web-viewer
```

If all frontends changed:
```bash
docker-compose build backend web-viewer rental-admin super-admin
docker-compose rm -sf backend web-viewer rental-admin super-admin
docker-compose up -d --no-deps backend web-viewer rental-admin super-admin
```

### 4.5 Check container status
```bash
docker-compose ps
docker-compose logs --tail=100 backend
```

---

## 5) Post-Deploy Smoke Test (Production)
Verify endpoints:
- `http://103.200.22.111:3000/health`
- `http://103.200.22.111:3002` (web-viewer)
- `http://103.200.22.111:8081` (rental-admin web)
- `http://103.200.22.111:5174` (super-admin)

Functional checks:
- login (super-admin/admin/viewer)
- house list + house detail
- add/edit/delete house from rental-admin
- `/about` page and language switch
- live monitor updates

---

## 6) Rollback (Quick)
If latest deploy has issue:
```bash
cd /root/rrreeennntttaaalll
git log --oneline -n 5
git checkout <previous_commit_hash>
docker-compose build backend web-viewer rental-admin super-admin
docker-compose rm -sf backend web-viewer rental-admin super-admin
docker-compose up -d --no-deps backend web-viewer rental-admin super-admin
```

Then inspect logs and open a fix commit.
