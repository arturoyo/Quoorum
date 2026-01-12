# OpenTelemetry - Guía de Verificación

**Última actualización**: 29 Dic 2025

Esta guía te muestra cómo verificar que OpenTelemetry está funcionando correctamente en tu aplicación.

---

## 🧪 Verificación en Desarrollo (Modo Custom Tracer)

En desarrollo, OpenTelemetry está **deshabilitado por defecto** para evitar conflictos con webpack. Se usa el tracer custom.

### 1. Verificar que el servidor inicia correctamente

```bash
pnpm dev

# Deberías ver:
⏭️  OpenTelemetry: Tracing disabled (ENABLE_TRACING=false)
 ✓ Ready in 2.6s
```

### 2. Verificar que traceAIGeneration funciona

El tracer custom sigue funcionando normalmente:

```typescript
import { traceAIGeneration } from '@wallie/ai/observability'

// Esto funciona en dev sin OpenTelemetry
const result = await traceAIGeneration('chat', async () => {
  return await generateChatResponse(prompt)
}, {
  model: 'gpt-4o-mini',
  provider: 'openai',
  userId: ctx.userId
})

// result._span contiene el span del tracer custom
console.log('Span ID:', result._span?.context.spanId)
```

### 3. Ejecutar tests

```bash
cd packages/ai
pnpm test src/__tests__/otel-integration.test.ts

# Deberías ver:
✓ src/__tests__/otel-integration.test.ts (9 tests) 6ms
  Test Files  1 passed (1)
  Tests  9 passed (9)
```

---

## 🚀 Verificación en Producción (OpenTelemetry Real)

En producción, OpenTelemetry se habilita automáticamente y envía trazas a Jaeger.

### Prerequisitos

1. **Jaeger corriendo**:
   ```bash
   docker ps | grep jaeger
   # Debe aparecer el contenedor jaeger
   ```

2. **Variables de entorno** configuradas (en `.env` o Vercel):
   ```bash
   ENABLE_TRACING=true
   OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
   OTEL_SERVICE_NAME=wallie-app
   ```

### Opción A: Build Local

```bash
# 1. Build la aplicación
pnpm build

# 2. Iniciar en modo producción
NODE_ENV=production ENABLE_TRACING=true pnpm start

# 3. Verificar logs de inicio
📡 OpenTelemetry initialized successfully
   Service: wallie-app
   Environment: production
   Exporter: http://localhost:4318/v1/traces
```

### Opción B: Prueba en Vercel

Si desplegaste a Vercel:

1. **Configurar variables en Vercel Dashboard**:
   - `ENABLE_TRACING=true`
   - `OTEL_EXPORTER_OTLP_ENDPOINT=https://your-jaeger-endpoint.com/v1/traces`

2. **Deploy** y verificar logs en Vercel Dashboard

---

## 🔍 Verificación en Jaeger UI

### 1. Abrir Jaeger UI

```bash
# Abrir en navegador
http://localhost:16686
```

### 2. Generar tráfico de prueba

Haz algunas llamadas a endpoints que usan AI:

```bash
# Ejemplo: endpoint de chat
curl -X POST http://localhost:3000/api/trpc/wallie.chat \
  -H "Content-Type: application/json" \
  -d '{
    "json": {
      "message": "Hola, ¿cómo estás?",
      "conversationId": "test-conv-123"
    }
  }'
```

### 3. Buscar trazas en Jaeger

1. **Service**: Selecciona `wallie-app`
2. **Operation**: Filtra por:
   - `ai.chat`
   - `ai.generate`
   - `ai.analyze`
3. **Tags**: Filtra por:
   - `ai.model=gpt-4o-mini`
   - `user.id=tu-user-id`
   - `ai.provider=openai`
4. Click **"Find Traces"**

### 4. Ver detalles de una traza

Al hacer click en una traza, deberías ver:

```
┌─ HTTP POST /api/trpc/wallie.chat (200ms)
│  ├─ ai.chat (180ms)
│  │  ├─ Tags:
│  │  │  - ai.system: wallie-ai
│  │  │  - ai.model: gpt-4o-mini
│  │  │  - ai.provider: openai
│  │  │  - ai.operation: chat
│  │  │  - ai.usage.prompt_tokens: 125
│  │  │  - ai.usage.completion_tokens: 234
│  │  │  - ai.usage.total_tokens: 359
│  │  │  - ai.cost.usd: 0.001607      👈 ¡Tu lógica de costos!
│  │  │  - ai.latency_ms: 1842
│  │  │  - user.id: clx1234567
│  │  └─ Status: OK
│  └─ db.query (15ms)
```

---

## 🐛 Troubleshooting

### Problema: No aparecen trazas en Jaeger

**Verificar**:

1. **Jaeger está corriendo**:
   ```bash
   docker ps | grep jaeger
   curl http://localhost:16686
   ```

