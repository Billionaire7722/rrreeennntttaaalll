# ---- Stage 1: Builder ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies for native modules (bcrypt needs python/make/g++)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build NestJS app
RUN npm run build

# ---- Stage 2: Production ----
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache python3 make g++ docker-cli

# Copy only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built output, prisma schema, and config
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma
COPY prisma.config.ts ./

# Copy entrypoint script
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
