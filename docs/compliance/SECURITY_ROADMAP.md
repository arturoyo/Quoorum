# 🔐 Roadmap de Ciberseguridad - Wallie

> **Versión:** 1.0.0 | **Fecha:** 02 Dic 2025
> **Estado:** Documento de referencia para implementación futura

---

## 📊 Estado Actual de Seguridad

### ✅ Lo que YA existe

| Área                          | Estado | Archivo                                       |
| ----------------------------- | ------ | --------------------------------------------- |
| SECURITY.md documentado       | ✅     | `/SECURITY.md`                                |
| Auth middleware Supabase      | ✅     | `packages/auth/src/middleware.ts`             |
| Protected procedures tRPC     | ⚠️     | `packages/api/src/trpc.ts` (tiene bypass DEV) |
| WhatsApp webhook verification | ✅     | `packages/whatsapp/src/webhook.ts`            |
| Stripe webhook verification   | ✅     | `packages/stripe/src/webhook.ts`              |
| Zod validation                | ✅     | En todos los routers                          |

### ❌ Lo que FALTA

| Área                          | Prioridad  | Cuándo Implementar  |
| ----------------------------- | ---------- | ------------------- |
| Security headers              | 🔴 CRÍTICO | AHORA               |
| Eliminar DEV bypass           | 🔴 CRÍTICO | AHORA               |
| Env validation (@t3-oss/env)  | 🔴 CRÍTICO | AHORA               |
| Rate limiting                 | 🟠 ALTO    | Antes de Beta       |
| CSP (Content Security Policy) | 🟠 ALTO    | Antes de Beta       |
| Audit logging                 | 🟠 ALTO    | Antes de Beta       |
| Prompt injection prevention   | 🟠 ALTO    | Con IA Core         |
| RLS en Supabase               | 🟠 ALTO    | Verificar/Completar |
| OAuth token encryption        | 🟡 MEDIO   | Con Gmail/Calendar  |
| 2FA/MFA                       | 🟡 MEDIO   | Post-Launch         |
| Sentry security config        | 🟡 MEDIO   | Post-Launch         |
| Vulnerability scanning CI     | 🟡 MEDIO   | Post-Launch         |
| Incident response plan        | 🟡 MEDIO   | Post-Launch         |

---

## 📋 Implementaciones Detalladas

### 1. Rate Limiting (Antes de Beta)

**Instalar:**

```bash
pnpm add @upstash/ratelimit @upstash/redis
```

**Crear:** `packages/api/src/lib/ratelimit.ts`

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

// Rate limit por IP (endpoints públicos)
export const ipRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      analytics: true,
      prefix: 'ratelimit:ip',
    })
  : null

// Rate limit para auth (más estricto)
export const authRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      analytics: true,
      prefix: 'ratelimit:auth',
    })
  : null

// Rate limit para IA (costoso)
export const aiRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '1 m'),
      analytics: true,
      prefix: 'ratelimit:ai',
    })
  : null

export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<{ success: boolean; remaining?: number }> {
  if (!limiter) return { success: true }
  const { success, remaining } = await limiter.limit(identifier)
  return { success, remaining }
}
```

**Aplicar en routers:**

```typescript
import { aiRatelimit, checkRateLimit } from '../lib/ratelimit'

// En mutation/query
const { success } = await checkRateLimit(aiRatelimit, ctx.userId)
if (!success) {
  throw new TRPCError({
    code: 'TOO_MANY_REQUESTS',
    message: 'Has excedido el límite de solicitudes.',
  })
}
```

---

### 2. Prompt Injection Prevention (Con IA Core)

**Crear:** `packages/ai/src/sanitize.ts`

```typescript
export function sanitizeUserInput(input: string): string {
  const dangerousPatterns = [
    /ignore previous instructions/gi,
    /ignore all previous/gi,
    /disregard previous/gi,
    /forget everything/gi,
    /you are now/gi,
    /pretend you are/gi,
    /act as if/gi,
    /system:/gi,
    /\[INST\]/gi,
    /\[\/INST\]/gi,
    /<\|im_start\|>/gi,
    /<\|im_end\|>/gi,
  ]

  let sanitized = input
  for (const pattern of dangerousPatterns) {
    sanitized = sanitized.replace(pattern, '[FILTERED]')
  }

  const MAX_LENGTH = 4000
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.slice(0, MAX_LENGTH) + '...'
  }

  return sanitized.trim()
}

