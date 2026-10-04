# ==============================================================================
# TRUSTPASSZ MONOREPO - NESTJS BACKEND SERVER DOCKERFILE (TASK-15)
# Multi-stage production build: Node.js 20 Debian Slim, Non-root user
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Dependency resolution and compilation
# ------------------------------------------------------------------------------
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Build arguments for CI/CD and build-time env injection
ARG NODE_ENV=production
ARG DATABASE_URL="postgresql://postgres:postgres@localhost:5432/trustpassz_build?schema=public"
ARG DIRECT_URL="postgresql://postgres:postgres@localhost:5432/trustpassz_build?schema=public"
ARG JWT_SECRET="mock-jwt-secret-for-ci-build-purposes-min-32-chars"
ARG BASE_SEPOLIA_RPC_URL="https://sepolia.base.org"
ARG ESCROW_CONTRACT_ADDRESS="0x165B47291B87569b91696DCE6f1207eE15C9f783"
ARG ORACLE_RELAYER_PRIVATE_KEY="0x0000000000000000000000000000000000000000000000000000000000000001"

# Environment variables for builder stage
ENV NODE_ENV=${NODE_ENV} \
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

# Activate Corepack for pnpm support
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy monorepo manifests for lockfile verification & dependency caching
COPY package.json package-lock.json* pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY packages/contracts/package.json* ./packages/contracts/
COPY apps/server/package.json ./apps/server/

# Install dependencies (supports pnpm workspaces or npm fallback)
RUN if [ -f pnpm-lock.yaml ]; then \
      pnpm install --frozen-lockfile --filter server...; \
    else \
      npm install --workspace=apps/server --include=dev --prefer-offline --no-audit; \
    fi

# Copy packages (shared contracts, ABIs) and server application source
COPY packages ./packages
COPY apps/server ./apps/server

# Generate Prisma Client for PostgreSQL target
WORKDIR /app/apps/server
RUN npx prisma generate

# Compile TypeScript production bundle via Nest CLI
RUN npm run build

# Ensure node_modules directories exist for multi-stage copy safety
RUN mkdir -p /app/apps/server/node_modules /app/node_modules

# Prune devDependencies to keep final container footprint minimal
RUN if [ -f /app/pnpm-lock.yaml ]; then \
      pnpm --filter server deploy --prod /app/pruned; \
    fi

# ------------------------------------------------------------------------------
# Stage 2: Production Minimal Runtime
# ------------------------------------------------------------------------------
FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3001

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
COPY --from=builder --chown=nestjs:nodejs /app/apps/server/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/server/package.json ./package.json
COPY --from=builder --chown=nestjs:nodejs /app/apps/server/prisma ./prisma

# Copy node_modules (check if pruned deploy folder exists, else copy direct)
COPY --from=builder --chown=nestjs:nodejs /app/apps/server/node_modules ./node_modules
# Also copy root node_modules if present in monorepo hoist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules_root

# Setup NODE_PATH so resolution falls back to root hoisted modules if needed
ENV NODE_PATH=/app/node_modules:/app/node_modules_root

USER nestjs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:${PORT}/api/v1/health || exit 1

CMD ["node", "dist/main.js"]
