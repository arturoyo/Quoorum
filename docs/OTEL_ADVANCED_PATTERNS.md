# OpenTelemetry - Patrones de Uso Avanzado

**Fecha**: 29 Dic 2025
**Audiencia**: Desarrolladores implementando nuevas features con tracing

---

## 📚 Índice

1. [Conceptos Básicos](#conceptos-básicos)
2. [Patrones en API Routers](#patrones-en-api-routers)
3. [Patrones en Workers (Inngest)](#patrones-en-workers-inngest)
4. [Patrones en AI](#patrones-en-ai)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Conceptos Básicos

### ¿Qué es un Span?

Un **span** representa una unidad de trabajo con:

- **Nombre**: Describe la operación (e.g., `db.query`, `ai.chat`)
- **Duración**: Cuánto tardó la operación
- **Atributos**: Metadatos key-value (e.g., `user.id`, `ai.cost.usd`)
- **Eventos**: Puntos importantes durante la ejecución (e.g., `cache.hit`)
- **Estado**: OK o ERROR

### ¿Qué es un Trace?

Un **trace** es una colección de spans relacionados que representan una request completa a través de todo el sistema.

**Ejemplo visual en Jaeger:**

```
┌─ HTTP POST /api/trpc/wallie.chat (2100ms) ← TRACE
│  ├─ db.query.profiles (12ms)             ← SPAN
│  ├─ db.query.globalAiConfig (8ms)        ← SPAN
│  ├─ db.query.clientContext (15ms)        ← SPAN
│  ├─ rag.search (240ms)                   ← SPAN
│  │  ├─ Events: embedding.generated       ← EVENT
│  │  └─ rag.results_count: 3              ← ATTRIBUTE
│  ├─ ai.chat (1650ms)                     ← SPAN (from traceAIGeneration)
│  │  ├─ ai.model: gpt-4o-mini             ← ATTRIBUTE
│  │  ├─ ai.usage.total_tokens: 359        ← ATTRIBUTE
│  │  └─ ai.cost.usd: 0.001607             ← ATTRIBUTE 💰
│  └─ ai.validate (180ms)                  ← SPAN
│     ├─ validation.is_valid: true         ← ATTRIBUTE
│     └─ validation.confidence: 0.91       ← ATTRIBUTE
```

---

## Patrones en API Routers

### Patrón 1: DB Query con Metadata

**Cuándo usar**: Todas las queries a base de datos.

```typescript
import { withSpan, SPAN_NAMES } from '../lib/tracing'

const [profile] = await withSpan(`${SPAN_NAMES.DB_QUERY}.profiles`, async (span) => {
  span.setAttribute('user.id', ctx.userId)

  const result = await db.select().from(profiles).where(eq(profiles.id, ctx.userId))

  if (result[0]) {
    span.setAttribute('profile.has_business_name', !!result[0].businessName)
    addSpanEvent('profile.loaded')
  } else {
    addSpanEvent('profile.not_found')
  }

  return result
})
```

**Atributos recomendados:**

- `user.id` (siempre)
- `query.limit` (si aplica)
- Counts de resultados (e.g., `results.count`)
- Metadata relevante (e.g., `client.stage`)

### Patrón 2: RAG Search con Métricas

**Cuándo usar**: Búsquedas de embeddings vectoriales.

```typescript
const ragContext = await withSpan(SPAN_NAMES.RAG_SEARCH, async (span) => {
  span.setAttributes({
    'user.id': ctx.userId,
    'query.length': input.message.length,
    'client.id': clientId ?? 'none',
  })

  // Generate embedding
  const queryEmbedding = await generateEmbedding(input.message)

  addSpanEvent('embedding.generated', {
    'embedding.dimensions': queryEmbedding.length,
  })

  // Vector similarity query
  const results = await db.execute(sql`...`)

  span.setAttribute('rag.results_count', results.length)

  if (results.length > 0) {
    const avgSimilarity = results.reduce((sum, r) => sum + r.similarity, 0) / results.length

    span.setAttributes({
      'rag.avg_similarity': avgSimilarity,
      'rag.max_similarity': Math.max(...results.map((r) => r.similarity)),
    })

    addSpanEvent('rag.results_found', {
      count: results.length,
      avg_similarity: avgSimilarity,
    })

    return buildRAGContext(results)
  }

  addSpanEvent('rag.no_results')
  return ''
})
```

**Atributos recomendados:**

- `rag.results_count`
- `rag.avg_similarity` (calidad de resultados)
- `rag.max_similarity` (mejor match)
- `rag.threshold` (si usas threshold dinámico)

### Patrón 3: AI Validation con Confidence

**Cuándo usar**: Validación de respuestas de AI.

```typescript
const validationResult = await withSpan(SPAN_NAMES.AI_VALIDATE, async (span) => {
  span.setAttributes({
    'user.id': ctx.userId,
    'response.length': response.length,
    'message.length': input.message.length,
  })

  try {
    const validationResponse = await runAgent<HallucinationCheckerResult>('hallucination-checker', {
      response,
      userMessage: input.message,
    })

    if (validationResponse.success && validationResponse.data) {
      span.setAttributes({
        'validation.is_valid': validationResponse.data.isValid,
        'validation.confidence': validationResponse.data.confidenceScore,
        'validation.issues_count': validationResponse.data.issues?.length ?? 0,
      })

      // Corrección automática
      if (
        validationResponse.data.confidenceScore < 0.7 &&
        validationResponse.data.correctedResponse
      ) {
        addSpanEvent('validation.response_corrected', {
          original_length: response.length,
          corrected_length: validationResponse.data.correctedResponse.length,
        })
        response = validationResponse.data.correctedResponse
      }

      return {
        /* ... */
      }
    }

    return null
  } catch (error) {
    addSpanEvent('validation.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return null
  }
})
```

**Atributos recomendados:**

- `validation.is_valid` (boolean)
- `validation.confidence` (0-1)
- `validation.issues_count`

### Patrón 4: Multi-Step Operations

**Cuándo usar**: Operaciones con múltiples sub-pasos lógicos.

```typescript
// Parent span
await withSpan('endpoint.getDailySummary', async () => {
  // Child span 1
  const stats = await withSpan(`${SPAN_NAMES.DB_QUERY}.dailyStats`, async (span) => {
    span.setAttribute('query.date', today.toISOString())
    // ... DB query
    return result
  })

  // Child span 2
  const reminders = await withSpan(`${SPAN_NAMES.DB_QUERY}.pendingReminders`, async (span) => {
    span.setAttribute('user.id', ctx.userId)
    // ... DB query
    return result
  })

  // Child span 3 (AI - already traced by traceAIGeneration)
  const summary = await generateQuickResponse(/* ... */)

  return { stats, reminders, summary }
})
```

**Resultado en Jaeger:**

```
┌─ endpoint.getDailySummary (850ms)
│  ├─ db.query.dailyStats (35ms)
│  ├─ db.query.pendingReminders (20ms)
│  └─ ai.generate (780ms) ← from traceAIGeneration
```

---

## Patrones en Workers (Inngest)

### Patrón 1: Worker con Trace Propagation (Opcional)

**Cuándo usar**: Workers críticos donde quieres ver la traza completa desde el trigger original.

**En el código que dispara el worker:**

```typescript
import { inngest } from '@wallie/workers'
import { captureTraceContext } from '@wallie/workers/lib/tracing'

await inngest.send({
  name: 'conversation/analyzed',
  data: {
    conversationId,
    userId,
    _traceContext: captureTraceContext(), // Opcional
  },
})
```

**En el worker:**

```typescript
import { withRestoredContext, withSpan, WORKER_SPAN_NAMES } from '../lib/tracing'

export const conversationAnalysis = inngest.createFunction(
  { id: 'conversation-analysis' },
  { event: 'conversation/analyzed' },
  async ({ event, step }) => {
    // Restore parent trace context (opcional)
    return withRestoredContext(event.data._traceContext, async () => {
      // Todas las operaciones estarán linkadas al parent request
      const messages = await step.run('get-messages', async () => {
        return withSpan(WORKER_SPAN_NAMES.DB_QUERY, async (span) => {
          span.setAttributes({
            'user.id': event.data.userId,
            'conversation.id': event.data.conversationId,
          })

          const result = await db
            .select()
            .from(messages)
            .where(eq(messages.conversationId, event.data.conversationId))

          span.setAttribute('messages.count', result.length)
          return result
        })
      })

      const summary = await step.run('summarize', async () => {
        // AI calls already traced by traceAIGeneration
        return await runAgent('summary', messagesText, { userId })
      })

      return { summary, messagesCount: messages.length }
    })
  }
)
```

**Resultado en Jaeger (con propagación):**

```
┌─ HTTP POST /api/trpc/conversation.markRead (120ms)
│  ├─ db.query.updateConversation (15ms)
│  └─ [Trigger: conversation-analysis]
│
└─ worker.conversation-analysis (5200ms) ← Linked via trace context!
   ├─ worker.db.query (20ms)
   ├─ ai.summary (800ms)
   └─ worker.rag.save (200ms)
```

**Sin propagación**, el worker aparecería como un trace separado.

### Patrón 2: Worker Simple sin Propagación

**Cuándo usar**: Workers de baja prioridad o cron jobs.

```typescript
export const dailySummary = inngest.createFunction(
  { id: 'daily-summary', cron: '0 8 * * *' },
  { event: 'cron/daily-summary' },
  async ({ step }) => {
    // No hay parent request, así que no hay context que propagar

    const users = await step.run('get-active-users', async () => {
      // Local span (no parent)
      return withSpan('worker.db.query', async (span) => {
        span.setAttribute('query', 'active_users')
        return await db.select().from(users).where(eq(users.isActive, true))
      })
    })

    // Process users...
    return { processed: users.length }
  }
)
```

---

## Patrones en AI

### Patrón 1: traceAIGeneration (Ya Implementado)

**Cuándo usar**: SIEMPRE que llames a una AI.

La función `traceAIGeneration` en `packages/ai/src/observability/ai-instrumentation.ts` ya crea spans automáticamente con:

- `ai.model`, `ai.provider`, `ai.operation`
- `ai.usage.prompt_tokens`, `ai.usage.completion_tokens`, `ai.usage.total_tokens`
- `ai.cost.usd` 💰
- `ai.latency_ms`

**NO necesitas wrappear con `withSpan` las llamadas AI**, ya están trackeadas internamente.

**Ejemplo (ya lo haces):**

```typescript
import { traceAIGeneration } from '@wallie/ai/observability'

const result = await traceAIGeneration(
  'chat',
  async () => {
    return await aiClient.generate(prompt, { tier: 'flash' })
  },
  {
    model: 'gpt-4o-mini',
    provider: 'openai',
    userId: ctx.userId,
  }
)
```

### Patrón 2: Custom Spans para Lógica Pre/Post AI

**Cuándo usar**: Lógica antes o después del AI call.

```typescript
// Preparar prompt (custom span)
const constructedPrompt = await withSpan('ai.prompt_construction', async (span) => {
  span.setAttributes({
    'prompt.has_rag': !!ragContext,
    'prompt.has_client': !!clientInfo,
    'prompt.style': stylePrompt ? 'learned' : 'default',
  })

  return buildPromptFromParts({ system, rag: ragContext, client: clientInfo })
})

// AI call (auto-traced)
const response = await traceAIGeneration(
  'chat',
  async () => {
    return await aiClient.generate(constructedPrompt)
  },
  { model: 'gpt-4o-mini' }
)

// Post-processing (custom span)
const sanitized = await withSpan('ai.response_sanitization', async (span) => {
  const cleaned = sanitizeAIResponse(response)
  span.setAttribute('sanitization.changes_made', cleaned !== response)
  return cleaned
})
```

---

## Best Practices

### ✅ DO

1. **Span naming consistente**

   ```typescript
   ✅ 'db.query.profiles'
   ✅ 'rag.search'
   ✅ 'ai.validate'

   ❌ 'getProfiles'
   ❌ 'search_rag'
   ❌ 'validateAI'
   ```

2. **Atributos relevantes**

   ```typescript
   ✅ span.setAttributes({
     'user.id': userId,           // Identifica al usuario
     'query.limit': 10,            // Params de configuración
     'results.count': items.length // Métricas de resultado
   })

   ❌ span.setAttribute('timestamp', Date.now()) // Ya tracked por OTel
   ❌ span.setAttribute('func', 'getData')       // No útil
   ```

3. **Eventos para milestones**

   ```typescript
   addSpanEvent('cache.hit')
   addSpanEvent('validation.failed', { reason: 'low_confidence' })
   addSpanEvent('rag.no_results')
   ```

4. **Usar `withSpan` para error handling automático**

   ```typescript
   ✅ await withSpan('operation', async (span) => {
     // Si hay error, el span lo captura automáticamente
     return await riskyOperation()
   })

   ❌ const span = tracer.startSpan('operation')
   try {
     // Manual, propenso a errores
   } finally {
     span.end()
   }
   ```

### ❌ DON'T

1. **No crear spans para operaciones triviales**

   ```typescript
   ❌ await withSpan('format.currency', async () => {
     return formatCurrency(amount)
   })

   ✅ // Just call it directly
   const formatted = formatCurrency(amount)
   ```

2. **No añadir PII a atributos**

   ```typescript
   ❌ span.setAttribute('user.email', email)
   ❌ span.setAttribute('client.phone', phone)

   ✅ span.setAttribute('user.id', userId) // ID, no PII
   ```

3. **No sobre-instrumentar**

   ```typescript
   ❌ // Too granular - creates 100 spans
   for (const item of items) {
     await withSpan('process.item', async () => {
       processItem(item)
     })
   }

   ✅ // One span for the batch
   await withSpan('process.items', async (span) => {
     span.setAttribute('items.count', items.length)
     await Promise.all(items.map(processItem))
   })
   ```

4. **No wrappear AI calls (ya están traced)**

   ```typescript
   ❌ await withSpan('ai.call', async () => {
     return traceAIGeneration(...)
   })

   ✅ await traceAIGeneration(...) // Ya crea su propio span
   ```

---

## Nombres de Spans Estándar

### API Layer (`packages/api/src/lib/tracing.ts`)

```typescript
export const SPAN_NAMES = {
  // Database operations
  DB_QUERY: 'db.query',
  DB_INSERT: 'db.insert',
  DB_UPDATE: 'db.update',
  DB_DELETE: 'db.delete',

  // RAG operations
  RAG_EMBEDDING: 'rag.embedding',
  RAG_SEARCH: 'rag.search',
  RAG_BUILD_CONTEXT: 'rag.buildContext',

  // AI operations
  AI_VALIDATE: 'ai.validate',
  AI_ROUTE: 'ai.route',

  // Business logic
  BIZ_RATE_LIMIT: 'biz.rateLimit',
  BIZ_AUTH_CHECK: 'biz.authCheck',
  BIZ_TOOL_EXECUTION: 'biz.toolExecution',

  // External calls
  EXT_WEBHOOK: 'ext.webhook',
  EXT_API_CALL: 'ext.apiCall',
} as const
```

### Workers Layer (`packages/workers/src/lib/tracing.ts`)

```typescript
export const WORKER_SPAN_NAMES = {
  // Worker lifecycle
  WORKER_START: 'worker.start',
  WORKER_COMPLETE: 'worker.complete',

  // Database operations
  DB_QUERY: 'worker.db.query',
  DB_INSERT: 'worker.db.insert',
  DB_UPDATE: 'worker.db.update',

  // AI operations
  AI_GENERATE: 'worker.ai.generate',
  AI_EMBED: 'worker.ai.embed',
  AI_ANALYZE: 'worker.ai.analyze',

  // RAG operations
  RAG_SAVE: 'worker.rag.save',
  RAG_SEARCH: 'worker.rag.search',

  // Business logic
  BIZ_PROCESS: 'worker.process',
  BIZ_VALIDATE: 'worker.validate',
} as const
```

---

## Troubleshooting

### Problema: Spans no aparecen en Jaeger

**1. Verificar que tracing está habilitado:**

```bash
# En producción, debe estar true
echo $ENABLE_TRACING
# → "true"

# En desarrollo, debe estar false (webpack conflict)
# → "false" o undefined
```

**2. Verificar Jaeger está corriendo:**

```bash
docker ps | grep jaeger
curl http://localhost:16686
```

**3. Verificar logs de inicialización:**

```bash
# Debe aparecer en logs del servidor:
📡 OpenTelemetry initialized successfully
   Service: wallie-app
   Exporter: http://localhost:4318/v1/traces
```

### Problema: Spans duplicados o huérfanos

**Causa**: Llamar `withSpan` dentro de una función ya traced.

```typescript
❌ INCORRECTO:
const result = await withSpan('ai.call', async () => {
  // traceAIGeneration ya crea un span
  return traceAIGeneration('chat', ...)
})
// Resultado: 2 spans (duplicado)

✅ CORRECTO:
const result = await traceAIGeneration('chat', ...)
// Resultado: 1 span
```

### Problema: Costos no aparecen en spans

**Causa**: La respuesta AI no incluye `usage` o el formato no es reconocido.

**Solución**: Verificar que `traceAIGeneration` recibe usage en uno de estos formatos:

```typescript
// OpenAI format
{ usage: { prompt_tokens: X, completion_tokens: Y } }

// Anthropic format
{ response: { usage: { promptTokens: X, completionTokens: Y } } }

// Google AI format
{ tokenUsage: { promptTokenCount: X, completionTokenCount: Y } }
```

Si tu provider usa otro formato, actualiza `traceAIGeneration` en `packages/ai/src/observability/ai-instrumentation.ts`.

### Problema: Workers no linkean al parent request

**Causa**: No se propagó el trace context en el evento.

**Solución**: Usar `captureTraceContext()` al enviar y `withRestoredContext()` en el worker (ver [Patrón 1](#patrón-1-worker-con-trace-propagation-opcional)).

**Nota**: Esto es opcional. La mayoría de workers funcionan bien sin trace propagation.

---

## Recursos

- [Jaeger UI](http://localhost:16686) (dev)
- [OTEL_STATUS.md](./OTEL_STATUS.md) - Estado de implementación
- [OTEL_VERIFICATION.md](./OTEL_VERIFICATION.md) - Cómo verificar que funciona
- [OpenTelemetry Docs](https://opentelemetry.io/docs/languages/js/)
- [GenAI Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/)

---

## Checklist para Nueva Feature con Tracing

Antes de marcar tu PR como ready:

- [ ] **DB queries** wrapped en `withSpan(SPAN_NAMES.DB_QUERY.*)`
- [ ] **AI calls** usan `traceAIGeneration` (NO wrappear en withSpan)
- [ ] **Spans tienen atributos relevantes** (`user.id`, counts, metadata)
- [ ] **Eventos añadidos** para milestones importantes
- [ ] **Nombres consistentes** (ver SPAN_NAMES)
- [ ] **Sin PII** en atributos
- [ ] **Testeado en Jaeger** (local o staging)
- [ ] **Workers críticos** usan trace propagation (si aplica)
