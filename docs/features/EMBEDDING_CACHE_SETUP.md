# 🚀 Embedding Cache - Setup Rápido

> **Implementado:** 29 Dic 2025
> **Status:** ✅ Todo implementado - Solo falta configurar Redis

---

## ✅ Lo que ya está hecho

- ✅ Cache layer completo
- ✅ Integración con RAG
- ✅ Admin panel UI
- ✅ 4 Workers automáticos
- ✅ Webhook de deployment
- ✅ Métricas y alertas

**Total implementado:** 10 archivos nuevos

---

## 🎯 Setup en 5 minutos

### Paso 1: Crear Redis en Upstash (2 min)

1. Ve a https://upstash.com/ (crea cuenta si no tienes)
2. Click **"Create Database"**
3. Configuración:
   - Name: `wallie-embedding-cache`
   - Type: `Regional`
   - Region: `eu-west-1` (más cerca de Europa)
   - Plan: `Free` (suficiente para empezar)
4. Click **"Create"**
5. En la página de la DB, copia:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### Paso 2: Añadir a Vercel (1 min)

```bash
# En tu terminal:
vercel env add UPSTASH_REDIS_REST_URL
# Pega: https://tu-redis.upstash.io
# Selecciona: Production, Preview, Development

vercel env add UPSTASH_REDIS_REST_TOKEN
# Pega: AYNxxxxx...
# Selecciona: Production, Preview, Development
```

### Paso 3: Deploy (1 min)

```bash
git add .
git commit -m "feat(cache): implement embedding cache system"
git push
```

Vercel hará deploy automáticamente.

### Paso 4: Warmup Inicial (30 seg)

1. Ve a https://wallie.pro/admin/embedding-cache
2. Click **"Warm Up Now"**
3. Verifica que las métricas se actualizan

**¡Listo!** El cache ya está funcionando.

---

## 📊 Verificar que funciona

### Check 1: Admin Panel

Ve a `/admin/embedding-cache` y verifica:

- ✅ Status: "Enabled"
- ✅ Redis Configured: "Yes"
- ✅ Hit rate empieza a subir después de warmup

### Check 2: Logs

En Vercel → Logs, busca:

```
[EmbeddingCache] Cache HIT
```

Si ves esto, el cache está funcionando perfectamente.

### Check 3: Performance

Abre una conversación y pregunta algo a Wallie.

- **Antes:** ~1 segundo de respuesta
- **Después:** ~150ms de respuesta (con cache hit)

---

## 🔧 (Opcional) Auto-warmup en Deployments

**Para que el cache se caliente automáticamente después de cada deploy:**

### 1. Generar Secret (10 seg)

```bash
# En terminal:
node -e "console.log(require('crypto').randomUUID())"
# Copia el UUID generado
```

### 2. Añadir a Vercel (20 seg)

```bash
vercel env add DEPLOYMENT_WEBHOOK_SECRET
# Pega el UUID del paso 1
# Selecciona: Production
```

### 3. Crear Deploy Hook en Vercel (30 seg)

1. Ve a Vercel Dashboard → Settings → Git
2. **Deploy Hooks** → **Create Hook**
3. Configuración:
   - Name: `Embedding Cache Warmup`
   - Branch: `main`
4. Click **Create Hook**
5. Copia la URL generada
6. **⚠️ Ignora la URL, usa esta en su lugar:**
   ```
   https://wallie.pro/api/webhooks/deployment
   ```
7. En **Headers**, añade:
   - Key: `x-deployment-secret`
   - Value: (pega el UUID del paso 1)

**Listo!** Ahora cada deploy calentará el cache automáticamente.

---

## 🎉 Resultado Esperado

### Antes (sin cache)

```
Query RAG: "¿Cuánto cuesta?"
├─ Generate embedding: 800ms ❌ Slow
├─ Search DB: 50ms
└─ Total: 850ms
```

### Después (con cache)

```
Query RAG: "¿Cuánto cuesta?"
├─ Get embedding (cache): 5ms ✅ Fast!
├─ Search DB: 50ms
└─ Total: 55ms
```

**Mejora: 15x más rápido** 🚀

---

## 📈 Métricas Esperadas (después de 1 semana)

| Métrica             | Valor esperado |
| ------------------- | -------------- |
| Hit rate            | 60-80%         |
| Queries/día         | ~500-1000      |
| Tiempo ahorrado/día | ~6-8 minutos   |
| Costo ahorrado/día  | ~$0.15-0.25    |

**Ahorro mensual:** ~$5-8 USD + Mejor UX

---

## 🐛 Problemas Comunes

### "Cache disabled" en admin panel

**Causa:** Redis no configurado
**Solución:** Verifica paso 1 y 2

### Hit rate = 0% después de warmup

**Causa:** Queries diferentes a las pre-configuradas
**Solución:** Añade tus queries más comunes en:
`packages/api/src/lib/embedding-cache.ts` línea 325

### Workers no aparecen en Inngest

**Causa:** Inngest no sincronizado
**Solución:** El próximo deploy los registrará automáticamente

---

## ❓ FAQ

**P: ¿Cuánto cuesta Upstash?**
R: Free tier incluye 10,000 comandos/día. Suficiente para empezar.

**P: ¿Qué pasa si Redis falla?**
R: El sistema funciona sin cache (fallback automático a Gemini API).

**P: ¿Puedo desactivar el cache?**
R: Sí, simplemente elimina las env vars de Upstash.

**P: ¿Cuánto dura el cache?**
R: 7 días por defecto (configurable en `EMBEDDING_CACHE_CONFIG`).

---

## 📚 Documentación Completa

Ver: `docs/features/EMBEDDING_CACHE.md`

---

**¿Dudas?** Revisa los logs en Vercel o contacta al equipo.

**Status:** ✅ Ready for Production
