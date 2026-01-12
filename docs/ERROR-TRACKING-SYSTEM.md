# 🔍 Sistema de Error Tracking

**Última actualización:** 31 Dic 2025

## 📋 Resumen

Wallie tiene un sistema completo de tracking de errores que guarda automáticamente todos los errores del dashboard (y cualquier parte del frontend) en la base de datos para que puedas monitorizarlos y corregirlos.

## ✅ ¿Cómo Funciona?

### 1. **Captura Automática**

Cuando ocurre un error en el dashboard (o cualquier parte del frontend):

1. **Error Boundary** captura errores de React
2. **`captureException()`** se llama automáticamente
3. El error se guarda en la base de datos (`error_tracking` table)
4. También se envía a Sentry (si está configurado)

### 2. **Dónde se Guardan**

Los errores se guardan en la tabla `error_tracking` con:

- **Error Hash**: Identificador único del error (basado en tipo + mensaje + stack)
- **Error Type**: Tipo de error (TypeError, NetworkError, etc.)
- **Error Message**: Mensaje del error
- **Stack Trace**: Stack completo del error
- **Service**: `'web'` (para errores del frontend)
- **Endpoint**: Ruta donde ocurrió el error (ej: `/dashboard`)
- **Occurrence Count**: Cuántas veces ha ocurrido
- **Users Affected**: Cuántos usuarios únicos lo han visto
- **First/Last Seen**: Primera y última vez que ocurrió
- **Status**: `'new'`, `'acknowledged'`, `'resolved'`, `'ignored'`

### 3. **Agregación Inteligente**

Si el mismo error ocurre múltiples veces:

- ✅ Se incrementa `occurrenceCount`
- ✅ Se actualiza `lastSeenAt`
- ✅ Se actualiza `usersAffected` si es un usuario nuevo
- ❌ NO se crean múltiples registros (usa `errorHash` para deduplicar)

## 🎯 Cómo Ver los Errores

### Opción 1: Panel de Admin (Recomendado)

1. Ve a `/admin/system/errors` (solo admins)
2. Verás una lista de todos los errores con:
   - Tipo y mensaje
   - Cuántas veces ocurrió
   - Cuántos usuarios afectados
   - Primera y última vez que ocurrió
   - Estado (nuevo, reconocido, resuelto, ignorado)

### Opción 2: API tRPC

```typescript
// En cualquier componente admin
const { data } = api.adminSystem.listErrors.useQuery({
  page: 1,
  limit: 20,
  status: 'new', // o 'all', 'acknowledged', 'resolved', 'ignored'
  service: 'web', // opcional: filtrar por servicio
})
```

### Opción 3: Sentry (Si está configurado)

Si tienes `SENTRY_DSN` configurado, los errores también aparecen en Sentry Dashboard.

## 📊 Flujo Completo

```
Usuario interactúa con Dashboard
         ↓
    Ocurre un error
         ↓
ErrorBoundary captura el error
         ↓
captureException(error, context)
         ↓
    ┌─────────────────┐
    │                 │
    ↓                 ↓
Sentry (si config)   DB (siempre)
    │                 │
    │                 ↓
    │         error_tracking table
    │                 │
    │                 ↓
    │         Agregación por errorHash
    │                 │
    └─────────────────┘
         ↓
Admin puede ver en /admin/system/errors
```

## 🔧 Configuración

### Desarrollo

Los errores se guardan automáticamente en la DB. No necesitas configurar nada.

### Producción

1. **Sentry (Opcional pero recomendado):**

   ```env
   SENTRY_DSN=https://xxx@sentry.io/xxx
   NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
   ```

2. **Base de Datos:**
   - Ya está configurada ✅
   - Los errores se guardan automáticamente ✅

## 📝 Ejemplo de Uso Manual

Si quieres capturar un error manualmente:

```typescript
import { captureException } from '@/lib/monitoring'

try {
  await someOperation()
} catch (error) {
  captureException(error instanceof Error ? error : new Error(String(error)), {
    action: 'dashboard-load',
    metadata: {
      userId: user.id,
      dashboardSection: 'quick-stats',
    },
  })
  // El error se guarda automáticamente en la DB
}
```

## 🎨 Estados de Error

| Estado         | Descripción                                | Acción Requerida                  |
| -------------- | ------------------------------------------ | --------------------------------- |
| `new`          | Error nuevo, no revisado                   | Revisar y corregir                |
| `acknowledged` | Error reconocido, en proceso de corrección | Trabajando en la solución         |
| `resolved`     | Error corregido                            | Verificar que no vuelve a ocurrir |
| `ignored`      | Error ignorado (falsos positivos, etc.)    | No requiere acción                |

## 🔍 Búsqueda y Filtrado

En `/admin/system/errors` puedes:

- ✅ Filtrar por estado (`new`, `acknowledged`, `resolved`, `ignored`)
- ✅ Filtrar por servicio (`web`, `api`, etc.)
- ✅ Ordenar por última vez visto (más recientes primero)
- ✅ Ver detalles completos (stack trace, metadata, etc.)

## 💡 Tips

1. **Revisa errores `new` primero**: Son los más recientes y pueden ser críticos
2. **Agrupa por `errorHash`**: El mismo error aparece una vez con contador
3. **Usa `usersAffected`**: Si muchos usuarios ven el mismo error, es prioritario
4. **Marca como `resolved`**: Cuando corrijas un error, márcalo como resuelto
5. **Ignora falsos positivos**: Errores de extensiones del navegador, etc.

## 🚨 Errores Críticos

Un error es crítico si:

- ✅ `usersAffected > 10`: Muchos usuarios afectados
- ✅ `occurrenceCount > 100`: Ocurre muy frecuentemente
- ✅ `status = 'new'` y `lastSeenAt` es reciente: Error nuevo y activo

## 📈 Métricas

El sistema también calcula:

- **Total de errores únicos**: Cuántos tipos diferentes de errores hay
- **Errores nuevos en las últimas 24h**: Errores recientes
- **Errores resueltos**: Errores que ya fueron corregidos
- **Tasa de resolución**: % de errores resueltos vs total

## 🔗 Archivos Relacionados

- `apps/web/src/lib/monitoring.ts` - Función `captureException()`
- `apps/web/src/components/error-boundary.tsx` - Error Boundary de React
- `packages/api/src/routers/admin-system.ts` - Endpoint `trackError` y `listErrors`
- `packages/db/src/schema/system-health.ts` - Schema de `error_tracking` table

---

**¿Preguntas?** Revisa `/admin/system/errors` para ver todos los errores capturados.
