# 📏 STANDARDS.md — Estándares de Código de Quoorum

> **Versión:** 1.0.0 | **Última actualización:** 17 Dic 2025
> **Para:** Guía de estilo y patrones de código obligatorios

---

## 📋 ÍNDICE

1. [Naming Conventions](#-naming-conventions)
2. [Estructura de Archivos](#-estructura-de-archivos)
3. [Componentes React](#-componentes-react)
4. [TypeScript](#-typescript)
5. [API & Backend](#-api--backend)
6. [Database](#-database)
7. [Testing](#-testing)
8. [Git & Commits](#-git--commits)
9. [Code Review](#-code-review)

---

## 🏷️ NAMING CONVENTIONS

### Archivos y Carpetas

```bash
# Archivos: kebab-case
client-card.tsx          ✅
ClientCard.tsx           ❌
client_card.tsx          ❌

# Carpetas: kebab-case
user-settings/           ✅
userSettings/            ❌
user_settings/           ❌

# Excepciones (Next.js conventions)
page.tsx                 ✅  # Route page
layout.tsx               ✅  # Route layout
loading.tsx              ✅  # Loading UI
error.tsx                ✅  # Error boundary
not-found.tsx            ✅  # 404 page
route.ts                 ✅  # API route
```

### Componentes

```typescript
// Componentes: PascalCase
export function ClientCard() {}           ✅
export function clientCard() {}           ❌
export function Client_Card() {}          ❌

// Props interfaces: [Component]Props
interface ClientCardProps {}              ✅
interface IClientCardProps {}             ❌  // No prefix I
interface ClientCardPropsInterface {}     ❌  // No suffix Interface

// Componentes con forwardRef
export const Button = forwardRef<HTMLButtonElement, ButtonProps>() ✅
```

### Hooks

```typescript
// Hooks: camelCase con prefijo "use"
function useClientData() {}               ✅
function useDebounce() {}                 ✅
function clientHook() {}                  ❌
function UseClient() {}                   ❌

// Archivos de hooks: use-[name].ts
use-client-data.ts                        ✅
useClientData.ts                          ❌
```

### Variables y Funciones

```typescript
// Variables: camelCase
const clientName = 'John'                 ✅
const client_name = 'John'                ❌
const ClientName = 'John'                 ❌

// Funciones: camelCase
function formatCurrency() {}              ✅
function FormatCurrency() {}              ❌
function format_currency() {}             ❌

// Constantes: SCREAMING_SNAKE_CASE
const MAX_RETRY_COUNT = 3                 ✅
const API_BASE_URL = 'https://...'        ✅
const maxRetryCount = 3                   ❌  // Para constantes globales
```

### Types y Enums

```typescript
// Types: PascalCase (sin prefijos)
type Client = {}                          ✅
type TClient = {}                         ⚠️  // Aceptable pero no preferido
type client = {}                          ❌

// Interfaces: PascalCase (sin prefix I)
interface ClientData {}                   ✅
interface IClientData {}                  ❌

// Enums: PascalCase con valores SCREAMING_SNAKE
enum ClientStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
}

// Preferir union types sobre enums cuando sea posible
type ClientStatus = 'active' | 'inactive' | 'pending'  ✅
```

### Database

```typescript
// Tables: snake_case (plural)
clients                                   ✅
client                                    ❌
Clients                                   ❌

// Columns: snake_case
user_id                                   ✅
userId                                    ❌
UserID                                    ❌

// Foreign keys: [table_singular]_id
user_id                                   ✅  // References users
client_id                                 ✅  // References clients
```

---

## 📁 ESTRUCTURA DE ARCHIVOS

### Estructura de Componente

```
components/
├── clients/                    # Feature folder
│   ├── client-card.tsx        # Componente principal
│   ├── client-list.tsx        # Componente lista
│   ├── client-form.tsx        # Formulario
│   ├── use-client-data.ts     # Hook específico
│   ├── client.types.ts        # Types locales (si muchos)
│   └── __tests__/             # Tests
│       ├── client-card.test.tsx
│       └── client-list.test.tsx
```

### Estructura de Página (App Router)

```
app/
├── (dashboard)/               # Route group (no afecta URL)
│   ├── clients/
│   │   ├── page.tsx          # /clients
│   │   ├── [id]/
│   │   │   └── page.tsx      # /clients/:id
│   │   ├── new/
│   │   │   └── page.tsx      # /clients/new
│   │   └── layout.tsx        # Layout compartido
│   └── layout.tsx            # Dashboard layout
├── (marketing)/              # Landing, pricing, etc
│   ├── page.tsx              # /
│   └── pricing/
│       └── page.tsx          # /pricing
└── api/
    └── webhooks/
        └── stripe/
            └── route.ts      # POST /api/webhooks/stripe
```

### Estructura de Package

```
packages/api/
├── src/
│   ├── routers/              # tRPC routers
│   │   ├── clients.ts
│   │   ├── messages.ts
│   │   ├── index.ts          # Re-exports
│   │   └── __tests__/
│   │       └── clients.test.ts
│   ├── lib/                  # Utilidades internas
│   │   ├── logger.ts
│   │   └── validators.ts
│   ├── trpc.ts               # tRPC setup
│   ├── root.ts               # Root router
│   └── index.ts              # Public exports
├── package.json
└── tsconfig.json
```

---

## ⚛️ COMPONENTES REACT

### Template de Componente

```typescript
'use client' // Solo si necesita hooks de cliente

// ═══════════════════════════════════════════════════════════
// 1. IMPORTS (en orden)
// ═══════════════════════════════════════════════════════════

// React y Next.js
import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Librerías externas
import { toast } from 'sonner'
import { format } from 'date-fns'

// Packages internos (@quoorum/*)
import { api } from '@quoorum/api'
import { Button, Card } from '@quoorum/ui'

// Imports locales
import { ClientAvatar } from '@/components/clients/client-avatar'
import { useDebounce } from '@/hooks/use-debounce'
import { formatCurrency } from '@/lib/utils'

// Types (siempre al final con "import type")
import type { Client } from '@quoorum/db/schema'

// ═══════════════════════════════════════════════════════════
// 2. TYPES
// ═══════════════════════════════════════════════════════════

interface ClientCardProps {
  client: Client
  onEdit?: (client: Client) => void
  onDelete?: (id: string) => void
  className?: string
}

// ═══════════════════════════════════════════════════════════
// 3. COMPONENT
// ═══════════════════════════════════════════════════════════

export function ClientCard({ client, onEdit, onDelete, className }: ClientCardProps) {
  // ─────────────────────────────────────────────────────────
  // 3.1 Hooks (siempre primero)
  // ─────────────────────────────────────────────────────────
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  // Queries
  const { data: stats } = api.clients.getStats.useQuery(
    { clientId: client.id },
    { enabled: !!client.id }
  )

  // Mutations
  const deleteClient = api.clients.delete.useMutation({
    onSuccess: () => {
      toast.success('Cliente eliminado')
      onDelete?.(client.id)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  // ─────────────────────────────────────────────────────────
  // 3.2 Computed values (useMemo si es costoso)
  // ─────────────────────────────────────────────────────────
  const fullName = `${client.name} ${client.lastName ?? ''}`.trim()
  const isActive = client.status === 'ACTIVE'

  const formattedDate = useMemo(
    () => format(new Date(client.createdAt), 'dd MMM yyyy'),
    [client.createdAt]
  )

  // ─────────────────────────────────────────────────────────
  // 3.3 Handlers (useCallback si se pasan como props)
  // ─────────────────────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    if (!confirm('¿Eliminar este cliente?')) return
    setIsDeleting(true)
    await deleteClient.mutateAsync({ id: client.id })
    setIsDeleting(false)
  }, [client.id, deleteClient])

  const handleEdit = useCallback(() => {
    onEdit?.(client)
  }, [client, onEdit])

  // ─────────────────────────────────────────────────────────
  // 3.4 Early returns (loading, error, empty)
  // ─────────────────────────────────────────────────────────
  // (En este caso no aplica, pero ejemplo:)
  // if (isLoading) return <ClientCardSkeleton />
  // if (error) return <ErrorState message={error.message} />

  // ─────────────────────────────────────────────────────────
  // 3.5 Render
  // ─────────────────────────────────────────────────────────
  return (
    <Card className={className}>
      <div className="flex items-center gap-4 p-4">
        <ClientAvatar name={fullName} />

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[#e9edef] truncate">{fullName}</h3>
          <p className="text-sm text-[#8696a0]">{client.email}</p>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleEdit}>
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </div>
      </div>
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════
// 4. SUBCOMPONENTS (privados, en el mismo archivo si pequeños)
// ═══════════════════════════════════════════════════════════

function ClientCardSkeleton() {
  return (
    <Card>
      <div className="animate-pulse p-4">
        <div className="h-10 w-10 rounded-full bg-[#202c33]" />
        <div className="mt-2 h-4 w-24 rounded bg-[#202c33]" />
      </div>
    </Card>
  )
}
```

### Reglas de Componentes

```typescript
// ✅ HACER
// 1. Named exports (no default)
export function ClientCard() {}

// 2. Props destructuradas
function ClientCard({ client, onEdit }: ClientCardProps) {}

// 3. Tipos explícitos para props
interface ClientCardProps {
  client: Client
  onEdit?: (client: Client) => void
}

// 4. Early returns para estados
if (isLoading) return <Skeleton />
if (error) return <Error />
if (!data) return <Empty />

// 5. Keys estables en listas
{clients.map((client) => (
  <ClientCard key={client.id} client={client} />
))}

// ❌ NO HACER
// 1. Default exports
export default function ClientCard() {}  // ❌

// 2. Props sin tipar
function ClientCard(props) {}  // ❌

// 3. Index como key
{clients.map((client, index) => (
  <ClientCard key={index} client={client} />  // ❌
))}

// 4. Lógica compleja en render
return (
  <div>
    {clients.filter(c => c.active).sort((a,b) => a.name.localeCompare(b.name)).map(...)}  // ❌
  </div>
)

// 5. Inline objects/functions en props (causa re-renders)
<Component style={{ color: 'red' }} onClick={() => doSomething()} />  // ❌
```

---

## 📘 TYPESCRIPT

### Strict Mode Obligatorio

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Tipos vs Interfaces

```typescript
// Usar TYPE para:
// - Union types
type Status = 'active' | 'inactive' | 'pending'

// - Tipos de funciones
type FormatFn = (value: number) => string

// - Tipos inferidos
type Client = typeof clients.$inferSelect

// - Mapped types
type Partial<T> = { [P in keyof T]?: T[P] }

// Usar INTERFACE para:
// - Props de componentes
interface ClientCardProps {
  client: Client
}

// - Objetos que pueden extenderse
interface BaseEntity {
  id: string
  createdAt: Date
}

interface Client extends BaseEntity {
  name: string
}
```

### Prohibiciones de TypeScript

```typescript
// ❌ NUNCA usar any
function process(data: any) {}                    // ❌
const result: any = fetchData()                   // ❌

// ✅ Alternativas a any
function process(data: unknown) {                 // ✅ unknown + type guard
  if (isValidData(data)) {
    return data.value
  }
}

function process<T>(data: T) {}                   // ✅ Generics

// ❌ NUNCA usar as (type assertion) sin validación
const user = data as User                         // ❌

// ✅ Validar con Zod
const user = userSchema.parse(data)               // ✅

// ❌ NUNCA usar @ts-ignore
// @ts-ignore
someFunction()                                    // ❌

// ✅ Si es absolutamente necesario, usar @ts-expect-error con comentario
// @ts-expect-error - Library types are wrong, issue #123
someFunction()                                    // ⚠️ Solo como último recurso

// ❌ NUNCA usar non-null assertion sin verificar
const value = obj!.property                       // ❌

// ✅ Verificar primero
if (obj) {
  const value = obj.property                      // ✅
}
const value = obj?.property ?? defaultValue       // ✅
```

### Inferencia de Tipos

```typescript
// ✅ Dejar que TS infiera cuando es obvio
const name = 'John'                               // string inferido
const count = 42                                  // number inferido
const items = ['a', 'b', 'c']                     // string[] inferido

// ✅ Tipar explícitamente cuando no es obvio
const client: Client = await fetchClient(id)
const handlers: Record<string, () => void> = {}

// ✅ Usar satisfies para validar sin perder inferencia
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
} satisfies Config

// ✅ Inferir tipos de Zod
const clientSchema = z.object({
  name: z.string(),
  email: z.string().email(),
})
type Client = z.infer<typeof clientSchema>

// ✅ Inferir tipos de Drizzle
type Client = typeof clients.$inferSelect
type NewClient = typeof clients.$inferInsert
```

---

## 🔌 API & BACKEND

### tRPC Router Pattern

```typescript
// packages/api/src/routers/clients.ts
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../trpc'
import { db } from '@quoorum/db'
import { clients } from '@quoorum/db/schema'
import { eq, and, desc } from 'drizzle-orm'

// ═══════════════════════════════════════════════════════════
// SCHEMAS (al inicio del archivo)
// ═══════════════════════════════════════════════════════════

const createClientSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().regex(/^\+?[0-9]{9,15}$/, 'Teléfono inválido').optional(),
})

const updateClientSchema = createClientSchema.partial().extend({
  id: z.string().uuid(),
})

// ═══════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════

export const clientsRouter = router({
  // LIST
  list: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      cursor: z.string().uuid().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const items = await db
        .select()
        .from(clients)
        .where(eq(clients.userId, ctx.userId))  // ⚠️ SIEMPRE filtrar por userId
        .orderBy(desc(clients.createdAt))
        .limit(input.limit + 1)

      let nextCursor: string | undefined
      if (items.length > input.limit) {
        const nextItem = items.pop()
        nextCursor = nextItem?.id
      }

      return { items, nextCursor }
    }),

  // GET BY ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [client] = await db
        .select()
        .from(clients)
        .where(and(
          eq(clients.id, input.id),
          eq(clients.userId, ctx.userId)  // ⚠️ SIEMPRE verificar ownership
        ))

      if (!client) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Cliente no encontrado',
        })
      }

      return client
    }),

  // CREATE
  create: protectedProcedure
    .input(createClientSchema)
    .mutation(async ({ ctx, input }) => {
      const [client] = await db
        .insert(clients)
        .values({
          ...input,
          userId: ctx.userId,  // ⚠️ SIEMPRE asignar userId
        })
        .returning()

      return client
    }),

  // UPDATE
  update: protectedProcedure
    .input(updateClientSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      // Verificar ownership primero
      const [existing] = await db
        .select({ id: clients.id })
        .from(clients)
        .where(and(
          eq(clients.id, id),
          eq(clients.userId, ctx.userId)
        ))

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Cliente no encontrado',
        })
      }

      const [updated] = await db
        .update(clients)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(clients.id, id))
        .returning()

      return updated
    }),

  // DELETE (soft delete preferido)
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await db
        .update(clients)
        .set({
          deletedAt: new Date(),
          status: 'DELETED',
        })
        .where(and(
          eq(clients.id, input.id),
          eq(clients.userId, ctx.userId)
        ))
        .returning({ id: clients.id })

      if (result.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Cliente no encontrado',
        })
      }

      return { success: true }
    }),
})
```

### Error Handling

```typescript
import { TRPCError } from '@trpc/server'

// Códigos de error estándar
throw new TRPCError({ code: 'NOT_FOUND', message: 'Recurso no encontrado' })
throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No autenticado' })
throw new TRPCError({ code: 'FORBIDDEN', message: 'Sin permisos' })
throw new TRPCError({ code: 'BAD_REQUEST', message: 'Datos inválidos' })
throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Error interno' })
throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Rate limit excedido' })

// Con causa original
try {
  await externalApi.call()
} catch (error) {
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Error al conectar con servicio externo',
    cause: error,
  })
}
```

---

## 🗄️ DATABASE

### Drizzle Schema Pattern

```typescript
// packages/db/src/schema/clients.ts
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  jsonb,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'

// ═══════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════

export const clientStatusEnum = pgEnum('client_status', [
  'ACTIVE',
  'INACTIVE',
  'PENDING',
  'DELETED',
])

// ═══════════════════════════════════════════════════════════
// TABLE
// ═══════════════════════════════════════════════════════════

export const clients = pgTable('clients', {
  // Primary key
  id: uuid('id').defaultRandom().primaryKey(),

  // Foreign keys
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Data
  name: varchar('name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  notes: text('notes'),

  // Status
  status: clientStatusEnum('status').notNull().default('ACTIVE'),

  // Metadata (JSON flexible)
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),

  // Timestamps (SIEMPRE incluir)
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  // Indexes para queries frecuentes
  userIdIdx: index('clients_user_id_idx').on(table.userId),
  statusIdx: index('clients_status_idx').on(table.status),
  emailIdx: index('clients_email_idx').on(table.email),
}))

// ═══════════════════════════════════════════════════════════
// RELATIONS
// ═══════════════════════════════════════════════════════════

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, {
    fields: [clients.userId],
    references: [users.id],
  }),
  conversations: many(conversations),
  messages: many(messages),
}))

// ═══════════════════════════════════════════════════════════
// TYPES (inferidos)
// ═══════════════════════════════════════════════════════════

export type Client = typeof clients.$inferSelect
export type NewClient = typeof clients.$inferInsert
```

### Query Patterns

```typescript
// ✅ Select con filtro de usuario
const userClients = await db
  .select()
  .from(clients)
  .where(eq(clients.userId, userId))

// ✅ Select con joins
const clientWithMessages = await db
  .select({
    client: clients,
    messageCount: count(messages.id),
  })
  .from(clients)
  .leftJoin(messages, eq(messages.clientId, clients.id))
  .where(eq(clients.userId, userId))
  .groupBy(clients.id)

// ✅ Insert returning
const [newClient] = await db
  .insert(clients)
  .values({ name: 'John', userId })
  .returning()

// ✅ Update con returning
const [updated] = await db
  .update(clients)
  .set({ name: 'Jane', updatedAt: new Date() })
  .where(and(
    eq(clients.id, clientId),
    eq(clients.userId, userId)
  ))
  .returning()

// ✅ Soft delete
await db
  .update(clients)
  .set({ deletedAt: new Date(), status: 'DELETED' })
  .where(eq(clients.id, clientId))

// ✅ Transaction
await db.transaction(async (tx) => {
  const [client] = await tx.insert(clients).values({ ... }).returning()
  await tx.insert(activities).values({ clientId: client.id, ... })
})
```

---

## 🧪 TESTING

### Estructura de Tests

```typescript
// __tests__/clients.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('ClientsRouter', () => {
  // Setup/Teardown
  beforeEach(async () => {
    await setupTestDatabase()
  })

  afterEach(async () => {
    await cleanupTestDatabase()
  })

  // Agrupar por método
  describe('list', () => {
    it('should return only user clients', async () => {
      // Arrange
      const userId = 'user-1'
      await createTestClient({ userId, name: 'Client 1' })
      await createTestClient({ userId: 'other-user', name: 'Client 2' })

      // Act
      const result = await caller.clients.list({ limit: 10 })

      // Assert
      expect(result.items).toHaveLength(1)
      expect(result.items[0].name).toBe('Client 1')
    })

    it('should paginate correctly', async () => {
      // ...
    })
  })

  describe('create', () => {
    it('should create client with valid data', async () => {
      // ...
    })

    it('should reject invalid email', async () => {
      await expect(
        caller.clients.create({ name: 'Test', email: 'invalid' })
      ).rejects.toThrow('Email inválido')
    })
  })
})
```

### Testing Patterns

```typescript
// ✅ Test names descriptivos
it('should return 404 when client does not exist')
it('should not allow access to other users clients')
it('should create client and return with id')

// ❌ Test names vagos
it('works')
it('test create')
it('should work correctly')

// ✅ Arrange-Act-Assert pattern
it('should calculate total correctly', () => {
  // Arrange
  const items = [{ price: 10 }, { price: 20 }]

  // Act
  const total = calculateTotal(items)

  // Assert
  expect(total).toBe(30)
})

// ✅ Test edge cases
describe('formatCurrency', () => {
  it('handles zero', () => expect(formatCurrency(0)).toBe('€0.00'))
  it('handles negative', () => expect(formatCurrency(-10)).toBe('-€10.00'))
  it('handles decimals', () => expect(formatCurrency(10.5)).toBe('€10.50'))
  it('handles large numbers', () => expect(formatCurrency(1000000)).toBe('€1,000,000.00'))
})

// ✅ Mock external services
vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
}))
```

### Coverage Requirements

| Área | Mínimo | Ideal |
|------|--------|-------|
| API Routers | 90% | 95% |
| Services/Lib | 85% | 90% |
| Components (críticos) | 80% | 90% |
| Utils/Helpers | 90% | 95% |

---

## 📝 GIT & COMMITS

### Conventional Commits

```bash
# Format: type(scope): description

# Types
feat     # Nueva feature
fix      # Bug fix
docs     # Documentación
style    # Formatting (no code change)
refactor # Refactoring (no feature/fix)
test     # Tests
chore    # Maintenance, dependencies
perf     # Performance improvement
ci       # CI/CD changes

# Ejemplos
feat(clients): add client search functionality
fix(auth): resolve token expiration issue
docs(readme): update installation instructions
refactor(api): extract validation to shared utils
test(clients): add unit tests for client service
chore(deps): update dependencies
perf(queries): optimize client list query

# Con breaking change
feat(api)!: change response format for client list

# Con body y footer
git commit -m "feat(clients): add bulk import

- Support CSV and Excel formats
- Validate data before import
- Show progress indicator

Closes #123"
```

### Branch Naming

```bash
# Format: type/description

# Types
feature/   # Nueva feature
fix/       # Bug fix
hotfix/    # Fix urgente para producción
refactor/  # Refactoring
docs/      # Documentación
test/      # Tests

# Ejemplos
feature/client-search
fix/auth-token-expiration
hotfix/stripe-webhook-crash
refactor/api-validation
docs/api-documentation

# Con ticket number
feature/WALL-123-client-search
fix/WALL-456-auth-issue
```

### Git Workflow

```bash
# 1. Crear branch desde develop
git checkout develop
git pull origin develop
git checkout -b feature/my-feature

# 2. Commits atómicos mientras trabajas
git add -p  # Stage parcial
git commit -m "feat(scope): first part"
git commit -m "feat(scope): second part"

# 3. Rebase antes de PR (si hay cambios en develop)
git fetch origin
git rebase origin/develop

# 4. Push y crear PR
git push -u origin feature/my-feature

# 5. Después de merge, limpiar
git checkout develop
git pull origin develop
git branch -d feature/my-feature
```

### Pre-commit Checks

```bash
# .husky/pre-commit
#!/bin/sh

echo "🔍 Running pre-commit checks..."

# TypeScript
pnpm typecheck || exit 1

# Lint
pnpm lint || exit 1

# Tests afectados
pnpm test --run --changed || exit 1

# No console.log
if grep -r "console\." apps/web/src packages/*/src --include="*.ts" --include="*.tsx" | grep -v ".test."; then
  echo "❌ Found console.log in production code"
  exit 1
fi

echo "✅ All checks passed"
```

---

## 👀 CODE REVIEW

### Checklist para Reviewer

```markdown
## Code Review Checklist

### Funcionalidad
- [ ] ¿El código hace lo que se espera?
- [ ] ¿Maneja edge cases?
- [ ] ¿Tiene error handling adecuado?

### Seguridad
- [ ] ¿Queries filtran por userId?
- [ ] ¿Input validado con Zod?
- [ ] ¿No hay secrets hardcodeados?
- [ ] ¿No hay SQL injection posible?

### TypeScript
- [ ] ¿No hay tipos `any`?
- [ ] ¿No hay `@ts-ignore`?
- [ ] ¿Tipos explícitos donde necesario?

### Performance
- [ ] ¿No hay N+1 queries?
- [ ] ¿useMemo/useCallback donde necesario?
- [ ] ¿No hay re-renders innecesarios?

### Testing
- [ ] ¿Tests añadidos para código nuevo?
- [ ] ¿Tests pasan?
- [ ] ¿Coverage adecuado?

### Estilo
- [ ] ¿Sigue naming conventions?
- [ ] ¿Imports ordenados?
- [ ] ¿No hay código comentado?
- [ ] ¿No hay console.log?
```

### Feedback Guidelines

```markdown
# ✅ Buen feedback
"Este query podría causar N+1. Considera usar un join:
```ts
const result = await db.select().from(clients).leftJoin(messages, ...)
```"

# ❌ Mal feedback
"Esto está mal"
"No me gusta"
"Cambia esto"

# ✅ Sugerir, no imponer (cuando es preferencia)
"nit: Podrías usar `const` aquí ya que no se reasigna"
"suggestion: Considera extraer esto a un hook para reusabilidad"

# ✅ Explicar el por qué
"Este useEffect no tiene dependency array, lo que causará
que se ejecute en cada render. Añade [] si solo debe
ejecutarse una vez."
```

---

## 🎨 TAILWIND & STYLING

### Colores del Tema (WhatsApp Dark)

```typescript
// Usar estos colores consistentemente
const colors = {
  // Backgrounds
  'bg-dark': '#111b21',      // Fondo principal
  'bg-panel': '#202c33',     // Paneles, cards
  'bg-hover': '#2a3942',     // Hover states
  'bg-input': '#2a3942',     // Inputs

  // Accents
  'green': '#00a884',        // Primary action
  'blue': '#53bdeb',         // Links, secondary
  'orange': '#f59e0b',       // Warnings
  'red': '#ef4444',          // Errors, destructive

  // Text
  'text-primary': '#e9edef', // Texto principal
  'text-secondary': '#8696a0', // Texto secundario
}
```

### Class Ordering

```tsx
// Orden de clases Tailwind
<div className={cn(
  // 1. Layout (display, position)
  'flex items-center justify-between',
  'relative',

  // 2. Sizing
  'h-12 w-full',
  'min-w-0',

  // 3. Spacing
  'p-4 gap-3',
  'mt-4',

  // 4. Typography
  'text-sm font-medium',
  'text-[#e9edef]',

  // 5. Background & Border
  'bg-[#202c33]',
  'border border-[#2a3942]',
  'rounded-lg',

  // 6. Effects
  'shadow-sm',
  'opacity-80',

  // 7. Transitions
  'transition-colors duration-200',

  // 8. States (hover, focus, etc)
  'hover:bg-[#2a3942]',
  'focus:ring-2 focus:ring-[#00a884]',

  // 9. Responsive
  'sm:flex-row',
  'lg:w-auto',

  // 10. Conditional classes
  isActive && 'ring-2 ring-[#00a884]',
  className
)} />
```

---

**Última actualización:** 17 Dic 2025
**Versión:** 1.0.0
**Mantenido por:** Equipo Quoorum
