# 🚀 IMPLEMENTATION ROADMAP - Tecnologías Recomendadas

> **Versión:** 1.0.0 | **Fecha:** 27 Dic 2025
> **Basado en:** Análisis de 30+ tecnologías con scoring ROI
> **Objetivo:** Implementar mejoras con máximo ROI y mínimo riesgo

---

## 📊 Resumen Ejecutivo

| Métrica               | Valor                             |
| --------------------- | --------------------------------- |
| **Inversión Total**   | ~$100/mes (infraestructura)       |
| **Ahorro Proyectado** | ~$800/mes (AI + operaciones)      |
| **ROI Neto**          | +$700/mes = +$8,400/año           |
| **Tiempo Total**      | 3-4 meses                         |
| **Riesgo**            | Bajo (implementación incremental) |

---

## 🎯 FASE 0: Quick Wins (Semana 1-2)

### Objetivo: ROI inmediato con cambios mínimos

### 1. Redis Caching (Score: 35/40)

**Por qué primero:** Ahorro inmediato de $500/mes en llamadas AI

```typescript
// packages/ai/src/cache/redis-cache.ts
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

interface CacheOptions {
  ttl?: number // seconds
  prefix?: string
}

export async function getCachedAIResponse<T>(
  key: string,
  fallback: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = 3600, prefix = 'ai:' } = options
  const cacheKey = `${prefix}${key}`

  // Try cache first
  const cached = await redis.get<T>(cacheKey)
  if (cached) {
    return cached
  }

  // Generate and cache
  const result = await fallback()
  await redis.set(cacheKey, result, { ex: ttl })

  return result
}

// Ejemplo de uso en wallie.ts router
export const wallieRouter = router({
  suggestMessage: protectedProcedure
    .input(suggestMessageSchema)
    .mutation(async ({ ctx, input }) => {
      const cacheKey = `suggest:${input.conversationId}:${input.context.slice(0, 50)}`

      return getCachedAIResponse(
        cacheKey,
        () => generateSuggestion(input),
        { ttl: 1800 } // 30 min cache
      )
    }),
})
```

**Implementación:**

```bash
# 1. Añadir dependencia
pnpm add @upstash/redis -F @wallie/ai

# 2. Configurar env
# UPSTASH_REDIS_URL=...
# UPSTASH_REDIS_TOKEN=...

# 3. Crear cache wrapper
# packages/ai/src/cache/redis-cache.ts

# 4. Integrar en routers AI críticos
# - wallie.ts: suggestMessage, analyzeMessage
# - psychology.ts: analyzeEmotions
# - conclusions.ts: generateConclusions
```

**Métricas de éxito:**

- [ ] Cache hit rate > 40%
- [ ] Reducción de llamadas AI > 50%
- [ ] Latencia p95 < 500ms (vs 2-3s actual)

---

### 2. SSE Streaming (Score: 34/40)

**Por qué:** UX premium sin refactor de WebSockets

```typescript
// apps/web/src/app/api/ai/stream/route.ts
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

export async function POST(req: Request) {
  const { messages, conversationId } = await req.json()

  const result = await streamText({
    model: openai('gpt-4o-mini'),
    messages,
    onFinish: async ({ text }) => {
      // Guardar en DB cuando termine
      await saveMessage(conversationId, text)
    },
  })

  return result.toTextStreamResponse()
}

// Frontend hook
// apps/web/src/hooks/use-ai-stream.ts
import { useChat } from 'ai/react'

export function useAIStream(conversationId: string) {
  return useChat({
    api: '/api/ai/stream',
    body: { conversationId },
    onFinish: (message) => {
      // Invalidar cache de conversación
      utils.conversations.getById.invalidate({ id: conversationId })
    },
  })
}
```

**Implementación:**

```bash
# 1. Instalar Vercel AI SDK
pnpm add ai @ai-sdk/openai -F web

# 2. Crear route handler
# apps/web/src/app/api/ai/stream/route.ts

# 3. Crear hook de streaming
# apps/web/src/hooks/use-ai-stream.ts

# 4. Integrar en chat UI
# apps/web/src/components/chat/message-input.tsx
```

---

### 3. TanStack Query Persister (Score: 29/40)

**Por qué:** Offline resilience + mejor UX en conexiones lentas

