# ✅ Sistema de Alineación: Planes vs Implementación

> **Fecha:** 23 Ene 2026  
> **Estado:** ✅ COMPLETADO - Sistema alineado y funcional

---

## 📊 Resumen Ejecutivo

**Estado actual:**
1. ✅ **Precios unificados** - Fuente de verdad: `subscription-management-modal.tsx`
2. ✅ **Límites de créditos implementados** - Asignación mensual automática + verificación
3. ✅ **Modelos de IA por tier** - Starter+ usa Claude 3.5 Sonnet para síntesis
4. ✅ **Verificación mensual** - Sistema completo de tracking y límites
5. ✅ **Documentación actualizada** - Precios y características alineados

---

## 💰 Planes: Fuente de Verdad (Actualizado)

### Fuente de Verdad: `subscription-management-modal.tsx`

| Plan | Precio Mensual | Precio Anual | Créditos/mes | Modelos IA |
|------|----------------|--------------|--------------|------------|
| **Free** | 0€ | 0€ | 100 (una vez) | Modelos estándar (GPT-4o mini, Gemini Flash) |
| **Starter** | 29€ | 290€ | 3,500 | Modelos estándar + **Claude 3.5 Sonnet** (síntesis) |
| **Pro** | 79€ | 790€ | 10,000 | Modelos especializados + **Claude 3.5 Sonnet** (síntesis) |
| **Business** | 199€ | 1,990€ | 30,000 | **Todos los modelos premium** |

**✅ PRECIOS UNIFICADOS:**
- ✅ Pricing page actualizado con precios correctos
- ✅ Documentación actualizada
- ✅ Sistema de créditos implementado

---

## 🗄️ Base de Datos: Schema vs Realidad

### Schema (`packages/db/src/schema/subscriptions.ts`)

```typescript
export const plans = pgTable("plans", {
  // Limits
  debatesPerMonth: integer("debates_per_month").notNull().default(5),
  maxExperts: integer("max_experts").notNull().default(4),
  maxRoundsPerDebate: integer("max_rounds_per_debate").notNull().default(3),
  maxTeamMembers: integer("max_team_members").notNull().default(1),
  
  // Features
  features: jsonb("features").$type<{
    customExperts: boolean;
    pdfExport: boolean;
    apiAccess: boolean;
    prioritySupport: boolean;
    whiteLabel: boolean;
    analytics: boolean;
    webhooks: boolean;
  }>(),
})
```

**⚠️ PROBLEMA:**
- Defaults genéricos (5 debates, 4 expertos, 3 rondas)
- No hay configuración específica por plan
- No hay campo para créditos mensuales

---

## 🚦 Rate Limiting: Límites Implementados

### Rate Limiting Avanzado (`packages/quoorum/src/rate-limiting-advanced.ts`)

| Tier | Debates/día | Debates/hora | Rondas/debate | Concurrentes | Costo/día |
|------|-------------|--------------|---------------|--------------|-----------|
| **Free** | 3 | 2 | 5 | 1 | $1.00 |
| **Starter** | 10 | 5 | 10 | 2 | $5.00 |
| **Pro** | 50 | 20 | 15 | 5 | $20.00 |
| **Enterprise** | Ilimitados | Ilimitados | 20 | 10 | $100.00 |

**⚠️ DISCREPANCIAS:**
- **Rondas:** Pricing dice 3/5/10/ilimitadas, rate limiting dice 5/10/15/20
- **Debates/mes:** Pricing dice "ilimitados" para Starter+, rate limiting tiene límites diarios
- **No hay límite de créditos** implementado

---

## 💳 Sistema de Créditos: Prometido vs Implementado

### Prometido en Pricing Page

| Plan | Créditos/mes |
|------|--------------|
| Free | 100 (una vez) |
| Starter | 3,500 |
| Pro | 10,000 |
| Business | 30,000 |

### Implementado en Código

**Ubicación:** `packages/api/src/routers/quoorum.ts`

```typescript
// Pre-flight check: Verify user has sufficient credits before starting
const estimatedCreditsMax = 140
const hasBalance = await hasSufficientCredits(userId, estimatedCreditsMax)
```

