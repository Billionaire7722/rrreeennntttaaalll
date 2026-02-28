# Rental Listings — Monorepo

## Structure

```
d:\rental\
├── apps\
│   ├── rental-admin\     ← App A: Admin app (login required, full CRUD)
│   ├── rental-viewer\    ← App B: Viewer app (no login, read-only map)
│   └── backend\          ← NestJS API (Prisma + PostgreSQL)
└── packages\
    └── shared\           ← Shared types, constants, and data
```

## Running

### App A — Admin
```bash
cd apps/rental-admin
bun install
bunx expo start
```

### App B — Viewer
```bash
cd apps/rental-viewer
bun install
bunx expo start
```

### Backend
```bash
cd apps/backend
npm install
npm run start:dev
```

## Notes
- Both apps reference shared code via the `@shared/` path alias → `../../packages/shared/`
- App B is read-only: no login, no add/delete/edit operations
- App A requires login before any operation is possible
