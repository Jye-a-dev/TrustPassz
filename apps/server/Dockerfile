# ==============================================================================
# TRUSTPASSZ MONOREPO - NESTJS BACKEND SERVER DOCKERFILE (TASK-15)
# Multi-stage production build: Node.js 20 Debian Slim, Non-root user
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Dependency resolution and compilation
# ------------------------------------------------------------------------------
FROM node:20-bookworm-slim AS builder

WORKDIR /app

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
COPY apps/server/package.json ./apps/server/

# Install dependencies (supports pnpm workspaces or npm fallback)
RUN if [ -f pnpm-lock.yaml ]; then \
      pnpm install --frozen-lockfile --filter server...; \
    else \
      npm install --workspace=apps/server; \
    fi

# Copy server application source code and Prisma schema
COPY apps/server ./apps/server

# Generate Prisma Client for PostgreSQL target
WORKDIR /app/apps/server
RUN npx prisma generate

# Compile TypeScript production bundle via Nest CLI
RUN npm run build

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
