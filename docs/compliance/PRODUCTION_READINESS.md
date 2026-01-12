# 🚀 Production Readiness - Wallie

> **Versión:** 1.0.0 | **Fecha:** 02 Dic 2025
> **Estado:** Documento de referencia para preparación a producción

---

## 📋 Resumen Ejecutivo

Este documento cubre todos los aspectos necesarios para llevar Wallie a producción de forma profesional y escalable.

### Estado por Área

| Área                   | Prioridad  | Estado     | Cuándo Implementar |
| ---------------------- | ---------- | ---------- | ------------------ |
| Observabilidad         | 🔴 Crítico | ❌         | Antes de Beta      |
| Testing/QA             | 🔴 Crítico | ⚠️ Parcial | Continuo           |
| DevOps/CI-CD           | 🟠 Alto    | ❓ Revisar | Antes de Beta      |
| Emails Transaccionales | 🟠 Alto    | ⚠️ Parcial | Antes de Beta      |
| Performance            | 🟠 Alto    | ⚠️ Básico  | Antes de Launch    |
| Accesibilidad (a11y)   | 🟠 Alto    | ❌         | Antes de Launch    |
| SEO                    | 🟡 Medio   | ⚠️ Básico  | Antes de Launch    |
| Documentación          | 🟡 Medio   | ⚠️ Parcial | Continuo           |
| i18n (Multi-idioma)    | 🟢 Bajo    | ❌         | Post-Launch        |
| Soporte/Help Center    | 🟢 Bajo    | ❌         | Post-Launch        |

---

## 1. 📊 OBSERVABILIDAD

### Por qué es crítico

Sin observabilidad, no sabrás qué pasa en producción. Un error puede afectar usuarios durante horas sin que te enteres.

### 1.1 Error Tracking (Sentry)

**Instalar:**

```bash
pnpm add @sentry/nextjs -F web
```

**Configurar:** `apps/web/sentry.client.config.ts`

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% de transacciones

  // No capturar datos sensibles
  beforeSend(event) {
    if (event.request?.data) {
      const data = event.request.data as Record<string, unknown>
      delete data.email
      delete data.phone
      delete data.password
      delete data.token
    }
    return event
  },

  ignoreErrors: ['ResizeObserver loop limit exceeded', 'Network request failed', 'Load failed'],
})
```

**Configurar:** `apps/web/sentry.server.config.ts`

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
})
```

### 1.2 Analytics de Producto (PostHog)

**Instalar:**

```bash
pnpm add posthog-js -F web
```

**Crear:** `apps/web/src/lib/posthog.ts`

```typescript
import posthog from 'posthog-js'

export function initPostHog() {
  if (typeof window === 'undefined') return
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.posthog.com',
    capture_pageview: false, // Lo haremos manualmente
    persistence: 'localStorage',
    autocapture: false, // Controlamos qué capturamos
  })
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  posthog.capture(event, properties)
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  posthog.identify(userId, traits)
}

export function resetUser() {
  posthog.reset()
}
```

**Eventos importantes a trackear:**

```typescript
// Auth
trackEvent('user_signed_up', { method: 'email' })
trackEvent('user_logged_in')
trackEvent('user_logged_out')

// Core features
trackEvent('client_created')
trackEvent('message_sent', { channel: 'whatsapp', wasAI: false })
trackEvent('ai_suggestion_used')
trackEvent('autopilot_enabled')

// Billing
trackEvent('subscription_started', { plan: 'pro' })
trackEvent('subscription_cancelled', { reason: '...' })

// Engagement
trackEvent('feature_used', { feature: 'pipeline_view' })
```

### 1.3 Logging Estructurado

**Instalar:**

```bash
pnpm add pino pino-pretty -F web
```

**Crear:** `apps/web/src/lib/logger.ts`

```typescript
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  redact: [
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'apiKey',
    'secret',
    'authorization',
    'cookie',
  ],
})

// Uso
logger.info({ userId, action: 'client_created' }, 'Client created')
logger.error({ error, userId }, 'Failed to send message')
logger.warn({ clientId }, 'Client approaching message limit')
```

