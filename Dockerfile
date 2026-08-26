# ==========================================
# Fullstack Production Dockerfile (Node.js 22 Alpine)
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install native OS build dependencies for compiling better-sqlite3 (C++ bindings)
RUN apk add --no-cache python3 make g++

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
FROM node:22-alpine AS runner

WORKDIR /app

# Set Production Environment
ENV NODE_ENV=production
ENV PORT=7070
ENV DB_PATH=/app/data/database.sqlite

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
  CMD wget --quiet --tries=1 --spider http://localhost:7070/api/health || exit 1

# Start Fullstack Application Server
CMD ["node", "server.js"]
