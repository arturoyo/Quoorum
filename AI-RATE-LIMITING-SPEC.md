# 🤖 AI Rate Limiting & Fallback System - Especificación Técnica

> **Estado:** 📋 Diseñado - Implementación Parcial
> **Última actualización:** 16 Ene 2026
> **Implementado:** `packages/ai/src/lib/fallback-config.ts`
> **Pendiente:** rate-limiter.ts, quota-monitor.ts, retry.ts, telemetry.ts

---

## 📊 Estado de Implementación

| Componente | Archivo | Estado | Prioridad |
|------------|---------|--------|-----------|
| Fallback Config | `fallback-config.ts` | ✅ Implementado | - |
| Rate Limiter | `rate-limiter.ts` | ❌ No existe | 🔴 Alta |
| Quota Monitor | `quota-monitor.ts` | ❌ No existe | 🔴 Alta |
| Circuit Breaker | Dentro de fallback | ❌ No existe | 🟡 Media |
| Retry Logic | `retry.ts` | ❌ No existe | 🟡 Media |
| Telemetry | `telemetry.ts` | ❌ No existe | 🟢 Baja |

---

## 🎯 Arquitectura Multi-Proveedor

El sistema está diseñado para gestionar múltiples proveedores de IA con:

- ✅ **5 proveedores** configurados (OpenAI, Anthropic, Gemini, Groq, DeepSeek)
- 📋 **Rate limiting local** (evita hit de límites de API)
- 📋 **Circuit breaker pattern** (detecta providers caídos)
- 📋 **Fallback automático** (cambia de proveedor en caso de error)
- 📋 **Quota monitoring** (alertas al 80% y 95%)
- 📋 **Cost tracking** (PostHog telemetry)

---

## 1. Rate Limiting Local (Token Bucket)

### Objetivo
Prevenir hitting de rate limits ANTES de llamar a la API.

### API Diseñada

```typescript
import { getRateLimiterManager } from '@wallie/ai/lib/rate-limiter'

// En tu router/función
const rateLimiterManager = getRateLimiterManager()
const limiter = rateLimiterManager.getOrCreate('openai', 500, 800_000) // 500 RPM, 800k TPM

// ANTES de llamar a la API
await limiter.waitForCapacity(estimatedTokens)

// Ahora sí, llamar a la API
const response = await openai.chat.completions.create(...)
```

### Límites Pre-configurados (Free Tier)

| Provider  | RPM | TPM       | RPD    |
| --------- | --- | --------- | ------ |
| OpenAI    | 3   | 150,000   | 200    |
| Gemini    | 15  | 1,000,000 | 1,500  |
| Anthropic | 5   | 20,000    | 50     |
| Groq      | 30  | 14,400    | 14,400 |
| DeepSeek  | 60  | 100,000   | 10,000 |

### Implementación Sugerida

```typescript
// packages/ai/src/lib/rate-limiter.ts
export class TokenBucketRateLimiter {
  private tokens: number
  private lastRefill: number
  private readonly rpm: number
  private readonly tpm: number

  constructor(rpm: number, tpm: number) {
    this.rpm = rpm
    this.tpm = tpm
    this.tokens = tpm
    this.lastRefill = Date.now()
  }

  async waitForCapacity(estimatedTokens: number): Promise<void> {
    await this.refill()

    while (this.tokens < estimatedTokens) {
      const waitTime = this.calculateWaitTime(estimatedTokens)
      await new Promise(resolve => setTimeout(resolve, waitTime))
      await this.refill()
    }

    this.tokens -= estimatedTokens
  }

  private async refill(): Promise<void> {
    const now = Date.now()
    const elapsed = now - this.lastRefill
    const tokensToAdd = (elapsed / 60000) * this.tpm

    this.tokens = Math.min(this.tpm, this.tokens + tokensToAdd)
    this.lastRefill = now
  }

  private calculateWaitTime(needed: number): number {
    const deficit = needed - this.tokens
    return (deficit / this.tpm) * 60000
  }
}

export class RateLimiterManager {
  private limiters = new Map<string, TokenBucketRateLimiter>()

  getOrCreate(provider: string, rpm: number, tpm: number): TokenBucketRateLimiter {
    if (!this.limiters.has(provider)) {
      this.limiters.set(provider, new TokenBucketRateLimiter(rpm, tpm))
    }
    return this.limiters.get(provider)!
  }

  get(provider: string): TokenBucketRateLimiter | undefined {
    return this.limiters.get(provider)
  }
}

let instance: RateLimiterManager | null = null

export function getRateLimiterManager(): RateLimiterManager {
  if (!instance) {
    instance = new RateLimiterManager()
  }
  return instance
}
```

---

## 2. Quota Monitoring (Alertas Automáticas)

### Objetivo
Monitorear uso en tiempo real y alertar cuando se acerca al límite.

### API Diseñada

