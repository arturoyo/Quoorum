# ✅ Sistema de Alineación Planes-Sistema - Documentación Completa

> **Fecha:** 23 Ene 2026  
> **Estado:** ✅ COMPLETADO  
> **Fuente de Verdad:** `apps/web/src/components/settings/subscription-management-modal.tsx`

---

## 📋 Resumen Ejecutivo

Sistema completo implementado para alinear los planes de suscripción con la funcionalidad del sistema:

1. ✅ **Precios unificados** - Actualizados en pricing page y documentación
2. ✅ **Asignación mensual de créditos** - Worker automático + verificación
3. ✅ **Límites mensuales** - Verificación antes de crear debates
4. ✅ **Modelos por tier** - Starter+ usa Claude 3.5 Sonnet para síntesis
5. ✅ **Tracking de uso** - Sistema completo de métricas mensuales

---

## 💰 Precios Oficiales (Fuente de Verdad)

### Planes y Precios

| Plan | Mensual | Anual | Créditos/mes | Descuento Anual |
|------|---------|-------|--------------|-----------------|
| **Free** | 0€ | 0€ | 100 (una vez) | - |
| **Starter** | 29€ | 290€ | 3,500 | 17% (2 meses gratis) |
| **Pro** | 79€ | 790€ | 10,000 | 17% (2 meses gratis) |
| **Business** | 199€ | 1,990€ | 30,000 | 17% (2 meses gratis) |

**Ubicación:** `apps/web/src/components/settings/subscription-management-modal.tsx` (líneas 66-153)

---

## 💳 Sistema de Créditos Mensuales

### Asignación Automática

**Worker:** `packages/workers/src/functions/monthly-credits-assignment.ts`

**Funcionalidad:**
- ✅ Asigna créditos automáticamente al inicio de cada período de facturación
- ✅ Cron job diario (01:00 UTC) verifica renovaciones
- ✅ Event-driven: Se activa cuando Stripe notifica renovación de suscripción

**Límites por Plan:**
```typescript
const PLAN_MONTHLY_CREDITS = {
  free: 100,        // Una vez (no mensual)
  starter: 3500,    // 3,500 créditos/mes
  pro: 10000,       // 10,000 créditos/mes
  business: 30000,  // 30,000 créditos/mes
  enterprise: 100000, // 100,000 créditos/mes (si existe)
}
```

**Proceso:**
1. Worker detecta renovación (nuevo período de facturación)
2. Obtiene tier del plan de suscripción
3. Calcula créditos a asignar según `PLAN_MONTHLY_CREDITS`
4. Añade créditos al balance del usuario (`users.credits`)
5. Actualiza `subscriptions.monthlyCredits` con el valor asignado

### Verificación de Límite Mensual

**Helper:** `packages/api/src/lib/monthly-credits-limit.ts`

**Funcionalidad:**
- ✅ Verifica límite mensual ANTES de crear debate
- ✅ Calcula créditos usados en período actual
- ✅ Bloquea creación si se excedería el límite
- ✅ Actualiza tracking de uso después de cada debate

**Uso en Router:**
```typescript
// packages/api/src/routers/quoorum.ts
const monthlyCheck = await checkMonthlyCreditLimit(userId, estimatedCreditsMax)

if (!monthlyCheck.allowed) {
  // Bloquear creación de debate
  throw new TRPCError({
    code: 'PRECONDITION_FAILED',
    message: monthlyCheck.reason
  })
}
```

**Tracking de Uso:**
- Tabla `usage` registra créditos consumidos por período
- Campo `creditsDeducted` acumula créditos usados
- Período = `currentPeriodStart` → `currentPeriodEnd` de suscripción

---

## 🤖 Modelos de IA por Tier

### Configuración Implementada

**Archivo:** `packages/quoorum/src/config/agent-config.ts`

**Función:** `getConfigByUserTier(userTier, role)`

### Modelos por Plan

| Plan | Optimizer | Critic | Analyst | Synthesizer |
|------|-----------|--------|---------|-------------|
| **Free** | Gemini 2.0 Flash (free) | Gemini 2.0 Flash (free) | Gemini 2.0 Flash (free) | Gemini 2.0 Flash (free) |
| **Starter** | Gemini 2.0 Flash (free) | Gemini 2.0 Flash (free) | Gemini 2.0 Flash (free) | **Claude 3.5 Sonnet** ✅ |
| **Pro** | Gemini 2.0 Flash (free) | Gemini 2.0 Flash (free) | Gemini 2.0 Flash (free) | **Claude 3.5 Sonnet** ✅ |
| **Business** | Gemini 2.0 Flash (free) | Gemini 2.0 Flash (free) | Gemini 2.0 Flash (free) | **Claude 3.5 Sonnet** ✅ |

