# Serper API Setup - Auto-Research Web Search (Backup/Fallback)

**Actualizado:** 21 Ene 2026

## ¿Qué es Serper API?

Serper API proporciona acceso programático a Google Search para el sistema de **Auto-Research** de Quoorum. 

**Nota:** Serper ahora actúa como **backup/fallback automático** cuando Google Custom Search API está configurada. Si Google falla o excede su límite diario, Serper toma el relevo automáticamente.

## 🎯 Características del Auto-Research

Con Serper API configurada, el sistema puede:
- ✅ Buscar datos de mercado en tiempo real
- ✅ Encontrar análisis de competencia
- ✅ Obtener best practices y casos de éxito
- ✅ Enriquecer contexto con fuentes externas

**Sin Serper API:**
- ⚠️ El sistema funciona en "modo AI-only"
- ⚠️ Usa solo conocimiento del LLM (hasta su cutoff date)
- ⚠️ No puede acceder a datos actualizados de internet

## 📦 Planes y Precios

| Plan | Búsquedas/mes | Precio | Ideal para |
|------|---------------|--------|------------|
| **Free** | 100 | $0 | Testing, desarrollo |
| **Starter** | 1,000 | $50/mo | Producción pequeña |
| **Pro** | 5,000 | $200/mo | Producción media |
| **Enterprise** | Custom | Custom | Alto volumen |

**Enlace:** https://serper.dev/pricing

## 🚀 Configuración Paso a Paso

### 1. Crear cuenta en Serper.dev

1. Ir a https://serper.dev
2. Hacer clic en "Sign Up"
3. Registrarse con email o GitHub
4. Verificar email

### 2. Generar API Key

1. Ir a Dashboard: https://serper.dev/dashboard
2. En la sección "API Keys", hacer clic en "Generate New Key"
3. Copiar la API key (formato: `YOUR_SERPER_API_KEY`)
4. ⚠️ **IMPORTANTE:** Guardar en lugar seguro, solo se muestra una vez

### 3. Añadir a .env.local

```bash
# En el archivo .env.local (NO .env.example)
SERPER_API_KEY=YOUR_SERPER_API_KEY
```

**Ubicación del archivo:**
- Desarrollo: `apps/web/.env.local`
- Producción: Variables de entorno en Vercel/Railway

### 4. Verificar configuración

```bash
# Reiniciar servidor de desarrollo
pnpm dev

# Verificar en logs que Serper está activo
# Debería ver: "[Auto-Research] Serper API key found"
```

## 🧪 Probar Auto-Research

1. Ir a `/debates/new`
2. Escribir una pregunta de decisión:
   ```
   ¿Debería expandirme al mercado europeo?
   ```
3. El sistema automáticamente:
   - Genera preguntas de contexto
   - Busca información relevante en Google (con Serper)
   - Enriquece el debate con datos externos

## 🔍 Verificar que funciona

### Con Serper API configurada:

```typescript
// En packages/api/src/lib/auto-research.ts
console.log('[Auto-Research] Serper API key found')
// Ejecuta búsquedas reales en Google
const searchResults = await SerperAPI.searchWebCached(query)
```

### Sin Serper API:

```typescript
console.log('[Auto-Research] No Serper API key found, using AI-only mode')
// Usa solo conocimiento del LLM
const aiResults = await generateAIOnlyResearch(question)
```

## 📊 Monitoreo de Uso

### Ver cuota restante:

1. Dashboard Serper: https://serper.dev/dashboard
2. Sección "Usage" muestra:
   - Búsquedas usadas este mes
   - Búsquedas restantes
   - Histórico de uso

### Alertas de límite:

Serper envía emails automáticos cuando:
- Alcanzas 80% de tu cuota
- Alcanzas 100% de tu cuota

## ⚠️ Rate Limiting

Serper tiene límites de velocidad:

| Plan | Requests/segundo |
|------|------------------|
| Free | 1 RPS |
| Paid | 5 RPS |

**El sistema maneja esto automáticamente** con:
- Cache de 15 minutos (Redis/memoria)
- Retry con exponential backoff
- Fallback a AI-only si falla

## 🐛 Troubleshooting

### Error: "Serper API key invalid"

**Causa:** API key incorrecta o expirada

**Solución:**
1. Verificar que la key no tiene espacios al inicio/final
2. Regenerar key en Dashboard Serper
3. Actualizar `.env.local`
4. Reiniciar servidor

### Error: "Rate limit exceeded"

**Causa:** Demasiadas búsquedas en poco tiempo

**Solución:**
- Esperar 1 segundo entre requests
- El sistema automáticamente hace fallback a AI-only

### Warning: "Quota exceeded"

**Causa:** Cuota mensual agotada

**Solución:**
- Esperar al próximo mes (reset día 1)
- Upgrade a plan superior
- El sistema funciona en AI-only mode mientras tanto

### No se ven resultados de búsqueda

**Posibles causas:**

1. **Serper API no configurada**
   - Verificar que `SERPER_API_KEY` está en `.env.local`
   - Reiniciar servidor

2. **Redis cache sirviendo resultados antiguos**
   - Limpiar cache: `redis-cli FLUSHDB`
   - O esperar 15 minutos

3. **Network issues**
   - Verificar conexión a internet
   - Verificar que Serper.dev está accesible

## 🔒 Seguridad

### ✅ Buenas prácticas:

- ✅ **NUNCA** commitear `.env.local` a Git
- ✅ Usar variables de entorno en producción (Vercel/Railway)
- ✅ Rotar keys periódicamente (cada 3-6 meses)
- ✅ Monitorear uso para detectar abuso

### ❌ NO hacer:

- ❌ Compartir API key en Slack/Discord/Email
- ❌ Hardcodear key en código fuente
- ❌ Usar misma key en dev y prod

## 📚 Recursos

- **Documentación oficial:** https://serper.dev/docs
- **API Reference:** https://serper.dev/api-reference
- **Status page:** https://status.serper.dev
- **Support:** support@serper.dev

## 🆘 Soporte

Si tienes problemas:

1. **Verificar logs del servidor** (buscar "[Auto-Research]")
2. **Consultar Serper Dashboard** (uso y errores)
3. **Contactar soporte Serper** (para issues de API)
4. **Crear issue en GitHub** (para bugs del sistema)

---

**Estado:** ✅ Sistema funciona con y sin Serper API (AI-only fallback automático)
