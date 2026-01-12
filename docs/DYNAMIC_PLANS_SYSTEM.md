# Dynamic Plans & Features System

## Overview

Sistema completo de administración dinámica de planes, features, límites y permisos que permite gestionar el pricing y funcionalidades desde el panel de admin sin necesidad de modificar código.

---

## Arquitectura

### Componentes

1. **Base de Datos** - 8 tablas para planes, features, asignaciones, overrides, usage tracking y add-ons
2. **tRPC Router** - 20+ endpoints para administración
3. **Panel de Admin** - UI completa para gestión
4. **API Pública** - Endpoints para landing page
5. **Sistema de Límites** - Tracking y verificación de uso
6. **Helpers** - Funciones para verificar features dinámicamente

---

## Schema de Base de Datos

### dynamic_plans
Planes disponibles (FREE, STARTER, PRO, BUSINESS)

```sql
CREATE TABLE "dynamic_plans" (
  "id" UUID PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "monthly_price" REAL NOT NULL,
  "yearly_price" REAL,
  "included_seats" INTEGER NOT NULL,
  "seat_price" REAL NOT NULL,
  "status" plan_status NOT NULL,
  "is_popular" BOOLEAN NOT NULL,
  ...
);
```

### dynamic_features
Features disponibles (voiceAI, coldCalling, etc.)

```sql
CREATE TABLE "dynamic_features" (
  "id" UUID PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "type" feature_type NOT NULL, -- boolean, limit, enum, text
  "category" TEXT,
  ...
);
```

### plan_features
Relación N:M entre planes y features con valores

```sql
CREATE TABLE "plan_features" (
  "id" UUID PRIMARY KEY,
  "plan_id" UUID NOT NULL,
  "feature_id" UUID NOT NULL,
  "value" TEXT NOT NULL,
  "limit_period" limit_period,
  "display_value" TEXT,
  "is_highlight" BOOLEAN,
  ...
);
```

### user_feature_overrides
Permisos especiales por usuario

```sql
CREATE TABLE "user_feature_overrides" (
  "id" UUID PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "feature_id" UUID NOT NULL,
  "value" TEXT NOT NULL,
  "reason" TEXT,
  "expires_at" TIMESTAMP,
  ...
);
```

### feature_usage
Tracking de uso para límites

```sql
CREATE TABLE "feature_usage" (
  "id" UUID PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "feature_id" UUID NOT NULL,
  "period" limit_period NOT NULL,
  "current_usage" INTEGER NOT NULL,
  "limit" INTEGER NOT NULL,
  ...
);
```

---

## API Reference

### Admin Endpoints (tRPC)

#### Plans Management

```typescript
// Listar planes
adminDynamicPlans.listPlans({ includeArchived: false })

// Crear plan
adminDynamicPlans.createPlan({
  slug: 'enterprise',
  name: 'Plan Enterprise',
  monthlyPrice: 299,
  includedSeats: 10,
  ...
})

// Actualizar plan
adminDynamicPlans.updatePlan({
  planId: 'uuid',
  data: { monthlyPrice: 349 }
})

// Eliminar plan
adminDynamicPlans.deletePlan({ planId: 'uuid' })
```

#### Features Management

```typescript
// Listar features
adminDynamicPlans.listFeatures({ category: 'growth' })

// Crear feature
adminDynamicPlans.createFeature({
  slug: 'newFeature',
  name: 'New Feature',
  type: 'boolean',
  category: 'core',
})

// Actualizar feature
adminDynamicPlans.updateFeature({
  featureId: 'uuid',
  data: { name: 'Updated Name' }
})
```

#### Plan-Features Assignment

```typescript
// Asignar feature a plan
adminDynamicPlans.assignFeatureToPlan({
  planId: 'plan-uuid',
  featureId: 'feature-uuid',
  value: 'true',
  displayValue: 'Incluido',
  isHighlight: true,
})

// Remover feature de plan
adminDynamicPlans.removePlanFeature({
  planId: 'plan-uuid',
  featureId: 'feature-uuid',
})
```

#### User Overrides

```typescript
// Dar acceso especial a usuario
adminDynamicPlans.grantUserFeature({
  userId: 'user-id',
  featureId: 'feature-uuid',
  value: 'true',
  reason: 'Beta tester',
  expiresAt: new Date('2025-12-31'),
})

// Listar overrides de usuario
adminDynamicPlans.listUserOverrides({ userId: 'user-id' })

// Revocar override
adminDynamicPlans.revokeUserFeature({ overrideId: 'uuid' })
```

