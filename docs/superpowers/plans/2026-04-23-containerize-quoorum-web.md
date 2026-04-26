# Containerize Quoorum Web — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Containerize the Quoorum Next.js web app so it runs as a Docker service alongside quoorum-postgres, accessible via Caddy at quoorum.pro.

**Architecture:** Multi-stage Docker build using Next.js standalone output. The web container exposes port 3000 to the host. Caddy already routes `quoorum.pro` to `172.19.0.1:3000` (host gateway), so no Caddy or network changes needed. DATABASE_URL inside the container points to `quoorum-postgres:5432` via Docker internal DNS.

**Tech Stack:** Next.js 15, pnpm 9, Node 22, Docker multi-stage, PostgreSQL 16

---

### Task 1: Enable Next.js standalone output

**Files:**
- Modify: `apps/web/next.config.ts`

- [ ] **Step 1: Add `output: "standalone"` to next.config.ts**

```typescript
const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@quoorum/ui", "@quoorum/api", "@quoorum/core", "@quoorum/db", "@quoorum/quoorum", "@quoorum/workers"],
```

Only add the `output: "standalone",` line after the opening brace. Everything else stays.

- [ ] **Step 2: Commit**

```bash
cd /home/arturo/quoorum
git add apps/web/next.config.ts
git commit -m "feat: enable Next.js standalone output for Docker"
```

---

### Task 2: Create .dockerignore

**Files:**
- Create: `.dockerignore`

- [ ] **Step 1: Create `.dockerignore` in project root**

```
node_modules
.next
.git
*.md
!README.md
e2e
backups
docs
scripts
*.sql
*.log
*.txt
.env*
!.env.example
```

- [ ] **Step 2: Commit**

```bash
cd /home/arturo/quoorum
git add .dockerignore
git commit -m "feat: add .dockerignore for Docker build context"
```

---

### Task 3: Create Dockerfile

**Files:**
- Create: `Dockerfile`

- [ ] **Step 1: Create multi-stage Dockerfile in project root**

```dockerfile
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# --- Install dependencies ---
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/api/package.json packages/api/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/quoorum/package.json packages/quoorum/package.json
COPY packages/workers/package.json packages/workers/package.json
COPY packages/ai/package.json packages/ai/package.json
RUN pnpm install --frozen-lockfile

# --- Build ---
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/*/node_modules ./packages/
COPY . .

# Build args become env vars at build time
ARG DATABASE_URL=postgresql://postgres:postgres@quoorum-postgres:5432/quoorum
ARG NEXT_PUBLIC_APP_URL=https://app.quoorum.pro
ENV DATABASE_URL=${DATABASE_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

RUN pnpm build --filter=@quoorum/web

# --- Runtime ---
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./apps/web/public

# standalone output includes only what's needed
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "apps/web/server.js"]
```

**Notes:**
- The `deps` stage copies only package.json files for layer caching.
- The `builder` stage needs DATABASE_URL at build time because Drizzle may run schema generation during build.
- The `runner` stage is minimal — just the standalone server output + static files.
- The COPY of packages/*/node_modules uses a glob; if pnpm hoists differently, deps stage handles it.

- [ ] **Step 2: Commit**

```bash
cd /home/arturo/quoorum
git add Dockerfile
git commit -m "feat: add multi-stage Dockerfile for Next.js standalone"
```

---

### Task 4: Update docker-compose.yml

**Files:**
- Modify: `docker-compose.yml`

- [ ] **Step 1: Add quoorum-web service to docker-compose.yml**

Add this service block after the postgres service:

```yaml
  web:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        DATABASE_URL: postgresql://postgres:postgres@quoorum-postgres:5432/quoorum
        NEXT_PUBLIC_APP_URL: https://app.quoorum.pro
    container_name: quoorum-web
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:postgres@quoorum-postgres:5432/quoorum
      - AUTH_SECRET=${AUTH_SECRET}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - GOOGLE_AI_API_KEY=${GOOGLE_AI_API_KEY}
      - DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}
      - NEXT_PUBLIC_APP_URL=https://app.quoorum.pro
      - QUOORUM_EMAIL_FROM=${QUOORUM_EMAIL_FROM}
      - PINECONE_INDEX=${PINECONE_INDEX}
    depends_on:
      postgres:
        condition: service_healthy
```

**Key decisions:**
- Secrets via `${VAR}` — Docker Compose reads from `.env` file in same directory. We'll create a `.env` from `.env.local`.
- `depends_on` with health condition ensures postgres is ready before web starts.
- Port 3000 exposed to host = Caddy reaches it via `172.19.0.1:3000` (already configured).
- No need to join `arturo_web_network` — Caddy routes through host gateway.

- [ ] **Step 2: Create `.env` from `.env.local` for Docker Compose variable substitution**

```bash
cp /home/arturo/quoorum/.env.local /home/arturo/quoorum/.env
```

Then edit `.env` to change DATABASE_URL (not needed at compose level since we override, but keep consistent):
```
DATABASE_URL=postgresql://postgres:postgres@quoorum-postgres:5432/quoorum
```

- [ ] **Step 3: Commit compose changes (NOT .env)**

```bash
cd /home/arturo/quoorum
git add docker-compose.yml
git commit -m "feat: add quoorum-web container to docker-compose"
```

---

### Task 5: Build and verify

- [ ] **Step 1: Build the Docker image**

```bash
cd /home/arturo/quoorum
docker compose build web
```

Expected: successful build, image created. Watch for:
- pnpm install errors (missing packages)
- Build errors (type errors, missing env vars)
- standalone output not generated (check for `.next/standalone` in build logs)

- [ ] **Step 2: Start the web container**

```bash
cd /home/arturo/quoorum
docker compose up -d web
```

- [ ] **Step 3: Verify container is running**

```bash
docker ps | grep quoorum-web
docker logs quoorum-web --tail 20
```

Expected: container UP, logs show `Ready in Xs` or `Listening on port 3000`.

- [ ] **Step 4: Test via curl from host**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

Expected: 200 (or 302 redirect to login).

- [ ] **Step 5: Test via Caddy (as Cloudflare would)**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:80 -H "Host: quoorum.pro"
```

Expected: 200 (or 302). No more 502.

- [ ] **Step 6: Commit any fixes, push**

```bash
cd /home/arturo/quoorum
git add -A
git commit -m "fix: adjustments from Docker build/run verification"
git push
```