2. **Variables de entorno correctas**:
   ```bash
   echo $ENABLE_TRACING  # debe ser "true"
   echo $OTEL_EXPORTER_OTLP_ENDPOINT  # debe apuntar a Jaeger
   ```

3. **Logs de inicialización**:
   ```bash
   # Debe aparecer en logs del servidor:
   📡 OpenTelemetry initialized successfully
   ```

4. **Connectivity con Jaeger**:
   ```bash
   curl -X POST http://localhost:4318/v1/traces \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

### Problema: Trazas aparecen pero sin atributos de costos

**Verificar**:

1. **La respuesta de AI incluye `usage`**:
   ```typescript
   // El resultado debe tener uno de estos formatos:
   {
     usage: { prompt_tokens: X, completion_tokens: Y }
   }
   // O
   {
     response: { usage: { promptTokens: X, completionTokens: Y } }
   }
   // O
   {
     tokenUsage: { promptTokenCount: X, completionTokenCount: Y }
   }
   ```

2. **El modelo está en la lista de costos**:
   - Ver `packages/ai/src/observability/ai-instrumentation.ts`
   - Variable `TOKEN_COSTS` (línea 53)
   - Si tu modelo no está, se usa fallback: `{ input: 1, output: 3 }`

### Problema: Error "Resource is not a constructor" en desarrollo

**Esto es normal** - OpenTelemetry no funciona en dev debido a webpack.

**Solución**: Verificar que `ENABLE_TRACING=false` o no está definida:

```bash
# En desarrollo, debe estar deshabilitado:
grep ENABLE_TRACING apps/web/.env.local
# No debe existir o debe ser "false"
```

---

## 📊 Métricas a Monitorear

Una vez que las trazas fluyen correctamente, puedes:

### 1. Costos de AI por endpoint

En Jaeger, agrupa por `ai.operation` y suma `ai.cost.usd`:

```
ai.chat:      $12.34 (último día)
ai.analyze:   $3.45
ai.classify:  $1.23
```

### 2. Latencia P95 por modelo

Agrupa por `ai.model` y calcula P95 de `ai.latency_ms`:

```
gpt-4o:       P95 = 2.3s
gpt-4o-mini:  P95 = 1.1s
claude-3-sonnet: P95 = 1.8s
```

### 3. Tasa de errores

Filtra por `error=true` y agrupa por `ai.model`:

```
gpt-4o:       0.2% errors (2 de 1000 requests)
claude-3:     0.1% errors (1 de 1000 requests)
```

### 4. Tokens consumidos por usuario

Agrupa por `user.id` y suma `ai.usage.total_tokens`:

```
user-123:  1.2M tokens (último mes)
user-456:  450K tokens
user-789:  3.4M tokens  👈 ¡Power user!
```

---

## 🎯 Test de Integración Completo

Script completo para verificar todo el flujo:

```bash
#!/bin/bash
set -e

echo "🧪 Test de OpenTelemetry - Integración Completa"
echo "================================================"

# 1. Verificar Jaeger
echo "1. Verificando Jaeger..."
if docker ps | grep -q jaeger; then
  echo "   ✅ Jaeger corriendo"
else
  echo "   ❌ Jaeger NO está corriendo"
  exit 1
fi

# 2. Build producción
echo "2. Building aplicación..."
pnpm build
echo "   ✅ Build exitoso"

# 3. Iniciar servidor
echo "3. Iniciando servidor en modo producción..."
NODE_ENV=production ENABLE_TRACING=true pnpm start &
SERVER_PID=$!
sleep 10

# 4. Hacer request de prueba
echo "4. Enviando request de prueba..."
curl -X POST http://localhost:3000/api/trpc/wallie.chat \
  -H "Content-Type: application/json" \
  -d '{"json": {"message": "Test OpenTelemetry"}}' \
  -s > /dev/null

echo "   ✅ Request enviado"

# 5. Esperar procesamiento
echo "5. Esperando procesamiento (5s)..."
sleep 5

# 6. Verificar en Jaeger
echo "6. Verificando trazas en Jaeger..."
TRACES=$(curl -s "http://localhost:16686/api/traces?service=wallie-app&limit=1" | jq '.data | length')

if [ "$TRACES" -gt 0 ]; then
  echo "   ✅ Trazas encontradas en Jaeger!"
  echo "   🎉 OpenTelemetry funcionando correctamente"
else
  echo "   ⚠️  No se encontraron trazas (puede tardar unos segundos)"
fi

# Cleanup
kill $SERVER_PID

echo ""
echo "✅ Test completado"
echo "🔍 Ver trazas en: http://localhost:16686"
```

---

## 📚 Referencias

- [Jaeger UI Guide](https://www.jaegertracing.io/docs/latest/frontend-ui/)
- [OpenTelemetry Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/)
- [GenAI Observability Best Practices](https://opentelemetry.io/docs/specs/semconv/gen-ai/)