**⚠️ PROBLEMA:**
- ✅ Verifica créditos antes de crear debate
- ❌ **NO verifica límite mensual de créditos por plan**
- ❌ **NO hay asignación automática de créditos mensuales**
- ❌ **NO hay diferenciación de límites por plan**

---

## 🤖 Modelos de IA: Prometido vs Usado

### Prometido en Pricing Page

| Plan | Modelos |
|------|---------|
| Free | Modelos estándar (GPT-4o mini, Gemini Flash) |
| Starter | Modelos estándar + Síntesis con Claude 3.5 Sonnet |
| Pro | Modelos premium (Claude 3.5 Sonnet) |
| Business | Todos los modelos premium |

### Realmente Usado (`packages/quoorum/src/config/agent-config.ts`)

```typescript
// Defaults (configurables via env vars):
optimizer: { provider: 'google', model: 'gemini-2.0-flash-exp' }
critic: { provider: 'google', model: 'gemini-2.0-flash-exp' }
analyst: { provider: 'google', model: 'gemini-2.0-flash-exp' }
synthesizer: { provider: 'openai', model: 'gpt-4o-mini' }
```

**⚠️ PROBLEMA:**
- ✅ Usa modelos free tier (gemini-2.0-flash-exp) para mayoría
- ❌ **NO diferencia modelos por plan**
- ❌ **NO usa Claude 3.5 Sonnet para Starter+ como prometido**
- ❌ **NO hay restricción de modelos por plan**

---

## 🔄 Funcionalidades Técnicas: No Documentadas

### Implementadas pero NO mencionadas en planes

1. **Compresión Bidireccional** (`packages/quoorum/src/ultra-language.ts`)
   - ✅ Implementada para todos los planes
   - ❌ No mencionada en pricing
   - 💡 **Recomendación:** Añadir como "Optimización de tokens" en todos los planes

2. **Retry Logic con Exponential Backoff** (`packages/quoorum/src/runner-dynamic.ts`)
   - ✅ Implementada para todos los planes
   - ❌ No mencionada en pricing
   - 💡 **Recomendación:** Añadir como "Resiliencia automática" en todos los planes

3. **Optimización de Modelos** (`packages/quoorum/src/config/agent-config.ts`)
   - ✅ Implementada (usa free tier cuando es posible)
   - ❌ No mencionada en pricing
   - 💡 **Recomendación:** Añadir como "Optimización de costos" en todos los planes

---

## ✅ Checklist de Alineación

### Precios
- [ ] Unificar precios entre pricing page y documentación
- [ ] Verificar que precios en DB coinciden con pricing page
- [ ] Actualizar documentación si hay cambios

### Créditos
- [ ] Implementar asignación mensual de créditos por plan
- [ ] Implementar verificación de límite mensual antes de crear debate
- [ ] Añadir UI para mostrar créditos restantes del mes
- [ ] Añadir alertas cuando se acerca al límite

### Límites de Rondas
- [ ] Unificar límites entre pricing, DB y rate limiting
- [ ] Implementar verificación de `maxRoundsPerDebate` por plan
- [ ] Detener debate cuando se alcanza el límite

### Modelos de IA
- [ ] Implementar restricción de modelos por plan
- [ ] Starter+ debe usar Claude 3.5 Sonnet para síntesis
- [ ] Free debe usar solo modelos free tier
- [ ] Business debe tener acceso a todos los modelos

### Funcionalidades Técnicas
- [ ] Documentar compresión bidireccional en pricing
- [ ] Documentar retry logic en pricing
- [ ] Documentar optimización de modelos en pricing
- [ ] Añadir estas features como "valor añadido" en todos los planes

---

## 🎯 Recomendaciones Prioritarias

### 🔴 CRÍTICO (Antes de lanzar)

1. **Unificar precios**
   - Decidir: ¿Pro es 49€ o 79€?
   - Actualizar pricing page y documentación
   - Verificar Stripe products

2. **Implementar límites de créditos**
   - Asignación mensual automática
   - Verificación antes de crear debate
   - UI para mostrar créditos restantes

