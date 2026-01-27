# 🎯 Patrones Obligatorios

> **Código consistente = Código mantenible**

---

## 1. tRPC Router Pattern

### Estructura Estándar

```typescript
// packages/api/src/routers/clients.ts
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../trpc'
import { db } from '@proyecto/db'
import { clients } from '@proyecto/db/schema'
import { eq, and, desc } from 'drizzle-orm'

// ═══════════════════════════════════════
// 1. SCHEMAS DE VALIDACIÓN (al inicio)
// ═══════════════════════════════════════
const createClientSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().regex(/^\+?[0-9]{9,15}$/).optional(),
})

const updateClientSchema = createClientSchema.partial().extend({
  id: z.string().uuid(),
})

// ═══════════════════════════════════════
// 2. ROUTER
// ═══════════════════════════════════════
export const clientsRouter = router({
  // LIST
  list: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      return await db
        .select()
        .from(clients)
        .where(eq(clients.userId, ctx.userId)) // ⚠️ SIEMPRE filtrar
        .limit(input.limit)
    }),

  // GET BY ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [client] = await db
        .select()
        .from(clients)
        .where(
          and(
            eq(clients.id, input.id),
            eq(clients.userId, ctx.userId) // ⚠️ SIEMPRE filtrar
          )
        )

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
          userId: ctx.userId, // ⚠️ SIEMPRE asignar
        })
        .returning()

      return client
    }),

  // UPDATE
  update: protectedProcedure
    .input(updateClientSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      // Verificar propiedad
      const [existing] = await db
        .select({ id: clients.id })
        .from(clients)
        .where(and(eq(clients.id, id), eq(clients.userId, ctx.userId)))

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      const [updated] = await db
        .update(clients)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(clients.id, id))
        .returning()

      return updated
    }),

  // DELETE (soft delete)
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verificar propiedad
      const [existing] = await db
        .select({ id: clients.id })
        .from(clients)
        .where(and(eq(clients.id, input.id), eq(clients.userId, ctx.userId)))

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      await db
        .update(clients)
        .set({ deletedAt: new Date(), status: 'DELETED' })
        .where(eq(clients.id, input.id))

      return { success: true }
    }),
})
```

---

## 2. Schema Drizzle Pattern

```typescript
// packages/db/src/schema/clients.ts
import { pgTable, uuid, varchar, text, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'

// ═══════════════════════════════════════
// 1. ENUMS
// ═══════════════════════════════════════
export const clientStatusEnum = pgEnum('client_status', [
  'ACTIVE',
  'INACTIVE',
  'PENDING',
  'DELETED',
])

// ═══════════════════════════════════════
// 2. TABLE
// ═══════════════════════════════════════
export const clients = pgTable('clients', {
  // Primary key
  id: uuid('id').defaultRandom().primaryKey(),

  // Foreign keys
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Data fields
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  notes: text('notes'),

  // Status
  status: clientStatusEnum('status').notNull().default('ACTIVE'),

  // Timestamps (SIEMPRE incluir)
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

// ═══════════════════════════════════════
// 3. RELATIONS
// ═══════════════════════════════════════
export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, {
    fields: [clients.userId],
    references: [users.id],
  }),
}))

// ═══════════════════════════════════════
// 4. TYPES (inferidos automáticamente)
// ═══════════════════════════════════════
export type Client = typeof clients.$inferSelect
export type NewClient = typeof clients.$inferInsert
```

---

## 3. Estructura de Componentes

```typescript
'use client' // Solo si es necesario

// ═══════════════════════════════════════
// 1. IMPORTS (en orden)
// ═══════════════════════════════════════
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

import { toast } from 'sonner'

import { api } from '@proyecto/api'
import { Button } from '@proyecto/ui'

import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'

import type { Client } from '@proyecto/db/schema'

// ═══════════════════════════════════════
// 2. TIPOS
// ═══════════════════════════════════════
interface ClientDetailProps {
  clientId: string
  onUpdate?: (client: Client) => void
}

// ═══════════════════════════════════════
// 3. COMPONENTE
// ═══════════════════════════════════════
export function ClientDetail({ clientId, onUpdate }: ClientDetailProps) {
  // 3.1. HOOKS (SIEMPRE AL INICIO)
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)

  // Queries
  const { data: client, isLoading, error } = api.clients.getById.useQuery(
    { id: clientId },
    { enabled: !!clientId }
  )

  // Mutations
  const updateClient = api.clients.update.useMutation({
    onSuccess: (data) => {
      toast.success('Cliente actualizado')
      onUpdate?.(data)
    },
  })

  // 3.2. ESTADO DERIVADO
  const fullName = client ? `${client.name} ${client.lastName}` : ''

  // 3.3. HANDLERS
  const handleSubmit = useCallback(async (formData: FormData) => {
    const name = formData.get('name') as string
    await updateClient.mutateAsync({ id: clientId, name })
  }, [clientId, updateClient])

  // 3.4. EARLY RETURNS (después de hooks)
  if (isLoading) return <ClientDetailSkeleton />
  if (error) return <ErrorState message={error.message} />
  if (!client) return <EmptyState message="Cliente no encontrado" />

  // 3.5. RENDER
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{fullName}</h1>
      {/* Contenido */}
    </div>
  )
}

// ═══════════════════════════════════════
// 4. SUBCOMPONENTES PRIVADOS
// ═══════════════════════════════════════
function ClientDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
    </div>
  )
}
```