### 1.4 Uptime Monitoring

**Opciones gratuitas/económicas:**

- BetterUptime (gratis hasta 10 monitores)
- UptimeRobot (gratis hasta 50 monitores)
- Vercel Analytics (incluido)

**Endpoints a monitorear:**

```
https://wallie.pro/api/health          → Health check básico
https://wallie.pro/api/trpc/health     → tRPC funcionando
https://wallie.pro                      → App principal
```

**Crear:** `apps/web/src/app/api/health/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { db } from '@wallie/db'

export async function GET() {
  try {
    // Check database
    await db.execute('SELECT 1')

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0',
    })
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: 'Database connection failed' },
      { status: 503 }
    )
  }
}
```

---

## 2. 🧪 TESTING / QA

### 2.1 Estructura de Tests

```
apps/web/
├── __tests__/
│   ├── components/        # Tests de componentes
│   └── e2e/               # Tests end-to-end
packages/
├── api/
│   └── src/routers/__tests__/   # Tests de routers tRPC
├── ai/
│   └── src/__tests__/     # Tests de IA
└── whatsapp/
    └── src/__tests__/     # Tests de WhatsApp
```

### 2.2 Tests Unitarios (Vitest)

**Configurar:** `packages/api/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', '**/*.d.ts', '**/__tests__/**'],
    },
  },
})
```

**Ejemplo test router:** `packages/api/src/routers/__tests__/clients.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createCaller } from '../../root'

describe('clients router', () => {
  const mockCtx = {
    userId: 'test-user-id',
    user: { id: 'test-user-id', email: 'test@example.com' },
  }

  describe('list', () => {
    it('should return paginated clients', async () => {
      const caller = createCaller(mockCtx)
      const result = await caller.clients.list({ limit: 10 })

      expect(result).toHaveProperty('items')
      expect(result).toHaveProperty('nextCursor')
      expect(Array.isArray(result.items)).toBe(true)
    })

    it('should filter by search term', async () => {
      const caller = createCaller(mockCtx)
      const result = await caller.clients.list({ search: 'Juan' })

      result.items.forEach((client) => {
        expect(client.name.toLowerCase()).toContain('juan')
      })
    })
  })

  describe('create', () => {
    it('should create a client with valid data', async () => {
      const caller = createCaller(mockCtx)
      const client = await caller.clients.create({
        name: 'Test Client',
        phone: '+34612345678',
      })

      expect(client).toHaveProperty('id')
      expect(client.name).toBe('Test Client')
      expect(client.userId).toBe(mockCtx.userId)
    })

    it('should reject invalid phone number', async () => {
      const caller = createCaller(mockCtx)

      await expect(
        caller.clients.create({
          name: 'Test',
          phone: 'invalid',
        })
      ).rejects.toThrow()
    })
  })
})
```

### 2.3 Tests E2E (Playwright)

**Instalar:**

```bash
pnpm add -D @playwright/test -F web
```

**Configurar:** `apps/web/playwright.config.ts`

```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

**Ejemplo test E2E:** `apps/web/__tests__/e2e/auth.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('h1')).toContainText('Dashboard')
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.fill('[name="email"]', 'wrong@example.com')
    await page.fill('[name="password"]', 'wrong')
    await page.click('button[type="submit"]')

    await expect(page.locator('[role="alert"]')).toBeVisible()
  })
})
```

### 2.4 Coverage Targets

| Área                 | Coverage Mínimo      | Ideal |
| -------------------- | -------------------- | ----- |
| Routers tRPC         | 80%                  | 90%   |
| Utils/Helpers        | 90%                  | 95%   |
| Componentes críticos | 70%                  | 80%   |
| E2E happy paths      | 100% flujos críticos | -     |

### 2.5 QA Checklist Pre-Release

```markdown
## Pre-Release Checklist

### Funcionalidad

- [ ] Flujo de login/registro funciona
- [ ] CRUD de clientes funciona
- [ ] Envío de mensajes WhatsApp funciona
- [ ] Sugerencias de IA se generan
- [ ] Pagos con Stripe funcionan

