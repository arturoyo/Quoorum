# 🔍 Guía de Manejo de Errores - Agente "Sabueso de Errores"

> **Última actualización:** 31 Dic 2025
> **Estado:** ✅ Implementado

---

## 📋 ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Sistema de Monitoreo](#sistema-de-monitoreo)
3. [Patrones de Manejo de Errores](#patrones-de-manejo-de-errores)
4. [Errores de Red](#errores-de-red)
5. [Auditoría de Errores](#auditoría-de-errores)
6. [Checklist de Implementación](#checklist-de-implementación)

---

## 🎯 RESUMEN EJECUTIVO

**El Agente "Sabueso de Errores" está configurado y listo para mantener la estabilidad de Wallie en producción.**

### Características Implementadas

✅ **Sentry Integration** - Captura automática de errores en producción
✅ **Error Classification** - Clasificación inteligente de tipos de error
✅ **Network Error Handling** - Manejo elegante de errores de red y timeouts
✅ **Retry Logic** - Reintentos con exponential backoff
✅ **Error Auditor** - Script para encontrar catch blocks problemáticos
✅ **Structured Logging** - Logs estructurados para debugging

### Archivos Clave

```
apps/web/src/lib/
├── monitoring.ts          # Sistema de monitoreo con Sentry
└── error-handling.ts     # Helpers para manejo de errores en frontend

packages/api/src/lib/
└── logger.ts             # Logger estructurado para backend

scripts/
└── audit-error-handling.ts  # Auditoría de patrones problemáticos
```

---

## 🔧 SISTEMA DE MONITOREO

### captureException

**Ubicación:** `apps/web/src/lib/monitoring.ts`

```typescript
import { captureException } from '@/lib/monitoring'

try {
  await riskyOperation()
} catch (error) {
  captureException(error instanceof Error ? error : new Error(String(error)), {
    action: 'risky-operation',
    userId: ctx.userId,
    metadata: {
      additionalContext: 'value',
    },
  })
  throw error // Re-throw si es necesario
}
```

**Características:**

- ✅ Captura automática en Sentry (producción)
- ✅ Log estructurado en desarrollo
- ✅ Fallback si Sentry no está disponible
- ✅ Contexto adicional para debugging

### Logger Estructurado (Backend)

**Ubicación:** `packages/api/src/lib/logger.ts`

```typescript
import { logger } from '@wallie/api/lib/logger'

try {
  await dbOperation()
} catch (error) {
  logger.error(
    'Database operation failed',
    error instanceof Error ? error : new Error(String(error)),
    {
      userId: ctx.userId,
      operation: 'db-operation',
      table: 'clients',
    }
  )
  throw error
}
```

**Características:**

- ✅ Log estructurado con contexto
- ✅ Integración automática con Sentry en producción
- ✅ No requiere configuración adicional

---

## 📝 PATRONES DE MANEJO DE ERRORES

### ❌ PROHIBIDO: Catch Blocks Vacíos

```typescript
// ❌ INCORRECTO
try {
  await operation()
} catch {
  // Error silenciado - nunca hacer esto
}
```

### ❌ PROHIBIDO: Solo console.log

```typescript
// ❌ INCORRECTO
try {
  await operation()
} catch (error) {
  console.log('Error:', error) // No captura en Sentry
}
```

### ✅ CORRECTO: Con captureException

```typescript
// ✅ CORRECTO - Backend (tRPC routers)
try {
  await operation()
} catch (error) {
  logger.error(
    'Operation failed',
    error instanceof Error ? error : new Error(String(error)),
    { userId: ctx.userId, operation: 'operation-name' }
  )
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Error al ejecutar la operación',
    cause: error,
  })
}
```

```typescript
// ✅ CORRECTO - Frontend
try {
  await apiOperation()
} catch (error) {
  const errorInfo = handleError(error, {
    action: 'api-operation',
    userId: user?.id,
  })

  toast.error(errorInfo.message)

  // Error ya capturado en Sentry por handleError
}
```

### ✅ CORRECTO: Re-throw con Contexto

```typescript
// ✅ CORRECTO - Si necesitas re-throw
try {
  await operation()
} catch (error) {
  captureException(error instanceof Error ? error : new Error(String(error)), {
    action: 'operation',
  })
  throw error // Re-throw para que el caller maneje
}
```

---

## 🌐 ERRORES DE RED

### Clasificación Automática

**Ubicación:** `apps/web/src/lib/error-handling.ts`

El sistema clasifica automáticamente los errores:

```typescript
import { handleError, classifyError } from '@/lib/error-handling'

const { data, error } = api.clients.list.useQuery()

if (error) {
  const errorInfo = handleError(error, { action: 'list-clients' })

  // errorInfo.type puede ser:
  // - 'network' → Sin conexión
  // - 'timeout' → Request tardó demasiado
  // - 'server' → Error 500+
  // - 'unauthorized' → 401
  // - 'forbidden' → 403
  // - 'not-found' → 404
  // - 'validation' → 400
  // - 'unknown' → Otro error
}
```

### Manejo Elegante en UI

```typescript
import { ErrorState } from '@/components/ui/error-state'
import { handleError } from '@/lib/error-handling'

function ClientList() {
  const { data, error, isLoading } = api.clients.list.useQuery()

  if (error) {
    const errorInfo = handleError(error, { action: 'list-clients' })

    return (
      <ErrorState
        type={errorInfo.type === 'network' ? 'network' : 'server'}
        message={errorInfo.message}
        onRetry={() => window.location.reload()}
      />
    )
  }

  // ... render data
}
```

### Retry con Exponential Backoff

```typescript
import { retryWithBackoff } from '@/lib/error-handling'

const result = await retryWithBackoff(
  async () => {
    return await fetch('/api/data')
  },
  {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    onRetry: (attempt, error) => {
      console.log(`Retry attempt ${attempt}:`, error.message)
    },
  }
)
```

### Detección de Conexión

```typescript
import { isOnline, waitForNetwork } from '@/lib/error-handling'

if (!isOnline()) {
  // Mostrar mensaje de "Sin conexión"
  await waitForNetwork(30000) // Esperar hasta 30s
  // Reintentar operación
}
```

---

## 🔍 AUDITORÍA DE ERRORES

### Script de Auditoría

**Ubicación:** `scripts/audit-error-handling.ts`

```bash
# Ejecutar auditoría
pnpm tsx scripts/audit-error-handling.ts
```

**Qué busca:**

1. **Catch blocks vacíos** (severidad: alta)
   - `catch {}` sin ningún código

2. **Catch blocks con solo console.log** (severidad: alta)
   - `catch (e) { console.log(e) }` sin captureException

3. **Catch blocks sin captureException** (severidad: media)
   - Catch blocks que no usan captureException o logger.error

4. **Network calls sin error handling** (severidad: baja)
   - Llamadas fetch/axios sin try-catch o ErrorState

**Salida del script:**

```
🔍 Auditing error handling patterns...

📁 Analyzing 234 TypeScript files...

📊 RESULTS

Total issues found: 3

🔴 HIGH SEVERITY: Empty catch blocks
────────────────────────────────────────────────────────────
  packages/api/src/routers/example.ts:45
    catch {}

🔴 HIGH SEVERITY: Catch blocks with only console.log
────────────────────────────────────────────────────────────
  apps/web/src/components/example.tsx:123
    catch (e) { console.log(e) }

📈 SUMMARY

  🔴 High: 2
  🟡 Medium: 1
  🟢 Low: 0

⚠️  Action required: Fix high severity issues before deployment
```

### Integración en CI/CD

```yaml
# .github/workflows/ci.yml
- name: 🔍 Audit error handling
  run: pnpm tsx scripts/audit-error-handling.ts
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Para Nuevos Códigos

- [ ] **Catch blocks** usan `captureException` o `logger.error`
- [ ] **Errores de red** tienen manejo elegante con `ErrorState`
- [ ] **Timeouts** tienen retry logic con exponential backoff
- [ ] **tRPC errors** se capturan automáticamente en `onError`
- [ ] **No hay catch blocks vacíos**
- [ ] **No hay console.log en catch blocks** (solo logger estructurado)

### Para Código Existente

- [ ] Ejecutar `pnpm tsx scripts/audit-error-handling.ts`
- [ ] Corregir todos los issues de severidad alta
- [ ] Revisar issues de severidad media
- [ ] Documentar decisiones sobre issues de severidad baja

### Verificación Pre-Deploy

```bash
# 1. Ejecutar auditoría
pnpm tsx scripts/audit-error-handling.ts

# 2. Verificar que no hay console.log en producción
pnpm lint | grep -i "console"

# 3. Verificar que Sentry está configurado
grep -r "SENTRY_DSN" .env*

# 4. Verificar que los errores se capturan
# (Revisar dashboard de Sentry)
```

---

## 🚨 CASOS ESPECIALES

### Server Actions (Next.js)

Si usas Server Actions, asegúrate de capturar errores:

```typescript
'use server'

import { captureException } from '@/lib/monitoring'

export async function serverAction(formData: FormData) {
  try {
    // ... operation
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)), {
      action: 'server-action',
      metadata: { formData: Object.fromEntries(formData) },
    })
    return { success: false, error: 'Error al procesar' }
  }
}
```

### tRPC Routers

Los errores de tRPC se capturan automáticamente en `apps/web/src/app/api/trpc/[trpc]/route.ts`:

```typescript
onError({ error, path }) {
  captureException(error, {
    action: 'trpc-error',
    metadata: {
      path,
      code: error.code,
    },
  })
}
```

**No necesitas capturar manualmente** en cada router, pero puedes añadir contexto adicional:

```typescript
try {
  await operation()
} catch (error) {
  logger.error('Operation failed', error, { userId: ctx.userId })
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Error message',
    cause: error,
  })
}
```

### Workers (Inngest)

Los workers deben usar el logger estructurado:

```typescript
import { logger } from '@wallie/workers/lib/logger'

