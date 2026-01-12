# 🚀 DEPLOYMENT.md — Guía de Deployment para Wallie

> **Versión:** 1.2.0 | **Última actualización:** 05 Dic 2025
> **Plataforma:** Vercel + Supabase + WhatsApp Cloud API + Resend
> **Proyecto:** Wallie - Asistente de WhatsApp con IA

---

## 📋 ÍNDICE

1. [Entornos](#-entornos)
2. [Pre-Deployment Checklist](#-pre-deployment-checklist)
3. [Variables de Entorno](#-variables-de-entorno)
4. [WhatsApp Cloud API Setup](#-whatsapp-cloud-api-setup)
5. [Deployment a Vercel](#-deployment-a-vercel)
6. [Baileys Worker Deployment](#-baileys-worker-deployment)
7. [Database Setup](#-database-setup)
8. [CI/CD Pipeline](#-cicd-pipeline)
9. [Rollback](#-rollback)
10. [Monitoreo](#-monitoreo)
11. [Troubleshooting](#-troubleshooting)

---

## 🌍 ENTORNOS

### Overview

| Entorno         | URL                  | Branch      | Database           | Propósito  |
| --------------- | -------------------- | ----------- | ------------------ | ---------- |
| **Development** | localhost:3000       | \*          | Local/Docker       | Desarrollo |
| **Preview**     | wallie-\*.vercel.app | PR branches | Supabase (staging) | Review PRs |
| **Staging**     | staging.wallie.app   | develop     | Supabase (staging) | QA/Testing |
| **Production**  | wallie.app           | main        | Supabase (prod)    | Usuarios   |

### Flujo de Deployment

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Development │────▶│   Preview   │────▶│   Staging   │────▶│ Production  │
│   (local)   │     │   (PR)      │     │  (develop)  │     │   (main)    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │                   │
      │                   │                   │                   │
      ▼                   ▼                   ▼                   ▼
   Feature            Auto deploy         Auto deploy         Manual/
   branches           on PR               on merge            Auto deploy
```

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### Antes de Deploy a Producción

```markdown
## Código

- [ ] Todos los tests pasan (`pnpm test`)
- [ ] TypeScript sin errores (`pnpm typecheck`)
- [ ] Lint sin warnings (`pnpm lint`)
- [ ] Build exitoso (`pnpm build`)
- [ ] No hay `console.log` en producción
- [ ] No hay datos mock
- [ ] No hay TODOs críticos

## Seguridad

- [ ] `git secrets --scan` limpio
- [ ] `pnpm audit` sin vulnerabilidades críticas
- [ ] Variables de entorno configuradas
- [ ] Secrets rotados si hubo exposición
- [ ] Rate limiting verificado
- [ ] WHATSAPP_APP_SECRET configurado para firma de webhooks

## WhatsApp Cloud API

- [ ] Webhook URL configurado en Meta Business
- [ ] Verify token coincide con env
- [ ] Número de teléfono verificado
- [ ] Campos `messages` suscritos
- [ ] Firma de webhooks verificada
- [ ] Mensaje de prueba enviado/recibido

## Base de Datos

- [ ] Migraciones aplicadas en staging
- [ ] Migraciones probadas
- [ ] Backup de producción realizado
- [ ] Plan de rollback definido

## Infraestructura

- [ ] Vercel configurado correctamente
- [ ] Domains configurados (wallie.app)
- [ ] SSL activo
- [ ] Headers de seguridad verificados

## Integraciones

- [ ] Stripe webhooks configurados
- [ ] Resend dominio verificado
- [ ] OpenAI API key válida
- [ ] Supabase RLS policies activas

## Monitoreo

- [ ] Sentry configurado
- [ ] Alertas configuradas
- [ ] Health checks funcionando (`/api/health`)
- [ ] Logging configurado

## Documentación

- [ ] CHANGELOG actualizado
- [ ] README actualizado si necesario
- [ ] Breaking changes documentados
```

---

## 🚀 PRE-LAUNCH CHECKLIST

### Checklist Final Antes del Lanzamiento

```markdown
## 1. Verificación de Features Core

- [ ] Login/Logout funciona correctamente
- [ ] Dashboard carga sin errores
- [ ] Lista de clientes muestra datos reales
- [ ] Chat en tiempo real funciona
- [ ] Mensajes de WhatsApp se reciben
- [ ] Mensajes de WhatsApp se envían
- [ ] AI genera respuestas correctamente
- [ ] Sugerencias de respuesta funcionan

## 2. Verificación de Flujos Críticos

- [ ] Registro de nuevo usuario
- [ ] Verificación de email
- [ ] Creación de cliente
- [ ] Envío de mensaje desde dashboard
- [ ] Recepción de mensaje desde WhatsApp
- [ ] Respuesta automática con AI
- [ ] Búsqueda de conversaciones
- [ ] Filtros funcionan correctamente

## 3. Integración WhatsApp

- [ ] Webhook responde 200 OK
- [ ] Mensajes entrantes se guardan en DB
- [ ] Mensajes salientes llegan al cliente
- [ ] Estados de mensaje se actualizan (sent, delivered, read)
- [ ] Medios (imágenes, audio) se manejan correctamente

## 4. Rendimiento

- [ ] First Load JS < 200KB (actual: ~87KB)
- [ ] Time to Interactive < 3s
- [ ] Core Web Vitals en verde
- [ ] No memory leaks en conversaciones largas

## 5. Seguridad Pre-Launch

- [ ] Verificar que no hay datos de prueba en producción
- [ ] RLS policies activas en todas las tablas
- [ ] API keys son de producción (no test)
- [ ] Webhook signatures se verifican
- [ ] CORS configurado correctamente
- [ ] Rate limiting activo en endpoints públicos

## 6. Backup & Recovery

- [ ] Backup de base de datos configurado
- [ ] Script de rollback probado
- [ ] Plan de contingencia documentado
- [ ] Contactos de emergencia actualizados

## 7. Legal & Compliance

- [ ] Política de privacidad publicada
- [ ] Términos de servicio publicados
- [ ] Consentimiento GDPR implementado
- [ ] Política de cookies activa
```

---

## 🔐 VARIABLES DE ENTORNO

### Configuración por Entorno

```bash
# ═══════════════════════════════════════════════════════════
# DESARROLLO (.env.local)
# ═══════════════════════════════════════════════════════════

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
DATABASE_URL="postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres"

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN="EAAx..."
WHATSAPP_PHONE_NUMBER_ID="123456789"
WHATSAPP_WEBHOOK_VERIFY_TOKEN="mi-token-secreto"
WHATSAPP_APP_SECRET="xxx"

# AI & Auto-reply
OPENAI_API_KEY="sk-..."
AUTO_REPLY_ENABLED="false"
BUSINESS_NAME="Mi Negocio"
DEFAULT_USER_ID="uuid-de-usuario"

# Stripe (test keys)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_PRICE_STARTER="price_xxx"
STRIPE_PRICE_PRO="price_yyy"
STRIPE_PRICE_BUSINESS="price_zzz"

# Email
RESEND_API_KEY="re_xxx"
EMAIL_FROM="Wallie <hola@wallie.ai>"

# ═══════════════════════════════════════════════════════════
# STAGING (Vercel Environment Variables)
# ═══════════════════════════════════════════════════════════

NEXT_PUBLIC_APP_URL="https://staging.wallie.app"
NODE_ENV="production"
DATABASE_URL="postgresql://...@db.xxx-staging.supabase.co:5432/postgres"
AUTO_REPLY_ENABLED="true"  # Activar en staging para testing
# ... resto con keys de staging

# ═══════════════════════════════════════════════════════════
# PRODUCCIÓN (Vercel Environment Variables)
# ═══════════════════════════════════════════════════════════

NEXT_PUBLIC_APP_URL="https://wallie.app"
NODE_ENV="production"
DATABASE_URL="postgresql://...@db.xxx-prod.supabase.co:5432/postgres"
AUTO_REPLY_ENABLED="true"
STRIPE_SECRET_KEY="sk_live_..."  # ⚠️ LIVE KEY
# ... resto con keys de producción
```

### Configurar en Vercel

1. Ir a **Project Settings** → **Environment Variables**
2. Añadir cada variable
3. Seleccionar entornos: Preview, Production
4. Para secrets sensibles, usar Vercel's encrypted secrets

```bash
# CLI alternativo
vercel env add DATABASE_URL production
vercel env add STRIPE_SECRET_KEY production
```

### Validación de Env

```typescript
// env.ts - Validar en build time
import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']),
    DATABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    // ... resto
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    // ... mapear todas
  },
})
```

---

## 📱 WHATSAPP CLOUD API SETUP

### 1. Crear App en Meta Business

1. Ir a [developers.facebook.com](https://developers.facebook.com)
2. Crear nueva App → Tipo: **Business**
3. Añadir producto: **WhatsApp**
4. Obtener credenciales de la sección **WhatsApp > Getting Started**

### 2. Configurar Webhook

```bash
# URL del webhook (producción)
https://wallie.app/api/webhooks/whatsapp

# URL del webhook (staging)
https://staging.wallie.app/api/webhooks/whatsapp
```

**Campos a suscribir:**

- `messages` - Mensajes entrantes
- `message_status` - Estados de entrega

**Configuración en Meta:**

1. WhatsApp → Configuration → Webhook
2. Callback URL: `https://wallie.app/api/webhooks/whatsapp`
3. Verify Token: Mismo valor que `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
4. Suscribir campos: `messages`

### 3. Verificar Número de Teléfono

1. Añadir número de teléfono de prueba en **WhatsApp > Phone Numbers**
2. Completar verificación por código SMS/llamada
3. Guardar el `Phone Number ID` en las variables de entorno

### 4. Verificar Firma de Webhooks

```typescript
// packages/whatsapp/src/verify-signature.ts
import { createHmac, timingSafeEqual } from 'crypto'

export function verifyWhatsAppSignature(
  payload: string,
  signature: string | null,
  appSecret: string
): boolean {
  if (!signature) return false

  const expectedSignature = createHmac('sha256', appSecret).update(payload).digest('hex')

  const providedSignature = signature.replace('sha256=', '')

  try {
    return timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(providedSignature))
  } catch {
    return false
  }
}
```

### 5. Testing del Webhook

```bash
# Verificar que el webhook responde correctamente
curl -X GET "https://wallie.app/api/webhooks/whatsapp?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=tu-token"
# Debe responder: test123

# Enviar mensaje de prueba
curl -X POST https://wallie.app/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "34600000000",
            "text": {"body": "Hola test"}
          }]
        }
      }]
    }]
  }'