### Seguridad

- [ ] No hay console.logs con datos sensibles
- [ ] Variables de entorno configuradas
- [ ] HTTPS activo
- [ ] Headers de seguridad presentes

### Performance

- [ ] Lighthouse score > 80
- [ ] Sin memory leaks obvios
- [ ] Queries N+1 corregidas

### Cross-browser

- [ ] Chrome ✓
- [ ] Firefox ✓
- [ ] Safari ✓
- [ ] Mobile ✓
```

---

## 3. 🔧 DEVOPS / CI-CD

### 3.1 GitHub Actions - CI

**Crear:** `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-typecheck:
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
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
        env:
          SKIP_ENV_VALIDATION: true

  test:
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
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
        env:
          SKIP_ENV_VALIDATION: true

  build:
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
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
        env:
          SKIP_ENV_VALIDATION: true
```

### 3.2 Preview Deployments (Vercel)

Vercel automáticamente crea preview deployments para cada PR. Verificar que está configurado:

- Branch previews: ON
- Production branch: main

### 3.3 Database Backups

**Supabase:**

- Backups automáticos diarios (incluido en plan)
- Point-in-time recovery (plan Pro)

**Script manual de backup:**

```bash
#!/bin/bash
# scripts/backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.sql"

pg_dump $DATABASE_URL > $BACKUP_FILE
gzip $BACKUP_FILE

# Subir a storage (S3, Supabase Storage, etc.)
```

### 3.4 Staging Environment

Crear proyecto separado en Supabase para staging:

- `wallie-staging` en Supabase
- Branch `develop` → staging
- Branch `main` → production

---

## 4. 📧 EMAILS TRANSACCIONALES

### 4.1 Templates Necesarios

| Email                  | Trigger         | Prioridad  |
| ---------------------- | --------------- | ---------- |
| Welcome                | Registro        | 🔴 Crítico |
| Password Reset         | Forgot password | 🔴 Crítico |
| Email Verification     | Registro        | 🟠 Alto    |
| Payment Receipt        | Pago exitoso    | 🟠 Alto    |
| Payment Failed         | Pago fallido    | 🟠 Alto    |
| Subscription Started   | Nueva sub       | 🟡 Medio   |
| Subscription Cancelled | Cancelación     | 🟡 Medio   |
| Weekly Summary         | Cron semanal    | 🟢 Bajo    |

### 4.2 Setup con Resend + React Email

**Instalar:**

```bash
pnpm add resend @react-email/components -F email
```

**Crear:** `packages/email/src/templates/welcome.tsx`

```tsx
import { Body, Container, Head, Heading, Html, Link, Preview, Text } from '@react-email/components'

interface WelcomeEmailProps {
  name: string
  loginUrl: string
}

