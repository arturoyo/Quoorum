# 🔌 PROMPT DE CONEXIÓN - Quoorum Pre-Lanzamiento

> **Estado:** Pre-lanzamiento - Infraestructura construida, lógica de negocio pendiente
> **Objetivo:** Conectar la lógica de negocio faltante a la infraestructura existente
> **Fecha:** 20 Enero 2026

---

## 🎯 FILOSOFÍA: NO CREAR, CONECTAR

**IMPORTANTE:** Este proyecto NO necesita más infraestructura. La arquitectura está completa.
Lo que falta es la **"carne"** - la lógica de negocio que hace que todo funcione junto.

**Antes de escribir código nuevo:**
1. ✅ Verificar que el esquema/tabla/endpoint YA EXISTE
2. ✅ Verificar que el componente UI YA EXISTE
3. ✅ SOLO escribir la lógica de conexión faltante

---

## 📋 TAREAS DE CONEXIÓN PRIORITARIAS

### 1️⃣ STRIPE WEBHOOK - Lógica Faltante

**Archivo:** `apps/web/src/app/api/stripe/webhook/route.ts`

**Estado Actual:**
- ✅ Estructura completa
- ✅ Manejo de eventos principales (checkout, subscriptions, invoices)
- ✅ Rate limiting, idempotency, error handling

**Lógica Faltante:**

#### A. Credit Transactions Auditing
```typescript
// FALTA: Crear registro en credit_transactions después de CADA operación de créditos

// Ubicación: Después de cada db.update(users).set({ credits: ... })
// Añadir:
await db.insert(creditTransactions).values({
  userId,
  amount: creditsToAdd, // Positivo para add, negativo para deduct
  type: 'purchase' | 'refund' | 'renewal' | 'deduction',
  description: `Stripe ${event.type}`,
  balanceBefore,
  balanceAfter: balanceBefore + creditsToAdd,
  metadata: {
    stripeEventId: event.id,
    sessionId: session.id,
  },
})
```

#### B. Admin Notifications
```typescript
// FALTA: Notificar admins cuando hay:
// - Subscription canceled
// - Payment failed (3+ times)
// - Refund requested

// Ubicación: En cada case del switch (customer.subscription.deleted, invoice.payment_failed)
// Añadir:
if (condition) {
  await sendAdminAlert({
    type: 'critical',
    message: `Subscription canceled for user ${userId}`,
    userId,
    metadata: { ... }
  })
}
```

#### C. Webhook Event Retry Logic
```typescript
// FALTA: Si un evento falla 3+ veces, marcar como "failed" y notificar

// Ubicación: En el catch block del handler
// Añadir:
if (existingEvent && Number(existingEvent.retryCount) >= 3) {
  await db.update(webhookEvents)
    .set({
      status: 'failed',
      finalError: error.message,
    })
    .where(eq(webhookEvents.id, existingEvent.id))

  await sendAdminAlert({
    type: 'critical',
    message: `Webhook event failed after 3 retries: ${eventId}`,
  })
}
```

---

### 2️⃣ DEPARTMENTS - Lógica de Orquestación (Corporate Intelligence)

**Contexto:** Existe el sistema de 4 capas (Company → Departments → People → Context Files)
pero falta la lógica que USE esos datos en debates.

**Archivos Existentes:**
- ✅ Schema: `packages/db/src/schema/departments.ts`
- ✅ Schema: `packages/db/src/schema/companies.ts`
- ✅ UI Selector: `apps/web/src/components/quoorum/department-selector.tsx`
- ✅ Router: `packages/api/src/routers/companies.ts`

**Lógica Faltante:**

#### A. Department Context Injection
```typescript
// FALTA: Función que construye contexto corporativo desde departments

// Archivo NUEVO: packages/quoorum/src/corporate-context.ts
export async function buildCorporateContext(options: {
  companyId?: string
  departmentIds?: string[]
  includeFiles?: boolean
}): Promise<string> {
  // 1. Fetch company info
  const company = await db.query.companies.findFirst({ ... })

  // 2. Fetch selected departments con su contexto
  const departments = await db.query.departments.findMany({ ... })

  // 3. Fetch context files si includeFiles=true
  const files = await db.query.userContextFiles.findMany({ ... })

  // 4. Build structured context
  return `
## Contexto Corporativo

**Empresa:** ${company.name}
**Industria:** ${company.industry}
**Tamaño:** ${company.size}

### Departamentos Involucrados:
${departments.map(d => `
- **${d.name}**: ${d.description}
  Objetivos: ${d.goals}
  KPIs: ${d.kpis}
`).join('\n')}

