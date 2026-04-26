# Quoorum Dev Environment — Safe Miniserver Setup

**Date:** 2026-04-26
**Status:** Approved
**Problem:** pnpm dev / turbo build consume 2-4GB uncapped → OOM cascade kills server
**Solution:** Docker dev container with hard memory cap + shared Postgres

## 1. DB: Use postgres-vision

Create database `quoorum` in existing `optym-postgres-vision` container.
Remove `quoorum-postgres` container + 2 orphan volumes.
Update `.env` DATABASE_URL to point at postgres-vision.

Connection string: `postgresql://optym:${POSTGRES_VISION_PASSWORD}@optym-postgres-vision:5432/quoorum`

## 2. Dev Container (docker-compose.dev.yml)

Docker Compose file at `/home/arturo/quoorum/docker-compose.dev.yml`:

```yaml
services:
  dev:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: quoorum-dev
    mem_limit: 2g
    memswap_limit: 2g
    cpus: 2.0
    volumes:
      - .:/app
      - quoorum_node_modules:/app/node_modules
    environment:
      - DATABASE_URL=postgresql://optym:${POSTGRES_VISION_PASSWORD:-optym_vision_2026}@optym-postgres-vision:5432/quoorum
      - AUTH_SECRET=${AUTH_SECRET:-quoorum-dev-secret}
      - NODE_OPTIONS=--max-old-space-size=1536
      - OPENAI_API_KEY=${OPENAI_API_KEY:-}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-}
      - GOOGLE_AI_API_KEY=${GOOGLE_AI_API_KEY:-}
      - DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY:-}
      - NEXT_PUBLIC_APP_URL=https://app.quoorum.pro
    ports:
      - "127.0.0.1:3003:3000"
    command: pnpm dev --filter=@quoorum/web
    networks:
      - optym_optym-network
    restart: "no"

volumes:
  quoorum_node_modules:

networks:
  optym_optym-network:
    external: true
```

Protections:
- `mem_limit: 2g` + `memswap_limit: 2g` = hard OOM kill at 2GB, no swap thrashing
- `cpus: 2.0` = cannot saturate server
- `NODE_OPTIONS=--max-old-space-size=1536` = Node GC before Docker kills
- `restart: "no"` = OOM death stays dead, no crash-restart loop

## 3. Dockerfile.dev

Lightweight — install deps only, no build. Source mounted via volume.

```dockerfile
FROM node:22-alpine
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/web/package.json apps/web/
COPY packages/api/package.json packages/api/
COPY packages/core/package.json packages/core/
COPY packages/db/package.json packages/db/
COPY packages/ui/package.json packages/ui/
COPY packages/quoorum/package.json packages/quoorum/
COPY packages/workers/package.json packages/workers/
COPY packages/ai/package.json packages/ai/
RUN pnpm install --frozen-lockfile
```

## 4. Wrapper Scripts

`/home/arturo/bin/quoorum-dev.sh` — Start dev server
`/home/arturo/bin/quoorum-stop.sh` — Stop dev server
`/home/arturo/bin/quoorum-build.sh` — Production build (same container, mem-limited)

## 5. Cleanup

- Remove container `quoorum-postgres`
- Remove volumes `quoorum_postgres_data` + `quoorum_quoorum_postgres_data`
- Delete old `node_modules/` (1.2GB) — container uses named volume
- Update `.env` DATABASE_URL

## 6. DB Migration

Run Drizzle migrations against new postgres-vision DB:
```bash
docker compose -f docker-compose.dev.yml run --rm dev pnpm db:migrate
```