export function validateAIResponse(response: string): string {
  const sensitivePatterns = [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    /\b(?:\d[ -]*?){13,16}\b/g,
    /\b\d{9}\b/g,
    /sk-[a-zA-Z0-9]{20,}/g,
    /password\s*[:=]\s*\S+/gi,
  ]

  let cleaned = response
  for (const pattern of sensitivePatterns) {
    cleaned = cleaned.replace(pattern, '[REDACTED]')
  }

  return cleaned
}
```

---

### 3. Audit Logging (Antes de Beta)

**Schema:** `packages/db/src/schema/audit-logs.ts`

```typescript
import { pgTable, uuid, text, jsonb, timestamp, inet } from 'drizzle-orm/pg-core'
import { profiles } from './profiles'

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => profiles.id),
  action: text('action').notNull(),
  resource: text('resource'),
  resourceId: text('resource_id'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
```

**Helper:** `packages/api/src/lib/audit.ts`

```typescript
import { db } from '@wallie/db'
import { auditLogs } from '@wallie/db/schema'

export type AuditAction =
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'create_client'
  | 'update_client'
  | 'delete_client'
  | 'send_message'
  | 'ai_response_generated'
  | 'subscription_changed'
  | 'payment_failed'
  | 'data_exported'
  | 'account_deleted'
  | 'oauth_connected'
  | 'oauth_disconnected'
  | 'settings_changed'

export async function audit(params: {
  userId?: string
  action: AuditAction
  resource?: string
  resourceId?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}): Promise<void> {
  try {
    await db.insert(auditLogs).values(params)
  } catch (error) {
    console.error('Failed to write audit log:', error)
  }
}
```

---

### 4. OAuth Token Encryption (Con Gmail/Calendar)

**Crear:** `packages/api/src/lib/encryption.ts`

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!
const ALGORITHM = 'aes-256-gcm'

export function encrypt(text: string): string {
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

export function decrypt(encryptedData: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':')

  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')

  const decipher = createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
```

Generar key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

### 5. RLS en Supabase (Verificar/Completar)

```sql
-- Ejecutar en Supabase SQL Editor

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own clients" ON clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clients" ON clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clients" ON clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own clients" ON clients FOR DELETE USING (auth.uid() = user_id);

-- Conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own conversations" ON conversations FOR ALL USING (auth.uid() = user_id);

-- Messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view messages in own conversations" ON messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id AND conversations.user_id = auth.uid()));

-- Tags
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own tags" ON tags FOR ALL USING (auth.uid() = user_id);

-- Subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Consents
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own consents" ON consents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own consents" ON consents FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

### 6. 2FA/MFA (Post-Launch)

Usar Supabase MFA nativo:

```typescript
// Enroll
const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })

// Verify
const { data, error } = await supabase.auth.mfa.verify({
  factorId: factorId,
  code: userCode,
})
```

---

### 7. Sentry Security Config (Post-Launch)

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
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
  ignoreErrors: ['ResizeObserver loop limit exceeded', 'Network request failed'],
})
```

---

### 8. Script de Seguridad Pre-Commit

```bash
#!/bin/bash
# scripts/security-check.sh

echo "🔐 Running security checks..."

# Check for secrets
if grep -rE "(sk-[a-zA-Z0-9]{20,}|sk_live_|whsec_|password\s*=)" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules apps/ packages/; then
  echo "❌ Potential secrets found!"
  exit 1
fi

# Check .env not in git
if git ls-files --error-unmatch .env 2>/dev/null; then
  echo "❌ .env in git!"
  exit 1
fi

# Audit dependencies
pnpm audit --audit-level=high || echo "⚠️ Vulnerabilities found"

echo "✅ Security checks passed!"
```

---

## 📞 Incident Response

### Niveles de Severidad

| Nivel | Descripción               | Tiempo Respuesta |
| ----- | ------------------------- | ---------------- |
| P0    | Brecha de datos           | Inmediato        |
| P1    | Vulnerabilidad explotable | < 1 hora         |
| P2    | Vulnerabilidad potencial  | < 24 horas       |
| P3    | Mejora de seguridad       | < 1 semana       |

### Checklist P0/P1

- [ ] Aislar sistema afectado
- [ ] Notificar equipo
- [ ] Documentar alcance
- [ ] Preservar logs
- [ ] Revocar credenciales
- [ ] Notificar usuarios (si brecha)
- [ ] Notificar AEPD (72h GDPR)
- [ ] Post-mortem

---

## 🔑 Variables de Entorno Futuras

```bash
# Rate Limiting
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Encryption
ENCRYPTION_KEY=  # 32 bytes hex

# Sentry
NEXT_PUBLIC_SENTRY_DSN=
```

---

_Documento generado: 02 Dic 2025_
_Próxima revisión: Antes de Beta_