```

---

## ▲ DEPLOYMENT A VERCEL

### Setup Inicial

1. **Conectar repositorio**

   ```bash
   # Opción 1: Vercel CLI
   vercel link

   # Opción 2: Dashboard
   # Ir a vercel.com → New Project → Import Git Repository
   ```

2. **Configurar proyecto**

   ```json
   // vercel.json
   {
     "framework": "nextjs",
     "buildCommand": "pnpm build",
     "installCommand": "pnpm install",
     "outputDirectory": "apps/web/.next"
   }
   ```

3. **Configurar monorepo**
   - Root Directory: `apps/web`
   - Build Command: `cd ../.. && pnpm build --filter=web`
   - Install Command: `cd ../.. && pnpm install`

### Deployment Automático

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm test

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: ${{ github.ref == 'refs/heads/main' && '--prod' || '' }}
```

### Deployment Manual

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod

# Deploy con variables de entorno específicas
vercel --env DATABASE_URL=xxx --prod
```

---

## 🐳 BAILEYS WORKER DEPLOYMENT

### Descripción

El Baileys Worker es un microservicio Docker separado que maneja operaciones de WhatsApp mediante la librería Baileys. **NO puede desplegarse en Vercel** debido a que requiere conexiones WebSocket persistentes.

### Plataformas Recomendadas

| Plataforma | Costo     | Ventajas                  | Desventajas            |
| ---------- | --------- | ------------------------- | ---------------------- |
| Railway    | ~$5/mes   | Fácil, Docker nativo, SSL | Límite de horas gratis |
| Render     | $7/mes    | Docker, escalable         | Cold starts en free    |
| Fly.io     | ~$5/mes   | Global, bajo latencia     | Config más compleja    |
| VPS        | $5-10/mes | Control total             | Más mantenimiento      |

### Paso 1: Desplegar en Railway

```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Crear proyecto
railway init

