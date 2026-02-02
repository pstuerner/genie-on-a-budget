FROM node:20-alpine AS base

RUN npm install -g pnpm
RUN npm install -g tsx
 
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
 
# Install dependencies
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci --legacy-peer-deps; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi
 
# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
 
ENV NEXT_TELEMETRY_DISABLED=1
 
RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi
 
# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app
 
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
 
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next
 
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Copy the node_modules from the builder stage
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
# Copy application files needed at runtime
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/data ./data

# Install postgresql-client for pg_isready
RUN apk add --no-cache postgresql-client

# Make the startup script executable before switching users
RUN chmod +x /app/scripts/start.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["/app/scripts/start.sh"]
