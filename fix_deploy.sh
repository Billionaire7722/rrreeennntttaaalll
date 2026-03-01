#!/bin/bash
# Fix deployment script for VPS

echo "=== Step 1: Stop and clean containers ==="
docker-compose down --remove-orphans

echo "=== Step 2: Navigate to project and pull latest ==="
cd /root/rrreeennntttaaalll
git fetch --all
git checkout main
git pull origin main

echo "=== Step 3: Build and start backend ==="
docker-compose build --no-cache backend
docker-compose up -d backend

echo "=== Step 4: Check backend status ==="
sleep 10
docker-compose ps

echo "=== Step 5: Build and start frontends ==="
docker-compose build web-viewer
docker-compose up -d web-viewer

docker-compose build rental-admin
docker-compose up -d rental-admin

docker-compose build super-admin
docker-compose up -d super-admin

echo "=== Final Status ==="
docker-compose ps

echo "=== Check logs if needed ==="
echo "docker-compose logs --tail=50"