# 4. Enlazar con el directorio del worker
cd packages/baileys-worker
railway link

# 5. Configurar variables de entorno en Railway Dashboard:
#    - PORT: 3000
#    - BAILEYS_SERVICE_SECRET: (generar uno seguro)
#    - BAILEYS_API_KEY: (mismo que SERVICE_SECRET)
#    - NODE_ENV: production
#    - LOG_LEVEL: info

# 6. Desplegar
railway up
```

### Paso 2: Configurar Vercel (Wallie Core)

Una vez desplegado el Worker, obtén su URL pública y actualiza Vercel:

```bash
# En el dashboard de Vercel, añadir variable de entorno:
BAILEYS_WORKER_URL=https://baileys-production.up.railway.app
BAILEYS_SERVICE_SECRET=<el-mismo-secret-que-pusiste-en-railway>
```

### Paso 3: Sincronización de Base de Datos

Antes de lanzar, asegura que producción tiene todas las tablas necesarias:

```bash
# Apuntar a la DB de producción
DATABASE_URL="postgresql://..." pnpm db:push

# Verificar en Supabase Studio que existen:
# - client_scoring
# - referral_codes (si existe)
# - Cualquier tabla nueva del sprint
```

### Paso 4: Smoke Test

#### Prueba A: Mystery Shopper

1. Ve a `https://wallie.pro/tools/speed-test`
2. Introduce tu móvil personal
3. **Expectativa**: Recibes un WhatsApp del número "Worker" y la web muestra el cronómetro