---

## 4. Orden de Imports (Fijo)

```typescript
// 1. React y Next.js (primero)
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

// 2. Librerías de terceros
import { format } from 'date-fns'
import { z } from 'zod'
import { toast } from 'sonner'

// 3. Packages internos (@proyecto/*)
import { db } from '@proyecto/db'
import { api } from '@proyecto/api'
import { Button } from '@proyecto/ui'

// 4. Imports locales
import { ClientCard } from '@/components/clients/client-card'
import { useDebounce } from '@/hooks/use-debounce'
import { formatCurrency } from '@/lib/utils'

// 5. Types (SIEMPRE al final con "import type")
import type { Client } from '@proyecto/db/schema'
import type { RouterOutputs } from '@proyecto/api'
```

---

## 5. Naming Conventions

```typescript
// Componentes: PascalCase
export function ClientCard() {}

// Hooks: camelCase + prefijo "use"
export function useClientData() {}

// Funciones: camelCase
export function formatCurrency() {}

// Constantes: SCREAMING_SNAKE_CASE
export const MAX_RETRY_COUNT = 3

// Archivos: kebab-case
// client-card.tsx ✅
// ClientCard.tsx ❌
```

---

## 6. Error Handling Pattern (2 Capas)

### 🎯 Problema

Sistema de error handling tiene **2 capas de interceptación** que deben mantenerse sincronizadas:
1. **Interceptación de `console.error`** (verifica strings)
2. **Handler `onError` de React Query** (clasifica errores)

### ✅ Solución: Fuente Única de Verdad

**Archivo:** `apps/web/src/lib/trpc/silenced-error-types.ts`

```typescript
// ÚNICA fuente de verdad para tipos de errores silenciados
export const SILENCED_ERROR_PATTERNS = {
  PAYMENT_REQUIRED: ['PAYMENT_REQUIRED', '402', 'Créditos insuficientes'],
  UNAUTHORIZED: ['UNAUTHORIZED', '401', 'No autenticado'],
  NETWORK: ['Failed to fetch', 'NetworkError'],
  NOT_FOUND: ['NOT_FOUND', '404', 'no encontrado'],
}

export const SILENCED_ERROR_CATEGORIES = [
  'payment-required',
  'unauthorized',
  'network',
  'not-found',
] as const

// Helper functions
export function containsSilencedPattern(text: string): boolean
export function isSilencedCategory(category: string): boolean
```

### Uso en provider.tsx

```typescript
import { containsSilencedPattern, isSilencedCategory } from './silenced-error-types'

// CAPA 1: Interceptación console.error
if (typeof arg === 'string') {
  if (containsSilencedPattern(arg)) {
    return true // Silenciar
  }
}

// CAPA 2: Handler onError React Query
onError: (error) => {
  const errorInfo = classifyTRPCError(error)
  if (!isSilencedCategory(errorInfo.type)) {
    logger.error('[React Query] Query error:', error)
  }
}
```

### ⚠️ Para Añadir Nuevo Tipo Silenciado

**SOLO modificar:** `silenced-error-types.ts`

```typescript
// 1. Añadir keywords a SILENCED_ERROR_PATTERNS
export const SILENCED_ERROR_PATTERNS = {
  // ... existentes
  NUEVO_TIPO: ['keyword1', 'keyword2'],
}

// 2. Añadir categoría a SILENCED_ERROR_CATEGORIES
export const SILENCED_ERROR_CATEGORIES = [
  // ... existentes
  'nuevo-tipo',
] as const
```

**Las 2 capas se actualizan automáticamente ✅**

### 📚 Ver También

- **[ERRORES-COMETIDOS.md#error-6](../../ERRORES-COMETIDOS.md#error-6)** - Historia completa del problema
- **[provider.tsx](../../apps/web/src/lib/trpc/provider.tsx)** - Implementación completa

---

## 📖 Ver Todos los Patrones

Patrones completos con más ejemplos en:
- **[CLAUDE.md](../../CLAUDE.md#patrones-obligatorios)** - Documentación completa

Incluye:
- Server Actions Pattern
- Form Validation Pattern
- API Response Pattern

---

_Ver [INDEX.md](./INDEX.md) para más módulos de documentación_