${files.length > 0 ? '### Documentos de Contexto:\n' + files.map(...).join('\n') : ''}
  `
}
```

#### B. Integration en Debate Creation
```typescript
// FALTA: Usar buildCorporateContext en debates.create

// Archivo: packages/api/src/routers/debates.ts
// Ubicación: En debates.create mutation, antes de runDebateAsync

// Añadir:
let fullContext = input.context?.summary || ''

if (input.companyId || input.departmentIds?.length) {
  const corporateContext = await buildCorporateContext({
    companyId: input.companyId,
    departmentIds: input.departmentIds,
    includeFiles: true,
  })

  fullContext = corporateContext + '\n\n' + fullContext
}
```

#### C. Department-Aware Expert Selection
```typescript
// FALTA: Ajustar expert matching basado en departments

// Archivo: packages/quoorum/src/expert-matcher.ts
// Añadir nuevo parámetro a matchExperts:

export function matchExperts(
  analysis: QuestionAnalysis,
  options: MatchingOptions & {
    departments?: string[] // Nueva opción
  }
): ExpertMatch[] {
  // Boost expert scores si su expertise matchea con department
  // Ejemplo: Si departments incluye "Sales", boost expertos con expertise en "sales"

  if (options.departments?.length) {
    for (const match of matches) {
      const expertDomains = match.expert.expertise.map(e => e.toLowerCase())
      const hasRelevantExpertise = options.departments.some(dept =>
        expertDomains.some(domain =>
          dept.toLowerCase().includes(domain) ||
          domain.includes(dept.toLowerCase())
        )
      )

      if (hasRelevantExpertise) {
        match.score += 15 // Bonus por department relevance
        match.reasons.push(`Experto relevante para departamento`)
      }
    }
  }

  return matches
}
```

---

### 3️⃣ THEME ENGINE - Integración UI

**Contexto:** El ThemeEngine está implementado en backend, pero NO se usa en UI.

**Archivos Existentes:**
- ✅ Engine: `packages/quoorum/src/narrative/theme-engine.ts`
- ✅ Themes: `packages/quoorum/src/narrative/themes.ts`
- ✅ Export: `packages/quoorum/src/index.ts` (ya exportado)

**Lógica Faltante:**

#### A. Theme Selection en Debate Creation
```typescript
// FALTA: Seleccionar theme automáticamente cuando se crea debate

// Archivo: packages/api/src/routers/debates.ts
// Ubicación: En debates.create mutation, antes de runDebateAsync

import { selectTheme, assignDebateIdentities } from '@quoorum/quoorum'

// Añadir:
const themeSelection = selectTheme(input.question, input.context?.summary)

logger.info('[Debate Create] Theme selected', {
  themeId: themeSelection.themeId,
  confidence: themeSelection.confidence,
  reason: themeSelection.reason,
})

// Guardar theme en debate metadata
await db.update(debates).set({
  metadata: {
    theme: {
      id: themeSelection.themeId,
      name: themeSelection.theme.name,
      confidence: themeSelection.confidence,
    }
  }
}).where(eq(debates.id, newDebate.id))
```

#### B. Character Assignment a Expertos
```typescript
// FALTA: Asignar identidades narrativas a cada experto

// Archivo: packages/quoorum/src/runner-dynamic.ts
// Ubicación: Antes del debate loop, después de expert selection

const identities = assignDebateIdentities(
  selectedExperts,
  themeSelection.theme
)

// Usar identities en messages
for (const round of rounds) {
  for (const expert of experts) {
    const identity = identities.find(i => i.role === expert.role)

    const message = {
      role: expert.role,
      // User-facing
      displayName: identity.displayNameUser, // "Atenea"
      emoji: identity.characterEmoji,
      color: identity.characterColor,
      // Admin transparency
      technicalInfo: identity.displayNameAdmin, // "Atenea (Claude 3.5 Sonnet)"
    }
  }
}
```