#### Prueba B: Import WhatsApp

1. Ve a `/settings/knowledge`
2. Click "Importar Historial"
3. **Expectativa**: Aparece QR, lo escaneas, y comienza la importación

#### Prueba C: Escaneo B2B

1. Ve a `/dashboard/referrals`
2. Introduce algunos números en "Escanear Agenda B2B"
3. **Expectativa**: Detecta cuáles son cuentas business

### Docker Compose (Desarrollo Local)

```yaml
# packages/baileys-worker/docker-compose.yml
version: '3.8'

services:
  baileys-worker:
    build: .
    ports:
      - '3001:3000'
    environment:
      - PORT=3000
      - BAILEYS_API_KEY=dev-key
      - BAILEYS_SERVICE_SECRET=dev-key
      - NODE_ENV=development
      - LOG_LEVEL=debug
    volumes:
      - ./sessions:/app/sessions
    restart: unless-stopped
```

### Gestión de Cron Jobs (Workaround Vercel Hobby)

Vercel Hobby no soporta Cron Jobs. Alternativas:

| Servicio       | Costo  | Notas               |
| -------------- | ------ | ------------------- |
| Cron-Job.org   | Gratis | Hasta 1 llamada/min |
| EasyCron       | Gratis | 200 llamadas/día    |
| Upstash QStash | Gratis | 500 mensajes/día    |

**Configurar:**

1. Crear cuenta en cron-job.org
2. Añadir job que llame a:
   - `POST https://wallie.pro/api/cron/daily-maintenance` (1x/día)
   - `POST https://wallie.pro/api/cron/scoring-update` (1x/hora si necesario)
