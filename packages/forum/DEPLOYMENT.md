# Forum Deployment Guide

Complete guide to deploy the Wallie Forum dynamic expert system to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Environment Variables](#environment-variables)
4. [WebSocket Server](#websocket-server)
5. [Redis Setup (Optional)](#redis-setup-optional)
6. [Production Deployment](#production-deployment)
7. [Monitoring & Logging](#monitoring--logging)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required

- Node.js 18+ (LTS recommended)
- PostgreSQL 14+ or MySQL 8+
- pnpm 8+
- OpenAI API key (or compatible LLM API)

### Optional

- Redis 7+ (for caching and rate limiting)
- Resend API key (for email notifications)
- Firebase Cloud Messaging (for push notifications)
- Puppeteer dependencies (for PDF export)

---

## Database Setup

### 1. Run Migrations

```bash
cd packages/db
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

### 2. Verify Tables

Check that these tables were created:

- `forum_debates`
- `forum_debate_comments`
- `forum_debate_likes`
- `forum_expert_performance`
- `forum_custom_experts`
- `forum_debate_templates`

### 3. Seed Data (Optional)

```bash
pnpm tsx scripts/seed-forum.ts
```

This will:
- Create sample debates
- Initialize expert performance metrics
- Add default templates

---

## Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/wallie"

# OpenAI (or compatible)
OPENAI_API_KEY="sk-..."
OPENAI_BASE_URL="https://api.openai.com/v1" # Optional, for custom endpoints

# App
NEXT_PUBLIC_APP_URL="https://app.wallie.ai"
```

### Optional Variables

```bash
# Redis (for caching and rate limiting)
REDIS_URL="redis://localhost:6379"

# Email (Resend)
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="forum@wallie.ai"

# Push Notifications (FCM)
FCM_SERVER_KEY="..."
FCM_PROJECT_ID="..."

# WebSocket
WEBSOCKET_PORT=3001
WEBSOCKET_HOST="0.0.0.0"

# Forum Config
FORUM_COMPLEXITY_THRESHOLD=5
FORUM_MAX_EXPERTS=5
FORUM_ENABLE_CACHING=true
FORUM_CACHE_EXPIRY=3600

# Rate Limiting
FORUM_MAX_DEBATES_PER_HOUR=10
FORUM_MAX_DEBATES_PER_DAY=50
FORUM_MAX_CONCURRENT_DEBATES=3
FORUM_MAX_COST_PER_DAY=10.0
```

---

## WebSocket Server

### Option 1: Standalone Server

Create `apps/websocket-server/index.ts`:

```typescript
import { ForumWebSocketServer } from '@wallie/forum'

const port = parseInt(process.env.WEBSOCKET_PORT || '3001')
const wss = new ForumWebSocketServer({ port })

wss.start()

console.log(`WebSocket server running on port ${port}`)
```

Run:

```bash
pnpm tsx apps/websocket-server/index.ts
```

### Option 2: Integrated with Next.js

Add to `apps/web/server.ts`:

```typescript
import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { ForumWebSocketServer } from '@wallie/forum'

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })

  // Attach WebSocket server
  const wss = new ForumWebSocketServer({ server })
  wss.start()

  server.listen(3000, () => {
    console.log('> Ready on http://localhost:3000')
    console.log('> WebSocket ready on ws://localhost:3000')
  })
})
```

### Option 3: Separate Service (Recommended for Production)

Deploy WebSocket server as a separate service:

```yaml
# docker-compose.yml
services:
  websocket:
    build: ./apps/websocket-server
    ports:
      - "3001:3001"
    environment:
      - WEBSOCKET_PORT=3001
      - DATABASE_URL=${DATABASE_URL}
    restart: unless-stopped
```

---

## Redis Setup (Optional)

### 1. Install Redis

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu
sudo apt install redis-server
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:7-alpine
```

### 2. Configure Forum to Use Redis

Update `packages/forum/src/rate-limiting.ts`:

```typescript
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

// Replace in-memory store with Redis
// See comments in rate-limiting.ts for implementation
```

Update `packages/forum/src/caching.ts`:

```typescript
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

// Replace in-memory cache with Redis
// See comments in caching.ts for implementation
```

---

## Production Deployment

### Vercel (Recommended for Next.js)

1. **Deploy Web App:**

```bash
cd apps/web
vercel --prod
```

2. **Set Environment Variables:**

Go to Vercel Dashboard → Settings → Environment Variables and add all required variables.

3. **Deploy WebSocket Separately:**

WebSocket needs a long-running server, so deploy to:
- Railway
- Render
- Fly.io
- AWS ECS
- Google Cloud Run

Example for Railway:

```bash
cd apps/websocket-server
railway up
```

### Docker Deployment

1. **Build Images:**

```bash
# Web app
docker build -t wallie-web -f apps/web/Dockerfile .

# WebSocket server
docker build -t wallie-websocket -f apps/websocket-server/Dockerfile .
```

2. **Run with Docker Compose:**

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: wallie
      POSTGRES_USER: wallie
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  web:
    image: wallie-web
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://wallie:${DB_PASSWORD}@db:5432/wallie
      - REDIS_URL=redis://redis:6379
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - db
      - redis

  websocket:
    image: wallie-websocket
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://wallie:${DB_PASSWORD}@db:5432/wallie
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

volumes:
  postgres_data:
  redis_data:
```

Run:

```bash
docker-compose up -d
```

### Kubernetes Deployment

See `k8s/` directory for Kubernetes manifests.

---

## Monitoring & Logging

### 1. Application Logs

Forum uses structured logging. Configure handlers:

```typescript
import { logger, jsonHandler } from '@wallie/forum'

// Send logs to external service
logger.addHandler(jsonHandler((entry) => {
  // Send to Datadog, Sentry, etc.
  fetch('https://logs.datadoghq.com/...', {
    method: 'POST',
    body: JSON.stringify(entry),
  })
}))
```

### 2. Metrics

Enable metrics collection:

```typescript
import { metrics } from '@wallie/forum'

// Periodically send metrics
setInterval(() => {
  const report = metrics.generateReport()
  // Send to monitoring service
}, 60000)
```

### 3. Error Tracking

Integrate with Sentry:

```typescript
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
})

// Wrap debate execution
try {
  await runDynamicDebate(options)
} catch (error) {
  Sentry.captureException(error)
  throw error
}
```

### 4. Database Monitoring

Monitor key metrics:
- Debate creation rate
- Average debate duration
- Expert performance trends
- Cache hit rate
- Rate limit violations

Query examples:

```sql
-- Debates per day
SELECT DATE(created_at), COUNT(*)
FROM forum_debates
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at);

-- Average consensus score
SELECT AVG(consensus_score)
FROM forum_debates
WHERE status = 'completed';

-- Most used experts
SELECT experts->>0 as expert, COUNT(*)
FROM forum_debates
WHERE experts IS NOT NULL
GROUP BY expert
ORDER BY COUNT(*) DESC
LIMIT 10;
```

---

## Troubleshooting

### WebSocket Connection Issues

**Problem:** Clients can't connect to WebSocket

**Solutions:**
1. Check firewall allows port 3001
2. Verify CORS settings
3. Check WebSocket server is running
4. Try connecting with `wscat`:
   ```bash
   npx wscat -c ws://localhost:3001
   ```

### High Latency

**Problem:** Debates take too long

**Solutions:**
1. Enable caching (check `FORUM_ENABLE_CACHING=true`)
2. Use Redis for distributed caching
3. Reduce `maxExpertsPerDebate` in config
4. Use `static` mode for simple questions
5. Check OpenAI API latency

### Rate Limit Issues

**Problem:** Users hitting rate limits too often

**Solutions:**
1. Increase limits in config
2. Implement premium tiers
3. Use Redis for accurate distributed rate limiting
4. Monitor with `getAllRateLimitData()`

### Database Performance

**Problem:** Slow queries

**Solutions:**
1. Add indexes:
   ```sql
   CREATE INDEX idx_debates_user ON forum_debates(user_id);
   CREATE INDEX idx_debates_status ON forum_debates(status);
   CREATE INDEX idx_debates_created ON forum_debates(created_at);
   ```
2. Enable query logging
3. Use connection pooling
4. Consider read replicas

### PDF Export Fails

**Problem:** PDF generation errors

**Solutions:**
1. Install Puppeteer dependencies:
   ```bash
   # Ubuntu
   sudo apt-get install -y \
     chromium-browser \
     fonts-liberation \
     libnss3 \
     libatk-bridge2.0-0
   ```
2. Check disk space
3. Increase memory limits
4. Use fallback to HTML-to-PDF libraries

### Memory Leaks

**Problem:** Server memory grows over time

**Solutions:**
1. Clear expired cache regularly:
   ```typescript
   setInterval(() => clearExpiredCache(), 3600000) // hourly
   ```
2. Limit concurrent debates
3. Monitor with `process.memoryUsage()`
4. Restart workers periodically

---

## Security Checklist

- [ ] Environment variables are secure
- [ ] Database uses SSL/TLS
- [ ] Rate limiting is enabled
- [ ] Input validation is active
- [ ] CORS is configured properly
- [ ] WebSocket has authentication
- [ ] API keys are rotated regularly
- [ ] Logs don't contain sensitive data
- [ ] Dependencies are up to date
- [ ] Admin endpoints require auth

---

## Performance Optimization

### 1. Enable All Caching

```typescript
updateConfig({
  enableCaching: true,
  cacheExpiry: 3600,
})
```

### 2. Use Redis

Replace in-memory stores with Redis for:
- Debate caching
- Rate limiting
- Expert performance metrics

### 3. Optimize Database

- Add indexes on frequently queried columns
- Use connection pooling
- Enable query caching
- Consider read replicas

### 4. CDN for Static Assets

Serve debate exports (PDFs, images) via CDN:
- Cloudflare
- AWS CloudFront
- Vercel Edge Network

### 5. Load Balancing

For high traffic, use multiple instances:
- Web app: Vercel auto-scales
- WebSocket: Use sticky sessions with load balancer
- Database: Use read replicas

---

## Backup & Recovery

### Database Backups

```bash
# Automated daily backups
pg_dump -h localhost -U wallie wallie > backup-$(date +%Y%m%d).sql

# Restore
psql -h localhost -U wallie wallie < backup-20240101.sql
```

### Redis Backups

```bash
# Save snapshot
redis-cli SAVE

# Copy RDB file
cp /var/lib/redis/dump.rdb /backups/
```

---

## Scaling Guide

### Horizontal Scaling

1. **Web App:** Auto-scales on Vercel
2. **WebSocket:** Deploy multiple instances with Redis pub/sub
3. **Database:** Use read replicas for queries
4. **Redis:** Use Redis Cluster for high availability

### Vertical Scaling

Increase resources based on bottlenecks:
- **CPU-bound:** More cores for debate processing
- **Memory-bound:** More RAM for caching
- **I/O-bound:** Faster disks for database

---

## Support

For deployment issues:
- GitHub Issues: https://github.com/arturoyo/Wallie/issues
- Documentation: https://docs.wallie.ai/deployment
- Email: support@wallie.ai