export function WelcomeEmail({ name, loginUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Bienvenido a Wallie - Tu asistente de ventas en WhatsApp</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>¡Bienvenido a Wallie, {name}!</Heading>
          <Text style={text}>
            Gracias por registrarte. Estás a un paso de transformar tus ventas en WhatsApp.
          </Text>
          <Link href={loginUrl} style={button}>
            Acceder a mi cuenta
          </Link>
          <Text style={footer}>Si tienes alguna pregunta, responde a este email.</Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = { backgroundColor: '#111b21', fontFamily: 'sans-serif' }
const container = { padding: '40px', maxWidth: '600px', margin: '0 auto' }
const h1 = { color: '#e9edef', fontSize: '24px' }
const text = { color: '#8696a0', fontSize: '16px', lineHeight: '24px' }
const button = {
  backgroundColor: '#00a884',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '8px',
  textDecoration: 'none',
  display: 'inline-block',
}
const footer = { color: '#8696a0', fontSize: '12px', marginTop: '32px' }
```

**Crear:** `packages/email/src/send.ts`

```typescript
import { Resend } from 'resend'
import { WelcomeEmail } from './templates/welcome'
import { PasswordResetEmail } from './templates/password-reset'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWelcomeEmail(to: string, name: string) {
  return resend.emails.send({
    from: 'Wallie <hola@wallie.pro>',
    to,
    subject: '¡Bienvenido a Wallie!',
    react: WelcomeEmail({ name, loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login` }),
  })
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  return resend.emails.send({
    from: 'Wallie <hola@wallie.pro>',
    to,
    subject: 'Restablecer tu contraseña',
    react: PasswordResetEmail({ resetUrl }),
  })
}
```

---

## 5. ⚡ PERFORMANCE

### 5.1 Checklist de Performance

```markdown
### Images

- [ ] Usar next/image para todas las imágenes
- [ ] Formatos modernos (WebP, AVIF)
- [ ] Lazy loading para imágenes below the fold
- [ ] Dimensiones explícitas para evitar CLS

### JavaScript

- [ ] Code splitting por rutas (Next.js lo hace automático)
- [ ] Dynamic imports para componentes pesados
- [ ] Tree shaking funcionando
- [ ] Bundle analyzer revisado

### Data Fetching

- [ ] React Query/tRPC caching configurado
- [ ] Stale-while-revalidate donde aplique
- [ ] Paginación en listas largas
- [ ] Sin queries N+1

### Database

- [ ] Índices en columnas frecuentemente consultadas
- [ ] Queries optimizadas (explain analyze)
- [ ] Connection pooling configurado
```

### 5.2 Lazy Loading de Componentes

```typescript
import dynamic from 'next/dynamic'

// Componentes pesados cargados bajo demanda
const HeavyChart = dynamic(() => import('@/components/charts/heavy-chart'), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false,
})

const RichTextEditor = dynamic(() => import('@/components/editor'), {
  loading: () => <Skeleton className="h-32" />,
})
```

### 5.3 Database Indexes

```sql
-- Índices recomendados para Wallie

-- Clients
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_clients_user_status ON clients(user_id, status);
CREATE INDEX idx_clients_phone ON clients(phone);

-- Conversations
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_client_id ON conversations(client_id);
CREATE INDEX idx_conversations_last_message ON conversations(user_id, last_message_at DESC);

-- Messages
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sent_at ON messages(conversation_id, sent_at DESC);
```

---

## 6. ♿ ACCESIBILIDAD (a11y)

### 6.1 Checklist WCAG 2.1 AA

```markdown
### Perceptible

- [ ] Todas las imágenes tienen alt text
- [ ] Videos tienen captions/subtítulos
- [ ] Contraste de color mínimo 4.5:1 (texto normal)
- [ ] Contraste mínimo 3:1 (texto grande, iconos)
- [ ] No depender solo del color para transmitir info

### Operable

- [ ] Todo funciona con teclado
- [ ] Focus visible en todos los elementos
- [ ] Sin trampas de teclado
- [ ] Skip links para navegación
- [ ] Tiempo suficiente para leer/actuar

### Comprensible

- [ ] Labels en todos los inputs
- [ ] Mensajes de error claros
- [ ] Navegación consistente
- [ ] Idioma de página declarado (<html lang="es">)

### Robusto

- [ ] HTML semántico
- [ ] ARIA cuando sea necesario
- [ ] Compatible con screen readers
```

### 6.2 Herramientas de Testing

```bash
# Lighthouse en CI
pnpm add -D lighthouse

# axe-core para tests
pnpm add -D @axe-core/playwright

# ESLint plugin
pnpm add -D eslint-plugin-jsx-a11y
```

### 6.3 Componentes Accesibles

```tsx
// Usar Radix UI (ya incluido via shadcn/ui)
// - Dialog accesible
// - Dropdown accesible
// - Tabs accesibles
// etc.

// Ejemplo: botón con aria-label
<Button aria-label="Cerrar diálogo" onClick={onClose}>
  <X className="h-4 w-4" />
</Button>

// Ejemplo: form con labels
<div>
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    name="email"
    type="email"
    aria-describedby="email-error"
  />
  {error && <span id="email-error" role="alert">{error}</span>}
</div>
```

---

## 7. 🔍 SEO

### 7.1 Meta Tags Dinámicos

**Crear:** `apps/web/src/lib/seo.ts`

```typescript
import type { Metadata } from 'next'

const defaultMeta = {
  title: 'Wallie - Tu clon de ventas en WhatsApp',
  description:
    'Automatiza tus ventas en WhatsApp con IA. Wallie aprende tu estilo y responde como tú.',
  url: 'https://wallie.pro',
  image: 'https://wallie.pro/og-image.png',
}

export function generateMetadata(page?: {
  title?: string
  description?: string
  image?: string
  noIndex?: boolean
}): Metadata {
  const title = page?.title ? `${page.title} | Wallie` : defaultMeta.title
  const description = page?.description || defaultMeta.description
  const image = page?.image || defaultMeta.image

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [image],
      type: 'website',
      locale: 'es_ES',
      siteName: 'Wallie',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    robots: page?.noIndex ? 'noindex, nofollow' : 'index, follow',
  }
}
```

### 7.2 Sitemap

**Crear:** `apps/web/src/app/sitemap.ts`

```typescript
import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://wallie.pro'

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/legal/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/legal/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]
}
```

### 7.3 Robots.txt

**Crear:** `apps/web/src/app/robots.ts`

```typescript
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard/', '/conversations/', '/clients/', '/settings/'],
    },
    sitemap: 'https://wallie.pro/sitemap.xml',
  }
}
```

---

## 8. 📚 DOCUMENTACIÓN

### 8.1 Documentos del Proyecto

| Documento                 | Propósito                | Estado |
| ------------------------- | ------------------------ | ------ |
| `CLAUDE.md`               | Instrucciones para IA    | ✅     |
| `SYSTEM.md`               | Arquitectura del sistema | ✅     |
| `PHASES.md`               | Estado de fases          | ✅     |
| `STACK.md`                | Stack tecnológico        | ✅     |
| `STANDARDS.md`            | Estándares de código     | ✅     |
| `SECURITY.md`             | Directrices de seguridad | ✅     |
| `SECURITY_ROADMAP.md`     | Roadmap de seguridad     | ✅     |
| `PRODUCTION_READINESS.md` | Este documento           | ✅     |
| `API.md`                  | Documentación de API     | ❌     |
| `DEPLOYMENT.md`           | Guía de deployment       | ⚠️     |

### 8.2 Documentación de API

Considerar generar docs automáticos con:

- tRPC Panel (desarrollo)
- OpenAPI/Swagger (si se expone API pública)

---

## 9. 🌍 INTERNACIONALIZACIÓN (i18n)

### Para Post-Launch

**Opciones:**

- `next-intl` (recomendado para App Router)
- `react-i18next`

**Estructura:**

```
apps/web/
├── messages/
│   ├── es.json
│   └── en.json
├── src/
│   └── i18n/
│       ├── config.ts
│       └── request.ts
```

---

## 10. 🎫 SOPORTE / HELP CENTER

### Para Post-Launch

**Opciones:**

- Intercom (caro pero completo)
- Crisp (más económico)
- Help Scout
- Self-hosted: Docusaurus para docs

**Mínimo necesario:**

- FAQ en `/help`
- Email de soporte: soporte@wallie.pro
- Formulario de contacto

---

## 📋 Checklist Final Pre-Launch

```markdown
## ✅ Pre-Launch Checklist

### Crítico (bloquea launch)

- [ ] Auth funciona (login, registro, reset password)
- [ ] Pagos funcionan (checkout, webhooks)
- [ ] WhatsApp funciona (envío, recepción)
- [ ] Error tracking configurado (Sentry)
- [ ] Backups de DB configurados
- [ ] HTTPS en producción
- [ ] Dominio configurado

### Importante (debería estar)

- [ ] Analytics configurado (PostHog)
- [ ] Emails transaccionales funcionan
- [ ] Páginas legales completas
- [ ] Monitoring de uptime
- [ ] Tests críticos pasan

### Nice to have (puede esperar)

- [ ] Lighthouse > 90
- [ ] 100% a11y compliance
- [ ] Documentación completa
- [ ] Help center
```

---

_Documento generado: 02 Dic 2025_
_Próxima revisión: Antes de Beta_
