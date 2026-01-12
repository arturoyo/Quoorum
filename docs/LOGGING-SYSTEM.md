# 📊 Sistema de Logs de Wallie

> **Guía completa del sistema de logging y diagnóstico de errores**

**Fecha:** 31 Dic 2025

---

## 🎯 Resumen

Wallie tiene un sistema de logging estructurado que incluye:

1. ✅ **Logger centralizado** (`packages/api/src/lib/logger.ts`)
2. ✅ **Integración con Sentry** (producción)
3. ✅ **Error Tracking en DB** (`error_tracking` table)
4. ✅ **Admin endpoints** para ver errores (`adminSystem.listErrors`)
5. ⚠️ **Falta:** Página de admin para ver logs en tiempo real

---

## 📋 Sistema de Logging Actual

### 1. Logger Centralizado

**Ubicación:** `packages/api/src/lib/logger.ts`

**Uso:**

```typescript
import { logger } from '@wallie/api'

// Info
logger.info('Operation started', { userId, clientId })

// Warning
logger.warn('Rate limit approaching', { userId, usage: 80 })

// Error (con captura automática en Sentry)
logger.error('Operation failed', error, { userId, operation: 'coaching' })

// Operaciones con tracking
const op = logger.operation('getClientCoaching', { clientId })
op.start()
try {
  const result = await doSomething()
  op.success({ hasData: true })
  return result
} catch (error) {
  op.error(error instanceof Error ? error : new Error(String(error)))
  throw error
}
```

**Características:**

- ✅ Logs estructurados en JSON
- ✅ Timestamp ISO automático
- ✅ Envío automático a Sentry en producción
- ✅ Fallback si Sentry no está disponible

---

### 2. Error Tracking en Base de Datos

**Tabla:** `error_tracking` (definida en `packages/db/src/schema/system-health.ts`)

**Campos:**

- `id` - UUID
- `service` - Servicio donde ocurrió (api, workers, etc.)
- `error_type` - Tipo de error
- `error_message` - Mensaje del error
- `stack_trace` - Stack trace completo
- `status` - Estado: 'new', 'acknowledged', 'resolved', 'ignored'
- `count` - Número de veces que ocurrió
- `first_seen_at` - Primera vez que se vio
- `last_seen_at` - Última vez que se vio
- `metadata` - JSON con contexto adicional

**Endpoint Admin:**

```typescript
// Ver errores recientes
api.adminSystem.listErrors.useQuery({
  page: 1,
  limit: 20,
  status: 'all', // o 'new', 'acknowledged', 'resolved', 'ignored'
  service: 'api', // opcional
})
```

---

### 3. Sentry Integration

**Ubicación:** `apps/web/src/lib/monitoring.ts`

**Configuración:**

- Variables de entorno: `SENTRY_DSN`
- Solo en producción
- Lazy loading (no bundlea en dev)

**Funciones:**

```typescript
import { captureException, captureMessage } from '@/lib/monitoring'

// Capturar excepción
captureException(error, {
  action: 'coaching.getClientCoaching',
  userId,
  clientId,
})

// Capturar mensaje
captureMessage('Rate limit exceeded', 'error', {
  userId,
  endpoint: '/api/coaching',
})
```

---

## 🔍 Cómo Diagnosticar Problemas

### Opción 1: Ver Logs en Consola (Desarrollo)

**En desarrollo**, todos los logs se muestran en la consola del servidor:

```bash
# Terminal donde corre el servidor
pnpm dev

# Verás logs como:
# {"timestamp":"2025-12-31T12:00:00.000Z","level":"error","message":"Operation failed",...}
```

**Formato de logs:**

```json
{
  "timestamp": "2025-12-31T12:00:00.000Z",
  "level": "error",
  "message": "Operation failed",
  "context": {
    "userId": "xxx",
    "clientId": "yyy"
  },
  "error": {
    "name": "Error",
    "message": "column 'primary_persona' does not exist",
    "stack": "..."
  }
}
```

---

### Opción 2: Ver Errores en Admin Panel

**Endpoint:** `/admin` → (necesita página de logs)

**Usar endpoint tRPC directamente:**

```typescript
// En cualquier componente admin
const { data: errors } = api.adminSystem.listErrors.useQuery({
  page: 1,
  limit: 50,
  status: 'new', // Solo errores nuevos
})
```

**Dónde ver:**

- Actualmente NO hay página de admin para logs
- Puedes usar el endpoint en cualquier componente admin
- O crear una página en `/admin/logs`

---

### Opción 3: Sentry Dashboard (Producción)

**Si está configurado:**

1. Ir a https://sentry.io
2. Seleccionar proyecto Wallie
3. Ver errores en tiempo real
4. Ver stack traces completos
5. Ver contexto adicional (userId, clientId, etc.)

**Configuración requerida:**