**✅ IMPLEMENTADO:**
- Starter+ usa Claude 3.5 Sonnet para síntesis (como prometido)
- Free tier usa solo modelos free tier
- Optimización de costos: modelos free tier cuando es posible

**Código:**
```typescript
// packages/quoorum/src/agents.ts
export function getAgentsByTier(userTier: 'free' | 'starter' | 'pro' | 'business'): Record<string, AgentConfig> {
  const tierAgents = getConfigByUserTier(userTier, role)
  // Starter+ automáticamente usa Claude 3.5 Sonnet para síntesis
}
```

**Integración:**
- Router de quoorum obtiene tier del usuario: `getUserTier(userId)`
- Pasa tier a `runDynamicDebate({ userTier })`
- `determineDebateMode` usa `getAgentsByTier(userTier)` para configurar agentes

---

## 📊 Tracking de Uso Mensual

### Tabla `usage`

**Schema:** `packages/db/src/schema/subscriptions.ts`

```typescript
export const usage = pgTable("usage", {
  userId: uuid("user_id").notNull(),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  creditsDeducted: integer("credits_deducted").notNull().default(0),
  debatesUsed: integer("debates_used").notNull().default(0),
  tokensUsed: integer("tokens_used").notNull().default(0),
  totalCostUsd: integer("total_cost_usd").notNull().default(0), // in cents
})
```

**Actualización:**
- Se actualiza después de cada debate completado
- Función: `updateMonthlyUsage(userId, creditsUsed, costUsd, tokensUsed)`
- Crea registro si no existe, actualiza si existe

---

## 🔄 Flujo Completo de Créditos

### 1. Asignación Mensual (Automática)

```
Renovación de Suscripción (Stripe Webhook)
  ↓
assignMonthlyCredits Worker
  ↓
Obtiene tier del plan
  ↓
Calcula créditos según PLAN_MONTHLY_CREDITS
  ↓
addCredits(userId, creditsToAssign)
  ↓
Actualiza users.credits
  ↓
Actualiza subscriptions.monthlyCredits
```

### 2. Verificación Antes de Crear Debate

```
Usuario crea debate
  ↓
checkMonthlyCreditLimit(userId, estimatedCredits)
  ↓
Obtiene límite mensual del plan
  ↓
Obtiene créditos usados en período actual
  ↓
¿used + requested > limit?
  ├─ SÍ → Bloquear creación (error claro)
  └─ NO → Continuar
  ↓
hasSufficientCredits(userId, estimatedCredits)
  ↓
¿Balance suficiente?
  ├─ SÍ → Crear debate
  └─ NO → Bloquear creación
```

### 3. Tracking Después del Debate

```
Debate completado
  ↓
Calcula créditos reales usados
  ↓
updateMonthlyUsage(userId, actualCredits, costUsd, tokensUsed)
  ↓
Actualiza tabla usage
  ↓
Registra en período actual
```

---

## 📁 Archivos Implementados

### Workers

1. **`packages/workers/src/functions/monthly-credits-assignment.ts`**
   - `assignMonthlyCredits` - Event-driven (Stripe webhook)
   - `checkMonthlyCreditsRenewals` - Cron diario (01:00 UTC)

### Helpers

2. **`packages/api/src/lib/monthly-credits-limit.ts`**
   - `getUserMonthlyCreditLimit(userId)` - Obtiene límite del plan
   - `getUserMonthlyCreditsUsed(userId)` - Obtiene créditos usados
   - `checkMonthlyCreditLimit(userId, requestedCredits)` - Verifica límite
   - `updateMonthlyUsage(userId, creditsUsed, costUsd, tokensUsed)` - Actualiza tracking

3. **`packages/api/src/lib/user-tier.ts`**
   - `getUserTier(userId)` - Obtiene tier del usuario desde suscripción

### Configuración de Agentes

