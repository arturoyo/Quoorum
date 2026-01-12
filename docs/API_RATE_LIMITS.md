# 📊 API Rate Limits - Proveedores de IA

> **Versión:** 1.0.0 | **Última actualización:** 30 Diciembre 2024
> **Proyecto:** Wallie - CRM con IA para WhatsApp Business
> **Mantenedor:** Equipo Técnico Wallie

---

## 📋 ÍNDICE

1. [OpenAI API](#-openai-api)
2. [Google Gemini API](#-google-gemini-api)
3. [Anthropic Claude API](#-anthropic-claude-api)
4. [Estrategias de Mitigación](#-estrategias-de-mitigación)
5. [Sistema de Fallback](#-sistema-de-fallback)
6. [Monitoreo de Cuota](#-monitoreo-de-cuota)
7. [Análisis de Costos](#-análisis-de-costos)
8. [Implementación en Código](#-implementación-en-código)

---

## 🔵 OPENAI API

**Documentación oficial:** [OpenAI Rate Limits](https://platform.openai.com/docs/guides/rate-limits)

### Límites por Tier

OpenAI usa un sistema de **5 tiers** basados en gasto acumulado. Se gradúa automáticamente al pagar más.

| Tier          | Gasto Requerido | Días Desde 1º Pago | RPM (gpt-4o) | TPM (gpt-4o) | RPM (gpt-4o-mini) | TPM (gpt-4o-mini) | RPM (o1) | TPM (o1)   |
| ------------- | --------------- | ------------------ | ------------ | ------------ | ----------------- | ----------------- | -------- | ---------- |
| 🟢 **Free**   | $0              | -                  | 3            | 150,000      | 3                 | 150,000           | -        | -          |
| 🔵 **Tier 1** | $5+             | 7+                 | 500          | 800,000      | 500               | 2,000,000         | 500      | 800,000    |
| 🟡 **Tier 2** | $50+            | 7+                 | 5,000        | 2,000,000    | 5,000             | 4,000,000         | 5,000    | 2,000,000  |
| 🟠 **Tier 3** | $1,000+         | 7+                 | 5,000        | 5,000,000    | 5,000             | 10,000,000        | 5,000    | 5,000,000  |
| 🔴 **Tier 4** | $5,000+         | 14+                | 10,000       | 10,000,000   | 10,000            | 10,000,000        | 10,000   | 10,000,000 |
| ⭐ **Tier 5** | $50,000+        | 30+                | 10,000       | 30,000,000   | 10,000            | 30,000,000        | 20,000   | 20,000,000 |

### Modelos Legacy (o1-preview, o1-mini)

⚠️ **DEPRECADOS** - Reemplazados por `o1` y `o3` series.

| Modelo       | Tier 1 RPM | Tier 1 TPM | Tier 2 RPM | Tier 2 TPM |
| ------------ | ---------- | ---------- | ---------- | ---------- |
| `o1-preview` | 20         | 150,000    | 50         | 450,000    |
| `o1-mini`    | 30         | 200,000    | 75         | 600,000    |

**Recomendación:** Migrar a `o1` o `o3-mini` para mejores límites.

### Límites Adicionales

- **RPD (Requests Per Day):** Típicamente 10,000 para Tier 1, sin límite explícito para Tier 2+
- **Batch API:** 50% descuento, límites separados (200,000 TPD en Tier 1)
- **Scale Tier:** Límites customizados para empresas ($100k+/mes)

### Códigos de Error

```typescript
// 429 Rate Limit Exceeded
{
  "error": {
    "message": "Rate limit reached for gpt-4o in organization...",
    "type": "rate_limit_error",
    "param": null,
    "code": "rate_limit_exceeded"
  }
}
```

**Headers de Respuesta:**

```
x-ratelimit-limit-requests: 500
x-ratelimit-limit-tokens: 800000
x-ratelimit-remaining-requests: 499
x-ratelimit-remaining-tokens: 799500
x-ratelimit-reset-requests: 120ms
x-ratelimit-reset-tokens: 75ms
```

---

## 🔴 GOOGLE GEMINI API

**Documentación oficial:** [Gemini API Rate Limits](https://ai.google.dev/gemini-api/docs/rate-limits)

### Límites por Tier (Actualizado Diciembre 2024)

Google usa **2 tiers principales** basados en facturación de Google Cloud.

| Tier          | Requisitos             | RPM (Flash) | TPM (Flash) | RPD (Flash) | RPM (Pro) | TPM (Pro) | RPD (Pro) |
| ------------- | ---------------------- | ----------- | ----------- | ----------- | --------- | --------- | --------- |
| 🟢 **Free**   | API Key gratis         | 15          | 1,000,000   | 1,500       | 5         | 200,000   | -         |
| 🔵 **Tier 1** | Billing habilitado     | 300         | 1,000,000   | 1,000       | 300       | 1,000,000 | 1,000     |
| 🟡 **Tier 2** | $250+ en GCP + 30 días | 1,000       | 2,000,000   | 10,000      | 1,000     | 2,000,000 | 10,000    |

### Modelos Específicos

| Modelo                 | Free RPM | Free TPM  | Paid Tier 1 RPM | Paid Tier 1 TPM |
| ---------------------- | -------- | --------- | --------------- | --------------- |
| `gemini-1.5-flash`     | 15       | 1,000,000 | 2,000           | 4,000,000       |
| `gemini-1.5-flash-8b`  | 15       | 1,000,000 | 4,000           | 4,000,000       |
| `gemini-1.5-pro`       | 5        | 200,000   | 360             | 4,000,000       |
| `gemini-2.0-flash-exp` | 15       | 1,000,000 | 1,000           | 4,000,000       |

### Características Especiales

- **Límites por proyecto:** No por API key
- **Reset diario:** Medianoche Pacific Time (PT)
- **Cache:** No cuenta contra límites de TPM (solo RPM)
- **Grounding con Google Search:** Límites separados (300 RPM en Tier 2)

### Códigos de Error

```typescript
// 429 RESOURCE_EXHAUSTED
{
  "error": {
    "code": 429,
    "message": "Resource has been exhausted (e.g. quota).",
    "status": "RESOURCE_EXHAUSTED"
  }
}
```

**Headers de Respuesta:**

```
X-Goog-Api-Key-Quota: 14/15 RPM remaining
Retry-After: 60
```

---

## 🟣 ANTHROPIC CLAUDE API

**Documentación oficial:** [Claude Rate Limits](https://docs.anthropic.com/en/api/rate-limits)

### Límites por Tier

Anthropic usa **4 tiers** basados en gasto mensual. Token bucket algorithm con replenishment continuo.

| Tier                | Gasto Mensual | RPM   | ITPM    | OTPM    | Descripción    |
| ------------------- | ------------- | ----- | ------- | ------- | -------------- |
| 🟢 **Free**         | $0            | 5     | 20,000  | 8,000   | Uso de prueba  |
| 🔵 **Build Tier 1** | $5-$100       | 50    | 40,000  | 16,000  | Desarrollo     |
| 🟡 **Build Tier 2** | $100-$500     | 1,000 | 80,000  | 32,000  | Escala inicial |
| 🟠 **Build Tier 3** | $500-$1,000   | 2,000 | 160,000 | 64,000  | Escala media   |
| 🔴 **Build Tier 4** | $1,000+       | 4,000 | 400,000 | 160,000 | Producción     |

### Límites por Modelo

| Modelo                       | Build Tier 1 RPM | Build Tier 2 RPM | Build Tier 4 RPM | Contexto |
| ---------------------------- | ---------------- | ---------------- | ---------------- | -------- |
| `claude-3-5-sonnet-20241022` | 50               | 1,000            | 4,000            | 200K     |
| `claude-3-5-haiku-20241022`  | 50               | 1,000            | 4,000            | 200K     |
| `claude-3-opus-20240229`     | 50               | 1,000            | 4,000            | 200K     |

### Prompt Caching (Noviembre 2024)

- **Cache writes:** 1.25x precio base
- **Cache hits:** 0.1x precio base (90% descuento)
- **TTL:** 5 minutos
- **Límites:** Solo tokens **uncached** cuentan contra ITPM

### Batch API

- **Descuento:** 50% en input y output tokens
- **Límites separados:** 2x de límites estándar
- **Tiempo de procesamiento:** 12-24 horas

### Códigos de Error

```typescript
// 429 Rate Limit Error
{
  "error": {
    "type": "rate_limit_error",
    "message": "Rate limit exceeded for requests per minute."
  },
  "retry-after": 60
}
```

**Headers de Respuesta:**

```
anthropic-ratelimit-requests-limit: 50
anthropic-ratelimit-requests-remaining: 49
anthropic-ratelimit-requests-reset: 2024-12-30T12:00:00Z
anthropic-ratelimit-tokens-limit: 40000
anthropic-ratelimit-tokens-remaining: 39500
anthropic-ratelimit-tokens-reset: 2024-12-30T12:01:00Z
```

---

## 🛡️ ESTRATEGIAS DE MITIGACIÓN

### 1. Exponential Backoff

**Implementación TypeScript:**

```typescript
// packages/ai/src/lib/retry.ts
import { sleep } from './utils'

interface RetryConfig {
  maxRetries: number
  initialDelay: number // ms
  maxDelay: number // ms
  backoffMultiplier: number
  jitter: boolean
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 5,
  initialDelay: 1000, // 1 segundo
  maxDelay: 64000, // 64 segundos
  backoffMultiplier: 2,
  jitter: true, // Añade aleatoriedad para evitar "thundering herd"
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  let lastError: Error

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // No reintentar errores que no son de rate limit
      if (!isRateLimitError(error)) {
        throw error
      }

      // Si es el último intento, lanzar error
      if (attempt === finalConfig.maxRetries) {
        throw new Error(`Max retries (${finalConfig.maxRetries}) exceeded: ${lastError.message}`)
      }

      // Calcular delay con exponential backoff
      let delay = Math.min(
        finalConfig.initialDelay * Math.pow(finalConfig.backoffMultiplier, attempt),
        finalConfig.maxDelay
      )

      // Añadir jitter (±25% de variación aleatoria)
      if (finalConfig.jitter) {
        const jitterRange = delay * 0.25
        delay = delay - jitterRange + Math.random() * (jitterRange * 2)
      }

      // Respetar header Retry-After si existe
      const retryAfter = getRetryAfterHeader(error)
      if (retryAfter) {
        delay = Math.max(delay, retryAfter * 1000)
      }

      console.warn(
        `Rate limit hit (attempt ${attempt + 1}/${finalConfig.maxRetries}). ` +
          `Retrying in ${Math.round(delay)}ms...`
      )

      await sleep(delay)
    }
  }

  throw lastError!
}

function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('rate_limit') ||
      error.message.includes('429') ||
      error.message.includes('RESOURCE_EXHAUSTED')
    )
  }
  return false
}

function getRetryAfterHeader(error: unknown): number | null {
  // Extraer Retry-After header de diferentes formatos
  if (typeof error === 'object' && error !== null) {
    const headers = (error as any).headers
    if (headers?.['retry-after']) {
      return parseInt(headers['retry-after'], 10)
    }
  }
  return null
}
```

### 2. Request Batching

**Combinar múltiples requests en uno:**

```typescript
// packages/ai/src/lib/batching.ts
interface BatchItem<T> {
  prompt: string
  resolve: (value: T) => void
  reject: (error: Error) => void
}

export class RequestBatcher<T> {
  private queue: BatchItem<T>[] = []
  private timer: NodeJS.Timeout | null = null
  private readonly batchSize: number
  private readonly batchDelay: number // ms

  constructor(
    private processor: (prompts: string[]) => Promise<T[]>,
    options: { batchSize?: number; batchDelay?: number } = {}
  ) {
    this.batchSize = options.batchSize ?? 10
    this.batchDelay = options.batchDelay ?? 100 // 100ms por defecto
  }

  async add(prompt: string): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ prompt, resolve, reject })

      // Si alcanzamos tamaño de batch, procesar inmediatamente
      if (this.queue.length >= this.batchSize) {
        this.flush()
      } else if (!this.timer) {
        // Si no, esperar un poco para acumular más requests
        this.timer = setTimeout(() => this.flush(), this.batchDelay)
      }
    })
  }

  private async flush() {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }

    if (this.queue.length === 0) return

    const batch = this.queue.splice(0, this.batchSize)
    const prompts = batch.map((item) => item.prompt)

    try {
      const results = await this.processor(prompts)
      batch.forEach((item, index) => {
        item.resolve(results[index]!)
      })
    } catch (error) {
      batch.forEach((item) => {
        item.reject(error as Error)
      })
    }
  }
}

// Uso
const embedBatcher = new RequestBatcher(
  async (texts: string[]) => {
    // Una sola llamada a OpenAI embeddings con múltiples textos
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts, // Array de strings
    })
    return response.data.map((d) => d.embedding)
  },
  { batchSize: 100, batchDelay: 50 }
)

// En lugar de:
// const emb1 = await getEmbedding(text1) // 1 request
// const emb2 = await getEmbedding(text2) // 1 request
// const emb3 = await getEmbedding(text3) // 1 request

// Hacemos:
const [emb1, emb2, emb3] = await Promise.all([
  embedBatcher.add(text1),
  embedBatcher.add(text2),
  embedBatcher.add(text3),
]) // Solo 1 request con 3 textos
```

### 3. Token Bucket (Rate Limiter Local)

**Prevenir alcanzar límites antes del request:**

```typescript
// packages/ai/src/lib/rate-limiter.ts
export class TokenBucket {
  private tokens: number
  private lastRefill: number

  constructor(
    private capacity: number, // Tokens máximos
    private refillRate: number, // Tokens por segundo
    private refillPeriod: number = 1000 // ms
  ) {
    this.tokens = capacity
    this.lastRefill = Date.now()
  }

  async consume(tokensNeeded: number = 1): Promise<void> {
    this.refill()

    if (this.tokens >= tokensNeeded) {
      this.tokens -= tokensNeeded
      return
    }

    // Calcular cuánto esperar
    const tokensShort = tokensNeeded - this.tokens
    const waitMs = (tokensShort / this.refillRate) * this.refillPeriod

    await sleep(waitMs)
    this.refill()
    this.tokens -= tokensNeeded
  }

  private refill() {
    const now = Date.now()
    const timePassed = now - this.lastRefill
    const tokensToAdd = (timePassed / this.refillPeriod) * this.refillRate

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd)
    this.lastRefill = now
  }

  getAvailableTokens(): number {
    this.refill()
    return this.tokens
  }
}

// Uso con múltiples buckets (RPM y TPM)
class AIProviderLimiter {
  private rpmBucket: TokenBucket
  private tpmBucket: TokenBucket

  constructor(rpm: number, tpm: number) {
    this.rpmBucket = new TokenBucket(rpm, rpm / 60, 1000) // RPM
    this.tpmBucket = new TokenBucket(tpm, tpm / 60, 1000) // TPM
  }

  async waitForCapacity(estimatedTokens: number): Promise<void> {
    await Promise.all([
      this.rpmBucket.consume(1), // 1 request
      this.tpmBucket.consume(estimatedTokens), // N tokens
    ])
  }
}

// Ejemplo para OpenAI Tier 1
const openaiLimiter = new AIProviderLimiter(500, 800_000)

async function callOpenAI(prompt: string) {
  const estimatedTokens = prompt.length / 4 // Aproximación

  // Esperar si es necesario ANTES de hacer el request
  await openaiLimiter.waitForCapacity(estimatedTokens)

  return await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
  })
}
```

### 4. Delays Recomendados

| Proveedor | Tier          | Delay entre Requests | Justificación              |
| --------- | ------------- | -------------------- | -------------------------- |
| OpenAI    | Free          | 20 segundos          | 3 RPM = 1 request cada 20s |
| OpenAI    | Tier 1        | 120ms                | 500 RPM = ~8 RPS           |
| OpenAI    | Tier 2+       | Sin delay            | Rate limiter maneja        |
| Gemini    | Free          | 4 segundos           | 15 RPM = 1 request cada 4s |
| Gemini    | Tier 1        | 200ms                | 300 RPM = ~5 RPS           |
| Gemini    | Tier 2        | Sin delay            | Rate limiter maneja        |
| Claude    | Build Tier 1  | 1.2 segundos         | 50 RPM = ~1 RPS            |
| Claude    | Build Tier 2+ | Sin delay            | Rate limiter maneja        |

---

## 🔄 SISTEMA DE FALLBACK

### Estrategia de Cascada

**Orden de prioridad cuando un modelo alcanza su límite:**

```typescript
// packages/ai/src/lib/fallback.ts
export enum AIProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
}

export enum TaskComplexity {
  SIMPLE = 'simple', // Saludos, respuestas cortas
  MEDIUM = 'medium', // Análisis, clasificación
  COMPLEX = 'complex', // Razonamiento, long-form
}

// Mapeo de modelos equivalentes entre proveedores
export const MODEL_EQUIVALENTS = {
  // Modelos rápidos/baratos (para tareas simples)
  fast: {
    [AIProvider.OPENAI]: 'gpt-4o-mini',
    [AIProvider.ANTHROPIC]: 'claude-3-5-haiku-20241022',
    [AIProvider.GOOGLE]: 'gemini-1.5-flash-8b',
  },
  // Modelos balanceados (para tareas medias)
  balanced: {
    [AIProvider.OPENAI]: 'gpt-4o',
    [AIProvider.ANTHROPIC]: 'claude-3-5-sonnet-20241022',
    [AIProvider.GOOGLE]: 'gemini-1.5-flash',
  },
  // Modelos premium (para tareas complejas)
  premium: {
    [AIProvider.OPENAI]: 'o1',
    [AIProvider.ANTHROPIC]: 'claude-3-opus-20240229',
    [AIProvider.GOOGLE]: 'gemini-1.5-pro',
  },
}

// Prioridad de fallback por complejidad
export const FALLBACK_PRIORITY = {
  [TaskComplexity.SIMPLE]: [
    { provider: AIProvider.GOOGLE, tier: 'fast' }, // Más barato
    { provider: AIProvider.OPENAI, tier: 'fast' },
    { provider: AIProvider.ANTHROPIC, tier: 'fast' },
  ],
  [TaskComplexity.MEDIUM]: [
    { provider: AIProvider.OPENAI, tier: 'balanced' }, // Mejor balance
    { provider: AIProvider.GOOGLE, tier: 'balanced' },
    { provider: AIProvider.ANTHROPIC, tier: 'balanced' },
  ],
  [TaskComplexity.COMPLEX]: [
    { provider: AIProvider.ANTHROPIC, tier: 'premium' }, // Mejor razonamiento
    { provider: AIProvider.OPENAI, tier: 'premium' },
    { provider: AIProvider.GOOGLE, tier: 'premium' },
  ],
}

export class AIFallbackManager {
  private providerHealth = new Map<
    AIProvider,
    {
      isAvailable: boolean
      lastError: Date | null
      consecutiveErrors: number
    }
  >()

  constructor() {
    // Inicializar todos como disponibles
    Object.values(AIProvider).forEach((provider) => {
      this.providerHealth.set(provider, {
        isAvailable: true,
        lastError: null,
        consecutiveErrors: 0,
      })
    })
  }

  async executeWithFallback<T>(
    task: TaskComplexity,
    executor: (provider: AIProvider, model: string) => Promise<T>
  ): Promise<T> {
    const fallbacks = FALLBACK_PRIORITY[task]

    for (const { provider, tier } of fallbacks) {
      const health = this.providerHealth.get(provider)!

      // Skip si el proveedor está marcado como no disponible
      if (!health.isAvailable) {
        // Re-intentar después de 5 minutos
        if (health.lastError && Date.now() - health.lastError.getTime() > 5 * 60 * 1000) {
          health.isAvailable = true
          health.consecutiveErrors = 0
        } else {
          continue
        }
      }

      const model = MODEL_EQUIVALENTS[tier][provider]

      try {
        const result = await executor(provider, model)

        // Reset contador de errores en éxito
        health.consecutiveErrors = 0
        return result
      } catch (error) {
        console.error(`Provider ${provider} failed:`, error)

        // Actualizar health
        health.lastError = new Date()
        health.consecutiveErrors++

        // Marcar como no disponible después de 3 errores consecutivos
        if (health.consecutiveErrors >= 3) {
          health.isAvailable = false
          console.warn(`Provider ${provider} marked as unavailable`)
        }

        // Si no es el último fallback, continuar al siguiente
        if (provider !== fallbacks[fallbacks.length - 1]?.provider) {
          continue
        }

        // Si es el último, lanzar error
        throw new Error(`All AI providers failed for task: ${task}`)
      }
    }

    throw new Error('No fallback providers available')
  }

  getProviderHealth() {
    return Object.fromEntries(this.providerHealth)
  }
}

// Uso
const fallbackManager = new AIFallbackManager()

async function generateResponse(prompt: string, complexity: TaskComplexity) {
  return await fallbackManager.executeWithFallback(complexity, async (provider, model) => {
    switch (provider) {
      case AIProvider.OPENAI:
        return await callOpenAI(model, prompt)
      case AIProvider.ANTHROPIC:
        return await callAnthropic(model, prompt)
      case AIProvider.GOOGLE:
        return await callGemini(model, prompt)
    }
  })
}
```

### Detección de Cambio de Proveedor

**Criterios para cambiar:**

1. **Error 429 detectado:** Cambio inmediato
2. **3 errores consecutivos:** Marcar proveedor como no disponible
3. **Latencia >30s:** Considerar cambio (timeout)
4. **Alcanzar 90% de cuota diaria:** Cambio preventivo

```typescript
// packages/ai/src/lib/quota-monitor.ts
interface QuotaUsage {
  provider: AIProvider
  requestsUsed: number
  requestsLimit: number
  tokensUsed: number
  tokensLimit: number
  resetAt: Date
}

export class QuotaMonitor {
  private usage = new Map<AIProvider, QuotaUsage>()

  updateUsage(
    provider: AIProvider,
    requestsDelta: number,
    tokensDelta: number,
    limits: { rpm: number; tpm: number }
  ) {
    const current = this.usage.get(provider) || {
      provider,
      requestsUsed: 0,
      requestsLimit: limits.rpm,
      tokensUsed: 0,
      tokensLimit: limits.tpm,
      resetAt: new Date(Date.now() + 60 * 1000), // +1 minuto
    }

    current.requestsUsed += requestsDelta
    current.tokensUsed += tokensDelta

    this.usage.set(provider, current)

    // Alertas
    const requestsPercent = (current.requestsUsed / current.requestsLimit) * 100
    const tokensPercent = (current.tokensUsed / current.tokensLimit) * 100

    if (requestsPercent > 90 || tokensPercent > 90) {
      console.warn(
        `⚠️ ${provider} quota at ${Math.max(requestsPercent, tokensPercent).toFixed(1)}%`
      )
    }
  }

  shouldSwitchProvider(provider: AIProvider): boolean {
    const usage = this.usage.get(provider)
    if (!usage) return false

    const requestsPercent = (usage.requestsUsed / usage.requestsLimit) * 100
    const tokensPercent = (usage.tokensUsed / usage.tokensLimit) * 100

    return requestsPercent > 90 || tokensPercent > 90
  }

  getUsageReport(): Record<AIProvider, QuotaUsage> {
    return Object.fromEntries(this.usage)
  }
}
```

---

## 📈 MONITOREO DE CUOTA

### Dashboard de Consumo

**Métricas clave a trackear:**

```typescript
// packages/api/src/routers/admin-ai-usage.ts
import { router, protectedProcedure } from '../trpc'
import { db } from '@wallie/db'
import { agentUsage } from '@wallie/db/schema'
import { eq, gte, sql } from 'drizzle-orm'

export const adminAIUsageRouter = router({
  getDashboard: protectedProcedure.query(async ({ ctx }) => {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Consumo por proveedor (últimas 24h)
    const byProvider = await db
      .select({
        provider: agentUsage.agentName, // 'openai', 'anthropic', 'google'
        requests: sql<number>`count(*)`,
        totalCost: sql<number>`sum(${agentUsage.costUsd})`,
        avgLatency: sql<number>`avg(${agentUsage.latencyMs})`,
      })
      .from(agentUsage)
      .where(and(eq(agentUsage.userId, ctx.userId), gte(agentUsage.createdAt, last24h)))
      .groupBy(agentUsage.agentName)

    // Proyección de gasto mensual
    const monthlyProjection = byProvider.reduce((sum, p) => sum + p.totalCost, 0) * 30

    // Alertas
    const alerts = []
    if (monthlyProjection > 100) {
      alerts.push({
        level: 'warning',
        message: `Proyección mensual: $${monthlyProjection.toFixed(2)}. Considerar optimizar uso.`,
      })
    }

    return {
      byProvider,
      monthlyProjection,
      alerts,
      last24h: {
        totalRequests: byProvider.reduce((sum, p) => sum + p.requests, 0),
        totalCost: byProvider.reduce((sum, p) => sum + p.totalCost, 0),
      },
    }
  }),

  // Endpoint para webhook de alerta (llamar cuando se alcance 80% de cuota)
  triggerQuotaAlert: protectedProcedure
    .input(
      z.object({
        provider: z.enum(['openai', 'anthropic', 'google']),
        quotaType: z.enum(['rpm', 'tpm', 'rpd']),
        percentUsed: z.number().min(0).max(100),
      })
    )
    .mutation(async ({ input }) => {
      // Enviar email/notificación
      await sendAdminAlert({
        subject: `⚠️ ${input.provider} ${input.quotaType} at ${input.percentUsed}%`,
        message: `Consider switching to fallback or upgrading tier.`,
      })

      return { success: true }
    }),
})
```

### Integración con PostHog

```typescript
// packages/ai/src/lib/telemetry.ts
import posthog from 'posthog-js'

export function trackAIUsage(
  provider: AIProvider,
  model: string,
  tokensUsed: number,
  cost: number,
  latency: number,
  success: boolean
) {
  posthog.capture('ai_request_completed', {
    provider,
    model,
    tokensUsed,
    costUsd: cost,
    latencyMs: latency,
    success,
    timestamp: new Date().toISOString(),
  })

  // Incrementar contador en PostHog
  posthog.increment('ai_requests_total', 1)
  posthog.increment(`ai_requests_${provider}`, 1)
}
```

---

## 💰 ANÁLISIS DE COSTOS

### Costos de Subir de Tier

| Proveedor  | Tier Actual | Tier Objetivo | Gasto Requerido       | Beneficio Principal  |
| ---------- | ----------- | ------------- | --------------------- | -------------------- |
| **OpenAI** | Free        | Tier 1        | $5                    | 500 RPM, 800K TPM    |
| OpenAI     | Tier 1      | Tier 2        | $50                   | 5,000 RPM, 2M TPM    |
| OpenAI     | Tier 2      | Tier 3        | $1,000                | 5M TPM (2.5x)        |
| OpenAI     | Tier 3      | Tier 4        | $5,000                | 10,000 RPM, 10M TPM  |
| **Gemini** | Free        | Tier 1        | Habilitar billing     | 300 RPM, 1M TPM      |
| Gemini     | Tier 1      | Tier 2        | $250 en GCP + 30 días | 1,000 RPM, 2M TPM    |
| **Claude** | Free        | Build Tier 1  | $5                    | 50 RPM, 40K ITPM     |
| Claude     | Tier 1      | Tier 2        | $100                  | 1,000 RPM (20x)      |
| Claude     | Tier 2      | Tier 3        | $500                  | 2,000 RPM, 160K ITPM |

### ROI: Subir Tier vs Implementar Rate Limiting

**Escenario: Startup con 1,000 usuarios activos**

| Estrategia                     | Costo Inicial      | Costo Mensual | Esfuerzo Dev          | Escalabilidad           |
| ------------------------------ | ------------------ | ------------- | --------------------- | ----------------------- |
| **Solo Free Tier**             | $0                 | $0            | 40h (rate limiting)   | Muy limitada            |
| **OpenAI Tier 2**              | $50                | $50+          | 8h (monitoring)       | Buena (5,000 RPM)       |
| **Multi-proveedor + Fallback** | $155 ($5+$50+$100) | $155+         | 24h (integración)     | Excelente (redundancia) |
| **Scale Tier (OpenAI)**        | Negociar           | $1,000+       | 4h (soporte dedicado) | Ilimitada               |

**Recomendación para Wallie:**

1. **Fase 1 (0-100 usuarios):** Free tier + rate limiting estricto
2. **Fase 2 (100-1,000 usuarios):** OpenAI Tier 2 + Gemini Tier 1 (fallback)
3. **Fase 3 (1,000-10,000 usuarios):** OpenAI Tier 4 + Claude Tier 2 + Gemini Tier 2
4. **Fase 4 (10,000+ usuarios):** Scale Tier customizado

---

## 💻 IMPLEMENTACIÓN EN CÓDIGO

### Wrapper Unificado de IA

```typescript
// packages/ai/src/unified-client.ts
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { retryWithBackoff } from './lib/retry'
import { AIFallbackManager, TaskComplexity } from './lib/fallback'
import { QuotaMonitor } from './lib/quota-monitor'
import { trackAIUsage } from './lib/telemetry'

export interface UnifiedAIRequest {
  prompt: string
  systemPrompt?: string
  model?: string
  maxTokens?: number
  temperature?: number
  complexity?: TaskComplexity
}

export interface UnifiedAIResponse {
  text: string
  provider: AIProvider
  model: string
  tokensUsed: number
  cost: number
  latency: number
}

export class UnifiedAIClient {
  private openai: OpenAI
  private anthropic: Anthropic
  private gemini: GoogleGenerativeAI
  private fallbackManager = new AIFallbackManager()
  private quotaMonitor = new QuotaMonitor()

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  }

  async generate(request: UnifiedAIRequest): Promise<UnifiedAIResponse> {
    const complexity = request.complexity ?? TaskComplexity.MEDIUM
    const startTime = Date.now()

    return await retryWithBackoff(async () => {
      return await this.fallbackManager.executeWithFallback(complexity, async (provider, model) => {
        const actualModel = request.model ?? model

        switch (provider) {
          case AIProvider.OPENAI:
            return await this.callOpenAI(actualModel, request, startTime)
          case AIProvider.ANTHROPIC:
            return await this.callAnthropic(actualModel, request, startTime)
          case AIProvider.GOOGLE:
            return await this.callGemini(actualModel, request, startTime)
        }
      })
    })
  }

  private async callOpenAI(
    model: string,
    request: UnifiedAIRequest,
    startTime: number
  ): Promise<UnifiedAIResponse> {
    const messages = [
      ...(request.systemPrompt ? [{ role: 'system' as const, content: request.systemPrompt }] : []),
      { role: 'user' as const, content: request.prompt },
    ]

    const response = await this.openai.chat.completions.create({
      model,
      messages,
      max_tokens: request.maxTokens,
      temperature: request.temperature,
    })

    const latency = Date.now() - startTime
    const tokensUsed = response.usage?.total_tokens ?? 0
    const cost = this.calculateOpenAICost(model, response.usage!)

    // Update quota monitor
    this.quotaMonitor.updateUsage(
      AIProvider.OPENAI,
      1,
      tokensUsed,
      { rpm: 500, tpm: 800_000 } // Tier 1 limits
    )

    // Track telemetry
    trackAIUsage(AIProvider.OPENAI, model, tokensUsed, cost, latency, true)

    return {
      text: response.choices[0]!.message.content ?? '',
      provider: AIProvider.OPENAI,
      model,
      tokensUsed,
      cost,
      latency,
    }
  }

  private async callAnthropic(
    model: string,
    request: UnifiedAIRequest,
    startTime: number
  ): Promise<UnifiedAIResponse> {
    const response = await this.anthropic.messages.create({
      model,
      system: request.systemPrompt,
      messages: [{ role: 'user', content: request.prompt }],
      max_tokens: request.maxTokens ?? 1024,
      temperature: request.temperature,
    })

    const latency = Date.now() - startTime
    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens
    const cost = this.calculateAnthropicCost(model, response.usage)

    this.quotaMonitor.updateUsage(
      AIProvider.ANTHROPIC,
      1,
      tokensUsed,
      { rpm: 50, tpm: 40_000 } // Build Tier 1
    )

    trackAIUsage(AIProvider.ANTHROPIC, model, tokensUsed, cost, latency, true)

    const text = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as any).text)
      .join('')

    return {
      text,
      provider: AIProvider.ANTHROPIC,
      model,
      tokensUsed,
      cost,
      latency,
    }
  }

  private async callGemini(
    model: string,
    request: UnifiedAIRequest,
    startTime: number
  ): Promise<UnifiedAIResponse> {
    const geminiModel = this.gemini.getGenerativeModel({ model })

    const prompt = request.systemPrompt
      ? `${request.systemPrompt}\n\n${request.prompt}`
      : request.prompt

    const result = await geminiModel.generateContent(prompt)
    const response = result.response

    const latency = Date.now() - startTime
    const tokensUsed = response.usageMetadata?.totalTokenCount ?? 0
    const cost = this.calculateGeminiCost(model, tokensUsed)

    this.quotaMonitor.updateUsage(
      AIProvider.GOOGLE,
      1,
      tokensUsed,
      { rpm: 300, tpm: 1_000_000 } // Tier 1
    )

    trackAIUsage(AIProvider.GOOGLE, model, tokensUsed, cost, latency, true)

    return {
      text: response.text(),
      provider: AIProvider.GOOGLE,
      model,
      tokensUsed,
      cost,
      latency,
    }
  }

  private calculateOpenAICost(model: string, usage: OpenAI.Completions.CompletionUsage): number {
    const prices: Record<string, { input: number; output: number }> = {
      'gpt-4o': { input: 2.5, output: 10 }, // per 1M tokens
      'gpt-4o-mini': { input: 0.15, output: 0.6 },
      o1: { input: 15, output: 60 },
      'o1-mini': { input: 3, output: 12 },
    }

    const price = prices[model] ?? prices['gpt-4o']
    const inputCost = (usage.prompt_tokens / 1_000_000) * price.input
    const outputCost = (usage.completion_tokens / 1_000_000) * price.output

    return inputCost + outputCost
  }

  private calculateAnthropicCost(
    model: string,
    usage: { input_tokens: number; output_tokens: number }
  ): number {
    const prices: Record<string, { input: number; output: number }> = {
      'claude-3-5-sonnet-20241022': { input: 3, output: 15 },
      'claude-3-5-haiku-20241022': { input: 1, output: 5 },
      'claude-3-opus-20240229': { input: 15, output: 75 },
    }

    const price = prices[model] ?? prices['claude-3-5-sonnet-20241022']
    const inputCost = (usage.input_tokens / 1_000_000) * price.input
    const outputCost = (usage.output_tokens / 1_000_000) * price.output

    return inputCost + outputCost
  }

  private calculateGeminiCost(model: string, tokens: number): number {
    const prices: Record<string, number> = {
      'gemini-1.5-flash': 0.075, // per 1M tokens (prompts <128K)
      'gemini-1.5-flash-8b': 0.0375,
      'gemini-1.5-pro': 1.25,
      'gemini-2.0-flash-exp': 0, // Free durante preview
    }

    const pricePerMillion = prices[model] ?? prices['gemini-1.5-flash']
    return (tokens / 1_000_000) * pricePerMillion
  }

  getQuotaReport() {
    return this.quotaMonitor.getUsageReport()
  }

  getProviderHealth() {
    return this.fallbackManager.getProviderHealth()
  }
}
```

### Uso en la Aplicación

```typescript
// packages/api/src/routers/wallie.ts
import { UnifiedAIClient, TaskComplexity } from '@wallie/ai'

const aiClient = new UnifiedAIClient()

export const wallieRouter = router({
  chat: protectedProcedure.input(z.object({ message: z.string() })).mutation(async ({ input }) => {
    const response = await aiClient.generate({
      prompt: input.message,
      systemPrompt: 'Eres Wallie, asistente de ventas...',
      complexity: TaskComplexity.MEDIUM,
      maxTokens: 500,
    })

    return {
      message: response.text,
      metadata: {
        provider: response.provider,
        model: response.model,
        cost: response.cost,
        latency: response.latency,
      },
    }
  }),
})
```

---

## 📚 REFERENCIAS

### Documentación Oficial

- **OpenAI:** [Rate Limits Guide](https://platform.openai.com/docs/guides/rate-limits)
- **Google Gemini:** [Rate Limits Documentation](https://ai.google.dev/gemini-api/docs/rate-limits)
- **Anthropic Claude:** [Rate Limits API](https://docs.anthropic.com/en/api/rate-limits)

### Pricing

- **OpenAI:** [Pricing Page](https://platform.openai.com/docs/pricing)
- **Google Gemini:** [Developer API Pricing](https://ai.google.dev/gemini-api/docs/pricing)
- **Anthropic:** [Claude Pricing](https://www.anthropic.com/pricing)

### Herramientas Útiles

- **Token Calculators:**
  - OpenAI Tokenizer: https://platform.openai.com/tokenizer
  - Claude Token Counter: https://docs.anthropic.com/en/docs/build-with-claude/token-counting

- **Cost Calculators:**
  - Claude Pricing Calculator: https://invertedstone.com/calculators/claude-pricing
  - Gemini Cost Estimator: https://ai.google.dev/gemini-api/docs/pricing

---

## 📝 CHANGELOG

- **v1.0.0** (30 Dic 2024) - Documento inicial con límites actualizados de OpenAI, Gemini y Claude

---

**Mantenido por:** Equipo Técnico Wallie
**Última revisión:** 30 Diciembre 2024
**Próxima revisión:** 31 Enero 2025
