FROM node:20-alpine AS base

# 1. Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm install

# 2. Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client (Architecture sensitive)
ENV PRISMA_CLI_QUERY_ENGINE_TYPE=library
RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npm run build

# 3. Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodev
RUN adduser --system --uid 1001 nextjs

# Set correct permissions for the database folder
RUN mkdir -p prisma && chown -R nextjs:nodev prisma

# Copy public assets
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodev .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodev /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodev /app/.next/static ./.next/static

# IMPORTANT: Copy Prisma and management scripts
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/seed-admin.js ./seed-admin.js
COPY --from=builder /app/package.json ./package.json
# Copy node_modules to ensure maintainability tools and bcryptjs are available
COPY --from=builder /app/node_modules ./node_modules

# Copy entrypoint script
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh

# Ensure the SQLite DB path is accessible (if used) or just persistent prisma files
VOLUME ["/app/prisma"]

# Grant permissions to the nextjs user for the whole app
RUN chmod +x docker-entrypoint.sh && chown -R nextjs:nodev /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Auto-run migrations + seed, then start the app
CMD ["sh", "docker-entrypoint.sh"]

