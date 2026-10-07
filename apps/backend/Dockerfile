# Multi-stage Dockerfile for Yewi Backend
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package definitions and lockfile if present
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install

# Copy source, prisma schema and configurations
COPY . .

# Generate Prisma Client & Build
RUN npx prisma generate
RUN pnpm build

# Production runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@latest --activate

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts* ./

USER nestjs

EXPOSE 3000

# Ejecutar prisma migrate deploy antes de arrancar el servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]

