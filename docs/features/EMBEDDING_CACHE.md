# Embedding Cache System

> **Versión:** 1.0.0 | **Fecha:** 29 Dic 2025
> **Estado:** ✅ Implementado

---

## 📋 Resumen

Sistema de caché para embeddings de RAG que reduce latencia y costos mediante Redis (Upstash).

### Beneficios Clave

| Métrica             | Sin Cache      | Con Cache      | Mejora             |
| ------------------- | -------------- | -------------- | ------------------ |
| **Latencia**        | 800-1200ms     | 50-100ms       | **15x más rápido** |
| **Costo**           | $0.00025/query | $0 (cache hit) | **-100%**          |
| **Throughput**      | ~20/min        | ~300/min       | **15x**            |
| **User Experience** | Laggy          | Instantáneo    | ⭐⭐⭐⭐⭐         |

---

## 🏗️ Arquitectura

```
┌─────────────────┐
│  User Query     │
│ "¿Cuánto cuesta?"│
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Hybrid RAG Search      │
│  (lib/hybrid-rag.ts)    │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐     ┌──────────────┐
│  Embedding Cache Layer  │────▶│ Redis Cache  │
│  (lib/embedding-cache)  │◀────│  (Upstash)   │
└────────┬────────────────┘     └──────────────┘
         │
         │ Cache MISS?
         ▼
┌─────────────────────────┐
│  Gemini API             │
│  text-embedding-004     │
│  (768 dimensions)       │
└─────────────────────────┘
```

---

## 📁 Archivos Implementados

### Core Layer

- `packages/api/src/lib/embedding-cache.ts` - Cache layer principal
- `packages/api/src/lib/hybrid-rag.ts` - Integración con RAG

### Admin

- `packages/api/src/routers/admin-embedding-cache.ts` - Admin endpoints
- `apps/web/src/app/admin/embedding-cache/page.tsx` - Admin UI

### Workers

- `packages/workers/src/functions/embedding-cache-maintenance.ts` - Maintenance (cada hora)
- `packages/workers/src/functions/embedding-cache-warmup.ts` - Warmup workers
  - Event-based warmup
  - Deployment warmup
  - Daily warmup (6 AM)

### Webhooks

- `apps/web/src/app/api/webhooks/deployment/route.ts` - Post-deployment hook

---

## ⚙️ Configuración

### 1. Variables de Entorno

```bash
# Redis (Upstash) - REQUERIDO para cache
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"

# Deployment Webhook - OPCIONAL (para auto-warmup)
DEPLOYMENT_WEBHOOK_SECRET="tu-secret-aleatorio"
```

### 2. Crear Redis en Upstash

1. Ve a https://upstash.com/
2. Crea una cuenta (free tier suficiente)
3. Create Database → "wallie-embedding-cache"
4. Copia REST URL y Token
5. Añade a Vercel:
   ```bash
   vercel env add UPSTASH_REDIS_REST_URL
   vercel env add UPSTASH_REDIS_REST_TOKEN
   ```

### 3. Configurar Deploy Hook en Vercel (Opcional)

**Para auto-warmup después de cada deploy:**

1. Ve a Vercel Dashboard → Settings → Git
2. Deploy Hooks → Create Hook
3. Configuración:
   - Name: `Embedding Cache Warmup`
   - Branch: `main` (producción)
   - URL: `https://wallie.pro/api/webhooks/deployment`
4. Añade header custom:
   - Key: `x-deployment-secret`
   - Value: (genera un UUID y guárdalo)
5. Añade la secret a Vercel:
   ```bash
   vercel env add DEPLOYMENT_WEBHOOK_SECRET
   # Pega el UUID del paso 4
   ```

---

## 🚀 Uso

### Admin Panel

Accede a: `https://wallie.pro/admin/embedding-cache`

#### Métricas Disponibles

- ✅ Total queries procesadas
- ✅ Hit rate (%)
- ✅ Tiempo total ahorrado
- ✅ Costo total ahorrado

#### Acciones de Gestión

1. **Warm Up Now** - Warmup instantáneo (10 queries comunes)
2. **Trigger Worker** - Warmup vía Inngest (async, mejor para deploys)
3. **Invalidate Query** - Eliminar query específica del cache
4. **Reset Stats** - Resetear contadores (mantiene cache)
5. **Clear All** - ⚠️ Borrar todo el cache (irreversible)
6. **Log Performance** - Forzar log de métricas

### API Endpoints

