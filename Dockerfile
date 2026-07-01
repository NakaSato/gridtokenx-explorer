# syntax=docker/dockerfile:1

# Pinned bun+node base for reproducible builds.
FROM imbios/bun-node:1.3.14-20.20.2-slim AS base

# ---- Dependencies ----
FROM base AS deps
WORKDIR /app

# Install dependencies with cache mount, honoring the lockfile.
COPY package.json bun.lock* ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# ---- Builder ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js public build args.
ARG NEXT_PUBLIC_SOLANA_RPC_HTTP
ARG NEXT_PUBLIC_DEFAULT_CLUSTER
ENV NEXT_PUBLIC_SOLANA_RPC_HTTP=$NEXT_PUBLIC_SOLANA_RPC_HTTP \
    NEXT_PUBLIC_DEFAULT_CLUSTER=$NEXT_PUBLIC_DEFAULT_CLUSTER \
    NEXT_TELEMETRY_DISABLED=1

RUN --mount=type=cache,target=/app/.next/cache \
    bun run build

# ---- Runner ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=4000 \
    HOSTNAME="0.0.0.0"

# Reuse the base image's built-in non-root `node` user (uid 1000).
RUN mkdir -p .next && chown -R node:node /app

# Standalone output already includes the minimal node_modules subset.
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node

EXPOSE 4000

# server.js is emitted by `next build` standalone output.
CMD ["node", "server.js"]