#### C. Theme Preview Component
```typescript
// FALTA: UI component para preview de theme antes de crear debate

// Archivo NUEVO: apps/web/src/components/quoorum/theme-preview.tsx

'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/trpc/client'

interface ThemePreviewProps {
  question: string
  context?: string
}

export function ThemePreview({ question, context }: ThemePreviewProps) {
  const [theme, setTheme] = useState<any>(null)

  useEffect(() => {
    if (question.length > 20) {
      // Call new endpoint to preview theme
      void fetchThemePreview()
    }
  }, [question, context])

  const fetchThemePreview = async () => {
    const result = await api.debates.previewTheme.mutate({
      question,
      context,
    })
    setTheme(result)
  }

  if (!theme) return null

  return (
    <div className="rounded-lg border p-4 bg-gradient-to-r from-purple-50 to-blue-50">
      <h3 className="font-semibold mb-2">🎭 Tema Narrativo Detectado</h3>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{theme.emoji}</span>
        <div>
          <p className="font-medium">{theme.name}</p>
          <p className="text-sm text-muted-foreground">{theme.description}</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        {theme.characterPreviews.map((char: any) => (
          <div key={char.id} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: char.color + '20' }}>
            {char.emoji} {char.name}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Confianza: {(theme.confidence * 100).toFixed(0)}%
      </p>
    </div>
  )
}
```

#### D. Endpoint para Preview
```typescript
// FALTA: Endpoint tRPC para preview de theme

// Archivo: packages/api/src/routers/debates.ts
// Añadir nuevo endpoint:

previewTheme: protectedProcedure
  .input(z.object({
    question: z.string().min(10),
    context: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    const { selectTheme } = await import('@quoorum/quoorum')

    const selection = selectTheme(input.question, input.context)

    return {
      themeId: selection.themeId,
      name: selection.theme.name,
      description: selection.theme.description,
      emoji: selection.theme.emoji,
      confidence: selection.confidence,
      reason: selection.reason,
      characterPreviews: selection.theme.characters.map(c => ({
        id: c.id,
        name: c.name,
        emoji: c.emoji,
        color: c.color,
      })),
    }
  }),
```

---

### 4️⃣ ADMIN/BILLING UI - Conectar Datos Reales

**Archivo:** `apps/web/src/app/admin/billing/page.tsx`

**Estado Actual:**
- ✅ Estructura UI completa
- ❌ Datos hardcodeados (placeholders)

**Lógica Faltante:**

#### A. Stats Overview - Datos Reales
```typescript
// FALTA: Queries reales para stats

// Reemplazar placeholders por:
const { data: stats, isLoading } = api.admin.getBillingStats.useQuery()

// Stats debe incluir:
// - totalUsers (count de users)
// - activeSubscriptions (count de subscriptions donde status='active')
// - totalCreditsIssued (sum de credit_transactions donde amount > 0)
// - mrr (sum de subscriptions.monthlyPriceUsd donde status='active')
```

#### B. User Search - Query Real
```typescript
// FALTA: Search de usuarios por email

const { data: searchResults, isLoading: isSearching } = api.admin.searchUsers.useQuery(
  { email: searchEmail },
  { enabled: searchEmail.length >= 3 }
)

// searchResults debe retornar:
// - id, email, name, tier
// - credits (balance actual)
// - subscription status
// - debatesUsed (del mes actual)
```

#### C. Credit Management Actions
```typescript
// FALTA: Mutations para añadir/quitar créditos

const addCredits = api.admin.addCredits.useMutation({
  onSuccess: () => {
    toast.success('Créditos añadidos')
    void utils.admin.searchUsers.invalidate()
  }
})

const deductCredits = api.admin.deductCredits.useMutation({
  onSuccess: () => {
    toast.success('Créditos deducidos')
    void utils.admin.searchUsers.invalidate()
  }
})

// Botones deben llamar:
await addCredits.mutateAsync({
  userId: selectedUserId,
  amount: Number(creditsToAdd),
  reason: 'Manual adjustment by admin',
})
```

#### D. Transaction History Table
```typescript
// FALTA: Tabla de transacciones recientes

const { data: transactions } = api.admin.getCreditTransactions.useQuery({
  userId: selectedUserId,
  limit: 50,
})

// Renderizar:
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Fecha</TableHead>
      <TableHead>Tipo</TableHead>
      <TableHead>Cantidad</TableHead>
      <TableHead>Balance After</TableHead>
      <TableHead>Descripción</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {transactions?.map(tx => (
      <TableRow key={tx.id}>
        <TableCell>{format(tx.createdAt, 'PP')}</TableCell>
        <TableCell><Badge>{tx.type}</Badge></TableCell>
        <TableCell className={tx.amount > 0 ? 'text-green-600' : 'text-red-600'}>
          {tx.amount > 0 ? '+' : ''}{tx.amount}
        </TableCell>
        <TableCell>{tx.balanceAfter}</TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {tx.description}
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

#### E. Charts/Visualizations
```typescript
// FALTA: Gráfico de MRR over time

