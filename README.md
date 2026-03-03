# Rental Platform Project

This project is a comprehensive property rental platform consisting of a high-performance backend API and multiple frontend applications.

## Project Goal (Important)

The core goal of this project is to run a single rental ecosystem with strict role-based access control and shared data across all apps:

- **SUPER_ADMIN**: one protected master account, highest authority, can create/manage `ADMIN` accounts and audit the whole system.
- **ADMIN**: uses `rental-admin` to create/update/soft-delete houses and reply to viewer messages.
- **VIEWER**: registered user of `web-viewer` / `mobile-viewer`, can favorite houses and message admins.
- **GUEST**: no login required, can browse map pins and popup summaries only; detail actions require login/register.

All applications (super-admin dashboard, rental-admin, web-viewer, mobile-viewer) connect to the same backend and PostgreSQL database so data and permissions are enforced centrally.

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

### Step 3: Start Web Viewer
```
bash
cd viewer/web-viewer
set NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
npm run dev
```
- Web Viewer: http://localhost:3002

### Default Accounts
| Role | Email | Password |
|------|-------|----------|
| Super Admin | ceo@rentalapp.com | Admin@123 |
| Admin | admin@rental.com | Admin@123 |

See `LOCAL_DEV.md` for more details.

---

## ðŸš€ Technologies Used

- **Backend**: NestJS, TypeScript, Prisma ORM, PostgreSQL (with PostGIS extension), Redis, BullMQ, Swagger.
- **Media Storage**: Cloudinary (image/video optimisation, WebP conversion, public URL persistence).
- **Frontend** (`rental-admin`, `rental-viewer`, `super-admin-dashboard`, `web-rental-viewer`): React Native, Expo, React Navigation, React Native Maps, Leaflet, Tailwind CSS (NativeWind, Web), Vite, Next.js 15, React 19, Recharts.
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

### 2. Admin Dashboard (`/rental-admin`)
A management interface for property administrators (`ADMIN` role).
- **Profile Tab**: Admin-specific profile page with clickable avatar upload (streamed to Cloudinary).
- **Property Management (CRUD)**:
  - **Add New Home**: Modal form with city + searchable ward/commune picker, price, bedrooms, area, GPS coordinates, description, and a merged **áº¢nh & Video** upload section (up to 8 images + 2 videos). Images and videos upload directly to Cloudinary; public URLs are stored in PostgreSQL. If no images are selected, `assets/images/defaultimage.jpg` is uploaded automatically as the default.
  - **Edit Property**: Pre-filled modal accessible from the property list (pencil icon) and from the property detail screen. Supports updating all fields and replacing media via Cloudinary.
  - **Delete Property**: Soft-delete with confirmation.
  - **Manage Houses list**: Card grid showing all properties the admin has listed, with per-card Edit and Delete controls.
- **Property Detail screen**: Replaces the "Contact" button with an **Edit** button (pencil icon) that opens the edit modal inline.
- **Responsive modals**: Both Add and Edit modals cap at `maxWidth: 520` and centre horizontally, preventing cut-off on narrow mobile browsers.
- **Searchable Ward/Commune input** (`DistrictSearchInput`): Replaces the plain `Picker` with a text-filterable combobox. The dropdown renders in a transparent `Modal` overlay so it is never clipped by the parent `ScrollView`.
- **Map Interface**: Interactive map to view existing properties and drop pins for new property locations.
- **Real-time API Sync**: Connects directly to the backend REST API to manage the unified PostgreSQL database.

### 3. Mobile Viewer Application (`/viewer/mobile-viewer`)
A user-facing application for customers searching for rental properties (`VIEWER` role, with guest browsing support).
- **Authentication**: JWT validation flow covering user registration, email/password login, and mock Google OAuth.
- **Personalization**: Dedicated sections for saving 'Favorite' properties and managing inquiries via 'Messages'.
- **Advanced Filtering**: Filter properties dynamically by price ranges, number of bedrooms, area, and availability status.
- **Interactive Browsing**: Browse properties visually on a map interface that requests only the pins inside the user's current viewport.