#### Usage Tracking

```typescript
// Ver uso de usuario
adminDynamicPlans.getUserUsage({
  userId: 'user-id',
  period: 'daily',
})

// Resetear uso
adminDynamicPlans.resetFeatureUsage({
  userId: 'user-id',
  featureId: 'feature-uuid',
})
```

### Public Endpoints (Landing Page)

```typescript
// Obtener planes para landing
publicPricing.getPlans()

// Obtener plan específico
publicPricing.getPlanBySlug({ slug: 'pro' })

// Comparar planes
publicPricing.comparePlans()
```

---

## Helpers para Verificar Features

### hasFeatureDynamic
Verifica si un usuario tiene acceso a un feature

```typescript
import { hasFeatureDynamic } from '@/lib/dynamic-features'

const hasVoiceAI = await hasFeatureDynamic(userId, 'voiceAI')
if (!hasVoiceAI) {
  throw new TRPCError({ code: 'FORBIDDEN', message: 'Requiere Voice AI' })
}
```

### getFeatureValue
Obtiene el valor de un feature para un usuario

```typescript
import { getFeatureValue } from '@/lib/dynamic-features'

const gamificationMode = await getFeatureValue(userId, 'gamificationMode')
// Returns: 'game', 'kpi', 'roi', or null
```

### checkFeatureLimit
Verifica si un usuario ha alcanzado el límite

```typescript
import { checkFeatureLimit } from '@/lib/dynamic-features'

const { allowed, current, limit } = await checkFeatureLimit(
  userId,
  'dailySmartInteractions',
  'daily'
)

if (!allowed) {
  throw new TRPCError({
    code: 'FORBIDDEN',
    message: `Límite alcanzado: ${current}/${limit}`,
  })
}
```

### incrementFeatureUsage
Incrementa el uso de un feature

```typescript
import { incrementFeatureUsage } from '@/lib/dynamic-features'

// Incrementar en 1
await incrementFeatureUsage(userId, 'dailySmartInteractions', 'daily')

// Incrementar en N
await incrementFeatureUsage(userId, 'dailySmartInteractions', 'daily', 5)
```

---

## Uso en Middleware

### Ejemplo: Proteger endpoint con feature flag dinámico

```typescript
import { hasFeatureDynamic } from '../lib/dynamic-features'

const voiceAIProcedure = adminProcedure.use(async ({ ctx, next }) => {
  const hasAccess = await hasFeatureDynamic(ctx.userId, 'voiceAI')
  
  if (!hasAccess) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Voice AI requiere plan PRO o superior',
    })
  }

  return next({ ctx })
})

export const voiceRouter = router({
  listCalls: voiceAIProcedure.query(async ({ ctx }) => {
    // Usuario tiene acceso a Voice AI
    ...
  }),
})
```

### Ejemplo: Verificar límite antes de acción

```typescript
import { checkFeatureLimit, incrementFeatureUsage } from '../lib/dynamic-features'

const createCall = voiceAIProcedure.mutation(async ({ ctx, input }) => {
  // Verificar límite
  const { allowed } = await checkFeatureLimit(
    ctx.userId,
    'dailySmartInteractions',
    'daily'
  )

  if (!allowed) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Has alcanzado tu límite diario de llamadas',
    })
  }

  // Crear llamada
  const call = await createVoiceCall(input)

  // Incrementar uso
  await incrementFeatureUsage(ctx.userId, 'dailySmartInteractions', 'daily')

  return call
})
```

---

## Panel de Admin

### Acceso
`/admin/plans`

### Funcionalidades

1. **Gestión de Planes**
   - Crear, editar, eliminar planes
   - Configurar pricing (mensual/anual)
   - Configurar seats (incluidos, precio, máximo)
   - Marcar como popular
   - Activar/desactivar visibilidad

2. **Gestión de Features**
   - Crear, editar, eliminar features
   - Configurar tipo (boolean, limit, enum, text)
   - Categorizar (core, growth, intelligence)
   - Asignar iconos

3. **Asignaciones Plan-Feature**
   - Asignar features a planes
   - Configurar valores por plan
   - Establecer límites y períodos
   - Marcar features destacados

4. **Permisos Especiales**
   - Dar acceso especial a usuarios
   - Configurar expiración
   - Documentar razón del override
   - Revocar permisos

---

## Migración desde plan-config.ts

### 1. Ejecutar migración SQL
```bash
cd packages/db
pnpm drizzle-kit push
```

