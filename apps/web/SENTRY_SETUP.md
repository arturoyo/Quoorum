# 🔴 Setup de Sentry para Quoorum

> **Estado:** ⚪ PREPARADO pero NO instalado
>
> **Archivos creados:**
> - ✅ `instrumentation.ts` - Entry point
> - ✅ `sentry.client.config.ts` - Client-side
> - ✅ `sentry.server.config.ts` - Server-side
> - ✅ `sentry.edge.config.ts` - Edge Runtime

---

## 🚀 Instalación Rápida (5 minutos)

### 1. Instalar dependencia

```bash
pnpm add @sentry/nextjs
```

### 2. Obtener DSN de Sentry

1. Ir a [sentry.io](https://sentry.io)
2. Crear proyecto (o usar existente)
3. Copiar el DSN (formato: `https://xxx@xxx.ingest.sentry.io/xxx`)

### 3. Configurar variables de entorno

Añadir a `.env.local` (desarrollo):
```bash
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

Añadir a Vercel Dashboard (producción):
```bash
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ORG=tu-organizacion
SENTRY_PROJECT=quoorum
```

### 4. Descomentar código en archivos de configuración

Editar estos 3 archivos y descomentar el código:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`

(Buscar `// ⚠️ DESCOMENTAR CUANDO SENTRY ESTÉ INSTALADO`)

### 5. Habilitar instrumentationHook en Next.js

Editar `next.config.ts`:
```typescript
const nextConfig: NextConfig = {
  // ... configuración existente
  experimental: {
    instrumentationHook: true, // ✅ Añadir esta línea
  },
}
```

### 6. Verificar funcionamiento

```bash
pnpm dev
```

Deberías ver en consola:
```
✅ Sentry initialized
```

Si no ves nada, asegúrate de que las variables de entorno están correctas.

---

## 📊 Funcionalidades Configuradas

### ✅ Client-Side (navegador)
- **Auto-captura de errores** no manejados
- **Session Replay** (grabaciones de sesión cuando hay error)
- **Browser Tracing** (performance)
- **Redacción de datos sensibles** (tokens, passwords, etc.)

### ✅ Server-Side (API routes)
- **Captura de errores** en API routes y Server Components
- **Node Profiling** (performance profiling)
- **Redacción automática** de headers sensibles (Authorization, Cookie)
- **Filtrado de TRPCError** (ya manejados)

### ✅ Edge Runtime (middleware)
- **Captura de errores** en middleware y edge functions
- **Redacción de headers** sensibles
- **Ignorar redirects** de Next.js

---

## 🔍 Testing

### Probar captura de errores del cliente:

Crear una ruta temporal en `apps/web/src/app/test-error/page.tsx`:
```tsx
'use client'

export default function TestError() {
  return (
    <button onClick={() => { throw new Error('Test error from client') }}>
      Lanzar error de prueba
    </button>
  )
}
```

Click en el botón → Error debería aparecer en Sentry.

### Probar captura de errores del servidor:

Crear en `apps/web/src/app/api/test-error/route.ts`:
```typescript
export async function GET() {
  throw new Error('Test error from server')
}
```

Visitar `/api/test-error` → Error debería aparecer en Sentry.

---

## 🎛️ Configuración Avanzada

### Cambiar sample rates (% de eventos enviados)

Editar en cada archivo `sentry.*.config.ts`:
```typescript
// Enviar 100% de errores, 10% de traces de performance
tracesSampleRate: 0.1

// Enviar 100% de session replays cuando hay error, 10% de sesiones normales
replaysOnErrorSampleRate: 1.0
replaysSessionSampleRate: 0.1
```

### Añadir contexto custom a errores

```typescript
import * as Sentry from '@sentry/nextjs'

// En cualquier parte del código
Sentry.setUser({
  id: userId,
  email: userEmail,
})

Sentry.setContext('debate', {
  debateId: '123',
  question: 'Should we...',
})

// Errores subsecuentes incluirán este contexto
```

### Capturar errores manualmente

```typescript
import * as Sentry from '@sentry/nextjs'

try {
  // Código que puede fallar
} catch (error) {
  Sentry.captureException(error, {
    level: 'error',
    tags: {
      feature: 'debates',
    },
    extra: {
      debateId: '123',
    },
  })
}
```

---

## 🚫 Si decides NO usar Sentry

El sistema de logging local seguirá funcionando sin problemas:

1. **Auto-captura de errores** → `apps/web/src/lib/logger.ts`
2. **Logs enviados al backend** → `systemLogs.createBatch` router
3. **Error Boundaries** → `error.tsx`, `global-error.tsx`

Sentry es **opcional** pero **recomendado** para producción.

---

## 📚 Documentación Oficial

- [Sentry Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Next.js Instrumentation](https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation)

---

_Última actualización: 2026-01-19_
