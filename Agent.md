# Agent Guide

## Project Architecture

### Repository root
- `backend/`: NestJS API, Prisma schema/seed data, backend tests, Dockerfile, and backend-specific env/config files.
- `users/`: Next.js user-facing app with App Router, shared UI components, i18n resources, and frontend scripts.
- `super-admin-dashboard/`: Vite + React admin dashboard for platform monitoring and moderation.
- `scripts/`: Windows/PowerShell helpers for local startup, Prisma tasks, seeding, deploy, and test utilities.
- `.github/workflows/deploy.yml`: CI/CD workflow that installs dependencies and builds each app before VPS deploy.
- `docker-compose.local.yml` / `docker-compose.yml`: Local and production container orchestration.
- `schema.sql`, `rental-db.pdf`: database reference material.
- `README.md`, `PROJECT_NOTES.md`: operational context, deployment notes, and safety rules.

### Backend (`backend/`)
- `src/app.module.ts`, `src/main.ts`: NestJS entry points.
- `src/prisma/`: Prisma module/service wiring.
- `src/common/`: shared filters and middleware.
- `src/auth/`, `src/users/`, `src/houses/`, `src/admin/`, `src/audit/`, `src/upload/`, `src/presence/`, `src/messages/`, `src/support/`, `src/health/`, `src/security/`, `src/cloudinary/`: feature modules, controllers, services, DTOs, guards, and helpers.
- `prisma/schema.prisma`, `prisma/seed.ts`, `prisma/migrations/`: ORM schema, seed, and migration assets.
- `test/`: Jest e2e coverage.
- `dist/`: generated build output; do not edit manually.

### Users app (`users/`)
- `src/app/`: Next.js App Router pages, layouts, route segments, and route-local components.
- `src/components/`: reusable UI components such as cards, map, modals, and providers.
- `src/context/` and `src/contexts/`: auth, language, theme, and socket providers/hooks.
- `src/api/`: Axios client setup.
- `src/hooks/`, `src/utils/`: shared hooks and helpers.
- `src/i18n/`: locale registry, legacy key map, and translation JSON files.
- `public/`, `assets/`: static assets.
- `scripts/`: i18n validation and rebuild helpers.
- `.next/`: generated Next.js output; do not edit manually.

### Super admin dashboard (`super-admin-dashboard/`)
- `src/main.tsx`, `src/App.tsx`: app bootstrap.
- `src/pages/`: route-level screens such as `Overview.tsx`, `Users.tsx`, `AuditLogs.tsx`, `Metrics.tsx`, and moderation/reporting pages.
- `src/components/`: reusable dashboard and route guards.
- `src/layouts/`: dashboard shell/layout components.
- `src/context/`, `src/hooks/`, `src/store/`, `src/api/`, `src/utils/`: app state, data fetching, API wiring, and utilities.
- `src/*.module.css`: component/page scoped styles.
- `dist/`: generated Vite output; do not edit manually.

## Code Conventions

### General
- TypeScript is the default across all apps.
- Keep feature code inside the app/module that owns it instead of adding cross-cutting files at the repo root.
- Follow existing naming patterns:
  - React components, contexts, layouts, and pages use `PascalCase` file names.
  - Hooks use `useXxx` names.
  - Backend services/controllers/modules/DTOs use Nest-style suffixes like `*.service.ts`, `*.controller.ts`, `*.module.ts`, `*.dto.ts`, `*.guard.ts`.
  - Route folders in `users/src/app/` are lowercase and URL-shaped.

### Formatting and linting
- `backend/` uses Prettier with single quotes and trailing commas (`backend/.prettierrc`).
- `backend/` ESLint is type-aware and includes Prettier; warnings exist for floating promises and unsafe arguments.
- `users/` uses Next.js ESLint presets (`core-web-vitals` + TypeScript). The app uses the `@/*` import alias mapped to `users/src/*`.
- `super-admin-dashboard/` uses ESLint with TypeScript, React Hooks, and React Refresh rules.
- Match the style already present in each package:
  - `backend/` and `super-admin-dashboard/` mostly use single quotes.
  - `users/` mostly uses double quotes because it follows the current Next.js file style.

## Important Rules

- Do not edit generated or vendored directories such as `node_modules/`, `backend/dist/`, `users/.next/`, or `super-admin-dashboard/dist/`.
- Do not commit or overwrite secret env files. Treat `.env*` values as local/production secrets unless the file is an example template.
- Protect production infrastructure noted in `PROJECT_NOTES.md`:
  - Do not stop or remove `rental_postgres` unless a verified backup exists.
  - Do not rename/delete `rental_network`.
  - Avoid destructive Docker cleanup commands.
- Keep changes scoped to the relevant app or module; avoid unrelated refactors.
- Run the relevant lint/build/test commands before committing. At minimum, verify every package you changed still builds.

## Build And Test Commands

### Root / infrastructure
```bash
docker-compose -f docker-compose.local.yml up -d postgres redis
```

### Backend (`backend/`)
```bash
npm install
npx prisma generate
npx prisma db push
npx ts-node prisma/seed.ts
npm run start:dev
npm run build
npm run lint
npm test
npm run test:e2e
```

### Users app (`users/`)
```bash
npm install
npm run dev
npm run build
npm run lint
npm run validate:i18n
```

### Super admin dashboard (`super-admin-dashboard/`)
```bash
npm install
npm run dev
npm run build
npm run lint
npm run preview
```

### Helpful repo scripts
```bash
run-local.bat
scripts\start-all.ps1
scripts\run-db-push.ps1
scripts\run-seed.ps1
scripts\deploy-vps.ps1
```