### 2. Ejecutar seed
```bash
cd packages/db
pnpm tsx src/seed-dynamic-plans.ts
```

### 3. Actualizar routers
Reemplazar:
```typescript
import { hasFeature } from '../lib/plan-config'

if (!hasFeature(planId, 'voiceAI')) {
  throw new TRPCError(...)
}
```

Por:
```typescript
import { hasFeatureDynamic } from '../lib/dynamic-features'

if (!await hasFeatureDynamic(userId, 'voiceAI')) {
  throw new TRPCError(...)
}
```

---

## Landing Page Integration

### Ejemplo: Mostrar pricing dinámico

```typescript
'use client'

import { trpc } from '@/lib/trpc'

export function PricingSection() {
  const { data: plans } = trpc.publicPricing.getPlans.useQuery()

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {plans?.map((plan) => (
        <div key={plan.id} className={plan.isPopular ? 'border-primary' : ''}>
          <h3>{plan.name}</h3>
          <p>{plan.tagline}</p>
          <div className="text-4xl font-bold">
            €{plan.pricing.monthly}
            <span className="text-sm">/mes</span>
          </div>
          
          <ul>
            {plan.features.map((feature) => (
              <li key={feature.name}>
                ✓ {feature.name}: {feature.value}
              </li>
            ))}
          </ul>

          <button>{plan.ctaText}</button>
        </div>
      ))}
    </div>
  )
}
```

### Ejemplo: Tabla de comparación

```typescript
'use client'

import { trpc } from '@/lib/trpc'

export function ComparisonTable() {
  const { data } = trpc.publicPricing.comparePlans.useQuery()

  return (
    <table>
      <thead>
        <tr>
          <th>Feature</th>
          {data?.plans.map((plan) => (
            <th key={plan.slug}>{plan.name}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data?.features.map((row) => (
          <tr key={row.feature.name}>
            <td>{row.feature.name}</td>
            {data.plans.map((plan) => (
              <td key={plan.slug}>
                {row.plans[plan.slug].hasFeature ? '✓' : '✗'}
                {row.plans[plan.slug].value}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

---

## Best Practices

### 1. Siempre verificar features dinámicamente
❌ **Mal:**
```typescript
if (planId === 'business') {
  // hardcoded
}
```

✅ **Bien:**
```typescript
if (await hasFeatureDynamic(userId, 'prospectingSystem')) {
  // dinámico
}
```

### 2. Verificar límites antes de acciones costosas
```typescript
const { allowed } = await checkFeatureLimit(userId, 'dailyCalls', 'daily')
if (!allowed) throw new TRPCError(...)

// Realizar acción
await makeCall()

// Incrementar uso
await incrementFeatureUsage(userId, 'dailyCalls', 'daily')
```

### 3. Usar overrides para casos especiales
```typescript
// Beta testers
await grantUserFeature({
  userId: 'beta-user-id',
  featureId: 'newFeature',
  value: 'true',
  reason: 'Beta tester',
  expiresAt: new Date('2025-12-31'),
})
```

### 4. Marcar features destacados para landing
```typescript
await assignFeatureToPlan({
  planId: 'business',
  featureId: 'voiceAI',
  value: 'true',
  displayValue: 'Voice AI completo',
  isHighlight: true, // ← Se mostrará en landing
})
```

---

## Troubleshooting

### Feature no aparece en landing
- Verificar `isVisible = true` en `dynamic_features`
- Verificar `status = 'active'` en `dynamic_plans`
- Verificar `isHighlight = true` si quieres destacarlo

### Usuario no tiene acceso a feature
1. Verificar plan del usuario en `profiles.planId`
2. Verificar que el plan tenga el feature en `plan_features`
3. Verificar si hay override en `user_feature_overrides`

### Límite no funciona
1. Verificar que el feature sea tipo `limit`
2. Verificar que `limitPeriod` esté configurado
3. Verificar que el valor sea numérico (o `-1` para ilimitado)

---

## Ventajas del Sistema Dinámico

✅ **Sin deploys** - Cambios en pricing sin tocar código
✅ **A/B Testing** - Probar diferentes configuraciones
✅ **Overrides** - Dar acceso especial a usuarios
✅ **Tracking** - Monitorear uso de features
✅ **Escalable** - Agregar features sin modificar schema
✅ **Auditable** - Historial de cambios en BD
✅ **Landing automático** - Pricing se actualiza solo

---

**Sistema 100% funcional y listo para producción** 🚀