4. **`packages/quoorum/src/config/agent-config.ts`**
   - `getConfigByUserTier(userTier, role)` - Config por tier y rol

5. **`packages/quoorum/src/agents.ts`**
   - `getAgentsByTier(userTier)` - Agentes completos configurados por tier

### Integración

6. **`packages/api/src/routers/quoorum.ts`**
   - Verificación de límite mensual antes de crear debate
   - Obtiene tier del usuario y lo pasa a `runDynamicDebate`
   - Actualiza tracking de uso después del debate

7. **`packages/quoorum/src/runner-dynamic.ts`**
   - Acepta `userTier` en `RunDebateOptions`
   - Usa `getAgentsByTier(userTier)` para configurar agentes

8. **`packages/quoorum/src/billing/credit-transactions.ts`**
   - `addCredits(userId, amount, subscriptionId?, reason?)` - Añade créditos

---

## ✅ Checklist de Implementación

### Precios
- [x] Actualizar pricing page con precios de `subscription-management-modal.tsx`
- [x] Actualizar documentación con precios correctos
- [x] Verificar que precios en DB coinciden

### Créditos
- [x] Implementar asignación mensual automática (worker)
- [x] Implementar verificación de límite mensual antes de crear debate
- [x] Implementar tracking de uso mensual
- [x] Añadir función `addCredits` para asignación

### Modelos de IA
- [x] Implementar `getConfigByUserTier` con Claude para Starter+
- [x] Integrar tier en `runDynamicDebate`
- [x] Usar modelos correctos según tier en todos los agentes

### Documentación
- [x] Actualizar `ALINEACION_PLANES_SISTEMA.md`
- [x] Crear `SISTEMA_ALINEACION_PLANES.md` (este documento)
- [x] Documentar flujo completo de créditos

---

## 🎯 Próximos Pasos (Opcional)

### Mejoras Futuras

1. **UI de Créditos Restantes**
   - Mostrar créditos usados vs límite mensual en dashboard
   - Alertas cuando se acerca al límite (80%, 95%)
   - Gráfico de uso mensual

2. **Rollover de Créditos**
   - Permitir acumular créditos no usados (hasta cierto límite)
   - Configurable por plan

3. **Créditos Adicionales**
   - Sistema de compra de créditos extra
   - Packs de créditos (ya implementado en billing router)

4. **Límites de Rondas por Plan**
   - Implementar verificación de `maxRoundsPerDebate` por plan
   - Detener debate cuando se alcanza el límite

---

## 📊 Matriz de Alineación Final

| Feature | Free | Starter | Pro | Business | Estado |
|---------|------|---------|-----|----------|--------|
| **Precio mensual** | 0€ | 29€ | 79€ | 199€ | ✅ Unificado |
| **Créditos/mes** | 100 (una vez) | 3,500 | 10,000 | 30,000 | ✅ Implementado |
| **Asignación automática** | ❌ | ✅ | ✅ | ✅ | ✅ Worker activo |
| **Verificación límite** | ✅ | ✅ | ✅ | ✅ | ✅ Implementado |
| **Modelos IA** | Free tier | +Claude síntesis | +Claude síntesis | +Claude síntesis | ✅ Por tier |
| **Tracking uso** | ✅ | ✅ | ✅ | ✅ | ✅ Implementado |
| **Compresión** | ✅ | ✅ | ✅ | ✅ | ✅ Implementado |
| **Retry logic** | ✅ | ✅ | ✅ | ✅ | ✅ Implementado |

---

## 🔍 Verificación

### Cómo Verificar que Funciona

1. **Asignación Mensual:**
   ```bash
   # Verificar worker registrado
   # Inngest dashboard → Functions → assign-monthly-credits
   
   # Verificar créditos asignados
   # DB: SELECT monthly_credits FROM subscriptions WHERE status = 'active'
   ```

2. **Verificación de Límite:**
   ```typescript
   // Crear debate cuando se excede límite mensual
   // Debe retornar error: "Monthly credit limit exceeded"
   ```

3. **Modelos por Tier:**
   ```typescript
   // Verificar que Starter+ usa Claude para síntesis
   const tierAgents = getAgentsByTier('starter')
   console.log(tierAgents.synthesizer.model) // 'claude-3-5-sonnet-20241022'
   ```

---

_Última actualización: 23 Ene 2026_  
_Implementado por: Sistema de Alineación Planes-Sistema_
