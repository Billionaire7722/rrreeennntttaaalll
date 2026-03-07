# Rental Platform Project

# Rental Platform Project

This project is a comprehensive property rental platform consisting of a high-performance backend API and multiple frontend applications.

## Project Goal (Important)

The core goal of this project is to run a single rental ecosystem with strict role-based access control and shared data across all apps:

- **SUPER_ADMIN**: one protected master account, highest authority, can manage all users and properties, and audit the whole system.
- **USER**: registered user of the `users` application, can add properties, update their properties, favorite houses, and message others.
- **GUEST**: no login required, can browse map pins and popup summaries only.

All applications (super-admin-dashboard, users) connect to the same backend and PostgreSQL database so data and permissions are enforced centrally.

---

## ðŸš€ Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- Docker Desktop (for PostgreSQL + Redis)
- npm

### Step 1: Start Infrastructure
```
bash
docker-compose -f docker-compose.local.yml up -d postgres redis
```

### Step 2: Start Backend
```
bash
cd backend
npm run start:dev
```
- Backend: http://localhost:3000
- Health: http://localhost:3000/health
- Swagger: http://localhost:3000/docs

### Step 3: Start Users App
```bash
cd users
set NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
npm run dev
```
- Users App: http://localhost:3002

### Default Accounts
| Role | Email | Password |
|------|-------|----------|
| Super Admin | set in your private env/seeding flow | set in your private env/seeding flow |
| User | Register via frontend | Any password |

See `LOCAL_DEV.md` for more details.

---

## ðŸš€ Technologies Used

- **Backend**: NestJS, TypeScript, Prisma ORM, PostgreSQL (with PostGIS extension), Redis, BullMQ, Swagger.
- **Media Storage**: Cloudinary (image/video optimisation, WebP conversion, public URL persistence).
- **Frontend** (`users`, `super-admin-dashboard`): Vite, Next.js 15, React 19, Recharts. Leaflet, Tailwind CSS.
- **Infrastructure**: Docker, Docker Compose for running database and caching layers.

---

## ðŸ“‚ Project Structure & Features

### 1. Backend (`/backend`)
A scalable, enterprise-grade REST API built with NestJS.
- **Authentication & Users**: JWT-based authentication utilizing Passport and bcrypt, alongside user management modules for favorited properties and messaging.
- **Geospatial Search**: Uses PostGIS `ST_MakeEnvelope` to efficiently query properties within a map's geographic bounding box.
- **Caching**: Integrates Redis (`@nestjs/cache-manager`) to cache grid-based map lookups, automatically invalidating upon data mutations.
- **Background Jobs**: Uses BullMQ backed by Redis for asynchronous processing of property creation events.
- **Data Management**: Implements soft deletes, audit logging components, and an automated data seeding script.
- **API Documentation**: Auto-generated Swagger UI available at `/docs`.
- **Health & Metrics**: Prometheus metrics (`/metrics`) and structured system health endpoint (`/health`).

### 2. Users App (`/users`)
A user-facing Next.js 15 App-Router React application for customers searching for rental properties or adding their own (`USER` role, with guest browsing support).
- **Authentication**: JWT validation flow covering user registration, email/password login, and mock Google OAuth.
- **Property Management**: Users can directly Add properties, providing details like location, price, and media (Cloudinary).
- **Personalization**: Dedicated sections for saving 'Favorite' properties and managing inquiries via 'Messages'.
- **Interactive Browsing**: Map interface (Leaflet) that requests only the pins inside the user's current viewport.
- **Real-time Chat**: Integrated chat feature allowing users to message property owners directly via WebSocket (Socket.io).

### 3. Super Admin Dashboard (`/super-admin-dashboard`)
An isolated secure web application dedicated entirely to system oversight (`SUPER_ADMIN` role).
- **Security & RBAC Enforcement**: Binds strictly to backend `RolesGuard` protected endpoints restricted from standard users.
- **System Metrics**: Visual overview of total users, active properties, and recent activity logs.
- **Identity & Access Management**: Fully capable of toggling active/banned status limits, and wiping user accounts securely.
- **Audit Trails**: Inspect deep system traces including JSON differentials of property edits and authentication login logs.