```typescript
import { getQuotaMonitor } from '@wallie/ai/lib/quota-monitor'

const quotaMonitor = getQuotaMonitor()

// Después de cada request
quotaMonitor.updateUsage('openai', 1, tokensUsed)

// Check si debemos cambiar de proveedor
if (quotaMonitor.shouldSwitchProvider('openai')) {
  logger.warn('[AI] Switching from OpenAI due to quota limits')
}

// Registrar callback para alertas
quotaMonitor.onAlert((alert) => {
  if (alert.type === 'critical') {
    void trackQuotaAlert(alert.provider, alert.metric, alert.percent, 'critical')
  }
})
```

### Alertas Automáticas

- ⚠️ **Warning** al 80% de RPM/TPM/RPD
- 🚨 **Critical** al 95% de RPM/TPM/RPD
- ❌ **Exceeded** cuando se alcanza el 100%

### Implementación Sugerida

```typescript
// packages/ai/src/lib/quota-monitor.ts
interface QuotaLimits {
  rpm: number
  tpm: number
  rpd: number
  tier: string
}

interface QuotaUsage {
  requests: number
  tokens: number
  dailyRequests: number
  lastReset: number
}

type AlertType = 'warning' | 'critical' | 'exceeded'
type AlertCallback = (alert: QuotaAlert) => void

interface QuotaAlert {
  provider: string
  metric: 'rpm' | 'tpm' | 'rpd'
  current: number
  limit: number
  percent: number
  type: AlertType
}

export class QuotaMonitor {
  private limits = new Map<string, QuotaLimits>()
  private usage = new Map<string, QuotaUsage>()
  private callbacks: AlertCallback[] = []

  updateUsage(provider: string, requests: number, tokens: number): void {
    const current = this.usage.get(provider) || {
      requests: 0,
      tokens: 0,
      dailyRequests: 0,
      lastReset: Date.now()
    }

    current.requests += requests
    current.tokens += tokens
    current.dailyRequests += requests

    this.usage.set(provider, current)
    this.checkAlerts(provider)
  }

  shouldSwitchProvider(provider: string): boolean {
    const limits = this.limits.get(provider)
    const usage = this.usage.get(provider)
    if (!limits || !usage) return false

    const rpmPercent = (usage.requests / limits.rpm) * 100
    const tpmPercent = (usage.tokens / limits.tpm) * 100
    const rpdPercent = (usage.dailyRequests / limits.rpd) * 100

    return rpmPercent >= 95 || tpmPercent >= 95 || rpdPercent >= 95
  }

  onAlert(callback: AlertCallback): void {
    this.callbacks.push(callback)
  }

  private checkAlerts(provider: string): void {
    const limits = this.limits.get(provider)
    const usage = this.usage.get(provider)
    if (!limits || !usage) return

    const checks: Array<{ metric: 'rpm' | 'tpm' | 'rpd', current: number, limit: number }> = [
      { metric: 'rpm', current: usage.requests, limit: limits.rpm },
      { metric: 'tpm', current: usage.tokens, limit: limits.tpm },
      { metric: 'rpd', current: usage.dailyRequests, limit: limits.rpd }
    ]

    for (const check of checks) {
      const percent = (check.current / check.limit) * 100
      let type: AlertType | null = null

      if (percent >= 100) type = 'exceeded'
      else if (percent >= 95) type = 'critical'
      else if (percent >= 80) type = 'warning'

      if (type) {
        const alert: QuotaAlert = {
          provider,
          metric: check.metric,
          current: check.current,
          limit: check.limit,
          percent,
          type
        }
        this.callbacks.forEach(cb => cb(alert))
      }
    }
  }

  resetAllUsage(): void {
    this.usage.clear()
  }
}

let instance: QuotaMonitor | null = null

export function getQuotaMonitor(): QuotaMonitor {
  if (!instance) {
    instance = new QuotaMonitor()
  }
  return instance
}
```

---

## 3. Circuit Breaker Pattern

### Objetivo
Detectar providers caídos y evitar seguir intentando (fail fast).

### API Diseñada

```typescript
import { getFallbackManager } from '@wallie/ai/lib/fallback'

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

### Configuración Circuit Breaker

- **Failure Threshold**: 5 errores
- **Failure Window**: 60 segundos
- **Open Duration**: 5 minutos (luego half-open)
- **Half-Open Requests**: 1 (test de recuperación)

---

## 4. Fallback Chains (Provider Equivalents)

### Objetivo
Cambiar automáticamente a un proveedor equivalente si el primario falla.

### API Diseñada

```typescript
import { getFallbackManager } from '@wallie/ai/lib/fallback'

const fallbackManager = getFallbackManager()

// Get fallback chain for a model
const chain = fallbackManager.getFallbackChain('gpt-4o')
// Returns: claude-3-5-sonnet → gemini-1.5-pro → llama-3.3-70b

// Get next available fallback
const fallback = fallbackManager.getNextFallback('gpt-4o', ['openai'])
// Returns: { provider: 'anthropic', modelId: 'claude-3-5-sonnet-20241022', ... }
```

### Cadenas de Fallback Predefinidas

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

### Objetivo
Reintentos inteligentes con delay creciente y jitter.

### API Diseñada

```typescript
import { retryWithBackoff } from '@wallie/ai/lib/retry'

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