const { data: mrrHistory } = api.admin.getMrrHistory.useQuery({
  months: 12,
})

// Usar recharts para renderizar:
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={mrrHistory}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="month" />
    <YAxis />
    <Tooltip />
    <Line type="monotone" dataKey="mrr" stroke="#8884d8" />
  </LineChart>
</ResponsiveContainer>
```

---

### 5️⃣ ADMIN ROUTER - Endpoints Faltantes

**Archivo NUEVO:** `packages/api/src/routers/admin.ts` (ya existe pero incompleto)

**Endpoints Faltantes:**

```typescript
import { z } from 'zod'
import { router, protectedProcedure } from '../trpc.js'
import { db } from '@quoorum/db'
import { users, subscriptions, creditTransactions, usage } from '@quoorum/db/schema'
import { eq, desc, gte, lte, sql, and } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'

// Middleware: verificar que user es admin
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, ctx.userId))

  if (user?.role !== 'admin' && user?.role !== 'superadmin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    })
  }

  return next()
})

export const adminRouter = router({
  /**
   * Get billing stats overview
   */
  getBillingStats: adminProcedure.query(async () => {
    const [stats] = await db
      .select({
        totalUsers: sql<number>`count(distinct ${users.id})`,
        activeSubscriptions: sql<number>`count(distinct case when ${subscriptions.status} = 'active' then ${subscriptions.id} end)`,
        totalCreditsIssued: sql<number>`coalesce(sum(case when ${creditTransactions.amount} > 0 then ${creditTransactions.amount} end), 0)`,
      })
      .from(users)
      .leftJoin(subscriptions, eq(users.id, subscriptions.userId))
      .leftJoin(creditTransactions, eq(users.id, creditTransactions.userId))

    // Calculate MRR
    const [mrrResult] = await db
      .select({
        mrr: sql<number>`sum(${subscriptions.monthlyCredits} * 0.01)`, // Assuming 1 credit = $0.01
      })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active'))

    return {
      totalUsers: stats.totalUsers,
      activeSubscriptions: stats.activeSubscriptions,
      totalCreditsIssued: stats.totalCreditsIssued,
      mrr: mrrResult.mrr || 0,
    }
  }),

  /**
   * Search users by email
   */
  searchUsers: adminProcedure
    .input(z.object({
      email: z.string().min(3),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ input }) => {
      const results = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          tier: users.tier,
          credits: users.credits,
          createdAt: users.createdAt,
          subscription: {
            id: subscriptions.id,
            status: subscriptions.status,
            planId: subscriptions.planId,
          },
        })
        .from(users)
        .leftJoin(subscriptions, eq(users.id, subscriptions.userId))
        .where(sql`lower(${users.email}) like lower(${'%' + input.email + '%'})`)
        .limit(input.limit)

      return results
    }),

  /**
   * Get credit transactions for user
   */
  getCreditTransactions: adminProcedure
    .input(z.object({
      userId: z.string().uuid(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      const transactions = await db
        .select()
        .from(creditTransactions)
        .where(eq(creditTransactions.userId, input.userId))
        .orderBy(desc(creditTransactions.createdAt))
        .limit(input.limit)

      return transactions
    }),

  /**
   * Add credits to user
   */
  addCredits: adminProcedure
    .input(z.object({
      userId: z.string().uuid(),
      amount: z.number().positive(),
      reason: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      // Get current balance
      const [user] = await db
        .select({ credits: users.credits })
        .from(users)
        .where(eq(users.id, input.userId))

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      }

      const balanceBefore = user.credits
      const balanceAfter = balanceBefore + input.amount

      // Update user credits
      await db
        .update(users)
        .set({
          credits: balanceAfter,
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.userId))

      // Create transaction record
      await db.insert(creditTransactions).values({
        userId: input.userId,
        amount: input.amount,
        type: 'admin_grant',
        description: input.reason,
        balanceBefore,
        balanceAfter,
        metadata: {
          adminId: ctx.userId,
        },
      })

      return { success: true, newBalance: balanceAfter }
    }),

  /**
   * Deduct credits from user
   */
  deductCredits: adminProcedure
    .input(z.object({
      userId: z.string().uuid(),
      amount: z.number().positive(),
      reason: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const [user] = await db
        .select({ credits: users.credits })
        .from(users)
        .where(eq(users.id, input.userId))

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      }

      const balanceBefore = user.credits
      const balanceAfter = Math.max(0, balanceBefore - input.amount)

      await db
        .update(users)
        .set({
          credits: balanceAfter,
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.userId))

      await db.insert(creditTransactions).values({
        userId: input.userId,
        amount: -input.amount,
        type: 'admin_deduction',
        description: input.reason,
        balanceBefore,
        balanceAfter,
        metadata: {
          adminId: ctx.userId,
        },
      })

      return { success: true, newBalance: balanceAfter }
    }),

  /**
   * Get MRR history (last N months)
   */
  getMrrHistory: adminProcedure
    .input(z.object({
      months: z.number().min(1).max(24).default(12),
    }))
    .query(async ({ input }) => {
      // This is a simplified version
      // In production, you'd query billing history table

      const results = []
      const now = new Date()

      for (let i = 0; i < input.months; i++) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)

        const [stats] = await db
          .select({
            mrr: sql<number>`sum(${subscriptions.monthlyCredits} * 0.01)`,
            activeCount: sql<number>`count(*)`,
          })
          .from(subscriptions)
          .where(
            and(
              eq(subscriptions.status, 'active'),
              gte(subscriptions.createdAt, month),
              lte(subscriptions.createdAt, monthEnd)
            )
          )

        results.unshift({
          month: month.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
          mrr: stats?.mrr || 0,
          activeSubscriptions: stats?.activeCount || 0,
        })
      }

      return results
    }),
})
```

---

## 🚦 ORDEN DE IMPLEMENTACIÓN RECOMENDADO

### Fase 1: Core Business Logic (Semana 1)
1. ✅ Admin Router completo (endpoints críticos)
2. ✅ Stripe Webhook - Credit Transactions Auditing
3. ✅ Corporate Context Builder (departments)

### Fase 2: User-Facing Features (Semana 2)
4. ✅ Theme Engine Integration (UI + Backend)
5. ✅ Department Context en Debates
6. ✅ Expert Selection con Departments

### Fase 3: Admin Tools (Semana 3)
7. ✅ Admin/Billing UI conectado
8. ✅ Charts y visualizaciones
9. ✅ Notifications system

### Fase 4: Testing & Polish (Semana 4)
10. ✅ Integration tests
11. ✅ Error handling robusto
12. ✅ Logging completo

---

## 📐 PRINCIPIOS DE CONEXIÓN

### 1. Verificar Antes de Escribir
```bash
# ANTES de crear un archivo nuevo:
find . -name "*nombre*"
grep -r "FunctionName" .