### 6. Permissions & Data Structure Architecture
The following Mermaid diagram illustrates the data structure and permission boundaries between the unified frontend ecosystem and PostgreSQL database.

```
mermaid
graph TD
    classDef frontend fill:#3b82f6,color:#fff,stroke:#2563eb,stroke-width:2px;
    classDef backend fill:#10b981,color:#fff,stroke:#059669,stroke-width:2px;
    classDef db fill:#6366f1,color:#fff,stroke:#4f46e5,stroke-width:2px;

    %% Client Applications
    SA["Super Admin Dashboard<br/>(Role: SUPER_ADMIN)"]:::frontend
    U_APP["Users App Next.js<br/>(Role: USER / GUEST)"]:::frontend

    %% Backend API
    API{{"NestJS REST API"}}:::backend

    %% Database Models
    subgraph PostgreSQL Database
        U[("User Table<br/>(RBAC & Auth)")]:::db
        H[("House Table<br/>(Geospatial Data)")]:::db
        LL[("LoginLog Table")]:::db
        AL[("AuditLog Table")]:::db
    end

    %% Routing Flow & Permissions
    SA -- "Manage Users, View Metrics & Audits" --> API
    U_APP -- "Search Houses, Add Properties, Chat" --> API

    %% Data Access
    API -- "CRUD Users & Roles" --> U
    API -- "CRUD Properties & Geolocations" --> H
    API -- "Record Authentications" --> LL
```

---

## ðŸ› ï¸ How to Start the Application

To run the full stack locally, you need to initialize the backend services first, followed by the frontend applications.

### Step 1: Start the Backend

Open a terminal and navigate to the backend directory:
```
bash
cd backend
```

1. **Start Docker Containers** (PostgreSQL + PostGIS & Redis):
   
```
bash
   docker-compose -f docker-compose.local.yml up -d postgres redis
   
```
2. **Install Dependencies**:
   
```
bash
   npm install
   
```
3. **Initialize Database Schema**:
   
```
bash
   npx prisma db push --accept-data-loss
   
```
   *Note: Accept data loss is used to reset the schema during development if migrating to the PostGIS format.*
   
4. **Seed the Database** (Recommended): Insert 500+ sample properties in the Hanoi area:
   
```
bash
   npx ts-node prisma/seed.ts
   
```
5. **Start the NestJS Server**:
   
```
bash
   npm run start:dev
   
```
   *The backend will be running at `http://localhost:3000`.*
   *View the Swagger API docs at `http://localhost:3000/docs`.*

### Step 2: Start the Super Admin Dashboard

Open a **new** terminal window:
```bash
cd super-admin-dashboard
```

1. **Install Dependencies**:
   
```bash
   npm install
   
```
2. **Build and Preview the App**:
   
```bash
   npm run build
   npm run preview
   
```
   *The super admin app will start a Vite preview server, typically available at `http://localhost:4173/`.*

### Step 3: Start the Users App

Open a **new** terminal window:
```bash
cd users
```

1. **Install Dependencies**:
   
```bash
   npm install
   
```
2. **Start the Development Server**:
   
```bash
   set NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
   npm run dev
   
```
   *The Next.js viewer web application will compile and launch instantly at `http://localhost:3002` (resolving any port 3000 backend conflicts).*

---

## Deploy to VPS

Use tracked template files so local fixes and deploy config stay in sync:
1. Copy `.env.production.example` -> `.env.production` (repo root on VPS).
2. Copy `backend/.env.production.example` -> `backend/.env.production`.
3. Fill real secrets only in those two `.env.production` files (never commit them).

When ready to deploy:
```bash
# Local machine
git add .
git commit -m "your changes"
git push origin main

# VPS
ssh root@<your-vps-ip>
cd /root/rrreeennntttaaalll
git pull origin main
docker compose --env-file .env.production up -d --build
docker compose ps
```

Frontend API fallback is now safe by default: if `NEXT_PUBLIC_API_BASE_URL` / `EXPO_PUBLIC_API_BASE_URL` / `VITE_API_BASE_URL` is blank or placeholder, clients auto-resolve to `<current-host>:3000`.