3. Añadir header de autenticación si el endpoint lo requiere

### Variables de Entorno del Worker

```bash
# Required
PORT=3000
BAILEYS_SERVICE_SECRET=<secret-compartido-con-vercel>

# Optional
BAILEYS_API_KEY=<para-llamadas-directas>
NODE_ENV=production
LOG_LEVEL=info
CORS_ORIGIN=https://wallie.pro
```

### Monitoreo del Worker

```bash
# Health check
curl https://baileys-production.up.railway.app/health

# Status detallado (requiere API key)
curl -H "x-api-key: TU_KEY" https://baileys-production.up.railway.app/status
```

### Troubleshooting Worker

#### Worker no responde

```bash
# Verificar logs en Railway
railway logs

# Verificar que el servicio está corriendo
railway status
```

#### QR no aparece

- Verificar que el worker puede abrir conexiones WebSocket
- Verificar que no hay otra sesión activa con el mismo número
- Revisar logs: `railway logs | grep "QR"`

#### Mensajes no se envían

- Verificar que la sesión está conectada: `GET /status`
- Verificar rate limits (no enviar más de 1 msg/seg)
- Revisar si el número está baneado en WhatsApp

---

## 🗄️ DATABASE SETUP

### Supabase Setup

1. **Crear proyecto en Supabase**
   - Ir a supabase.com
   - New Project
   - Seleccionar región cercana a usuarios

2. **Configurar conexión**

   ```bash
   # Connection string
   DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

   # Para migraciones (conexión directa)
   DATABASE_URL_DIRECT="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
   ```

3. **Ejecutar migraciones**

   ```bash
   # Generar migraciones
   pnpm db:generate

   # Aplicar a staging
   DATABASE_URL=$STAGING_DATABASE_URL pnpm db:push

   # Aplicar a producción
   DATABASE_URL=$PROD_DATABASE_URL pnpm db:push
   ```

### Migración Segura a Producción

```bash
#!/bin/bash
# scripts/migrate-prod.sh

echo "🔄 Iniciando migración a producción..."

# 1. Crear backup
echo "→ Creando backup..."
pg_dump $PROD_DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Verificar migración en staging primero
echo "→ Verificando que staging está actualizado..."
DATABASE_URL=$STAGING_DATABASE_URL pnpm db:push

# 3. Ejecutar en producción
echo "→ Aplicando migración a producción..."
DATABASE_URL=$PROD_DATABASE_URL pnpm db:push

# 4. Verificar
echo "→ Verificando migración..."
psql $PROD_DATABASE_URL -c "SELECT * FROM drizzle_migrations ORDER BY id DESC LIMIT 1;"

echo "✅ Migración completada"
```

---

## 🔄 CI/CD PIPELINE

### GitHub Actions Completo

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  # ═══════════════════════════════════════════════════════════
  # QUALITY CHECKS
  # ═══════════════════════════════════════════════════════════
  quality:
    name: Quality Checks
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: TypeScript Check
        run: pnpm typecheck

      - name: Lint
        run: pnpm lint

      - name: Check formatting
        run: pnpm format:check

  # ═══════════════════════════════════════════════════════════
  # TESTS
  # ═══════════════════════════════════════════════════════════
  test:
    name: Tests
    runs-on: ubuntu-latest
    needs: quality
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run unit tests
        run: pnpm test:unit
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - name: Run integration tests
        run: pnpm test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  # ═══════════════════════════════════════════════════════════
  # E2E TESTS
  # ═══════════════════════════════════════════════════════════
  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Install Playwright
        run: pnpm exec playwright install --with-deps

      - name: Build
        run: pnpm build

      - name: Run E2E tests
        run: pnpm test:e2e

      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

  # ═══════════════════════════════════════════════════════════
  # SECURITY
  # ═══════════════════════════════════════════════════════════
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Audit dependencies
        run: pnpm audit --audit-level=high
        continue-on-error: true

      - name: Check for secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}

  # ═══════════════════════════════════════════════════════════
  # DEPLOY PREVIEW
  # ═══════════════════════════════════════════════════════════
  deploy-preview:
    name: Deploy Preview
    runs-on: ubuntu-latest
    needs: [quality, test]
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        id: deploy
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

      - name: Comment PR
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🚀 Preview deployed to: ${{ steps.deploy.outputs.preview-url }}'
            })

  # ═══════════════════════════════════════════════════════════
  # DEPLOY STAGING
  # ═══════════════════════════════════════════════════════════
  deploy-staging:
    name: Deploy Staging
    runs-on: ubuntu-latest
    needs: [quality, test, e2e]
    if: github.ref == 'refs/heads/develop'
    environment: staging
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          alias-domains: staging.proyecto.com

  # ═══════════════════════════════════════════════════════════
  # DEPLOY PRODUCTION
  # ═══════════════════════════════════════════════════════════
  deploy-production:
    name: Deploy Production
    runs-on: ubuntu-latest
    needs: [quality, test, e2e, security]
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## ⏪ ROLLBACK