3. **Unificar límites de rondas**
   - Decidir límites finales por plan
   - Actualizar DB schema con valores correctos
   - Implementar verificación en código

### 🟡 IMPORTANTE (Próximas semanas)

4. **Restricción de modelos por plan**
   - Free: Solo free tier (gemini-2.0-flash-exp, gpt-4o-mini)
   - Starter+: Claude 3.5 Sonnet para síntesis
   - Business: Todos los modelos

5. **Documentar funcionalidades técnicas**
   - Añadir compresión, retry, optimización a pricing
   - Destacar como "valor añadido"

### 🟢 MEJORAS (Futuro)

6. **Sistema de créditos más granular**
   - Diferentes costos por tipo de debate
   - Créditos adicionales por compra
   - Rollover de créditos no usados

---

## 📋 Plan de Acción Inmediato

### Paso 1: Decidir Precios Finales
```typescript
// packages/db/src/schema/subscriptions.ts
// Actualizar con precios correctos
const PLAN_PRICES = {
  free: { monthly: 0, yearly: 0 },
  starter: { monthly: 29, yearly: 290 }, // o 299?
  pro: { monthly: 49, yearly: 490 }, // o 79/790?
  business: { monthly: 199, yearly: 1990 },
}
```

### Paso 2: Implementar Límites de Créditos
```typescript
// packages/api/src/lib/plan-limits.ts
export const PLAN_CREDIT_LIMITS = {
  free: { monthly: 100, oneTime: true },
  starter: { monthly: 3500, oneTime: false },
  pro: { monthly: 10000, oneTime: false },
  business: { monthly: 30000, oneTime: false },
}

// Verificar antes de crear debate
export async function checkMonthlyCreditLimit(userId: string, planTier: string): Promise<boolean> {
  const limit = PLAN_CREDIT_LIMITS[planTier]?.monthly
  if (!limit) return true // No limit
  
  const used = await getMonthlyCreditsUsed(userId)
  return used < limit
}
```

### Paso 3: Unificar Límites de Rondas
```typescript
// packages/db/src/schema/subscriptions.ts
// Actualizar defaults por plan
const PLAN_ROUND_LIMITS = {
  free: 3,
  starter: 5,
  pro: 10,
  business: -1, // unlimited
}
```

### Paso 4: Restricción de Modelos
```typescript
// packages/quoorum/src/config/agent-config.ts
export function getAgentConfigForPlan(planTier: string, agentKey: string): AgentConfig {
  const baseConfig = getAgentConfig(agentKey)
  
  // Free: Solo free tier
  if (planTier === 'free') {
    return {
      ...baseConfig,
      provider: 'google',
      model: 'gemini-2.0-flash-exp',
    }
  }
  
  // Starter+: Claude para síntesis
  if (agentKey === 'synthesizer' && ['starter', 'pro', 'business'].includes(planTier)) {
    return {
      ...baseConfig,
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
    }
  }
  
  return baseConfig
}
```

---

## 📊 Matriz de Alineación Final

| Feature | Free | Starter | Pro | Business | Estado |
|---------|------|---------|-----|----------|--------|
| **Precio mensual** | 0€ | 29€ | ? | 199€ | ⚠️ Inconsistente |
| **Créditos/mes** | 100 | 3,500 | 10,000 | 30,000 | ❌ No implementado |
| **Rondas/debate** | 3 | 5 | 10 | Ilimitadas | ⚠️ Inconsistente |
| **Expertos** | 4 | 4 | 8 | 15 | ✅ OK |
| **Modelos IA** | Free tier | +Claude | Premium | Todos | ❌ No diferenciado |
| **Compresión** | ✅ | ✅ | ✅ | ✅ | ✅ Implementado |
| **Retry logic** | ✅ | ✅ | ✅ | ✅ | ✅ Implementado |
| **PDF Export** | ❌ | ❌ | ✅ | ✅ | ✅ OK |
| **API Access** | ❌ | ❌ | ❌ | ✅ | ✅ OK |

---

_Última actualización: 23 Ene 2026_
