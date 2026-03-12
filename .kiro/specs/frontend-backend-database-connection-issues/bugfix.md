# Bugfix Requirements Document

## Introduction

The rental platform experiences critical connection failures in production (VPS deployment) where frontend applications cannot reliably communicate with the backend API. This manifests as authentication failures, unstable data loading, and intermittent connection errors. The root cause is a misconfiguration in how frontend applications resolve the backend API URL in the Docker containerized production environment.

**Impact**: Users cannot log in, data appears/disappears randomly, and the super-admin dashboard cannot connect to the backend API. The system works correctly in local development but fails in production.

**Scope**: This affects the connection layer between:
- Next.js users app → NestJS backend
- Vite React super-admin dashboard → NestJS backend
- Backend → PostgreSQL database
- Backend → Redis cache

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN frontend applications (users app and super-admin dashboard) are deployed in Docker containers on VPS THEN they attempt to connect to the backend using `http://{VPS_HOSTNAME}:3000` which fails because the backend container is not accessible via the host network

1.2 WHEN the backend container uses `DATABASE_URL=postgresql://postgres:postgres@localhost:5433/rental` in production THEN it cannot connect to the PostgreSQL container because `localhost` refers to the backend container itself, not the postgres service

1.3 WHEN the backend container uses `REDIS_HOST=localhost` in production THEN it cannot connect to the Redis container because `localhost` refers to the backend container itself, not the redis service

1.4 WHEN environment variables `NEXT_PUBLIC_API_BASE_URL` and `VITE_API_BASE_URL` are not set or empty in production THEN frontend applications fall back to constructing URLs using `window.location.hostname:3000`, which attempts to connect through the host network instead of the Docker network

1.5 WHEN users attempt to log in or sign up THEN they receive "Internal server error" because the backend cannot connect to PostgreSQL or Redis, or the frontend cannot reach the backend

1.6 WHEN data is loaded after login THEN it appears and disappears intermittently because connection attempts sometimes timeout and sometimes succeed depending on network conditions and retry logic

### Expected Behavior (Correct)

2.1 WHEN frontend applications are deployed in Docker containers on VPS THEN they SHALL connect to the backend using the internal Docker network service name `http://backend:3000` for server-side requests

2.2 WHEN the backend container runs in production THEN it SHALL use `DATABASE_URL=postgresql://postgres:password@postgres:5432/rental?schema=public` to connect to the PostgreSQL container via the Docker network service name

2.3 WHEN the backend container runs in production THEN it SHALL use `REDIS_HOST=redis` and `REDIS_PORT=6379` to connect to the Redis container via the Docker network service name

2.4 WHEN frontend applications need to make client-side API requests in production THEN they SHALL use the publicly accessible backend URL (e.g., `http://103.200.22.111:3000` or a domain name) configured via `NEXT_PUBLIC_API_BASE_URL` and `VITE_API_BASE_URL` environment variables

2.5 WHEN users attempt to log in or sign up THEN they SHALL successfully authenticate and receive proper responses without "Internal server error"

2.6 WHEN data is loaded after login THEN it SHALL load consistently and remain stable across page reloads and navigation without appearing/disappearing

2.7 WHEN the super-admin dashboard attempts to connect to the backend THEN it SHALL successfully establish connection without "cannot connect to backend API" errors

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the application runs in local development mode (docker-compose.local.yml or direct npm run dev) THEN it SHALL CONTINUE TO connect using localhost URLs (e.g., `http://127.0.0.1:3000`)

3.2 WHEN the backend receives authenticated requests with valid JWT tokens THEN it SHALL CONTINUE TO process them correctly and return appropriate responses

3.3 WHEN the backend connects to PostgreSQL and Redis in local development THEN it SHALL CONTINUE TO use the local ports (5433 for PostgreSQL, 6379 for Redis)

3.4 WHEN CORS is configured with `CORS_ORIGIN=*` THEN it SHALL CONTINUE TO allow cross-origin requests from any origin

3.5 WHEN Docker containers are built and deployed THEN they SHALL CONTINUE TO use the existing Dockerfile configurations and build processes

3.6 WHEN Prisma migrations run via the prisma-migrate init container THEN they SHALL CONTINUE TO execute successfully before the backend starts
