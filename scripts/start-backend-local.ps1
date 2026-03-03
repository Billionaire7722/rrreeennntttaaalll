$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5433/rental?schema=public"
$env:SKIP_CLOUDINARY="true"
$env:REDIS_HOST="localhost"
$env:REDIS_PORT="6379"
$env:JWT_SECRET="dev_jwt_secret_change_in_production"
$env:PORT="3000"
$env:CORS_ORIGIN="*"

cd d:/rental/backend
npm run start:dev
