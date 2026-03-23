# 🔐 Seguridad

> **Regla:** Validar todo, confiar en nada.

---

## ✅ Checklist de Seguridad (Obligatorio)

### 1. Validación de Input (Zod en TODOS los endpoints)

```typescript
const schema = z.object({
  id: z.string().uuid(),
  email: z.string().email().max(255),
  phone: z.string().regex(/^\+?[0-9]{9,15}$/),
  amount: z.number().positive().max(1000000),
})
```

### 2. Autorización (verificar propiedad SIEMPRE)

```typescript
// En CADA query/mutation:
.where(
  and(
    eq(table.id, input.id),
    eq(table.userId, ctx.userId) // ← NUNCA OLVIDAR
  )
)
```

### 3. Sanitización de Output

```typescript
// ❌ MAL - Expone todo
return user

// ✅ BIEN - Solo campos necesarios
return {
  id: user.id,
  name: user.name,
  email: user.email,
  // NO incluir: password, tokens, internal IDs
}
```

### 4. Rate Limiting

```typescript
import { ratelimit } from '@/lib/ratelimit'

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return Response.json({ error: 'Too many requests' }, { status: 429 })
  }
}
```

### 5. Verificación de Webhooks

```typescript
import { createHmac, timingSafeEqual } from 'crypto'

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  return timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${expected}`)
  )
}
```

### 6. Headers de Seguridad (next.config.js)

```javascript
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
]
```

### 7. Variables de Entorno

```typescript
// Usar @t3-oss/env-nextjs para validar en build time
import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    ANTHROPIC_API_KEY: z.string().min(1),
    WEBHOOK_SECRET: z.string().min(32),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    // ...
  },
})
```

---

## 🚨 VULNERABILIDADES COMUNES

### Queries Sin userId

```typescript
// ❌ CRÍTICO - Cualquier usuario puede ver cualquier dato
const client = await db.select().from(clients).where(eq(clients.id, id))

// ✅ CORRECTO
const client = await db.select().from(clients).where(
  and(
    eq(clients.id, id),
    eq(clients.userId, ctx.userId) // ← OBLIGATORIO
  )
)
```

### SQL Injection

```typescript
// ❌ VULNERABLE
db.execute(`SELECT * FROM users WHERE id = '${userId}'`)

// ✅ SEGURO - Usar query builder
db.select().from(users).where(eq(users.id, userId))
```

### XSS (Cross-Site Scripting)

```typescript
// ❌ PELIGROSO
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ SEGURO - Sanitizar primero
import DOMPurify from 'isomorphic-dompurify'
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

---

## 🔑 Git Secrets (Obligatorio)

```bash
# Instalar git-secrets
brew install git-secrets  # macOS

# Configurar en el repo
cd proyecto
git secrets --install
git secrets --register-aws

# Añadir patrones custom
git secrets --add 'sk-ant-[a-zA-Z0-9]+'  # Anthropic
git secrets --add 'sk_live_[a-zA-Z0-9]+'  # Stripe
git secrets --add 'password\s*=\s*.+'

# Verificar antes de commit
git secrets --scan
```

---

## ✅ Checklist Antes de Deploy

- [ ] Todas las queries filtran por userId
- [ ] Input validado con Zod
- [ ] Secrets en variables de entorno
- [ ] Rate limiting configurado
- [ ] Headers de seguridad activos
- [ ] git-secrets configurado
- [ ] No hay secrets en código

---

_Ver documentación completa en [CLAUDE.md](../../CLAUDE.md#seguridad)_