```typescript
// apps/web/src/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { persistQueryClient } from '@tanstack/react-query-persist-client'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
})

// Solo en cliente
if (typeof window !== 'undefined') {
  const persister = createSyncStoragePersister({
    storage: window.localStorage,
    key: 'wallie-cache',
  })

  persistQueryClient({
    queryClient,
    persister,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    buster: process.env.NEXT_PUBLIC_BUILD_ID, // Invalidar en deploy
  })
}
```

**Implementación:**

```bash
# 1. Instalar persister
pnpm add @tanstack/react-query-persist-client @tanstack/query-sync-storage-persister -F web

# 2. Configurar en query-client.ts

# 3. Verificar hydration correcta en _app.tsx o providers
```

---

## 🔧 FASE 1: Core Upgrades (Mes 1)

### 4. LiteLLM Proxy (Score: 33/40)

**Por qué:** Centralizar 4 providers AI, fallback automático, rate limiting global

```yaml
# docker-compose.litellm.yml
version: '3.8'
services:
  litellm:
    image: ghcr.io/berriai/litellm:main-latest
    ports:
      - '4000:4000'
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
      - GROQ_API_KEY=${GROQ_API_KEY}
    volumes:
      - ./litellm-config.yaml:/app/config.yaml
    command: ['--config', '/app/config.yaml']
```

```yaml
# litellm-config.yaml
model_list:
  - model_name: fast
    litellm_params:
      model: gemini/gemini-1.5-flash
      api_key: os.environ/GOOGLE_API_KEY
    model_info:
      max_tokens: 8192

  - model_name: fast
    litellm_params:
      model: groq/llama-3.1-8b-instant
      api_key: os.environ/GROQ_API_KEY
    model_info:
      max_tokens: 8192

  - model_name: smart
    litellm_params:
      model: gpt-4o
      api_key: os.environ/OPENAI_API_KEY

  - model_name: smart
    litellm_params:
      model: claude-3-5-sonnet-20241022
      api_key: os.environ/ANTHROPIC_API_KEY

router_settings:
  routing_strategy: least-busy
  num_retries: 3
  fallbacks:
    - fast: [groq/llama-3.1-8b-instant, gpt-4o-mini]
    - smart: [claude-3-5-sonnet, gpt-4o]
```

```typescript
// packages/ai/src/providers/litellm-client.ts
import OpenAI from 'openai'

export const litellm = new OpenAI({
  baseURL: process.env.LITELLM_URL || 'http://localhost:4000',
  apiKey: process.env.LITELLM_MASTER_KEY,
})

// Uso simplificado
export async function generateWithFallback(
  prompt: string,
  options: { model?: 'fast' | 'smart' } = {}
) {
  const { model = 'fast' } = options

  const response = await litellm.chat.completions.create({
    model, // LiteLLM routea automáticamente
    messages: [{ role: 'user', content: prompt }],
  })

  return response.choices[0]?.message?.content
}
```

**Beneficios:**

- Un solo endpoint para 4 providers
- Fallback automático si uno falla
- Rate limiting centralizado
- Métricas unificadas
- A/B testing de modelos

---

### 5. WebSockets con Soketi (Score: 33/40)

**Por qué:** Real-time bidireccional para chat, notificaciones, sync

```typescript
// packages/realtime/src/pusher-server.ts
import Pusher from 'pusher'

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: 'eu', // o self-hosted con Soketi
  useTLS: true,
})

// Broadcast events
export async function broadcastNewMessage(userId: string, message: Message) {
  await pusher.trigger(`private-user-${userId}`, 'message:new', message)
}

// packages/realtime/src/pusher-client.ts
import PusherClient from 'pusher-js'

export const pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
  cluster: 'eu',
  authEndpoint: '/api/pusher/auth',
})

// Hook para suscribirse
export function useRealtimeMessages(userId: string) {
  useEffect(() => {
    const channel = pusherClient.subscribe(`private-user-${userId}`)

    channel.bind('message:new', (message: Message) => {
      // Actualizar UI inmediatamente
      queryClient.setQueryData(['messages', message.conversationId], (old) => [...old, message])
    })

    return () => {
      channel.unbind_all()
      pusherClient.unsubscribe(`private-user-${userId}`)
    }
  }, [userId])
}
```

---

### 6. ⚠️ React 19 - APLAZADO

