# Use imbios/bun-node as base image
FROM imbios/bun-node AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install dependencies using bun
COPY package.json bun.lock* ./
RUN bun install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

# Add build arguments for Next.js public variables
ARG NEXT_PUBLIC_SOLANA_RPC_HTTP
ARG NEXT_PUBLIC_DEFAULT_CLUSTER
ENV NEXT_PUBLIC_SOLANA_RPC_HTTP=$NEXT_PUBLIC_SOLANA_RPC_HTTP
ENV NEXT_PUBLIC_DEFAULT_CLUSTER=$NEXT_PUBLIC_DEFAULT_CLUSTER

RUN bun run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs || true
RUN adduser --system --uid 1001 nextjs || true

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Use root user since we can't change ownership
# USER nextjs

EXPOSE 4000

ENV PORT=4000
# set hostname to localhost
ENV HOSTNAME="0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]