### Delay Progression

- Attempt 1: 1s ± 0.25s
- Attempt 2: 2s ± 0.5s
- Attempt 3: 4s ± 1s
- Attempt 4: 8s ± 2s
- Attempt 5: 16s ± 4s

**Respeta `Retry-After` header** de la API si existe.

---

## 6. Telemetry & Cost Tracking

### Objetivo
Enviar métricas a PostHog para análisis y alerting.

### API Diseñada

```typescript
import { trackAIRequest, calculateCost } from '@wallie/ai/lib/telemetry'

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
  feature: 'chat',
})
```

### Métricas Rastreadas

- Total requests (success/failed)
- Avg latency por provider
- Total tokens consumidos
- Total cost USD
- Error rate
- Provider health status

---

## 7. Admin Dashboard

### Objetivo
Monitorear todo desde `/admin/ai-usage`.

### Funcionalidades Planificadas

✅ **Provider Health** - Status de cada proveedor (healthy/degraded/down)
✅ **Quota Status** - Progress bars de RPM/TPM/RPD
✅ **Recent Alerts** - Últimas 20 alertas de cuota
✅ **Cost Estimate** - Costo actual + proyección mensual
✅ **Performance Metrics** - Latencia, success rate, tokens
✅ **Export Data** - CSV/JSON de métricas
✅ **Manual Controls** - Reset quotas, force close circuit

---

## 8. Patrón de Uso en Routers

### Ejemplo Completo

```typescript
import { getRateLimiterManager } from '@wallie/ai/lib/rate-limiter'
import { getQuotaMonitor } from '@wallie/ai/lib/quota-monitor'
import { getFallbackManager } from '@wallie/ai/lib/fallback'
import { retryWithBackoff } from '@wallie/ai/lib/retry'
import { trackAIRequest, calculateCost } from '@wallie/ai/lib/telemetry'

export const wallieRouter = router({
  chat: protectedProcedure
    .input(z.object({ message: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const startTime = Date.now()
      let provider = 'openai'
      let model = 'gpt-4o-mini'

      try {
        // 1. Check rate limits
        const limiter = getRateLimiterManager().get(provider)
        await limiter?.waitForCapacity(1000)

        // 2. Check circuit breaker
        const fallbackManager = getFallbackManager()
        if (!fallbackManager.isProviderAvailable(provider)) {
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
        fallbackManager.recordFailure(provider, error as Error)

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

### API Diseñada

```typescript
import { updateProviderQuotaLimits } from '@wallie/ai/lib/quota-monitor'
import { updateProviderLimits } from '@wallie/ai/lib/rate-limiter'

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

### Helpers para Testing

```typescript
// Reset all metrics (for tests)
import { resetAllMetrics } from '@wallie/ai/lib/telemetry'
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

## ⚠️ Reglas de Implementación

Cuando este sistema sea implementado:

1. ✅ **SIEMPRE** usar `waitForCapacity()` antes de llamar a una API de IA
2. ✅ **SIEMPRE** actualizar quota con `updateUsage()` después del request
3. ✅ **SIEMPRE** registrar success/failure con `recordSuccess()`/`recordFailure()`
4. ✅ **SIEMPRE** trackear telemetría con `trackAIRequest()`
5. ❌ **NUNCA** hacer requests directos sin pasar por el sistema de rate limiting
6. ❌ **NUNCA** ignorar circuit breaker status
7. ❌ **NUNCA** hardcodear límites de API (usar configuración centralizada)

---

## 📊 Monitoreo Continuo (Post-Implementación)

Acciones recomendadas:

- 🔍 Revisar `/admin/ai-usage` diariamente
- 📧 Configurar alertas PostHog para quota > 80%
- 💰 Monitorear proyección de costos mensual
- 🚨 Investigar circuit breakers abiertos
- 📈 Analizar success rate por provider
- 🔄 Optimizar fallback chains según latencia

---

## 🚧 Roadmap de Implementación

### Fase 1: Core (Alta Prioridad)
- [ ] Implementar `rate-limiter.ts` con Token Bucket
- [ ] Implementar `quota-monitor.ts` con alertas
- [ ] Tests unitarios para ambos componentes

### Fase 2: Resilience (Media Prioridad)
- [ ] Implementar circuit breaker en fallback manager
- [ ] Implementar `retry.ts` con exponential backoff
- [ ] Tests de integration para fallback chains

### Fase 3: Observability (Baja Prioridad)
- [ ] Implementar `telemetry.ts` con PostHog
- [ ] Crear admin dashboard `/admin/ai-usage`
- [ ] Implementar cost calculation

### Fase 4: Refinement
- [ ] Optimizar límites según uso real
- [ ] Añadir más providers
- [ ] Machine learning para predicción de usage

---

_Este documento es una especificación técnica. El sistema NO está completamente implementado aún._
_Estado actual: Solo `fallback-config.ts` existe en packages/ai/src/lib/_
_Última actualización: 16 Ene 2026_