> **NOTA IMPORTANTE (27 Dic 2025):** React 19 ha sido removido del roadmap inmediato debido a problemas de compatibilidad existentes.

**Problema detectado:**

```
Estado actual (INCORRECTO):
├── react: 18.3.1          ← Runtime React 18
├── react-dom: 18.3.1
└── @types/react: ^19.2.7  ← Types React 19 (MISMATCH!)
```

**Consecuencias del mismatch:**

- Errores de TypeScript en `forwardRef` vs `ref` como prop
- Tipos de hooks inexistentes (`useActionState`, `useOptimistic`)
- Commits de fix necesarios: `e503294`, `a51613d`

**Acción inmediata recomendada - Arreglar tipos:**

```bash
# OPCIÓN A: Downgrade types a React 18 (recomendado)
pnpm add -D @types/react@18.3.18 @types/react-dom@18.3.5 -F web

# OPCIÓN B: Upgrade completo a React 19 (riesgoso)
# Solo si Next.js 15 está estable y todas las dependencias son compatibles
pnpm add react@19 react-dom@19 next@15 -F web
```

**Cuándo considerar React 19:**

1. [ ] Next.js 15 sea estable (no canary)
2. [ ] Radix UI y shadcn/ui tengan soporte oficial
3. [ ] Framer Motion tenga soporte oficial
4. [ ] Haya tiempo para testing exhaustivo (mínimo 1 semana)

**Por ahora:** Mantener React 18.3.1 y **arreglar los tipos** a 18.x

---

## 🚀 FASE 2: Diferenciadores (Mes 2-3)

### 7. MCP Integration (Score: 30/40)

**Por qué:** Transforma Wallie de "multi-agente manual" a "Agentic RAG autónomo"

```typescript
// packages/ai/src/mcp/server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

const server = new Server(
  {
    name: 'wallie-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
)

// Exponer herramientas de Wallie como MCP tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'search_clients',
      description: 'Buscar clientes por nombre, email o teléfono',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          limit: { type: 'number', default: 10 },
        },
      },
    },
    {
      name: 'get_conversation_history',
      description: 'Obtener historial de conversación con un cliente',
      inputSchema: {
        type: 'object',
        properties: {
          clientId: { type: 'string' },
          limit: { type: 'number', default: 50 },
        },
      },
    },
    {
      name: 'analyze_sentiment',
      description: 'Analizar sentimiento de un mensaje',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string' },
        },
      },
    },
    // ... más herramientas
  ],
}))

// Handler para ejecutar herramientas
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  switch (name) {
    case 'search_clients':
      return { content: [{ type: 'text', text: JSON.stringify(await searchClients(args)) }] }
    case 'get_conversation_history':
      return {
        content: [{ type: 'text', text: JSON.stringify(await getConversationHistory(args)) }],
      }
    // ... más handlers
  }
})
```

**Impacto en RAG:**

- Actual: 9/25 tipos RAG (36%)
- Con MCP: 18/25 tipos RAG (72%)
- Nuevos tipos habilitados:
  - Agentic RAG (agentes autónomos)
  - Multi-Hop RAG (razonamiento multi-paso)
  - Self-RAG (auto-corrección)
  - Tool-Augmented RAG

---

### 8. Fine-tuning Pipeline (Score: 31/40)

**Por qué:** Modelos personalizados = ventaja competitiva imposible de copiar

```typescript
// packages/ai/src/fine-tuning/data-collector.ts
interface TrainingExample {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  metadata: {
    userId: string
    industry: string
    outcome: 'success' | 'failure'
    score: number
  }
}

export async function collectTrainingData(
  userId: string,
  options: { minScore?: number; limit?: number } = {}
): Promise<TrainingExample[]> {
  const { minScore = 0.8, limit = 1000 } = options

  // Obtener conversaciones exitosas
  const conversations = await db
    .select()
    .from(conversationsTable)
    .where(
      and(eq(conversationsTable.userId, userId), gte(conversationsTable.successScore, minScore))
    )
    .limit(limit)

  // Formatear para fine-tuning
  return conversations.map((conv) => ({
    messages: formatAsTrainingMessages(conv),
    metadata: {
      userId,
      industry: conv.clientIndustry,
      outcome: conv.outcome,
      score: conv.successScore,
    },
  }))
}

// Subir a OpenAI para fine-tuning
export async function startFineTuning(
  trainingData: TrainingExample[],
  options: { baseModel?: string } = {}
) {
  const { baseModel = 'gpt-4o-mini-2024-07-18' } = options

  // 1. Crear archivo JSONL
  const jsonlContent = trainingData
    .map((ex) => JSON.stringify({ messages: ex.messages }))
    .join('\n')

  // 2. Subir archivo
  const file = await openai.files.create({
    file: new Blob([jsonlContent], { type: 'application/jsonl' }),
    purpose: 'fine-tune',
  })

  // 3. Crear job de fine-tuning
  const job = await openai.fineTuning.jobs.create({
    training_file: file.id,
    model: baseModel,
    suffix: `wallie-${Date.now()}`,
  })

  return job
}
```

