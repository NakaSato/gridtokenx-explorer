# syntax=docker/dockerfile:1
# Use imbios/bun-node as base image
FROM imbios/bun-node AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install dependencies using bun with cache mount
COPY package.json bun.lock* ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Add build arguments for Next.js public variables
ARG NEXT_PUBLIC_SOLANA_RPC_HTTP
ARG NEXT_PUBLIC_DEFAULT_CLUSTER
ENV NEXT_PUBLIC_SOLANA_RPC_HTTP=$NEXT_PUBLIC_SOLANA_RPC_HTTP \
    NEXT_PUBLIC_DEFAULT_CLUSTER=$NEXT_PUBLIC_DEFAULT_CLUSTER \
    NEXT_TELEMETRY_DISABLED=1

RUN bun run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=4000 \
    HOSTNAME="0.0.0.0"

RUN <<EOT
    addgroup --system --gid 1001 nodejs || true
    adduser --system --uid 1001 nextjs || true
    mkdir .next
EOT

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 4000

# server.js is created by next build from the standalone output
CMD ["node", "server.js"]
