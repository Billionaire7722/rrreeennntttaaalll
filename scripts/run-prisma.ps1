$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5433/rental?schema=public"
$env:SKIP_CLOUDINARY="true"
cd d:/rental/backend
npx prisma db push
