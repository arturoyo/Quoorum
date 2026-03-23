# 📚 SISTEMA DE DOCUMENTACIÓN - MÓDULOS ADICIONALES

> **Fuente:** Proyecto Quoorum
> **Fecha:** 5 Febrero 2026
> **Complemento de:** SISTEMA-DOCUMENTACION-COMPLETO.md

Este documento contiene los **8 módulos adicionales** del sistema de documentación modular de Quoorum que no se incluyeron en el documento principal.

---

## 📑 CONTENIDO

1. [Módulo 03: Database (PostgreSQL)](#módulo-03-database)
2. [Módulo 04: Rules (22 Reglas)](#módulo-04-rules)
3. [Módulo 07: Stack Tecnológico](#módulo-07-stack)
4. [Módulo 09: Testing](#módulo-09-testing)
5. [Módulo 10: Security](#módulo-10-security)
6. [Módulo 11: FAQ y Comandos](#módulo-11-faq)
7. [Módulo 13: Debate Flow](#módulo-13-debate-flow)
8. [Módulo 14: AI Prompt Management](#módulo-14-ai-prompt-management)

---

## MÓDULO 03: DATABASE

```markdown
# 🗄️ Base de Datos: PostgreSQL Local

> **REGLA CRÍTICA:** PostgreSQL local (Docker) EXCLUSIVAMENTE. NUNCA uses Supabase cloud para datos.

---

## 📌 Configuración Actual

| Variable | Valor | Propósito |
|----------|-------|-----------|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5433/quoorum` | **PostgreSQL LOCAL** (Drizzle) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ipcbpkbvrftchbmpemlg.supabase.co` | Solo para Auth |

**⚠️ IMPORTANTE:**
- Supabase = Solo autenticación (`ctx.user`)
- PostgreSQL local = TODOS los datos

---

## 🏗️ Arquitectura Híbrida

### 1️⃣ Supabase Cloud (Auth ÚNICAMENTE)

```
📍 URL: https://ipcbpkbvrftchbmpemlg.supabase.co
🔑 Tabla: auth.users (gestionada por Supabase Auth)
```

**Responsabilidades:**
- ✅ Registro (`signUp()`)
- ✅ Login/Logout (`signIn()`, `signOut()`)
- ✅ Gestión de sesiones (JWT)
- ✅ Recuperación de contraseña
- ✅ OAuth providers

**NO almacena:**
- ❌ Perfiles de usuario
- ❌ Ningún dato de aplicación

### 2️⃣ PostgreSQL Local (TODOS LOS DATOS)

```
📍 URL: postgresql://postgres:postgres@localhost:5433/quoorum
🗄️ Tablas: 27 schemas (profiles, debates, clients, messages, etc.)
```

**Responsabilidades:**
- ✅ Todos los datos de aplicación
- ✅ Perfiles de usuario (tabla `profiles`)
- ✅ Relaciones entre entidades
- ✅ Queries con Drizzle ORM

---

## 🔗 Flujo de Autenticación

```
1. Usuario se registra
   ↓
2. Supabase Auth crea registro en auth.users
   ↓
3. Supabase Auth retorna user.id (UUID)
   ↓
4. Aplicación DEBE crear perfil en PostgreSQL local:
   INSERT INTO profiles (id, user_id, ...)
   VALUES (uuid_generate_v4(), user.id, ...)
   ↓
5. Todas las entidades referencian profiles.id:
   clients.user_id → profiles.id ✅
   debates.creator_id → profiles.id ✅
```

---

## 🚨 Error Común: Foreign Key Violations

**Error típico:**
```
insert or update on table "clients" violates foreign key constraint
"clients_user_id_profiles_id_fk"
```

**Causa raíz:**
- Usuario existe en Supabase Auth (`auth.users`)
- Perfil NO existe en PostgreSQL local (`profiles`)
- Aplicación intenta crear cliente con `user_id` inexistente

**Solución INMEDIATA:**

```bash
# 1. Verificar si el perfil existe
docker exec quoorum-postgres psql -U postgres -d quoorum -c \
  "SELECT id, user_id, email FROM profiles WHERE user_id = 'AUTH_USER_ID';"

# 2. Si NO existe, crear perfil
docker exec quoorum-postgres psql -U postgres -d quoorum -c "
  INSERT INTO profiles (id, user_id, email, name, role, is_active)
  VALUES ('PROFILE_ID', 'AUTH_USER_ID', 'email@example.com', 'Nombre Usuario', 'user', true)
  ON CONFLICT (id) DO NOTHING;
"
```

---

## 🚨 Reglas de Oro

### 1. NUNCA queries a Supabase para datos de aplicación

```typescript
// ❌ MAL
const { data } = await supabase.from('clients').select('*')

// ✅ BIEN
const clients = await db.select().from(clientsTable)
```

### 2. SIEMPRE verificar que el perfil existe

```typescript
// En routers tRPC, ctx.userId viene de Supabase Auth
// Pero DEBE existir en profiles de PostgreSQL local
const profile = await db.query.profiles.findFirst({
  where: eq(profiles.userId, ctx.userId)
})

if (!profile) {
  throw new TRPCError({
    code: 'PRECONDITION_FAILED',
    message: 'Profile not found. Please complete onboarding.'
  })
}
```

### 3. Sincronización de perfiles es responsabilidad de la aplicación

- NO hay trigger automático Supabase → PostgreSQL
- El endpoint de registro DEBE crear el perfil
- Script `scripts/sync-profiles.sh` es para casos excepcionales

### 4. PostgreSQL local puede resetearse en desarrollo

```bash
docker-compose down -v  # ⚠️ Borra TODO PostgreSQL local
docker-compose up -d    # Recrear contenedor
pnpm db:push            # Aplicar schemas
pnpm db:seed            # Seed data inicial

# Resultado: auth.users en Supabase siguen existiendo
#            profiles en PostgreSQL local NO
# Solución: Re-crear perfiles con sync-profiles.sh
```

---

## 📋 Checklist de Debugging

Si ves errores de foreign key:

- [ ] ¿El usuario está autenticado? (`ctx.userId` existe)
- [ ] ¿El perfil existe en PostgreSQL local? (query a `profiles`)
- [ ] ¿PostgreSQL local se reseteó recientemente?
- [ ] ¿El endpoint de registro crea el perfil correctamente?
- [ ] ¿Hay otros perfiles huérfanos? (auth.users sin profiles)

**Comando de auditoría:**
```bash
# Ver cuántos perfiles hay
docker exec quoorum-postgres psql -U postgres -d quoorum -c \
  "SELECT COUNT(*) FROM profiles;"

# Ver todos los perfiles
docker exec quoorum-postgres psql -U postgres -d quoorum -c \
  "SELECT id, user_id, email, name FROM profiles;"
```

---

## ✅ Checklist ANTES de Migrar Router a PostgreSQL Local

1. ✅ **Verificar que el usuario tiene perfil en PostgreSQL local**
   ```bash
   docker exec quoorum-postgres psql -U postgres -d quoorum -c \
     "SELECT COUNT(*) FROM profiles;"
   ```
   - Si retorna `0` → **CREAR PERFIL PRIMERO**

2. ✅ **Verificar foreign keys necesarias**
   - Revisa qué tablas referencia la tabla que vas a insertar
   - Asegúrate de que esas filas existen en PostgreSQL local

3. ✅ **Usar Drizzle ORM, NO Supabase client**
   ```typescript
   // ❌ INCORRECTO
   const { data } = await ctx.supabase.from('table').select('*')

   // ✅ CORRECTO
   const data = await db.select().from(table)
   ```
```

---

## MÓDULO 04: RULES

```markdown
# 🔴 Reglas Inviolables

> **Estas reglas son NO NEGOCIABLES. Cualquier violación será RECHAZADA.**

---

## 0. 🎯 OPCIONES: Evaluar y elegir la mejor

Cuando el usuario pida una feature, fix o cambio:

1. **Enumerar** las opciones viables (2–5 alternativas)
2. **Analizar** pros/contras de cada una
3. **Elegir** la mejor y **implementarla**

```
✅ CORRECTO: "Hay 3 opciones: A, B, C. Recomiendo B porque... La implemento."
❌ INCORRECTO: Implementar la primera idea sin considerar alternativas.
```

---

## 1. 📖 SIEMPRE LEER DOCUMENTACIÓN PRIMERO

```
✅ CORRECTO:
1. Leer CLAUDE.md → SYSTEM.md → PHASES.md
2. Entender la arquitectura actual
3. Verificar en qué fase estamos
4. LUEGO escribir código

❌ INCORRECTO:
- Empezar a codear directamente
- Asumir la arquitectura
- Inventar estructuras nuevas
```

---

## 2. 🚫 ZERO TOLERANCE: Datos Mock en Producción

```typescript
// ✅ CORRECTO: API real con error handling
const { data, error, isLoading } = api.clients.list.useQuery()
if (error) return <ErrorState message={error.message} />
if (isLoading) return <Skeleton />
return <ClientList data={data} />

// ❌ INCORRECTO: Fallback a mock data
const { data } = api.clients.list.useQuery()
const finalData = data || MOCK_CLIENTS // ❌ NUNCA
```

**Por qué:** La integridad del producto depende de datos reales.

---

## 3. 🏗️ ARQUITECTURA: Respetar Separación de Concerns

```
✅ CORRECTO:
- Componentes de UI → /components/
- Lógica de negocio → /services/ o /lib/
- Acceso a datos → /api/ o routers tRPC
- Tipos → /types/ o colocados con su módulo

❌ INCORRECTO:
- Lógica de negocio en componentes
- Queries SQL en componentes
- Fetch directo en UI
- Mezclar capas
```

---

## 4. 📝 TYPESCRIPT: Tipado Estricto Obligatorio

```typescript
// ✅ CORRECTO
function getClient(id: string): Promise<Client | null> {
  return db.query.clients.findFirst({ where: eq(clients.id, id) })
}

// ❌ INCORRECTO
function getClient(id: any): any {
  return db.query.clients.findFirst({ where: eq(clients.id, id) })
}
```

---

## 5. 🔐 SEGURIDAD: Validar Todo, Confiar en Nada

```typescript
// ✅ CORRECTO: Validación + autorización
const schema = z.object({
  clientId: z.string().uuid(),
  name: z.string().min(1).max(100),
})

const [client] = await db
  .select()
  .from(clients)
  .where(
    and(
      eq(clients.id, input.clientId),
      eq(clients.userId, ctx.userId) // ⚠️ OBLIGATORIO
    )
  )

// ❌ INCORRECTO: Sin validación ni autorización
const client = await db.select().from(clients).where(eq(clients.id, id))
```

---

## 6. 🧪 TESTING: No Commit Sin Tests

```
✅ CORRECTO:
- Función nueva → Test nuevo
- Bug fix → Test que reproduce el bug
- Coverage mínimo: 80%

❌ INCORRECTO:
- Commit sin tests
- Tests que no verifican nada
- Coverage < 80%
```

---

## 7. 🔄 ORDEN DE DESARROLLO: Backend First

```
✅ CORRECTO (Orden):
1. Schema/tipos
2. Migraciones DB
3. Router tRPC + Tests
4. Componente UI + Tests

❌ INCORRECTO:
1. UI con mock data
2. "Backend después"
```

---

## 9. 🎨 LANDING PAGE: Componentes Oficiales ÚNICOS

```
⚠️ LA LANDING TIENE UNA VERSIÓN ESTABLE OFICIAL
Commit: 786d2d2 (16 Dic 2024, 23:11)

✅ COMPONENTES OFICIALES (en orden):
1. FomoBanner
2. MarketingHeader
3. Hero
4. TrustBar
5. ProblemSection
6. SolutionSection
7. CopilotSection
8. SafeZoneSection
9. TestimonialsSection
10. PricingSection
11. FAQ
12. FinalCTA
13. MarketingFooter

❌ NUNCA usar componentes de _archived/
```

---

## 10. 📊 DASHBOARD: Estructura Oficial ÚNICA

```
⚠️ EL DASHBOARD TIENE UNA ÚNICA VERSIÓN OFICIAL
Archivo: apps/web/src/app/dashboard/page.tsx

✅ ESTRUCTURA:
- Header: Título + Fecha
- Quick Stats (4 cards)
- AI Suggested Reminders
- Main Grid:
  - Actividad Reciente (2 cols)
  - PointsWidget + Acciones + AI Efficiency (1 col)

❌ NO crear versiones duplicadas
```

---

## 13. 🎨 UX/DESIGN: Paleta de Colores Oficial

```
⚠️ REGLA CRÍTICA DE CONSISTENCIA VISUAL

"SIEMPRE usar variables CSS de tema.
NUNCA hardcodear colores (text-white, bg-white/5, etc.)"

// ❌ MAL - Colores hardcodeados
<div className="bg-white/5 border-white/10 text-white">

// ✅ BIEN - Variables CSS
<div className="bg-[var(--theme-landing-card)] border-[var(--theme-landing-border)]">
```

---

## 23. 🔄 ENUMS Y TYPES: Inferir desde DB

```
⚠️ REGLA DE SINGLE SOURCE OF TRUTH

"NUNCA definir manualmente enums/types que ya existen en el schema de DB."

✅ CORRECTO:
```typescript
import type { debateStatusEnum } from '@quoorum/db/schema'
export type DebateStatus = (typeof debateStatusEnum.enumValues)[number]
```

❌ INCORRECTO:
```typescript
export type DebateStatus = 'draft' | 'pending' | 'in_progress'
// ← Hardcoded, se desincroniza con DB
```

**Por qué:** Evita desincronización entre frontend y backend.
```

---

## MÓDULO 07: STACK

```markdown
# 🛠️ Stack Tecnológico

> **Stack aprobado (NO cambiar sin autorización)**

---

## 📋 STACK APROBADO

| Categoría | Tecnología | Alternativas Prohibidas |
|-----------|------------|------------------------|
| **Framework** | Next.js 14+ (App Router) | Pages Router, Remix, Gatsby |
| **Lenguaje** | TypeScript 5+ (strict) | JavaScript puro |
| **Estilos** | Tailwind CSS + shadcn/ui | CSS Modules, styled-components |
| **API** | tRPC v11+ | REST directo, GraphQL |
| **ORM** | Drizzle ORM | Prisma, TypeORM, Sequelize |
| **Database** | PostgreSQL (local Docker) | MongoDB, MySQL, Firebase |
| **Auth** | Supabase Auth | NextAuth, Clerk, Auth0 |
| **Validación** | Zod | Yup, Joi, class-validator |
| **State** | Zustand / TanStack Query | Redux, MobX, Recoil |
| **Testing** | Vitest + Playwright | Jest (excepto legacy) |
| **IA** | OpenAI / Anthropic / Google AI / Groq | Modelos no aprobados |
| **Monorepo** | Turborepo + pnpm | npm, yarn workspaces |
| **Monitoring** | Sentry | Alternativas sin aprobar |
| **Analytics** | PostHog | Mixpanel, Amplitude |
| **Background Jobs** | Inngest | BullMQ, Agenda |

---

## 📦 LIBRERÍAS APROBADAS (24 categorías)

### UI
- @radix-ui/*
- lucide-react
- framer-motion
- sonner

### Forms
- react-hook-form
- @hookform/resolvers

### Dates
- date-fns

### Utils
- clsx
- tailwind-merge
- superjson

### Charts
- recharts

### Tables
- @tanstack/react-table

### Emails
- @react-email/*
- resend

### Files
- uploadthing
- @vercel/blob

### AI
- openai
- @anthropic-ai/sdk
- @google/generative-ai
- groq-sdk
- langchain
- @langchain/openai
- @langchain/anthropic

### Monitoring
- @sentry/nextjs
- @sentry/node

### Analytics
- posthog-js
- posthog-node

### Jobs
- inngest

### PDF
- @react-pdf/renderer
- jspdf

### Rate Limiting
- @upstash/ratelimit
- @upstash/redis

---

## 🚫 ALTERNATIVAS PROHIBIDAS

### ❌ NO USAR

- **CSS-in-JS:** styled-components, Emotion, Stitches
- **State Management:** Redux Toolkit, MobX, Recoil, Jotai
- **Forms:** Formik, Final Form
- **Query:** SWR (usar TanStack Query)
- **ORM:** Prisma, TypeORM, Sequelize
- **Testing:** Jest para nuevos tests (legacy ok)
- **Package Manager:** npm, yarn (usar pnpm)

---

## 📌 JUSTIFICACIONES

### ¿Por qué Drizzle y no Prisma?

- ✅ SQL-like syntax (más familiar)
- ✅ Type-safe sin generación de código
- ✅ Mejor performance
- ✅ Más control sobre queries

### ¿Por qué tRPC y no REST/GraphQL?

- ✅ End-to-end type safety
- ✅ No codegen necesario
- ✅ Mejor DX (Developer Experience)
- ✅ Menos boilerplate

### ¿Por qué Vitest y no Jest?

- ✅ Más rápido
- ✅ ESM nativo
- ✅ Compatible con Vite
- ✅ Mejor experiencia de debugging

### ¿Por qué pnpm y no npm/yarn?

- ✅ Más rápido
- ✅ Ahorra espacio en disco
- ✅ Monorepo-friendly
- ✅ Strict mode por defecto

---

## 🔄 PROCESO PARA AÑADIR NUEVA LIBRERÍA

Si necesitas añadir una librería NO listada aquí:

1. **Buscar alternativa aprobada** en la lista
2. **Justificar por qué es necesaria** la nueva librería
3. **Proponer en PR** con justificación completa
4. **Esperar aprobación** antes de instalar
5. **Documentar decisión** en este archivo

### Template de Justificación

```markdown
## Propuesta: [Nombre Librería]

**Problema:** [Qué problema resuelve]
**Alternativa actual:** [Qué usamos ahora]
**Por qué no sirve:** [Limitaciones de la alternativa]
**Beneficios:** [Qué aporta la nueva librería]
**Riesgos:** [Posibles problemas]
**Mantenimiento:** [Estado del proyecto, comunidad]
**Bundle size:** [Impacto en el bundle]
```
```

---

## MÓDULO 09: TESTING

```markdown
# 🧪 Testing

> **Regla:** No commit sin tests. Coverage mínimo 80%.

---

## 📊 Coverage Mínimo

| Área | Mínimo | Ideal |
|------|--------|-------|
| Backend (routers) | 90% | 95% |
| Services/Lib | 85% | 90% |
| Componentes críticos | 80% | 90% |
| Utils/Helpers | 90% | 95% |
| E2E (happy paths) | 100% flujos críticos | — |

---

## 🏗️ Estructura de Tests

```
packages/
  api/
    src/
      routers/
        clients.ts
        __tests__/
          clients.test.ts      # Unit tests del router
  db/
    src/
      __tests__/
        client.test.ts         # Tests de schema/queries

apps/
  web/
    src/
      components/
        clients/
          __tests__/
            client-card.test.tsx  # Tests de componentes
    tests/
      e2e/
        clients.spec.ts        # Tests E2E
```

---

## ✅ Test de Router tRPC

```typescript
// packages/api/src/routers/__tests__/clients.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createCaller } from '../../root'
import { db } from '@proyecto/db'

const TEST_USER_ID = 'test-user-123'

describe('clients router', () => {
  beforeEach(async () => {
    await createTestUser()
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  it('should create a client with valid data', async () => {
    const caller = createCaller({ userId: TEST_USER_ID })

    const client = await caller.clients.create({
      name: 'Juan García',
      email: 'juan@example.com',
    })

    expect(client).toMatchObject({
      name: 'Juan García',
      email: 'juan@example.com',
      userId: TEST_USER_ID,
    })
  })

  it('should reject invalid email', async () => {
    const caller = createCaller({ userId: TEST_USER_ID })

    await expect(
      caller.clients.create({
        name: 'Juan García',
        email: 'invalid-email',
      })
    ).rejects.toThrow('Email inválido')
  })

  it('should NOT return client for non-owner', async () => {
    const ownerCaller = createCaller({ userId: TEST_USER_ID })
    const otherCaller = createCaller({ userId: 'other-user' })

    const created = await ownerCaller.clients.create({ name: 'Test' })

    await expect(
      otherCaller.clients.getById({ id: created.id })
    ).rejects.toThrow('NOT_FOUND')
  })
})
```

---

## ✅ Test de Componente

```typescript
// apps/web/src/components/clients/__tests__/client-card.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ClientCard } from '../client-card'

const mockClient = {
  id: '123',
  name: 'Juan García',
  email: 'juan@example.com',
  status: 'ACTIVE' as const,
}

describe('ClientCard', () => {
  it('renders client information correctly', () => {
    render(<ClientCard client={mockClient} />)

    expect(screen.getByText('Juan García')).toBeInTheDocument()
    expect(screen.getByText('juan@example.com')).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn()
    render(<ClientCard client={mockClient} onEdit={onEdit} />)

    fireEvent.click(screen.getByRole('button', { name: /editar/i }))

    expect(onEdit).toHaveBeenCalledWith(mockClient)
  })
})
```

---

## ✅ Test E2E (Playwright)

```typescript
// apps/web/tests/e2e/clients.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Clients', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('should create a new client', async ({ page }) => {
    await page.goto('/clients')
    await page.click('button:has-text("Nuevo Cliente")')
    await page.fill('[name="name"]', 'Nuevo Cliente')
    await page.fill('[name="email"]', 'nuevo@example.com')
    await page.click('button[type="submit"]')

    await expect(page.locator('text=Nuevo Cliente')).toBeVisible()
  })
})
```

---

## 🧪 Comandos de Testing

```bash
# Tests unitarios
pnpm test

# Tests con coverage
pnpm test --coverage

# Tests E2E
pnpm test:e2e

# Tests en modo watch
pnpm test --watch

# Tests de un archivo específico
pnpm test clients.test.ts
```

---

## ✅ Checklist Pre-Commit

- [ ] Tests pasan localmente
- [ ] Coverage mínimo 80%
- [ ] Tests de autorización (userId) incluidos
- [ ] Tests de validación Zod incluidos
- [ ] Tests E2E para flujos críticos
```

---

## MÓDULO 10: SECURITY

```markdown
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
// ❌ CRÍTICO
const client = await db.select().from(clients).where(eq(clients.id, id))

// ✅ CORRECTO
const client = await db.select().from(clients).where(
  and(
    eq(clients.id, id),
    eq(clients.userId, ctx.userId)
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
```

---

## MÓDULO 11: FAQ

```markdown
# ❓ FAQ y Comandos Útiles

---

## 🛠️ COMANDOS ÚTILES

### Desarrollo

```bash
pnpm dev              # Iniciar todo
pnpm dev --filter web # Solo web
pnpm preflight        # Pre-flight checks
```

### Base de Datos

```bash
pnpm db:generate      # Generar migraciones
pnpm db:push          # Aplicar migraciones
pnpm db:reset         # Reset DB (dev only)
pnpm db:studio        # Abrir studio
pnpm db:seed          # Seed data
```

### Calidad

```bash
pnpm typecheck        # TypeScript check
pnpm lint             # Lint
pnpm lint:fix         # Lint + fix
pnpm format           # Format
pnpm test             # Tests
pnpm test --coverage  # Tests con coverage
pnpm test:e2e         # Tests E2E
```

### Build & Deploy

```bash
pnpm build            # Build producción
pnpm preview          # Preview build
```

### Git

```bash
# Commit convencional
git commit -m "feat(clients): add client creation"
git commit -m "fix(auth): resolve token issue"

# Verificar secrets
git secrets --scan

# Restaurar desde producción
git checkout main -- archivo.tsx
```

---

## 🐛 TROUBLESHOOTING

### Error: Cannot find module './XXXX.js'

**Causa raíz:** Next.js cache corrupto (`.next/` folder)

**Solución:**
```bash
# Limpiar cache
cd apps/web
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules/.cache
pnpm next dev -p 3000
```

### 🔥 Next.js Cache Issues - Guía Completa

**⚠️ PROBLEMA FRECUENTE:** Next.js usa cache agresivo, se desincroniza en cambios masivos.

#### Por qué ocurre

Next.js cachea resultados de build en `.next/`:
- cache/ → Builds previos
- routes-manifest.json → Mapa de rutas compiladas
- server/ → Código servidor compilado

**El problema:**
1. Cambias 40+ archivos (ej: refactor de colores)
2. Next.js intenta Hot Module Replacement (HMR)
3. Cache tiene estado viejo, archivo real tiene estado nuevo
4. **Mismatch** → Error

#### Tipos de cambios "peligrosos"

| Tipo de Cambio | Riesgo | Por Qué |
|----------------|--------|---------|
| Cambiar imports/paths | 🔴 ALTO | Webpack regenera chunk mappings |
| Refactor masivo (10+ archivos) | 🔴 ALTO | Cache no puede seguir el ritmo |
| Renombrar archivos | 🔴 ALTO | Route manifest se desincroniza |
| Cambiar classNames (40+ archivos) | 🟡 MEDIO | Tailwind recompila todo |
| Añadir console.log | 🟢 BAJO | No afecta build |

#### Solución preventiva

```bash
# ANTES de refactor masivo:
rm -rf .next node_modules/.cache
pnpm dev
```

#### Solución curativa

```bash
# Windows PowerShell
cd C:\Quoorum\apps\web
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules\.cache
Get-Process | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force
Start-Sleep -Seconds 2
pnpm next dev -p 3000

# Linux/macOS
cd apps/web
rm -rf .next node_modules/.cache
pkill -9 node
pnpm next dev -p 3000
```

### 🪟 Windows Setup

**Configuración básica:**
```powershell
# 1. Verificar Node.js 20+
node -v

# 2. Instalar pnpm
npm install -g pnpm

# 3. Instalar dependencias
cd C:\Quoorum
pnpm install

# 4. Iniciar servidor
pnpm dev:no-fix
```

---

## 🚀 CI/CD

### Estado Actual

**⚠️ GitHub Actions NO configurado** (16 Ene 2026)

```
❌ GitHub Actions NO CONFIGURADO
✅ Alternativas funcionando:
   - Validación local con Husky
   - Vercel CI/CD operativo
```

### Sistema de Validación Local

```bash
# Pre-commit hooks (.husky/pre-commit)
# Ejecuta automáticamente:
- TypeScript check
- ESLint
- Tests unitarios
- Detección de console.log
- Git secrets scan
```

---

## ✅ CHECKLIST PRE-COMMIT

### Checklist Manual

**Antes de cada commit, verificar:**

- [ ] TypeScript sin errores (`pnpm typecheck`)
- [ ] Lint sin warnings (`pnpm lint`)
- [ ] Tests pasan (`pnpm test`)
- [ ] No hay `console.log` en producción
- [ ] No hay `any` en tipos nuevos
- [ ] No hay secrets en código
- [ ] Queries filtran por `userId`
- [ ] Input validado con Zod
- [ ] Commit message sigue convención
- [ ] Tests añadidos para código nuevo
```

---

## MÓDULO 13: DEBATE FLOW

```markdown
# 🎯 Flujo Completo de Creación de Debates

> **Sistema completo de creación de debates paso a paso**
> **Versión:** 2.0.0 | **Fecha:** 30 Ene 2026

---

## 🏗️ ARQUITECTURA GENERAL

### Ubicación del Sistema

```
apps/web/src/app/debates/new-unified/
├── [sessionId]/
│   └── page.tsx                    # Página principal
├── components/
│   ├── phase-contexto.tsx          # Fase 1
│   ├── phase-expertos.tsx          # Fase 2
│   ├── phase-estrategia.tsx        # Fase 3
│   ├── phase-revision.tsx          # Fase 4
│   ├── phase-debate.tsx            # Fase 5
│   ├── debate-sticky-header.tsx
│   ├── real-credits-tracker.tsx
│   └── autosave-indicator.tsx
├── hooks/
│   ├── use-unified-debate-state.ts # Hook central
│   └── use-backstory-header.ts
└── types.ts
```

### Hook Central: `use-unified-debate-state.ts`

**Responsabilidades:**
- ✅ Gestionar estado de las 5 fases
- ✅ Persistencia automática en localStorage
- ✅ Creación de drafts en DB
- ✅ Validación de respuestas con IA
- ✅ Evaluación de calidad del contexto
- ✅ Navegación entre fases
- ✅ Tracking de créditos consumidos
- ✅ Generación de preguntas contextuales

**Estados exportados:**
```typescript
{
  currentPhase: 1-5
  phaseProgress: { contexto: 0-100, expertos: 0-100, ... }
  contexto: ContextoState
  expertos: ExpertosState
  estrategia: EstrategiaState
  revision: RevisionState
  debate: DebateState

  isGeneratingQuestions: boolean
  isEvaluating: boolean
  isValidating: boolean
  isCreatingDebate: boolean

  handleInitialQuestion: (q: string) => void
  handleAnswer: (answer: string) => void
  handleParticipantUpdate: (update) => void
  handleStrategySelection: (strategy) => void
  navigateToPhase: (phase: number) => void
}
```

---

## 🎯 FASE 1: CONTEXTO

**Objetivo:** Recopilar contexto relevante mediante preguntas guiadas por IA.

### Flujo Completo

```
1. Usuario escribe pregunta inicial (mín 10 caracteres)
   ↓
2. Sistema muestra 3 opciones:
   a) 📋 Preguntas sugeridas (pool de 50)
   b) 🤖 Generar con IA (basadas en pregunta + backstory)
   c) ⏭️ Saltar (si isAdmin)
   ↓
3. Usuario responde cada pregunta
   ↓
4. [VALIDACIÓN NIVEL 1] Por cada respuesta:
   - Llama a api.debates.validateAnswerRelevance
   - Consume ~1 crédito
   - Verifica relevancia, claridad, longitud
   ↓
5. Si validación OK:
   - ✅ Acepta respuesta
   - ✅ [GUARDADO AUTO] localStorage
   - ✅ Avanza a siguiente pregunta
   ↓
6. [VALIDACIÓN NIVEL 2] Al completar todas:
   - Llama a api.debates.evaluateContextQuality
   - Consume ~3-5 créditos
   - Analiza TODAS las respuestas en conjunto
   ↓
7. Si score >= 40:
   - ✅ Botón "Continuar a Expertos" habilitado
```

### Pool de Preguntas Sugeridas (50 preguntas)

**5 categorías × 10 preguntas:**
- Estrategia & Negocio
- Producto & Desarrollo
- Equipo & Recursos
- Finanzas & Operaciones
- Marketing & Ventas

**Archivo:** `apps/web/src/lib/suggested-debate-questions.ts`

---

## 🎯 FASES 2-5

**FASE 2: EXPERTOS**
- Selección de participantes (3-5 expertos)
- Personalización con backstory
- Tracking de créditos

**FASE 3: ESTRATEGIA**
- Selección de patrón de debate
- Framework de toma de decisiones
- Configuración avanzada

**FASE 4: REVISIÓN**
- Confirmación de todo el setup
- Preview del debate
- Últimos ajustes

**FASE 5: DEBATE**
- Ejecución en vivo
- Streaming de respuestas
- Real-time credits tracking
- Generación de reporte final

---

## 🎨 COMPONENTES VISUALES

### debate-sticky-header.tsx
- Header fijo con título/subtítulo dinámico
- Progreso de fase
- Indicador de autosave

### real-credits-tracker.tsx
- Muestra créditos gastados en tiempo real
- Se actualiza con cada validación/generación
- Color-coded según disponibilidad

### validation-indicator.tsx
- Indicadores de validación
- Feedback visual de calidad
- Mensajes contextuales

---

## 🔍 DEBUGGING Y ERRORES COMUNES

### Error: Contexto vacío al avanzar a fase 2

**Causa:** No se guardó en localStorage
**Solución:** Verificar `use-unified-debate-state.ts` line ~450

### Error: Créditos no se actualizan

**Causa:** realCreditsDeducted no se suma correctamente
**Solución:** Verificar procedimiento tRPC retorna tokensUsed

### Error: Validación falla pero no muestra mensaje

**Causa:** Toast se superpone con mensaje en chat
**Solución:** Verificar orden de llamadas en handler
```

---

## MÓDULO 14: AI PROMPT MANAGEMENT

```markdown
# 📝 AI Prompt Management System

> **Versión:** 1.0.0 | **Fecha:** 31 Ene 2026

---

## 🎯 Propósito

Sistema centralizado para gestionar todos los prompts de IA:

- ✅ **3 niveles de rendimiento** configurables
- ✅ **60+ prompts** dinámicos (no hardcodeados)
- ✅ **Versioning** con historial
- ✅ **Admin UI** para editar desde navegador
- ✅ **Fallback** automático a configs
- ✅ **Type-safe** con TypeScript

---

## 🏗️ Arquitectura

```
USER SETTINGS UI
    ↓
PERFORMANCE LEVELS
• Económico (0.3x) - GPT-3.5, Gemini Flash
• Equilibrado (1.0x) - Mix [DEFAULT]
• Alto Rendimiento (3.0x) - GPT-4, Claude Opus
    ↓
PROMPT RESOLUTION ENGINE
  getPromptTemplate(slug, variables, performanceLevel)
    1. Check cache (15 min TTL)
    2. Query DB (system_prompts table)
    3. Fallback to config
    4. Select model based on level
    5. Replace variables
    ↓
AI CLIENT CALL
```

---

## 📊 Database Schema

### Tabla: `system_prompts`

```sql
-- Columnas clave:
key VARCHAR(100) UNIQUE        -- Slug del prompt
prompt TEXT NOT NULL           -- Template
category VARCHAR(50)           -- 'debates', 'context', etc.
phase INTEGER                  -- Fase del debate (1-5)
variables JSONB DEFAULT '[]'   -- Variables esperadas

-- Modelos por tier:
recommended_model VARCHAR(50)
economic_model VARCHAR(50)
balanced_model VARCHAR(50)
performance_model VARCHAR(50)

-- Configuración:
temperature REAL DEFAULT 0.7
max_tokens INTEGER DEFAULT 2000
```

### Tabla: `system_prompt_versions`

```sql
-- Historial de versiones
version INTEGER NOT NULL
changed_by UUID REFERENCES profiles(id)
change_reason TEXT
created_at TIMESTAMP
```

### Tabla: `profiles` (columna añadida)

```sql
performance_level VARCHAR(50) DEFAULT 'balanced'
  CHECK (performance_level IN ('economic', 'balanced', 'performance'))
```

---

## 🔧 Uso del Sistema

### 1. Obtener Prompt Dinámicamente

```typescript
import { getPromptTemplate } from '@quoorum/quoorum/lib/prompt-manager'

export const myProcedure = protectedProcedure
  .mutation(async ({ ctx, input }) => {
    // 1. Obtener performance level del usuario
    const [userProfile] = await db
      .select({ performanceLevel: profiles.performanceLevel })
      .from(profiles)
      .where(eq(profiles.id, ctx.userId))
      .limit(1)

    const performanceLevel = userProfile?.performanceLevel || 'balanced'

    // 2. Resolver prompt dinámicamente
    const resolvedPrompt = await getPromptTemplate(
      'analyze-question',  // Slug
      {
        question: input.question,
        context: input.context,
      },
      performanceLevel
    )

    // 3. Usar modelo y parámetros resueltos
    const response = await aiClient.chat({
      model: resolvedPrompt.model,
      temperature: resolvedPrompt.temperature,
      max_tokens: resolvedPrompt.maxTokens,
      messages: [
        {
          role: 'system',
          content: resolvedPrompt.systemPrompt || ''
        },
        {
          role: 'user',
          content: resolvedPrompt.template  // Variables ya reemplazadas
        },
      ],
    })

    return response
  })
```

### 2. Backward Compatibility Pattern

```typescript
// ❌ ANTES: Hardcoded
export function myFunction(input: Input): Output {
  const prompt = `Eres un experto...`
  return callAI(prompt, 'gpt-4')
}

// ✅ DESPUÉS: Dinámico con wrapper
async function getMyPrompt(performanceLevel: string) {
  try {
    const { getPromptTemplate } = await import('./lib/prompt-manager')
    const resolved = await getPromptTemplate('my-prompt', {}, performanceLevel)
    return { template: resolved.template, model: resolved.model }
  } catch {
    return { template: `Eres un experto...`, model: 'gpt-4' }
  }
}
```

---

## 📝 Crear Nuevo Prompt

### Vía Config (Desarrollo)

```typescript
// packages/quoorum/src/config/debate-prompts-config.ts
export const DEBATE_PROMPTS_DEFAULTS: Record<string, PromptConfig> = {
  'my-new-prompt': {
    slug: 'my-new-prompt',
    name: 'Mi Nuevo Prompt',
    description: 'Qué hace este prompt',
    phase: 1,
    category: 'analysis',
    template: `Eres un experto en \${topic}.

Tu tarea es analizar: \${question}`,
    systemPrompt: 'Eres un analista.',
    variables: ['topic', 'question'],

    // Modelos por tier
    recommendedModel: 'gpt-4-turbo',
    economicModel: 'gpt-3.5-turbo',
    balancedModel: 'gpt-4-turbo',
    performanceModel: 'gpt-4',

    temperature: 0.7,
    maxTokens: 2000,
  }
}
```

---

## 🔍 Sistema de Resolución

**Orden de prioridad:**
1. Cache (15 min TTL)
2. Database (system_prompts table)
3. Fallback config (DEBATE_PROMPTS_DEFAULTS)

**Selección de modelo:**
- Económico → economicModel
- Equilibrado → balancedModel
- Alto Rendimiento → performanceModel

---

## 💡 Beneficios

✅ **Centralizado** - Un solo lugar para todos los prompts
✅ **Versionado** - Historial completo de cambios
✅ **Configurable** - 3 tiers de rendimiento/coste
✅ **Type-safe** - TypeScript en todas las capas
✅ **Resiliente** - Fallback automático si DB falla
✅ **Admin-friendly** - UI para editar sin tocar código
```

---

## 🎯 RESUMEN FINAL

Este documento complementa **SISTEMA-DOCUMENTACION-COMPLETO.md** con 8 módulos adicionales:

- ✅ **03-database.md** - Arquitectura PostgreSQL + Supabase
- ✅ **04-rules.md** - 22 reglas inviolables
- ✅ **07-stack.md** - Stack tecnológico completo
- ✅ **09-testing.md** - Testing unit + E2E
- ✅ **10-security.md** - Checklist de seguridad
- ✅ **11-faq.md** - FAQ, comandos, troubleshooting
- ✅ **13-debate-flow.md** - Flujo completo de debates (5 fases)
- ✅ **14-ai-prompt-management.md** - Sistema de prompts dinámicos

**Total documentación:**
- Archivo 1: ~2,500 líneas (documento principal)
- Archivo 2: ~2,000 líneas (módulos adicionales)
- **Total: ~4,500 líneas de documentación completa**

---

_Documento creado: 5 Febrero 2026_
_Complemento de: SISTEMA-DOCUMENTACION-COMPLETO.md_
_Sistema de Documentación Modular v2.0.0_

**FIN DEL DOCUMENTO**
