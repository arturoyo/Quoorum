# OpenTelemetry - Estado de Implementación

**Fecha**: 29 Dic 2025
**Fase**: Fase 2 (Integración AI + API + Workers) ✅ **COMPLETADA**

---

## ✅ Completado

### 1. Dependencias Instaladas

**packages/ai** (lightweight):

```json
{
  "@opentelemetry/api": "1.9.0",
  "@opentelemetry/semantic-conventions": "1.38.0"
}
```

**apps/web** (full SDK):

```json
{
  "@opentelemetry/sdk-node": "0.208.0",
  "@opentelemetry/auto-instrumentations-node": "0.67.3",
  "@opentelemetry/exporter-trace-otlp-http": "0.208.0",
  "@opentelemetry/resources": "2.2.0"
}
```

### 2. Archivo de Instrumentación

- **Ubicación**: `apps/web/src/instrumentation.ts`
- **Estado**: ✅ Creado y funcionando
- **Características**:
  - Auto-instrumentación de HTTP, database, fetch
  - Exporta a Jaeger vía OTLP HTTP (puerto 4318)
  - Configuración basada en variables de entorno
  - Deshabilitado por defecto en desarrollo

### 3. Jaeger Backend

- **Estado**: ✅ Corriendo en Docker
- **Puertos**:
  - 16686: UI de Jaeger (http://localhost:16686)
  - 4317: OTLP gRPC
  - 4318: OTLP HTTP (usado por nuestra app)
- **Comando Docker**:
  ```bash
  docker run -d --name jaeger \
    -e COLLECTOR_ZIPKIN_HOST_PORT=:9494 \
    -p 16686:16686 \
    -p 4317:4317 \
    -p 4318:4318 \
    jaegertracing/all-in-one:latest
  ```

### 4. Variables de Entorno

Añadidas a `.env.example`:

```bash
# ----------------------------------
# OpenTelemetry (Observability)
# ----------------------------------
# Activa tracing distribuido para operaciones de AI
ENABLE_TRACING=false

# OTLP exporter endpoint (Jaeger, Datadog, New Relic, etc.)
# Local Jaeger: http://localhost:4318/v1/traces
# Production: configurar según proveedor
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces

# Service name para identificar en trazas
OTEL_SERVICE_NAME=wallie-app
```

### 5. Next.js Config

`next.config.js` actualizado:

```javascript
experimental: {
  optimizePackageImports: ['lucide-react', 'date-fns'],
  // Enable OpenTelemetry instrumentation
  instrumentationHook: true,
},
```

---

## ⚠️ Limitación Conocida (Desarrollo)

Hay un conflicto conocido entre Next.js webpack y OpenTelemetry cuando `ENABLE_TRACING=true` en **desarrollo local**.

### Error:

```
TypeError: Resource is not a constructor
```

### Causa:

Next.js compila el archivo `instrumentation.ts` con webpack, lo cual causa conflictos con módulos de Node.js (stream, grpc, etc.).

### Impacto:

- **Desarrollo local**: Tracing debe estar **deshabilitado** (`ENABLE_TRACING=false`)
- **Producción**: Funciona correctamente sin webpack ✅

### Solución Temporal:

El sistema está configurado para **deshabilitar tracing por defecto en desarrollo**:

```typescript
const isTracingEnabled =
  process.env['ENABLE_TRACING'] === 'true' ||
  (process.env['NODE_ENV'] === 'production' && process.env['ENABLE_TRACING'] !== 'false')
```

Esto significa:

- **Dev**: Tracing OFF por defecto (evita conflictos)
- **Prod**: Tracing ON por defecto (funciona correctamente)

### Solución Futura (Opcional):

Si necesitas tracing en desarrollo:

1. **Opción A**: Usar Vercel/producción para testing
2. **Opción B**: Migrar a Next.js 15+ con mejor soporte OpenTelemetry
3. **Opción C**: Configurar webpack para excluir instrumentation.ts:
   ```javascript
   webpack: (config) => {
     config.externals.push({
       '@opentelemetry/sdk-node': 'commonjs @opentelemetry/sdk-node',
       '@opentelemetry/resources': 'commonjs @opentelemetry/resources',
     })
     return config
   }
   ```

---

## 🧪 Cómo Probar

**Ver guía completa**: [OTEL_VERIFICATION.md](./OTEL_VERIFICATION.md)

### Quick Start - Desarrollo

```bash
# 1. Iniciar app
pnpm dev

# 2. Verificar consola
⏭️  OpenTelemetry: Tracing disabled (ENABLE_TRACING=false)
 ✓ Ready in 2.6s

# 3. Tests
cd packages/ai
pnpm test src/__tests__/otel-integration.test.ts
# ✓ 9 tests passed
```

### Quick Start - Producción

```bash
# 1. Build
pnpm build

# 2. Start con tracing habilitado
NODE_ENV=production ENABLE_TRACING=true pnpm start

# 3. Verificar consola
📡 OpenTelemetry initialized successfully
   Service: wallie-app
   Exporter: http://localhost:4318/v1/traces

# 4. Generar tráfico (hacer requests a la app)

# 5. Ver trazas en Jaeger UI
http://localhost:16686
# → Service: wallie-app
# → Find Traces
# → Ver spans con ai.cost.usd 💰
```

---

## ✅ Fase 2 Completada: Integración AI

**Objetivo**: Adaptar funciones de AI existentes para usar OpenTelemetry

### 1. ✅ `traceAIGeneration` Refactorizada

**Archivo modificado**: `packages/ai/src/observability/ai-instrumentation.ts`

**Cambios implementados**:

- ✅ **Dual-mode**:
  - `ENABLE_TRACING=false` (dev): Usa tracer custom (sin conflictos webpack)
  - `ENABLE_TRACING=true` (prod): Usa OpenTelemetry oficial

- ✅ **Integración OpenTelemetry**:

  ```typescript
  import { trace, SpanStatusCode } from '@opentelemetry/api'
  const otelTracer = trace.getTracer('@wallie/ai')
  ```

- ✅ **Atributos estándar GenAI**:
  - `ai.system: 'wallie-ai'`
  - `ai.model`, `ai.provider`, `ai.operation`
  - `ai.usage.prompt_tokens`, `ai.usage.completion_tokens`, `ai.usage.total_tokens`
  - `ai.cost.usd` (usando función `estimateCost` existente)
  - `ai.latency_ms`
  - `user.id`

- ✅ **Error handling robusto**:
  - `span.recordException(error)`
  - `span.setStatus({ code: SpanStatusCode.ERROR })`

- ✅ **Backwards compatible**:
  - Firma de función idéntica
  - Retorna `T & { _span?: Span }` como antes
  - No rompe código existente

**Usos existentes** (no requieren cambios):

- `packages/ai/src/index.ts` ✅
- Cualquier router que use `traceAIGeneration` ✅

### 2. ✅ Próximos pasos COMPLETADOS

#### Step 1: API Router Instrumentation ✅

**Archivo creado**: `packages/api/src/lib/tracing.ts`

- Utilidades `withSpan()`, `addSpanEvent()`, `setSpanAttributes()`
- Constantes `SPAN_NAMES` para nomenclatura consistente
- Manejo automático de errores con `SpanStatusCode.ERROR`

**Router instrumentado**: `packages/api/src/routers/wallie.ts`

- ✅ `getGlobalAIClient()` - Query AI config con atributos de provider
- ✅ `chat` endpoint - 4 spans principales:
  - db.query.profiles
  - db.query.clientContext (con eventos)
  - rag.search (con métricas: avg_similarity, max_similarity)
  - ai.validate (con confidence scores)
- ✅ `getDailySummary` - 3 DB queries traced:
  - dailyStats (new_clients, total_messages)
  - pendingReminders (count)
  - needsFollowUp (7-day threshold)
- ✅ `suggestMessage` - 2 DB queries traced:
  - client (con stage, notes)
  - recentMessages (con limit)

**Dependencia añadida**: `@opentelemetry/api` en `packages/api`

**Commit**: `08bbbbf` - feat(otel): add comprehensive instrumentation to API routers

#### Step 2: Inngest Worker Trace Propagation ✅

**Archivo creado**: `packages/workers/src/lib/tracing.ts`

- `captureTraceContext()` - Serializar trace context al enviar eventos
- `withRestoredContext()` - Restaurar trace context en workers
- `withSpan()` - Crear child spans en workers
- `WORKER_SPAN_NAMES` - Nomenclatura para workers

**Patrón implementado**: Trace propagation OPCIONAL

- Workers críticos pueden linkear a parent request
- Workers cron/batch pueden trabajar sin propagación
- Documentado cuándo usar cada enfoque

**Dependencia añadida**: `@opentelemetry/api` en `packages/workers`

**Commit**: `27d11b4` - feat(otel): add Inngest worker tracing and advanced documentation

#### Step 3: Documentación Avanzada ✅

**Archivo creado**: `docs/OTEL_ADVANCED_PATTERNS.md` (948 líneas)

- **Conceptos básicos**: Spans, traces, attributes, events
- **Patrones en API Routers**:
  - DB Query con metadata
  - RAG Search con métricas
  - AI Validation con confidence
  - Multi-step operations
- **Patrones en Workers**:
  - Con trace propagation (opcional)
  - Sin trace propagation (simple)
- **Patrones en AI**:
  - traceAIGeneration usage
  - Custom spans pre/post AI
- **Best Practices**:
  - Span naming (DO/DON'T)
  - Relevant attributes
  - When to add events
  - Error handling
- **Troubleshooting**:
  - Spans not appearing
  - Duplicate spans
  - Missing cost attributes
- **Pre-PR Checklist**:
  - 8 puntos a verificar antes de merge

**Commit**: `27d11b4` - (same commit)

#### Resultado: Distributed Tracing Completo

**Ejemplo de traza completa en Jaeger (con propagación):**

```
┌─ HTTP POST /api/trpc/wallie.chat (2100ms)
│  ├─ db.query.profiles (12ms)
│  ├─ db.query.globalAiConfig (8ms)
│  │  └─ ai.provider_order: openai,gemini
│  ├─ db.query.clientContext (15ms)
│  │  └─ Events: client.context_loaded
│  ├─ rag.search (240ms)
│  │  ├─ Events: embedding.generated, rag.results_found
│  │  ├─ rag.results_count: 3
│  │  ├─ rag.avg_similarity: 0.82
│  │  └─ rag.max_similarity: 0.91
│  ├─ ai.chat (1650ms) ← from traceAIGeneration
│  │  ├─ ai.model: gpt-4o-mini
│  │  ├─ ai.usage.total_tokens: 359
│  │  └─ ai.cost.usd: 0.001607 💰
│  ├─ ai.validate (180ms)
│  │  ├─ validation.is_valid: true
│  │  └─ validation.confidence: 0.91
│  └─ [Triggers: conversation-analysis]
│
└─ worker.conversation-analysis (5200ms) ← Linked via trace context!
   ├─ worker.db.query (20ms)
   ├─ ai.summary (800ms)
   │  └─ ai.cost.usd: 0.000412 💰
   └─ worker.rag.save (200ms)
```

**Métricas trackeadas:**

- ✅ Latencia de cada operación
- ✅ Costos de AI por request (`ai.cost.usd`)
- ✅ Tokens consumidos (prompt + completion)
- ✅ Calidad de RAG (avg_similarity, results_count)
- ✅ Confidence de validaciones
- ✅ User ID en todas las operaciones

---

## 📚 Referencias

- [OpenTelemetry Docs](https://opentelemetry.io/docs/languages/js/)
- [Next.js Instrumentation](https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation)
- [Jaeger UI Guide](https://www.jaegertracing.io/docs/latest/frontend-ui/)
- [OTLP HTTP Specification](https://opentelemetry.io/docs/specs/otlp/)

---

## 🔧 Troubleshooting

### Jaeger no muestra trazas

```bash
# Verificar Jaeger está corriendo
docker ps | grep jaeger

# Verificar endpoint
curl http://localhost:4318/v1/traces -v

# Verificar variables de entorno
echo $ENABLE_TRACING
echo $OTEL_EXPORTER_OTLP_ENDPOINT
```

### App no inicia en dev

```bash
# Asegurar que tracing está deshabilitado
grep ENABLE_TRACING apps/web/.env.local
# Debe estar ausente o = false
```

### Build falla

```bash
# Limpiar cache Next.js
rm -rf apps/web/.next

# Reinstalar dependencias
pnpm install --force

# Build again
pnpm build
```
