# Rental Project Notes

**Purpose**
This is the rental platform running on the VPS. The Flower project reuses its PostgreSQL server.

**Repo Locations**
- Local: `D:\rental`
- VPS: `/root/rrreeennntttaaalll`

**Services (Docker)**
- `rental_postgres` (postgis/postgis:15-3.3)
- `rental_redis` (redis:7-alpine)
- `rental_backend` (NestJS)
- `rental_users` (Next.js)
- `rental_super_admin` (Vite + Nginx)
- `rental_prisma_migrate` (init job)

**Network**
- Docker network: `rental_network`
- Flower backend also attaches to this network to reach `rental_postgres`

**Ports (VPS)**
- Backend: `3000`
- Users: `3002`
- Super Admin: `5174`
- Postgres is internal to the Docker network (no host port published)

**Database**
- Postgres container: `rental_postgres`
- Primary DB: `rental`
- Additional DB used by Flower: `flower_shop`
- Do not remove the Postgres volume `rental_pg_data_prod`

**Env File (VPS)**
- File: `/root/rrreeennntttaaalll/.env.production` (not committed)
- Contains `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, and public API base URLs

**Deploy / Redeploy**
1. SSH to VPS.
2. `cd /root/rrreeennntttaaalll`
3. `git pull --ff-only`
4. `docker-compose --env-file ./.env.production -f docker-compose.yml up -d --build`

**Safety Rules**
- Do not stop or remove `rental_postgres` unless a full backup is verified.
- Do not rename or delete the `rental_network`.
- Avoid destructive Docker cleanup commands.