---

### 9. Temporal Workflows (Score: 30/40)

**Por qué:** Orchestration enterprise-grade para workflows complejos

```typescript
// packages/workflows/src/onboarding.ts
import { proxyActivities, defineWorkflow } from '@temporalio/workflow'

const activities = proxyActivities<typeof import('./activities')>({
  startToCloseTimeout: '1 minute',
})

export const onboardingWorkflow = defineWorkflow(async (userId: string): Promise<void> => {
  // Step 1: Crear perfil básico
  await activities.createUserProfile(userId)

  // Step 2: Analizar conexiones (en paralelo)
  const [whatsappConnected, emailConnected] = await Promise.all([
    activities.connectWhatsApp(userId),
    activities.connectEmail(userId),
  ])

  // Step 3: Esperar datos suficientes
  await activities.waitForMinimumData(userId, { minMessages: 10 })

  // Step 4: Entrenar modelo personalizado
  await activities.trainPersonalizedModel(userId)

  // Step 5: Activar agentes
  await activities.activateAgents(userId, {
    whatsapp: whatsappConnected,
    email: emailConnected,
  })

  // Step 6: Notificar completado
  await activities.notifyOnboardingComplete(userId)
})
```

---

## 📱 FASE 3: Mobile + Scale (Mes 3-4)

### 10. React Native (Score: 30/40)

**Por qué:** Mercado móvil es 70%+ de usuarios potenciales

```
wallie-mobile/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx        # Dashboard
│   │   ├── inbox.tsx        # Unified Inbox
│   │   ├── clients.tsx      # Clients list
│   │   └── settings.tsx     # Settings
│   ├── chat/[id].tsx        # Chat detail
│   └── _layout.tsx
├── components/
├── hooks/
│   └── use-trpc.ts          # Reusar API existente
└── package.json
```

**Estrategia:**

- Expo + Expo Router
- Reusar 100% de la API tRPC
- UI components adaptados (React Native Paper o Tamagui)
- Push notifications con Expo

---

## 📋 Checklist de Implementación

### Fase 0 (Semana 1-2) ✅ COMPLETADO (27 Dic 2025)

- [x] Redis Caching
  - [x] Configurar Upstash Redis
  - [x] Crear cache wrapper (`packages/ai/src/cache/ai-cache.ts`)
  - [x] Integrar en wallie.ts (analyzeMessage con rate limiting)
  - [x] Tests unitarios (`packages/ai/src/__tests__/ai-cache.test.ts`)
  - [x] Métricas de cache hit rate (`getCacheStats()` con hits/misses/hitRate)
  - ℹ️ psychology.ts usa rule-based analysis (no AI calls, no necesita cache)
- [x] SSE Streaming
  - [x] Instalar Vercel AI SDK v4 (nota: v6 tenía API incompatible)
  - [x] Crear route handler (`apps/web/src/app/api/ai/stream/route.ts`)
  - [x] Crear hook useAIStream (`apps/web/src/hooks/use-ai-stream.ts`)
  - [x] Tests unitarios (`apps/web/src/hooks/__tests__/use-ai-stream.test.ts`)
  - [x] Integrar en chat UI (`ai-suggestions-panel.tsx` con streaming)
- [x] TanStack Persister
  - [x] Instalar dependencias (@tanstack/react-query-persist-client)
  - [x] Configurar persister (`apps/web/src/lib/trpc/provider.tsx`)
  - [x] Tests unitarios (`apps/web/src/lib/trpc/__tests__/provider.test.tsx`)
  - ℹ️ Testing offline: Funcionalidad lista, verificar manualmente en navegador

