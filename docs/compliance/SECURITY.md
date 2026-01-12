# 🔐 SECURITY.md — Seguridad del Proyecto

> **Versión:** 1.0.0 | **Última actualización:** 30 Nov 2025
> **Nivel:** CRÍTICO - Seguir todas las directrices

---

## 📋 ÍNDICE

1. [Principios de Seguridad](#-principios-de-seguridad)
2. [Autenticación](#-autenticación)
3. [Autorización](#-autorización)
4. [Validación de Datos](#-validación-de-datos)
5. [Protección de APIs](#-protección-de-apis)
6. [Manejo de Secrets](#-manejo-de-secrets)
7. [Headers de Seguridad](#-headers-de-seguridad)
8. [Prevención de Ataques](#-prevención-de-ataques)
9. [Logging y Auditoría](#-logging-y-auditoría)
10. [Checklist de Seguridad](#-checklist-de-seguridad)

---

## 🎯 PRINCIPIOS DE SEGURIDAD

### Defense in Depth

```
┌─────────────────────────────────────────────────────────────────┐
│                      CAPAS DE SEGURIDAD                          │
├─────────────────────────────────────────────────────────────────┤
│  1. Edge (Vercel)                                               │
│     ├── DDoS protection                                         │
│     ├── WAF rules                                               │
│     └── Rate limiting                                           │
│                                                                 │
│  2. Application (Next.js)                                       │
│     ├── Security headers                                        │
│     ├── CSRF protection                                         │
│     └── Input sanitization                                      │
│                                                                 │
│  3. API (tRPC)                                                  │
│     ├── Authentication middleware                               │
│     ├── Authorization checks                                    │
│     └── Request validation (Zod)                                │
│                                                                 │
│  4. Database (Supabase)                                         │
│     ├── Row Level Security                                      │
│     ├── Encrypted connections                                   │
│     └── Parameterized queries                                   │
│                                                                 │
│  5. Infrastructure                                              │
│     ├── Encrypted at rest                                       │
│     ├── Encrypted in transit                                    │
│     └── Secrets management                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Principio de Mínimo Privilegio

```typescript
// ❌ MAL - Retornar todos los campos
return user

// ✅ BIEN - Solo campos necesarios
return {
  id: user.id,
  name: user.name,
  email: user.email,
  // NO: password, tokens, internalId, etc.
}
```

### Zero Trust

```typescript
// Verificar en CADA request, no asumir nada
const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  // 1. Verificar autenticación
  if (!ctx.session) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  // 2. Verificar sesión válida
  const isValidSession = await verifySession(ctx.session.id)
  if (!isValidSession) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  // 3. Verificar usuario activo
  const user = await getUser(ctx.session.userId)
  if (!user || user.status === 'SUSPENDED') {
    throw new TRPCError({ code: 'FORBIDDEN' })
  }

  return next({ ctx: { ...ctx, user } })
})
```

---

## 🔑 AUTENTICACIÓN

### Implementación con Supabase Auth

```typescript
// lib/auth.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function getSession() {
  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session) {
    return null
  }

  return session
}

export async function getCurrentUser() {
  const session = await getSession()
  if (!session) return null

  // Obtener datos adicionales del usuario de nuestra DB
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  })

  return user
}
```

### Middleware de Autenticación

```typescript
// middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Rutas protegidas
  const protectedRoutes = ['/dashboard', '/clients', '/settings']
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Rutas de auth (redirigir si ya autenticado)
  const authRoutes = ['/login', '/register']
  const isAuthRoute = authRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

---

## 🛡️ AUTORIZACIÓN

### Verificación de Propiedad (OBLIGATORIO)

```typescript
// ⚠️ REGLA #1: SIEMPRE verificar que el recurso pertenece al usuario

// ❌ MAL - Cualquier usuario puede acceder
const getClient = async (id: string) => {
  return db.query.clients.findFirst({
    where: eq(clients.id, id),
  })
}

// ✅ BIEN - Solo el propietario puede acceder
const getClient = async (id: string, userId: string) => {
  return db.query.clients.findFirst({
    where: and(
      eq(clients.id, id),
      eq(clients.userId, userId), // ← OBLIGATORIO
      isNull(clients.deletedAt) // ← Excluir eliminados
    ),
  })
}
```

### Middleware de Autorización en tRPC

```typescript
// packages/api/src/middleware/auth.ts

// Procedure que requiere autenticación
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Debes iniciar sesión',
    })
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  })
})

// Procedure que requiere rol admin
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, ctx.userId),
  })

  if (!user || user.role !== 'ADMIN') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'No tienes permisos de administrador',
    })
  }

  return next({
    ctx: {
      ...ctx,
      user,
    },
  })
})

// Procedure que verifica pertenencia a workspace
export const workspaceProcedure = protectedProcedure
  .input(z.object({ workspaceId: z.string().uuid() }))
  .use(async ({ ctx, input, next }) => {
    const member = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.workspaceId, input.workspaceId),
        eq(workspaceMembers.userId, ctx.userId)
      ),
    })

    if (!member) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'No perteneces a este workspace',
      })
    }

    return next({
      ctx: {
        ...ctx,
        workspaceId: input.workspaceId,
        workspaceRole: member.role,
      },
    })
  })
```

### Row Level Security (Supabase)

```sql
-- Habilitar RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Política: usuarios solo ven sus propios clientes
CREATE POLICY "Users can view own clients"
  ON clients
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: usuarios solo pueden insertar sus propios clientes
CREATE POLICY "Users can insert own clients"
  ON clients
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: usuarios solo pueden actualizar sus propios clientes
CREATE POLICY "Users can update own clients"
  ON clients
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: usuarios solo pueden eliminar sus propios clientes
CREATE POLICY "Users can delete own clients"
  ON clients
  FOR DELETE
  USING (auth.uid() = user_id);
```

---

## ✅ VALIDACIÓN DE DATOS

### Validación con Zod (OBLIGATORIO)

```typescript
// SIEMPRE validar TODOS los inputs con Zod

// Schemas reutilizables
const emailSchema = z.string().email('Email inválido').max(255)
const phoneSchema = z.string().regex(/^\+?[0-9]{9,15}$/, 'Teléfono inválido')
const uuidSchema = z.string().uuid('ID inválido')
const nameSchema = z.string().min(1, 'Requerido').max(100, 'Muy largo')

// Schema de cliente
const clientSchema = z.object({
  name: nameSchema,
  lastName: nameSchema.optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  notes: z.string().max(500, 'Máximo 500 caracteres').optional(),
})

// Usar en router
create: protectedProcedure
  .input(clientSchema) // ← Validación automática
  .mutation(async ({ ctx, input }) => {
    // input ya está validado y tipado
  })
```

### Sanitización de Output

```typescript
// Nunca exponer datos sensibles

// ❌ MAL
return user

// ✅ BIEN - Schema de respuesta
const userResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  createdAt: z.date(),
})

return userResponseSchema.parse(user)

// O usando select específico
const user = await db
  .select({
    id: users.id,
    name: users.name,
    email: users.email,
    createdAt: users.createdAt,
  })
  .from(users)
  .where(eq(users.id, id))
```

---

## 🚦 PROTECCIÓN DE APIs

### Rate Limiting

```typescript
// lib/ratelimit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Rate limit por IP
export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests por minuto
  analytics: true,
})

// Rate limit por usuario (más generoso)
export const userRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(500, '1 m'),
  analytics: true,
})

// Rate limit para endpoints sensibles
export const authRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 intentos por minuto
  analytics: true,
})
```

```typescript
// Uso en API route
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous'

  const { success, limit, remaining, reset } = await authRatelimit.limit(ip)

  if (!success) {
    return Response.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      }
    )
  }

  // Continuar con la lógica
}
```

### Verificación de Webhooks

```typescript
// Verificar firma de webhook (WhatsApp/Stripe)
import { createHmac, timingSafeEqual } from 'crypto'

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = createHmac('sha256', secret).update(payload).digest('hex')

    const sig = signature.replace('sha256=', '')

    return timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedSignature, 'hex'))
  } catch {
    return false
  }
}

// Uso en webhook handler
export async function POST(req: Request) {
  const signature = req.headers.get('x-hub-signature-256')
  const body = await req.text()

  if (!signature || !verifyWebhookSignature(body, signature, WEBHOOK_SECRET)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const data = JSON.parse(body)
  // Procesar webhook...
}
```

---

## 🔒 MANEJO DE SECRETS

### Variables de Entorno

```bash
# .env.example (NUNCA .env en git)

# Database
DATABASE_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."  # ← Solo para operaciones públicas
SUPABASE_SERVICE_ROLE_KEY="eyJ..."       # ← NUNCA exponer al cliente

# Auth
AUTH_SECRET="..."

# APIs externas
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
WHATSAPP_ACCESS_TOKEN="..."
WHATSAPP_WEBHOOK_SECRET="..."
RESEND_API_KEY="re_..."
```

### Validación de Env con Zod

```typescript
// env.ts
import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    OPENAI_API_KEY: z.string().startsWith('sk-'),
    ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-'),
    STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
    STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
    WHATSAPP_ACCESS_TOKEN: z.string().min(1),
    WHATSAPP_WEBHOOK_SECRET: z.string().min(32),
    RESEND_API_KEY: z.string().startsWith('re_'),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    // ... resto de variables
  },
})
```

### Git Secrets (OBLIGATORIO)

```bash
# Instalar git-secrets
brew install git-secrets  # macOS
# o
sudo apt-get install git-secrets  # Linux

# Configurar en el repo
cd proyecto
git secrets --install
git secrets --register-aws

# Añadir patrones custom
git secrets --add 'sk-[a-zA-Z0-9]{20,}'           # OpenAI
git secrets --add 'sk-ant-[a-zA-Z0-9-]{20,}'      # Anthropic
git secrets --add 'sk_live_[a-zA-Z0-9]{20,}'      # Stripe live
git secrets --add 'whsec_[a-zA-Z0-9]{20,}'        # Stripe webhook
git secrets --add 'password\s*[:=]\s*.+'          # Passwords
git secrets --add 'secret\s*[:=]\s*.+'            # Secrets
git secrets --add 'eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*'  # JWTs

# Verificar antes de commit
git secrets --scan

# Hook pre-commit automático (ya instalado con --install)
```

---

## 🛡️ HEADERS DE SEGURIDAD

### Configuración Next.js

```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https:;
      font-src 'self';
      connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com;
      frame-ancestors 'none';
      base-uri 'self';
      form-action 'self';
    `.replace(/\n/g, ''),
  },
]

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}
```

---

## 🚨 PREVENCIÓN DE ATAQUES

### SQL Injection

```typescript
// ❌ MAL - Interpolación directa
const query = `SELECT * FROM users WHERE email = '${email}'`
await sql.raw(query)

// ✅ BIEN - Query builder de Drizzle (parametrizado automáticamente)
await db.select().from(users).where(eq(users.email, email))

// ✅ BIEN - Si necesitas SQL raw, usar placeholder
await sql`SELECT * FROM users WHERE email = ${email}`
```

### XSS (Cross-Site Scripting)

```tsx
// ❌ MAL - Renderizar HTML sin sanitizar
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ BIEN - React escapa automáticamente
<div>{userInput}</div>

// ✅ BIEN - Si necesitas HTML, sanitizar primero
import DOMPurify from 'dompurify'
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

### CSRF (Cross-Site Request Forgery)

```typescript
// Next.js tiene protección CSRF por defecto en Server Actions
// Para API routes, verificar Origin header

export async function POST(req: Request) {
  const origin = req.headers.get('origin')
  const allowedOrigins = [process.env.NEXT_PUBLIC_APP_URL, 'http://localhost:3000']

  if (!origin || !allowedOrigins.includes(origin)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Continuar...
}
```

### Path Traversal

```typescript
// ❌ MAL - Usar input del usuario directamente en path
const filePath = `./uploads/${userInput}`
fs.readFile(filePath)

// ✅ BIEN - Validar y sanitizar
import path from 'path'

const fileName = path.basename(userInput) // Remover path traversal
const safePath = path.join('./uploads', fileName)

// Verificar que está dentro del directorio permitido
if (!safePath.startsWith(path.resolve('./uploads'))) {
  throw new Error('Invalid path')
}
```

---

## 📝 LOGGING Y AUDITORÍA

### Logger Estructurado

```typescript
// lib/logger.ts
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
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
logger.info({ userId, action: 'login' }, 'User logged in')
logger.error({ error, userId }, 'Failed to process payment')
```

### Audit Log

```typescript
// Registrar acciones importantes
async function auditLog(action: AuditAction) {
  await db.insert(auditLogs).values({
    userId: action.userId,
    action: action.type,
    resource: action.resource,
    resourceId: action.resourceId,
    metadata: action.metadata,
    ipAddress: action.ipAddress,
    userAgent: action.userAgent,
    createdAt: new Date(),
  })
}

// Usar en operaciones sensibles
await auditLog({
  userId: ctx.userId,
  type: 'DELETE_CLIENT',
  resource: 'clients',
  resourceId: clientId,
  metadata: { clientName },
  ipAddress: ctx.ip,
  userAgent: ctx.userAgent,
})
```

---

## ✅ CHECKLIST DE SEGURIDAD

### Pre-Commit

```bash
#!/bin/bash
# scripts/security-check.sh

echo "🔐 Ejecutando verificaciones de seguridad..."

# 1. Git secrets
echo "→ Verificando secrets..."
git secrets --scan
if [ $? -ne 0 ]; then
  echo "❌ Posibles secrets detectados"
  exit 1
fi

# 2. Dependencias vulnerables
echo "→ Verificando dependencias..."
pnpm audit --audit-level=high
if [ $? -ne 0 ]; then
  echo "⚠️ Vulnerabilidades en dependencias"
  # No bloquear, solo advertir
fi

# 3. Verificar .env no está en git
if git ls-files --error-unmatch .env 2>/dev/null; then
  echo "❌ .env está en git!"
  exit 1
fi

echo "✅ Verificaciones de seguridad pasaron"
```

### Pre-Deploy

- [ ] Variables de entorno configuradas en producción
- [ ] Secrets rotados si hubo exposición
- [ ] `pnpm audit` sin vulnerabilidades críticas
- [ ] Headers de seguridad verificados
- [ ] Rate limiting configurado
- [ ] Logging configurado
- [ ] Backups de DB verificados
- [ ] RLS habilitado en todas las tablas
- [ ] HTTPS forzado

### Code Review

- [ ] No hay `any` en código nuevo
- [ ] Inputs validados con Zod
- [ ] Queries filtran por `userId`
- [ ] No hay secrets hardcodeados
- [ ] No hay `console.log` con datos sensibles
- [ ] Errores no exponen detalles internos
- [ ] Rate limiting en endpoints públicos
- [ ] Webhook signatures verificadas

---

_Última actualización: 30 Nov 2025_