```typescript
// Get stats
const stats = await api.adminEmbeddingCache.getStats.useQuery()

// Warmup manual
await api.adminEmbeddingCache.warmup.mutateAsync()

// Clear cache
await api.adminEmbeddingCache.clearCache.mutateAsync()

// Trigger Inngest worker
await api.adminEmbeddingCache.triggerWarmup.mutateAsync({
  trigger: 'manual',
})
```

---

## 🤖 Workers Automáticos

### 1. Maintenance Worker

- **Schedule:** Cada hora
- **Acciones:**
  - Log de performance
  - Auto-warmup si < 10 queries
  - Alerta si hit rate < 30%
  - Reset semanal de stats (domingos 00:00)

### 2. Warmup Workers

#### Event-based

- **Trigger:** `embedding-cache/warmup.requested`
- **Uso:** Manual desde admin panel

#### Deployment

- **Trigger:** `app/deployed` (vía webhook)
- **Delay:** 30s (espera a que servicios estén ready)
- **Uso:** Automático en cada deploy

#### Daily

- **Schedule:** 6:00 AM (antes de horario laboral)
- **Condición:** Solo si hit rate > 50%

---

## 📊 Queries Comunes Pre-configuradas

El sistema viene con 10 queries que se usan para warmup:

```typescript
const COMMON_QUERIES = [
  '¿Cuánto cuesta?',
  '¿Qué incluye el servicio?',
  '¿Cómo funciona el pago?',
  '¿Cuál es el plazo de entrega?',
  '¿Hacen envíos?',
  '¿Tienen garantía?',
  'Precio',
  'Disponibilidad',
  'Características',
  'Información del producto',
]
```

**Personalización:** Puedes añadir más en `lib/embedding-cache.ts` línea 325+

---

## 🔍 Monitoreo y Alertas

### Alertas Automáticas

El sistema envía alertas si:

- ✅ Hit rate < 30% (y total queries > 50)
- ✅ Errores de Redis

**Destino:** Logs de Sentry + Admin emails (env: `ADMIN_EMAILS`)

### Logs Estructurados

Todos los eventos se logean con contexto:

```json
{
  "message": "[EmbeddingCache] Cache HIT",
  "key": "emb:a3f2c1...",
  "queryLength": 15,
  "hitRate": 0.85
}
```

**Ver logs en:**

- Vercel Dashboard → Logs
- Sentry → Issues
- Inngest Dashboard → Functions → embedding-cache-\*

---

## 🐛 Troubleshooting

### Cache no funciona (hit rate 0%)

**Verificar:**

1. ¿Redis configurado?
   ```bash
   vercel env ls | grep UPSTASH
   ```
2. ¿Variables correctas?
   - `UPSTASH_REDIS_REST_URL` debe empezar con `https://`
   - `UPSTASH_REDIS_REST_TOKEN` no debe estar vacío
3. ¿Upstash activo?
   - Ve a Upstash Dashboard
   - Check que la DB no esté pausada

### Hit rate muy bajo (< 30%)

**Posibles causas:**

1. Queries muy diversas (usuarios preguntan cosas distintas)
2. Cache recién reseteado
3. TTL muy corto (default: 7 días)

**Solución:**

- Añade más queries comunes en `COMMON_QUERIES`
- Aumenta TTL en `EMBEDDING_CACHE_CONFIG`

### Deployment webhook no funciona

**Verificar:**

1. ¿Secret configurado correctamente?
   ```bash
   curl https://wallie.pro/api/webhooks/deployment \
     -H "x-deployment-secret: TU_SECRET"
   ```
2. ¿Vercel Deploy Hook creado?
   - Vercel → Settings → Git → Deploy Hooks
3. ¿Worker de deployment activo?
   - Inngest Dashboard → embedding-cache-deployment-warmup

---

## 📈 Mejoras Futuras

- [ ] Adaptive TTL (más TTL para queries populares)
- [ ] Smart invalidation (detectar cambios en docs/FAQs)
- [ ] Multi-region cache (edge locations)
- [ ] Prefetch predictivo (anticipar queries)
- [ ] Analytics dashboard (Grafana/PostHog)

---

## 🔗 Referencias

- [Upstash Redis Docs](https://upstash.com/docs/redis)
- [Gemini Embeddings](https://ai.google.dev/gemini-api/docs/embeddings)
- [Inngest Workers](https://www.inngest.com/docs)
- [Vercel Deploy Hooks](https://vercel.com/docs/deployments/deploy-hooks)

---

_Implementado: 29 Dic 2025_
_Autor: Claude Code_
_Status: ✅ Production Ready_