### Fase 1 (Mes 1)

- [x] LiteLLM ✅ (27 Dic 2025)
  - [x] Docker compose setup (`docker-compose.litellm.yml`)
  - [x] Config de modelos (`litellm-config.yaml` - flash, standard, pro, reasoning)
  - [x] Provider implementado (`packages/ai/src/providers/litellm.ts`)
  - [x] Integrado en unified-client.ts
  - [x] Tests unitarios (27 tests passing)
- [x] WebSockets ✅ (27 Dic 2025)
  - [x] Package @wallie/realtime creado
  - [x] Pusher server (`pusher-server.ts`) con soporte Soketi
  - [x] Pusher client (`pusher-client.ts`) con hooks React
  - [x] Hooks: `useRealtimeMessages`, `useRealtimeNotifications`
  - [x] Tests unitarios (21 tests passing)
  - [x] Integrar en chat UI (`inbox/chat/[id]/page.tsx` + `sidebar.tsx`)
  - [x] Endpoint `/api/pusher/auth` para canales privados
- [x] ⚠️ Fix React Types ✅ (Ya corregido)
  - [x] @types/react ya en 18.3.18 (match con runtime 18.3.1)
  - [x] @types/react-dom ya en 18.3.5
  - [x] Typecheck pasa (12/12 paquetes)

### Fase 2 (Mes 2-3)

- [ ] MCP
  - [ ] Crear MCP server
  - [ ] Exponer herramientas Wallie
  - [ ] Integrar con Claude Desktop
  - [ ] Testing de Agentic RAG
- [ ] Fine-tuning
  - [ ] Data collector
  - [ ] Pipeline de entrenamiento
  - [ ] A/B testing modelos
  - [ ] Dashboard de métricas
- [ ] Temporal
  - [ ] Setup Temporal Cloud
  - [ ] Migrar onboarding workflow
  - [ ] Migrar sequence runner
  - [ ] UI de monitoreo

### Fase 3 (Mes 3-4)

- [ ] React Native
  - [ ] Setup Expo
  - [ ] Screens básicas
  - [ ] Integración tRPC
  - [ ] Push notifications
  - [ ] Beta testing

---

## 📊 Métricas de Éxito

| Fase | Métrica              | Target   | Cómo Medir       |
| ---- | -------------------- | -------- | ---------------- |
| 0    | Cache Hit Rate       | > 40%    | Redis dashboard  |
| 0    | Latencia AI p95      | < 500ms  | Sentry           |
| 0    | Ahorro AI mensual    | $500/mes | Facturación      |
| 1    | Uptime AI            | > 99.9%  | LiteLLM metrics  |
| 1    | Tiempo real latencia | < 100ms  | Pusher dashboard |
| 2    | RAG types            | 18/25    | Audit manual     |
| 2    | Model accuracy       | +15%     | A/B testing      |
| 3    | Mobile DAU           | 1000+    | Analytics        |

---

## ⚠️ Riesgos y Mitigaciones

| Riesgo                    | Probabilidad | Impacto | Mitigación                        |
| ------------------------- | ------------ | ------- | --------------------------------- |
| React 19 breaking changes | Media        | Alto    | Testing exhaustivo, rollback plan |
| LiteLLM latencia          | Baja         | Medio   | Self-host si necesario            |
| Fine-tuning overfitting   | Media        | Medio   | Validación cruzada, eval set      |
| Mobile scope creep        | Alta         | Medio   | MVP estricto, iteraciones         |

---

## 💰 ROI Proyectado

```
INVERSIÓN MENSUAL:
├── Upstash Redis Pro:     $25/mes
├── LiteLLM Cloud:         $0 (self-host)
├── Temporal Cloud:        $25/mes
├── Pusher/Soketi:         $50/mes
└── TOTAL:                 ~$100/mes

AHORRO MENSUAL:
├── AI Caching:            $500/mes (50% menos llamadas)
├── Fallback automático:   $100/mes (menos errores)
├── Eficiencia operativa:  $200/mes (menos debugging)
└── TOTAL:                 ~$800/mes

ROI NETO: +$700/mes = +$8,400/año
```

---

_Documento creado: 27 Dic 2025_
_Próxima revisión: Después de completar Fase 0_
