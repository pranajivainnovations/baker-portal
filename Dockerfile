# CrossFriend Baker Portal — Next.js Dockerfile
# Multi-stage build for a lean production image (standalone output).
# Mirrors crossfriend-ops deliberately: same base, same non-root user, same bind/healthcheck fixes.

# Stage 1: Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# No build ARGs needed. This app reads exactly one variable — MEDUSA_BACKEND_URL — and reads it
# server-side at runtime, so nothing has to be baked into the client bundle. It deliberately holds
# no database credentials and no signing secrets: baker identity is decided entirely by the backend,
# and this app only forwards an opaque session token.
RUN npm run build

# Stage 2: Runner (Production)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=5000
# Next standalone's server.js binds to os.hostname() by default, which inside Docker resolves to the
# container's bridge IP rather than loopback — external traffic through the port mapping works, but
# anything hitting 127.0.0.1 from *inside* the container (the healthcheck below) is refused.
# Forcing the wildcard bind fixes it. Same issue and same fix as crossfriend-ops.
ENV HOSTNAME=0.0.0.0

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Standalone output already bundles next.config's compiled settings — no need to copy it separately.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 5000

# Explicit 127.0.0.1, not localhost — Alpine resolves "localhost" to ::1 (IPv6) first, while the
# HOSTNAME=0.0.0.0 bind above is IPv4-only, so a "localhost" healthcheck would be refused forever
# against a perfectly healthy app.
#
# Probes /login rather than / because / redirects (to /login or /dashboard depending on the session
# cookie), and wget --spider treats a 3xx without a followed body as a failure.
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:5000/login || exit 1

CMD ["node", "server.js"]