```env
SENTRY_DSN=https://xxx@sentry.io/xxx
```

---

## 🐛 Diagnóstico del Error Actual

### Error: `column "primary_persona" does not exist`

**Estado:** ✅ **CORREGIDO**

**Cambios realizados:**

1. Modificado `packages/api/src/routers/coaching.ts`
2. Añadido JOIN con `client_personas` para obtener `primaryPersona`
3. Añadido logging detallado para diagnóstico

**Logging añadido:**

- ✅ Log al inicio de la operación
- ✅ Log cuando no se encuentra cliente
- ✅ Log cuando no hay scores
- ✅ Log con datos de persona resueltos
- ✅ Log de errores con contexto completo

**Cómo verificar que funciona:**

1. **Ver logs en consola:**

   ```bash
   # En el terminal del servidor, deberías ver:
   {"timestamp":"...","level":"info","message":"[getClientCoaching] Started",...}
   {"timestamp":"...","level":"debug","message":"Fetching client scores and persona",...}
   {"timestamp":"...","level":"debug","message":"Persona data resolved",...}
   ```

2. **Verificar en Sentry (si está configurado):**
   - Ir a Sentry dashboard
   - Buscar errores de "primary_persona"
   - Verificar que ya no aparecen

3. **Probar el endpoint:**

   ```typescript
   // En el frontend
   const { data, error } = api.coaching.getClientCoaching.useQuery({
     clientId: 'xxx',
   })

   // Si hay error, aparecerá en:
   // - Consola del navegador (frontend)
   // - Consola del servidor (backend)
   // - Sentry (producción)
   ```

---

## 🚀 Mejoras Recomendadas

### 1. Crear Página de Admin para Logs

**Ubicación:** `apps/web/src/app/admin/logs/page.tsx`

**Features:**

- Lista de errores recientes
- Filtros por servicio, status, fecha
- Detalles del error (stack trace, contexto)
- Búsqueda por mensaje
- Exportar logs

### 2. Añadir Logging a Más Endpoints

**Endpoints críticos que deberían tener logging:**

- ✅ `coaching.getClientCoaching` (ya añadido)
- ⚠️ `clients.list` - Añadir logging de queries lentas
- ⚠️ `conversations.list` - Añadir logging de filtros complejos
- ⚠️ `deals.list` - Añadir logging de joins complejos

### 3. Alertas Automáticas

**Configurar alertas en Sentry:**

- Errores críticos → Email/Slack
- Rate de errores > 5% → Notificación
- Errores nuevos → Notificación inmediata

---

## 📝 Comandos Útiles

### Ver logs en desarrollo

```bash
# Terminal del servidor (automático con pnpm dev)
# Los logs aparecen en la consola

# Filtrar solo errores
pnpm dev 2>&1 | grep -i error

# Filtrar logs de coaching
pnpm dev 2>&1 | grep -i coaching
```

### Verificar Sentry

```bash
# Verificar si Sentry está configurado
echo $SENTRY_DSN

# Si está vacío, Sentry no está configurado
# Los errores solo se mostrarán en consola
```

### Ver errores en DB

```sql
-- Ver errores recientes
SELECT * FROM error_tracking
ORDER BY last_seen_at DESC
LIMIT 20;

-- Ver errores no resueltos
SELECT * FROM error_tracking
WHERE status = 'new'
ORDER BY last_seen_at DESC;
```

---

## ✅ Checklist de Diagnóstico

Cuando algo no funciona:

- [ ] **Verificar logs en consola del servidor**
  - Buscar el mensaje de error
  - Ver el contexto (userId, clientId, etc.)
  - Ver el stack trace

- [ ] **Verificar logs en consola del navegador** (si es error de frontend)
  - Abrir DevTools → Console
  - Buscar errores de tRPC
  - Ver el error completo

- [ ] **Verificar en Sentry** (si está configurado)
  - Ir a Sentry dashboard
  - Buscar errores recientes
  - Ver detalles del error

- [ ] **Verificar en error_tracking** (si el error se registró)

  ```typescript
  const { data } = api.adminSystem.listErrors.useQuery({
    status: 'new',
    service: 'api',
  })
  ```

- [ ] **Añadir logging temporal** si no hay suficiente información
  ```typescript
  logger.debug('Debug info', {
    variable1,
    variable2,
    queryResult,
  })
  ```

---

## 🔗 Referencias

- **Logger:** `packages/api/src/lib/logger.ts`
- **Monitoring:** `apps/web/src/lib/monitoring.ts`
- **Error Tracking Schema:** `packages/db/src/schema/system-health.ts`
- **Admin System Router:** `packages/api/src/routers/admin-system.ts`
- **Sentry Docs:** https://docs.sentry.io/platforms/javascript/guides/nextjs/

---

_Última actualización: 31 Dic 2025_