### Rollback de Deployment

```bash
# Ver deployments anteriores
vercel ls

# Rollback a deployment específico
vercel rollback [deployment-url]

# Rollback al anterior
vercel rollback
```

### Rollback de Base de Datos

```bash
#!/bin/bash
# scripts/rollback-db.sh

# Restaurar desde backup
echo "→ Restaurando backup..."
psql $PROD_DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql

# O revertir última migración (si es posible)
# Nota: Drizzle no tiene rollback automático
# Crear migración manual de reversión
```

### Procedimiento de Rollback

1. **Identificar problema**
   - Verificar logs en Vercel/Sentry
   - Confirmar que es problema del deploy

2. **Rollback inmediato**

   ```bash
   vercel rollback
   ```

3. **Comunicar al equipo**
   - Slack/Discord
   - Documentar incidente

4. **Investigar**
   - ¿Qué causó el problema?
   - ¿Cómo evitarlo en futuro?

5. **Fix y re-deploy**
   - Crear fix en rama
   - PR con tests
   - Deploy con precaución

---

## 📊 MONITOREO

### Sentry Setup

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})
```

```typescript
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
})
```

### Health Check Endpoint

```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'unknown',
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      external: await checkExternalServices(),
    },
  }

  const allHealthy = Object.values(checks.checks).every((c) => c.status === 'ok')

  return Response.json(checks, {
    status: allHealthy ? 200 : 503,
  })
}

async function checkDatabase() {
  try {
    await db.execute(sql`SELECT 1`)
    return { status: 'ok' }
  } catch (error) {
    return { status: 'error', error: 'Database connection failed' }
  }
}
```

### Alertas

```yaml
# Configurar en Vercel/Sentry/Uptime service

# Alertas críticas (PagerDuty/SMS):
- Error rate > 5%
- Latency p99 > 5s
- Health check failing
- Deployment failed

# Alertas warning (Slack):
- Error rate > 1%
- Latency p95 > 2s
- High memory usage
- Unusual traffic patterns
```

---

## 🔧 TROUBLESHOOTING

### Problemas Comunes

#### Build falla

```bash
# Verificar localmente
pnpm build

# Limpiar cache
rm -rf .next node_modules
pnpm install
pnpm build

# Verificar variables de entorno
vercel env pull

# En Windows, si hay errores EPERM con symlinks:
# NO usar output: 'standalone' en next.config.js
```

#### Error de conexión a DB

```bash
# Verificar connection string
psql $DATABASE_URL -c "SELECT 1"

# Verificar desde Vercel function
# Añadir log temporal
console.log('DB URL:', process.env.DATABASE_URL?.slice(0, 30))
```

#### 500 en producción

```bash
# Ver logs en Vercel
vercel logs [deployment-url]

# Ver errores en Sentry
# Dashboard → Issues → Filtrar por environment:production

