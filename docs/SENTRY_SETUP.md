# 🔍 Sentry - Configuración y Uso en Wallie

> **Última actualización:** 31 Dic 2025
> **Estado:** ✅ Configurado (Plan Free optimizado)

---

## 📋 ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Configuración Actual](#configuración-actual)
3. [Variables de Entorno](#variables-de-entorno)
4. [Captura Automática de Errores tRPC](#captura-automática-de-errores-trpc)
5. [Límites del Plan Free](#límites-del-plan-free)
6. [Cómo Consultar Errores](#cómo-consultar-errores)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 RESUMEN EJECUTIVO

**Sentry está configurado y listo para capturar errores en producción.**

### Características Implementadas

✅ **Error Tracking** - Captura automática de excepciones
✅ **Performance Monitoring** - 10% de transacciones (tracesSampleRate: 0.1)
✅ **Session Replay** - 10% de sesiones normales, 100% con errores
✅ **Source Maps** - Upload automático en builds de producción
✅ **tRPC Integration** - Errores de API capturados automáticamente
✅ **Filtrado de Datos Sensibles** - Tokens, cookies, headers eliminados

### Configuración Optimizada para Plan Free

| Métrica                  | Configurado | Objetivo                           |
| ------------------------ | ----------- | ---------------------------------- |
| **tracesSampleRate**     | 0.1 (10%)   | Mantenerse en límite Free          |
| **replaysSessionRate**   | 0.1 (10%)   | Optimizar cuota de replays         |
| **replaysOnErrorRate**   | 1.0 (100%)  | Capturar todos los errores         |
| **productionSourceMaps** | false       | No enviar source maps innecesarios |

**Resultado:** ✅ Siempre dentro del límite gratuito de Sentry

---

## ⚙️ CONFIGURACIÓN ACTUAL

### Archivos de Configuración

```
apps/web/
├── sentry.client.config.ts   # Browser error tracking
├── sentry.server.config.ts   # Node.js server error tracking
├── sentry.edge.config.ts     # Edge Runtime (middleware)
├── next.config.js            # Sentry webpack plugin
└── .sentryclirc              # CLI configuration
```

### sentry.client.config.ts

```typescript
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === 'production' && !!SENTRY_DSN,

  // Performance: 10% de transacciones
  tracesSampleRate: 0.1,

  // Session Replay: 10% normal, 100% con errores
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Filtrado de datos sensibles
  beforeSend(event) {
    // Elimina tokens, códigos, emails de URLs
    if (event.request?.url) {
      const url = new URL(event.request.url)
      url.searchParams.delete('token')
      url.searchParams.delete('code')
      url.searchParams.delete('email')
      event.request.url = url.toString()
    }
    return event
  },

  // Ignora errores comunes no accionables
  ignoreErrors: [
    'Network request failed',
    'Failed to fetch',
    'chrome-extension://',
    'ResizeObserver loop',
  ],
})
```

### sentry.server.config.ts

```typescript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: process.env.NODE_ENV === 'production' && !!SENTRY_DSN,

  // Performance: 10%
  tracesSampleRate: 0.1,

  // Filtrado de headers sensibles
  beforeSend(event) {
    if (event.request?.headers) {
      delete event.request.headers['authorization']
      delete event.request.headers['cookie']
      delete event.request.headers['x-api-key']
    }
    return event
  },

  // Ignora errores esperados de tRPC
  ignoreErrors: ['UNAUTHORIZED', 'NOT_FOUND', 'TOO_MANY_REQUESTS'],
})
```

---

## 🔑 VARIABLES DE ENTORNO

### Desarrollo Local (.env.local)

```bash
# Solo DSN necesario en desarrollo (errores no se envían)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@o123456.ingest.us.sentry.io/123456
SENTRY_DSN=https://xxx@o123456.ingest.us.sentry.io/123456
```

### Producción (Vercel Dashboard)

```bash
# Error tracking (obligatorio)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@o123456.ingest.us.sentry.io/123456
SENTRY_DSN=https://xxx@o123456.ingest.us.sentry.io/123456

# Source maps upload (opcional, recomendado)
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=wallie-web
SENTRY_AUTH_TOKEN=sntrys_xxx
```

### Cómo Obtener las Credenciales

1. **SENTRY_DSN:**
   - Login en https://sentry.io
   - Ir a Settings → Projects → wallie-web → Client Keys (DSN)

2. **SENTRY_AUTH_TOKEN:**
   - Ir a Settings → Account → API → Auth Tokens
   - Create New Token
   - Scopes necesarios: `project:releases`, `project:write`
   - Copiar token (empieza con `sntrys_`)

3. **SENTRY_ORG y SENTRY_PROJECT:**
   - Visibles en la URL de Sentry: `https://sentry.io/organizations/{org}/projects/{project}/`

---

## 🔌 CAPTURA AUTOMÁTICA DE ERRORES tRPC

### ¿Cómo Funciona?

Sentry **automáticamente** captura errores de tRPC sin configuración adicional porque:

1. **Errores No Capturados:** Los errores `TRPCError` que no se manejan se propagan hasta Sentry
2. **Middleware de Next.js:** Sentry intercepta todas las excepciones en API routes
3. **React Error Boundaries:** Los errores en el cliente se capturan automáticamente

### Ejemplo de Error Capturado

**En el código (packages/api/src/routers/clients.ts):**

```typescript
export const clientsRouter = router({
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [client] = await db
        .select()
        .from(clients)
        .where(and(eq(clients.id, input.id), eq(clients.userId, ctx.userId)))

      if (!client) {
        // Este error será capturado por Sentry
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Cliente no encontrado',
        })
      }

      return client
    }),
})
```

**En Sentry Dashboard verás:**

```
TRPCError: NOT_FOUND
Message: Cliente no encontrado
Location: packages/api/src/routers/clients.ts:42
User: user-uuid-123
Environment: production
Tags:
  - trpc.procedure: clients.getById
  - trpc.path: clients.getById
  - userId: user-uuid-123
```

### Errores que Se Ignoran (Configurado)

Estos errores **no** se envían a Sentry porque son esperados:

```typescript
ignoreErrors: [
  'UNAUTHORIZED', // Usuario no autenticado (esperado)
  'NOT_FOUND', // Recurso no encontrado (esperado)
  'TOO_MANY_REQUESTS', // Rate limiting (esperado)
]
```

### Cómo Ver Errores de tRPC en Sentry

1. Login en https://sentry.io
2. Ir a **Issues** → Filter por `trpc`
3. Click en un issue para ver:
   - Stack trace completo
   - User context (userId, email)
   - Request context (input, headers)
   - Breadcrumbs (acciones previas del usuario)
   - Session Replay (si hubo error)

---

## 📊 LÍMITES DEL PLAN FREE

### Cuotas Mensuales de Sentry Free

| Métrica            | Límite Free | Configurado | Estado |
| ------------------ | ----------- | ----------- | ------ |
| **Errors**         | 5,000/mes   | Sin límite  | ✅     |
| **Performance**    | 10,000 txn  | 10% sample  | ✅     |
| **Session Replay** | 50/mes      | 10% + 100%  | ✅     |
| **Attachments**    | 1 GB        | Source maps | ✅     |

### Cálculo de Uso Esperado

**Asumiendo 10,000 requests/mes:**

- **Errors:** ~50-100 errores/mes (bien dentro de 5,000)
- **Performance:** 1,000 transacciones (10% de 10,000) ✅
- **Session Replay:** ~5-10 replays/mes (10% de 100 sesiones) ✅

**Resultado:** ✅ Uso conservador, siempre dentro del Free tier

### Qué Hacer Si Se Excede el Límite

1. **Reducir tracesSampleRate:**

   ```typescript
   tracesSampleRate: 0.05, // 5% en lugar de 10%
   ```

2. **Reducir replaysSessionSampleRate:**

   ```typescript
   replaysSessionSampleRate: 0.05, // 5% en lugar de 10%
   ```

3. **Añadir más errores a ignoreErrors:**
   ```typescript
   ignoreErrors: [
     'UNAUTHORIZED',
     'NOT_FOUND',
     'TOO_MANY_REQUESTS',
     'BAD_REQUEST', // Añadir este
   ],
   ```

---

## 🔍 CÓMO CONSULTAR ERRORES

### Dashboard de Sentry

1. **Login:** https://sentry.io
2. **Seleccionar Proyecto:** wallie-web
3. **Ver Issues:** Menú lateral → Issues

### Filtros Útiles

```
# Errores del Wizard V2
is:unresolved path:*wizard*

# Errores de tRPC
is:unresolved trpc.procedure:*

# Errores por usuario específico
is:unresolved user.id:user-uuid-123

# Errores de los últimos 7 días
is:unresolved age:-7d
```

### Configurar Alertas

1. **Ir a Alerts → Create Alert Rule**
2. **Configurar:**
   - Condition: When an issue is first seen
   - Filter: `path:*wizard*` (para Wizard V2)
   - Actions: Send email to arturo@wallie.pro

3. **Guardar Alert Rule**

Ahora recibirás un email cada vez que haya un error nuevo en el Wizard.

---

## 🛠️ TROUBLESHOOTING

### Problema: No veo errores en Sentry

**Solución:**

1. Verificar que estás en **producción** (Sentry solo activa en `NODE_ENV=production`)
2. Verificar que `NEXT_PUBLIC_SENTRY_DSN` está configurado en Vercel
3. Verificar que el error no está en `ignoreErrors`
4. Verificar en Sentry → Project Settings → Inbound Filters

### Problema: Source maps no se suben

**Solución:**

1. Verificar que `SENTRY_AUTH_TOKEN` está configurado en Vercel
2. Verificar que `SENTRY_ORG` y `SENTRY_PROJECT` son correctos
3. Verificar permisos del token: `project:releases`, `project:write`
4. Ver logs de build en Vercel para errores de Sentry CLI

### Problema: Demasiados errores capturados

**Solución:**

1. Añadir errores comunes a `ignoreErrors` en `sentry.client.config.ts`
2. Usar `beforeSend` para filtrar errores programáticamente:
   ```typescript
   beforeSend(event) {
     // Ignorar errores de desarrollo
     if (event.environment === 'development') {
       return null
     }
     return event
   }
   ```

### Problema: Excediendo cuota de Performance

**Solución:**

1. Reducir `tracesSampleRate` a 0.05 (5%)
2. Añadir filtering por ruta:
   ```typescript
   tracesSampler(samplingContext) {
     // 100% para rutas críticas
     if (samplingContext.transactionContext.name.includes('/api/checkout')) {
       return 1.0
     }
     // 5% para todo lo demás
     return 0.05
   }
   ```

---

## 📚 RECURSOS

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Sentry Session Replay](https://docs.sentry.io/product/session-replay/)
- [Sentry tRPC Integration](https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/integrations/trpc/)

---

## ✅ CHECKLIST DE CONFIGURACIÓN

- [x] Sentry instalado (`@sentry/nextjs`)
- [x] `sentry.client.config.ts` configurado con `tracesSampleRate: 0.1`
- [x] `sentry.server.config.ts` configurado con `tracesSampleRate: 0.1`
- [x] `sentry.edge.config.ts` configurado con `tracesSampleRate: 0.1`
- [x] `next.config.js` wrapeado con `withSentryConfig`
- [x] `.sentryclirc` creado
- [x] Variables de entorno documentadas en `.env.example`
- [x] Datos sensibles filtrados con `beforeSend`
- [x] Errores comunes ignorados con `ignoreErrors`
- [ ] `SENTRY_DSN` configurado en Vercel (requiere configuración manual)
- [ ] `SENTRY_AUTH_TOKEN` configurado en Vercel (opcional, para source maps)
- [ ] Alert configurado para errores del Wizard V2 (opcional)

---

**Última actualización:** 31 Dic 2025
**Mantenido por:** Equipo Wallie
**Versión:** 1.0.0
