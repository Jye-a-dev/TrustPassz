# ==============================================================================
# TRUSTPASSZ MONOREPO - NEXT.JS USER CLIENT DOCKERFILE
# Multi-stage production build: Node.js 20 Debian Slim, Non-root user
# ==============================================================================

FROM node:20-bookworm-slim AS deps
WORKDIR /app

COPY package.json package-lock.json* pnpm-lock.yaml* ./
COPY apps/cl_user/package.json ./apps/cl_user/
COPY packages ./packages

RUN npm install --workspace=apps/cl_user --include=dev --prefer-offline --no-audit

FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Build arguments for Next.js static prerendering
ARG NEXT_PUBLIC_APP_URL="http://localhost:5000"
ARG NEXT_PUBLIC_API_URL="https://mock-api.trustpassz.com"
ARG NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS="0x165B47291B87569b91696DCE6f1207eE15C9f783"
ARG NEXT_PUBLIC_CHAIN_ID="84532"
ARG NEXT_PUBLIC_RPC_URL="https://sepolia.base.org"
ARG NEXT_PUBLIC_SUPABASE_URL="https://placeholder-project.supabase.co"
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY="mock-anon-key-placeholder"
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID="mock-google-client-id"
ARG NEXT_PUBLIC_SOLANA_NETWORK="devnet"
ARG NEXT_PUBLIC_SOLANA_RPC_URL="https://api.devnet.solana.com"

ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL} \
    NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS=${NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS} \
    NEXT_PUBLIC_CHAIN_ID=${NEXT_PUBLIC_CHAIN_ID} \
    NEXT_PUBLIC_RPC_URL=${NEXT_PUBLIC_RPC_URL} \
    NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL} \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY} \
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID} \
    NEXT_PUBLIC_SOLANA_NETWORK=${NEXT_PUBLIC_SOLANA_NETWORK} \
    NEXT_PUBLIC_SOLANA_RPC_URL=${NEXT_PUBLIC_SOLANA_RPC_URL} \
    NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS="--max-old-space-size=4096"

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY package.json ./
COPY apps/cl_user ./apps/cl_user

WORKDIR /app/apps/cl_user
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app/apps/cl_user

ENV NODE_ENV=production \
    PORT=5000 \
    NEXT_TELEMETRY_DISABLED=1

RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -s /bin/sh -m nextjs

COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder --chown=nextjs:nodejs /app/apps/cl_user/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/cl_user/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/apps/cl_user/package.json ./package.json

USER nextjs

EXPOSE 5000

CMD ["npx", "next", "start", "-p", "5000"]