# SI ya existe → USAR, NO DUPLICAR
```

### 2. Respetar Arquitectura Existente
- ✅ Usar schemas existentes (NO crear nuevos)
- ✅ Usar routers existentes (añadir endpoints)
- ✅ Usar componentes UI existentes (modificar props si necesario)

### 3. Logs Estructurados Siempre
```typescript
// ✅ BIEN
logger.info('[Feature] Action completed', {
  userId,
  result,
  duration: Date.now() - start,
})

// ❌ MAL
console.log('Done')
```

### 4. Error Handling Completo
```typescript
// ✅ BIEN
try {
  const result = await operation()
  return { success: true, data: result }
} catch (error) {
  logger.error('[Feature] Operation failed', {
    error: error instanceof Error ? error.message : String(error),
    userId,
  })
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Operation failed',
    cause: error,
  })
}

// ❌ MAL
const result = await operation() // Sin try-catch
```

### 5. TypeScript Strict
```typescript
// ✅ BIEN
const user: User | null = await getUser()
if (!user) {
  throw new TRPCError({ code: 'NOT_FOUND' })
}
// Aquí user es User (no null)

// ❌ MAL
const user: any = await getUser()
```

---

## 🎯 CHECKLIST POR TAREA

Antes de marcar una tarea como completa:

- [ ] ✅ Código escrito usa infraestructura existente
- [ ] ✅ Tipos TypeScript completos (no `any`)
- [ ] ✅ Error handling robusto
- [ ] ✅ Logs estructurados
- [ ] ✅ Tests unitarios añadidos
- [ ] ✅ UI conectada a API real (no placeholders)
- [ ] ✅ Documentación actualizada
- [ ] ✅ Build pasa sin errores
- [ ] ✅ Linter pasa sin warnings

---

## 📞 ESCALACIÓN

Si encuentras:
- ❌ Schema faltante → DETENER y consultar
- ❌ Endpoint crítico faltante → DETENER y consultar
- ❌ Arquitectura confusa → DETENER y consultar

**NO CREAR NUEVA INFRAESTRUCTURA sin aprobación.**

---

_Última actualización: 20 Enero 2026_
_Versión: 1.0_
