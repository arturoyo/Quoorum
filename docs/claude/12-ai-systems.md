# 🤖 AI Systems - Rate Limiting & Fallback

> **Módulo:** 12 | **Categoría:** Implementación
> **Tiempo de lectura:** 15-20 min
> **Estado:** Diseñado - Implementación Parcial

---

## 📋 CONTENIDO

1. [Resumen del Sistema](#resumen-del-sistema)
2. [Rate Limiting Local](#1-rate-limiting-local-token-bucket)
3. [Quota Monitoring](#2-quota-monitoring-alertas-automáticas)
4. [Circuit Breaker Pattern](#3-circuit-breaker-pattern)
5. [Fallback Chains](#4-fallback-chains-provider-equivalents)
6. [Retry con Exponential Backoff](#5-retry-con-exponential-backoff)
7. [Telemetry & Cost Tracking](#6-telemetry--cost-tracking)
8. [Admin Dashboard](#7-admin-dashboard)
9. [Patrón de Uso en Routers](#8-patrón-de-uso-en-routers)
10. [Testing & Debugging](#10-testing--debugging)

---

## Resumen del Sistema

**Estado:**
- ⚠️ Diseñado - Implementación Parcial
- 📖 Ver especificación completa: [AI-RATE-LIMITING-SPEC.md](../../AI-RATE-LIMITING-SPEC.md)
- ✅ Implementado: `packages/ai/src/lib/fallback-config.ts`
- ⚪ Pendiente: rate-limiter.ts, quota-monitor.ts, retry.ts, telemetry.ts

**Características:**
- ✅ **5 proveedores** configurados (OpenAI, Anthropic, Gemini, Groq, DeepSeek)
- ✅ **Rate limiting local** (evita hit de límites de API)
- ✅ **Circuit breaker pattern** (detecta providers caídos)
- ✅ **Fallback automático** (cambia de proveedor en caso de error)
- ✅ **Quota monitoring** (alertas al 80% y 95%)
- ✅ **Cost tracking** (PostHog telemetry)

---

## 1. Rate Limiting Local (Token Bucket)

**Previene** hitting de rate limits ANTES de llamar a la API.

```typescript
import { getRateLimiterManager } from '@quoorum/ai/lib/rate-limiter'

// En tu router/función
const rateLimiterManager = getRateLimiterManager()
const limiter = rateLimiterManager.getOrCreate('openai', 500, 800_000) // 500 RPM, 800k TPM

// ANTES de llamar a la API
await limiter.waitForCapacity(estimatedTokens)

// Ahora sí, llamar a la API
const response = await openai.chat.completions.create(...)
```

**Límites pre-configurados** (Free tier conservador):

| Provider  | RPM | TPM       | RPD    |
| --------- | --- | --------- | ------ |
| OpenAI    | 3   | 150,000   | 200    |
| Gemini    | 15  | 1,000,000 | 1,500  |
| Anthropic | 5   | 20,000    | 50     |
| Groq      | 30  | 14,400    | 14,400 |
| DeepSeek  | 60  | 100,000   | 10,000 |

---

## 2. Quota Monitoring (Alertas Automáticas)

**Monitorea** uso en tiempo real y alerta cuando se acerca al límite.

```typescript
import { getQuotaMonitor } from '@quoorum/ai/lib/quota-monitor'

const quotaMonitor = getQuotaMonitor()

// Después de cada request
quotaMonitor.updateUsage('openai', 1, tokensUsed)

// Check si debemos cambiar de proveedor
if (quotaMonitor.shouldSwitchProvider('openai')) {
  // Switch to fallback
  logger.warn('[AI] Switching from OpenAI due to quota limits')
}

// Registrar callback para alertas
quotaMonitor.onAlert((alert) => {
  if (alert.type === 'critical') {
    // Notificar a admins
    void trackQuotaAlert(alert.provider, alert.metric, alert.percent, 'critical')
  }
})
```

**Alertas automáticas**:
- ⚠️ **Warning** al 80% de RPM/TPM/RPD
- 🚨 **Critical** al 95% de RPM/TPM/RPD
- ❌ **Exceeded** cuando se alcanza el 100%

---

## 3. Circuit Breaker Pattern

**Detecta** providers caídos y evita seguir intentando (fail fast).

```typescript
import { getFallbackManager } from '@quoorum/ai/lib/fallback'

const fallbackManager = getFallbackManager()

// Check si el provider está disponible
if (!fallbackManager.isProviderAvailable('openai')) {
  logger.warn('[AI] OpenAI circuit open, using fallback')
  // Use fallback provider
}

// Registrar éxito/fallo
try {
  const response = await callOpenAI()
  fallbackManager.recordSuccess('openai')
} catch (error) {
  fallbackManager.recordFailure('openai', error)
  // Circuit se abre después de 5 errores en 1 minuto
  // Permanece abierto por 5 minutos
  // Auto-recovery cuando el proveedor se recupera
}
```

**Configuración Circuit Breaker**:
- **Failure Threshold**: 5 errores
- **Failure Window**: 60 segundos
- **Open Duration**: 5 minutos (luego half-open)
- **Half-Open Requests**: 1 (test de recuperación)

---

## 4. Fallback Chains (Provider Equivalents)

**Cambia automáticamente** a un proveedor equivalente si el primario falla.

```typescript
import { getFallbackManager } from '@quoorum/ai/lib/fallback'

const fallbackManager = getFallbackManager()

// Get fallback chain for a model
const chain = fallbackManager.getFallbackChain('gpt-4o')
// Returns: claude-3-5-sonnet → gemini-1.5-pro → llama-3.3-70b

// Get next available fallback
const fallback = fallbackManager.getNextFallback('gpt-4o', ['openai'])
// Returns: { provider: 'anthropic', modelId: 'claude-3-5-sonnet-20241022', ... }
```

**Cadenas de Fallback Predefinidas**:

| Modelo Original   | Fallback 1    | Fallback 2    | Fallback 3 |
| ----------------- | ------------- | ------------- | ---------- |
| gpt-4o            | Claude Sonnet | Gemini Pro    | Groq Llama |
| gpt-4o-mini       | Claude Haiku  | Gemini Flash  | Groq Llama |
| claude-3-5-sonnet | GPT-4o        | Gemini Pro    | Groq Llama |
| claude-3-5-haiku  | GPT-4o-mini   | Gemini Flash  | Groq Llama |
| gemini-1.5-pro    | GPT-4o        | Claude Sonnet | Groq Llama |
| gemini-2.0-flash  | GPT-4o-mini   | Claude Haiku  | Groq Llama |

---

## 5. Retry con Exponential Backoff

**Reintentos inteligentes** con delay creciente y jitter.

```typescript
import { retryWithBackoff } from '@quoorum/ai/lib/retry'

const response = await retryWithBackoff(
  async () => {
    return await openai.chat.completions.create(...)
  },
  {
    maxRetries: 5,
    initialDelay: 1000, // 1s
    maxDelay: 64000, // 64s
    backoffMultiplier: 2,
    jitter: true, // ±25% random variation
  }
)
```

**Delay progression** (con backoff multiplier 2x):
- Attempt 1: 1s ± 0.25s
- Attempt 2: 2s ± 0.5s
- Attempt 3: 4s ± 1s
- Attempt 4: 8s ± 2s
- Attempt 5: 16s ± 4s

**Respeta `Retry-After` header** de la API si existe.

---

## 6. Telemetry & Cost Tracking

**Envía métricas** a PostHog para análisis y alerting.

```typescript
import { trackAIRequest, calculateCost } from '@quoorum/ai/lib/telemetry'

// Después de cada request
const cost = calculateCost(model, promptTokens, completionTokens)

await trackAIRequest({
  provider: 'openai',
  model: 'gpt-4o',
  promptTokens,
  completionTokens,
  totalTokens,
  latencyMs: Date.now() - startTime,
  success: true,
  costUsd: cost,
  userId: ctx.userId,
  feature: 'chat', // o 'analysis', 'voice', etc.
})
```

**Métricas rastreadas**:
- Total requests (success/failed)
- Avg latency por provider
- Total tokens consumidos
- Total cost USD
- Error rate
- Provider health status

---

## 7. Admin Dashboard

**Monitorea** todo desde `/admin/ai-usage`:

✅ **Provider Health** - Status de cada proveedor (healthy/degraded/down)
✅ **Quota Status** - Progress bars de RPM/TPM/RPD
✅ **Recent Alerts** - Últimas 20 alertas de cuota
✅ **Cost Estimate** - Costo actual + proyección mensual
✅ **Performance Metrics** - Latencia, success rate, tokens
✅ **Export Data** - CSV/JSON de métricas
✅ **Manual Controls** - Reset quotas, force close circuit

---

## 8. Patrón de Uso en Routers

**Ejemplo completo** de cómo usar el sistema en un router tRPC:

```typescript
import { getRateLimiterManager } from '@quoorum/ai/lib/rate-limiter'
import { getQuotaMonitor } from '@quoorum/ai/lib/quota-monitor'
import { getFallbackManager } from '@quoorum/ai/lib/fallback'
import { retryWithBackoff } from '@quoorum/ai/lib/retry'
import { trackAIRequest, calculateCost } from '@quoorum/ai/lib/telemetry'

export const quoorumRouter = router({
  chat: protectedProcedure
    .input(z.object({ message: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const startTime = Date.now()
      let provider = 'openai'
      let model = 'gpt-4o-mini'

      try {
        // 1. Check rate limits
        const limiter = getRateLimiterManager().get(provider)
        await limiter?.waitForCapacity(1000) // Estimate 1k tokens

        // 2. Check circuit breaker
        const fallbackManager = getFallbackManager()
        if (!fallbackManager.isProviderAvailable(provider)) {
          // Use fallback
          const fallback = fallbackManager.getNextFallback(model)
          if (fallback) {
            provider = fallback.provider
            model = fallback.modelId
          }
        }

        // 3. Make request with retry
        const response = await retryWithBackoff(async () => {
          return await openai.chat.completions.create({
            model,
            messages: [{ role: 'user', content: input.message }],
          })
        })

        // 4. Update metrics
        const quotaMonitor = getQuotaMonitor()
        quotaMonitor.updateUsage(provider, 1, response.usage?.total_tokens || 0)

        // 5. Track telemetry
        const cost = calculateCost(
          model,
          response.usage?.prompt_tokens || 0,
          response.usage?.completion_tokens || 0
        )

        void trackAIRequest({
          provider,
          model,
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
          latencyMs: Date.now() - startTime,
          success: true,
          costUsd: cost,
          userId: ctx.userId,
          feature: 'chat',
        })

        // 6. Record success
        fallbackManager.recordSuccess(provider)

        return response.choices[0]?.message.content
      } catch (error) {
        // Record failure
        fallbackManager.recordFailure(provider, error as Error)

        // Track failed request
        void trackAIRequest({
          provider,
          model,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          latencyMs: Date.now() - startTime,
          success: false,
          errorType: (error as Error).message,
          userId: ctx.userId,
          feature: 'chat',
        })

        throw error
      }
    }),
})
```

---

## 9. Actualizar Límites (Tier Upgrade)

**Cuando un proveedor cambia de tier**, actualizar límites:

```typescript
import { updateProviderQuotaLimits } from '@quoorum/ai/lib/quota-monitor'
import { updateProviderLimits } from '@quoorum/ai/lib/rate-limiter'

// Ejemplo: Upgrade a OpenAI Tier 2
updateProviderQuotaLimits('openai', {
  rpm: 5000,
  tpm: 2_000_000,
  rpd: 10_000,
  tier: 'Tier 2',
})

updateProviderLimits('openai', 5000, 2_000_000)
```

---

## 10. Testing & Debugging

**Helpers para testing**:

```typescript
// Reset all metrics (for tests)
import { resetAllMetrics } from '@quoorum/ai/lib/telemetry'
resetAllMetrics()

// Reset all quotas
const quotaMonitor = getQuotaMonitor()
quotaMonitor.resetAllUsage()

// Force close circuit (manual recovery)
const fallbackManager = getFallbackManager()
fallbackManager.forceCloseCircuit('openai')

// Reset all provider health
fallbackManager.resetAllHealth()
```

---

## ⚠️ Reglas Importantes

1. ✅ **SIEMPRE** usar `waitForCapacity()` antes de llamar a una API de IA
2. ✅ **SIEMPRE** actualizar quota con `updateUsage()` después del request
3. ✅ **SIEMPRE** registrar success/failure con `recordSuccess()`/`recordFailure()`
4. ✅ **SIEMPRE** trackear telemetría con `trackAIRequest()`
5. ❌ **NUNCA** hacer requests directos sin pasar por el sistema de rate limiting
6. ❌ **NUNCA** ignorar circuit breaker status
7. ❌ **NUNCA** hardcodear límites de API (usar configuración centralizada)

---

## 📊 Monitoreo Continuo

**Acciones recomendadas**:

- 🔍 Revisar `/admin/ai-usage` diariamente
- 📧 Configurar alertas PostHog para quota > 80%
- 💰 Monitorear proyección de costos mensual
- 🚨 Investigar circuit breakers abiertos
- 📈 Analizar success rate por provider
- 🔄 Optimizar fallback chains según latencia

---

_Módulo creado: 27 Ene 2026_
_Ver también: [AI-RATE-LIMITING-SPEC.md](../../AI-RATE-LIMITING-SPEC.md)_