### 4. Super Admin Dashboard (`/super-admin-dashboard`)
An isolated secure web application dedicated entirely to system oversight (`SUPER_ADMIN` role).
- **Security & RBAC Enforcement**: Binds strictly to backend `RolesGuard` protected endpoints restricted from standard admins.
- **System Metrics**: Visual overview of total users, admins, active properties, and recent activity logs.
- **Identity & Access Management**: Fully capable of demoting admins, toggling active/banned status limits, and wiping accounts securely.
- **Audit Trails**: Inspect deep system traces including JSON differentials of property edits and authentication login logs.

### 5. Native Web Rental Viewer (`/viewer/web-viewer`)
A Next.js 15 App-Router React application delivering a superior browser experience mirroring the Expo app functionality.
- **High Performance SEO**: Leverages React Server Components structure optimized with Tailwind CSS.
- **Native Web Mapping**: Powered by `react-leaflet` to smoothly load properties across geographic viewports without crashing memory.
- **Shared API Ecosystem**: Intercepts the same NestJS tokens as the Mobile Apps meaning user login states carry seamlessly over.
- **Real-time Chat**: Integrated chat feature at `/chat` allowing viewers to message administrators directly via WebSocket (Socket.io).
  - Viewers can send and receive messages in real-time
  - Message history persists in database
  - Admin can reply via rental-admin interface
  - Connection status indicator shows online/offline status
  - Accessible from Profile page -> Tin nháº¯n tab -> "Há»— trá»£ ká»¹ thuáº­t"

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
    A["Admin App Expo<br/>(Role: ADMIN)"]:::frontend
    V["Viewer Mobile Expo<br/>(Role: VIEWER / GUEST)"]:::frontend
    WV["Web Viewer Next.js<br/>(Role: VIEWER / GUEST)"]:::frontend

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
    SA -- "Manage Users/Admins, View Metrics & Audits" --> API
    A -- "Manage Houses (CRUD)" --> API
    V -- "Search Houses, Manage Favorites" --> API
    WV -- "Interactive React Web Search, Context Auth" --> API

    %% Data Access
    API -- "CRUD Users & Roles" --> U
    API -- "CRUD Properties & Geolocations" --> H
    API -- "Record Authentications" --> LL
    API -- "Record Mutations" --> AL
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

### Step 2: Start the Admin Dashboard

Open a **new** terminal window:
```
bash
cd rental-admin
```

1. **Install Dependencies**:
   
```
bash
   npm install
   
```
2. **Start the Web App**:
   
```
bash
   npm run web
   
```
   *The admin app will automatically open in your browser, typically at `http://localhost:8081`.*

### Step 3: Start the Mobile Viewer Application

Open a **new** terminal window:
```
bash
cd viewer/mobile-viewer
```

1. **Install Dependencies**:
   
```
bash
   npm install
   
```
2. **Start the Web App**:
   
```
bash
   npm run web
   
```
   *The viewer app will automatically open in your browser, typically at `http://localhost:8082`.*

### Step 4: Start the Super Admin Dashboard

Open a **new** terminal window:
```
bash
cd super-admin-dashboard
```

1. **Install Dependencies**:
   
```
bash
   npm install
   
```
2. **Build and Preview the App**:
   
```
bash
   npm run build
   npm run preview
   
```
   *The super admin app will start a Vite preview server, typically available at `http://localhost:4173/`.*

### Step 5: Start the Next.js Web Rental Viewer

Open a **new** terminal window:
```
bash
cd viewer/web-viewer
```

1. **Install Dependencies**:
   
```
bash
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
ssh root@103.200.22.111
cd /root/rrreeennntttaaalll
git pull origin main
docker compose --env-file .env.production up -d --build
docker compose ps
```

Frontend API fallback is now safe by default: if `NEXT_PUBLIC_API_BASE_URL` / `EXPO_PUBLIC_API_BASE_URL` / `VITE_API_BASE_URL` is blank or placeholder, clients auto-resolve to `<current-host>:3000`.