# Verificar localmente con build de producción
pnpm build
pnpm start
```

#### Migración falló

```bash
# Verificar estado actual
psql $DATABASE_URL -c "SELECT * FROM drizzle_migrations"

# Aplicar manualmente si es necesario
psql $DATABASE_URL < packages/db/src/migrations/XXXX_fix.sql

# Regenerar si hay conflictos
pnpm db:generate
```

#### WhatsApp Webhook no recibe mensajes

```bash
# 1. Verificar que el webhook responde correctamente
curl -X GET "https://wallie.app/api/webhooks/whatsapp?hub.mode=subscribe&hub.challenge=test&hub.verify_token=TU_TOKEN"
# Debe responder: test

# 2. Verificar en Meta Business Console:
# - Webhook URL correcta
# - Verify token coincide
# - Campo 'messages' suscrito

# 3. Verificar logs de Vercel para errores 401/403
vercel logs --follow

# 4. Verificar que WHATSAPP_APP_SECRET está configurado
# para validar firmas de webhooks
```

#### Mensajes WhatsApp no se envían

```bash
# 1. Verificar WHATSAPP_ACCESS_TOKEN
curl -X GET "https://graph.facebook.com/v18.0/me?access_token=TU_TOKEN"

# 2. Verificar WHATSAPP_PHONE_NUMBER_ID
curl -X GET "https://graph.facebook.com/v18.0/TU_PHONE_NUMBER_ID?access_token=TU_TOKEN"

# 3. Enviar mensaje de prueba
curl -X POST "https://graph.facebook.com/v18.0/TU_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"messaging_product":"whatsapp","to":"34600000000","text":{"body":"Test"}}'
```

#### AI no genera respuestas

```bash
# 1. Verificar OPENAI_API_KEY
curl -X GET "https://api.openai.com/v1/models" \
  -H "Authorization: Bearer TU_API_KEY"

# 2. Verificar AUTO_REPLY_ENABLED está en 'true'

# 3. Verificar límites de rate/quota en OpenAI dashboard
```

#### Next.js errores de prerenderizado

```typescript
// Si ves errores como "useContext during pre-rendering"
// Añadir en el layout afectado:
export const dynamic = 'force-dynamic'

// Si hooks devuelven null (useParams, useSearchParams, usePathname)
// Usar optional chaining:
const id = params?.id
const redirect = searchParams?.get('redirect') ?? '/'
const isActive = pathname?.startsWith('/dashboard') ?? false
```

---

## 📞 CONTACTOS DE EMERGENCIA

| Servicio         | Contacto                        | Para qué            |
| ---------------- | ------------------------------- | ------------------- |
| Vercel Support   | support@vercel.com              | Problemas de deploy |
| Supabase Support | support@supabase.io             | Problemas de DB     |
| Meta Business    | developers.facebook.com/support | WhatsApp API        |
| OpenAI Support   | help.openai.com                 | API de IA           |
| Stripe Support   | support.stripe.com              | Pagos               |
| Resend Support   | resend.com/support              | Emails              |

---

## 🎯 RESUMEN DE COMANDOS

```bash
# === DESARROLLO ===
pnpm dev                    # Iniciar desarrollo
pnpm build                  # Build producción
pnpm typecheck             # Verificar TypeScript
pnpm lint                  # Verificar lint
pnpm test                  # Ejecutar tests

# === DATABASE ===
pnpm db:generate           # Generar migraciones
pnpm db:push               # Aplicar migraciones
pnpm db:studio             # Abrir Drizzle Studio

# === DEPLOY ===
vercel                     # Deploy preview
vercel --prod              # Deploy producción
vercel logs               # Ver logs
vercel rollback           # Rollback
vercel env pull           # Descargar env vars

# === GIT ===
git secrets --scan         # Verificar secrets
```

---

_Última actualización: 01 Dic 2025_
_Proyecto: Wallie - Asistente de WhatsApp con IA_