export const myWorker = inngest.createFunction(
  { id: 'my-worker' },
  { event: 'my.event' },
  async ({ event }) => {
    try {
      await operation()
    } catch (error) {
      logger.error('Worker failed', error, {
        eventId: event.id,
        userId: event.data.userId,
      })
      throw error // Inngest manejará el retry
    }
  }
)
```

---

## 📊 MÉTRICAS Y MONITOREO

### Dashboard de Sentry

Accede a: `https://sentry.io/organizations/[org]/projects/[project]/`

**Métricas clave:**

- **Error Rate** - Errores por minuto
- **Affected Users** - Usuarios afectados
- **Top Errors** - Errores más frecuentes
- **Performance** - Latencia de operaciones

### Alertas Recomendadas

Configurar en Sentry Dashboard:

1. **Critical Errors** (> 5 errores en 1 minuto)
2. **API Timeouts** (> 10 timeouts en 5 minutos)
3. **Database Errors** (> 3 errores en 1 minuto)
4. **New Error Types** (Nuevos tipos de error)

---

## 🔗 REFERENCIAS

- [Sentry Setup Guide](./SENTRY_SETUP.md)
- [Sentry Alerts Setup](./SENTRY_ALERTS_SETUP.md)
- [CLAUDE.md - Seguridad](../CLAUDE.md#-seguridad)
- [Standards - Error Handling](../STANDARDS.md#error-handling)

---

_Última actualización: 31 Dic 2025_

