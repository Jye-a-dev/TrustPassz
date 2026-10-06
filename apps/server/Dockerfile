# ==============================================================================
# TRUSTPASSZ MONOREPO - NESTJS BACKEND SERVER DOCKERFILE
# Multi-stage production build: Node.js 22 Debian Slim, Non-root user
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Dependency resolution and compilation
# ------------------------------------------------------------------------------
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Build arguments for CI/CD and build-time env injection
ARG NODE_ENV=production
ARG DATABASE_URL="postgresql://postgres:postgres@localhost:5432/trustpassz_build?schema=public"
ARG DIRECT_URL="postgresql://postgres:postgres@localhost:5432/trustpassz_build?schema=public"
ARG JWT_SECRET="mock-jwt-secret-for-ci-build-purposes-min-32-chars"
ARG BASE_SEPOLIA_RPC_URL="https://sepolia.base.org"
ARG ESCROW_CONTRACT_ADDRESS="0x165B47291B87569b91696DCE6f1207eE15C9f783"
ARG ORACLE_RELAYER_PRIVATE_KEY="0x0000000000000000000000000000000000000000000000000000000000000001"
ARG NODE_OPTIONS="--max-old-space-size=4096"

# Environment variables for builder stage (prevent OOM, inject mock database & secrets)
ENV NODE_ENV=development \
    NODE_OPTIONS="--max-old-space-size=4096" \
    DATABASE_URL=${DATABASE_URL} \
    DIRECT_URL=${DIRECT_URL} \
    JWT_SECRET=${JWT_SECRET} \
    BASE_SEPOLIA_RPC_URL=${BASE_SEPOLIA_RPC_URL} \
    ESCROW_CONTRACT_ADDRESS=${ESCROW_CONTRACT_ADDRESS} \
    ORACLE_RELAYER_PRIVATE_KEY=${ORACLE_RELAYER_PRIVATE_KEY} \
    PRISMA_CLI_QUERY_ENGINE_TYPE="binary" \
    PRISMA_CLIENT_ENGINE_TYPE="binary"

# Install native compile tools (bcrypt) and OpenSSL (Prisma engine)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency manifests
COPY package.json package-lock.json* ./

# Install dependencies with resilient lockfile check
RUN if [ -s package-lock.json ]; then \
      npm ci --include=dev --prefer-offline --no-audit; \
    else \
      npm install --include=dev --prefer-offline --no-audit --no-fund; \
    fi

# Copy application source & configurations
COPY prisma ./prisma
COPY src ./src
COPY tsconfig*.json nest-cli.json ./

# Generate Prisma Client for PostgreSQL target
RUN npx prisma generate

# Compile TypeScript production bundle via Nest CLI
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Minimal Runtime
# ------------------------------------------------------------------------------
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3001 \
    NODE_OPTIONS="--max-old-space-size=4096"

# Install runtime OpenSSL (Prisma dependency) and curl (Health Check)
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create dedicated non-root execution user for CIS benchmark compliance
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -s /bin/sh -m nestjs

# Copy compiled application code and Prisma artifacts
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules

USER nestjs

EXPOSE 3001

# Production health check probe matching NestJS HealthController
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:${PORT}/api/v1/health || exit 1

CMD ["node", "dist/main.js"]
