# Docker Deployment Guide for IT & DevOps Team

This document provides instructions for building, running, and deploying the **FIX 707 Form** frontend container image.

---

## 1. Container Architecture Summary

- **Multi-Stage Build**:
  - **Stage 1 (Builder)**: `node:20-alpine` — Compiles Vue 3 + Vite production bundle with minification and code splitting.
  - **Stage 2 (Runner)**: `nginx:1.25-alpine` — Lightweight web server (<25MB) serving compiled static assets from `/usr/share/nginx/html`.
- **Exposed Port**: `80` (HTTP)
- **Health Check Probe**: `GET /healthz` (Returns `200 healthy`)
- **Web Server Features**: SPA Fallback Routing (`try_files`), Gzip Compression, Security Headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`), and 1-year immutable caching for `/assets/`.

---

## 2. Quick Start Commands

### Build Image
```bash
docker build -t fix-707-form:latest .
```

### Run Container
```bash
docker run -d \
  --name fix-707-app \
  --restart always \
  -p 8080:80 \
  fix-707-form:latest
```

### Test Container Health
```bash
curl -I http://localhost:8080/healthz
```

---

## 3. Docker Compose Deployment

A pre-configured [`docker-compose.yml`](file:///Users/alvindecorous/Documents/FIX%20707%20Form/docker-compose.yml) is included in the project root:

```bash
# Start container in detached mode
docker compose up -d

# Check running status and health
docker compose ps

# View live application logs
docker compose logs -f

# Stop and remove container
docker compose down
```

---

## 4. Kubernetes / Helm Deployment Probes

For Kubernetes or Cloud Run deployments, use the following container configuration:

- **Port**: `80`
- **Liveness Probe**: `httpGet` path `/healthz` on port `80`
- **Readiness Probe**: `httpGet` path `/healthz` on port `80`
