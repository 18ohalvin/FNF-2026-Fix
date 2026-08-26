# ==========================================
# Fullstack Production Dockerfile (Node.js 22, Debian slim)
# ==========================================
# Debian slim (not Alpine) — better-sqlite3 always compiles its native
# addon via node-gyp (no prebuilt binaries for this version), and on
# Alpine that download hits the "unofficial-builds.nodejs.org" musl
# headers mirror, which was unreliable on our deploy server. Debian
# uses the standard, reliably-reachable nodejs.org headers URL instead.
FROM node:22-slim AS builder

WORKDIR /app

# Install native OS build dependencies for compiling better-sqlite3 (C++ bindings)
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# Copy package management manifests first for cache optimization
COPY package*.json ./

# Install dependencies (compiles better-sqlite3 with C++ build tools)
RUN npm ci

# Copy full application source code
COPY . .

# Compile Vue 3 frontend dist bundle
RUN npm run build

# Remove development devDependencies to minimize image size
RUN npm prune --production

# ==========================================
# STAGE 2: Lightweight Production Runtime
# ==========================================
FROM node:22-slim AS runner

WORKDIR /app

# Set Production Environment
ENV NODE_ENV=production
ENV PORT=7070
ENV DB_PATH=/app/data/database.sqlite

# curl for the container HEALTHCHECK probe
RUN apt-get update && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

# Create volume directory for SQLite database persistence
RUN mkdir -p /app/data

# Copy production node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/src/server ./src/server

# Declare volume for persistent SQLite storage
VOLUME ["/app/data"]

# Expose Application Port
EXPOSE 7070

# Container Health Check Probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl --fail --silent http://localhost:7070/api/health || exit 1

# Start Fullstack Application Server
CMD ["node", "server.js"]
