# 📊 Configuración de Monitoreo - Sentry y PostHog

**Fecha:** 31 Dic 2025
**Estado:** ✅ Estructura lista - Solo falta añadir variables de entorno en Vercel

---

## 🎯 Resumen

La estructura de monitoreo está completamente preparada y lista para activarse. Solo necesitas añadir las variables de entorno en Vercel para activar Sentry y PostHog.

---

## 🔍 Sentry - Error Tracking

### ✅ Estructura Implementada

Sentry está configurado en tres archivos que se cargan automáticamente:

1. **`apps/web/sentry.client.config.ts`** - Error tracking en el navegador
2. **`apps/web/sentry.server.config.ts`** - Error tracking en el servidor Node.js
3. **`apps/web/sentry.edge.config.ts`** - Error tracking en Edge Runtime (middleware)

### 📋 Variables de Entorno Requeridas

Añade estas variables en **Vercel Dashboard → Settings → Environment Variables**:

```bash
# Client-side (browser)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@o123456.ingest.us.sentry.io/123456

# Server-side (Node.js)
SENTRY_DSN=https://xxx@o123456.ingest.us.sentry.io/123456
```

### 🔧 Configuración Actual

- ✅ **Performance Monitoring:** 10% de transacciones (tracesSampleRate: 0.1)
- ✅ **Session Replay:** 10% de sesiones normales, 100% con errores
- ✅ **Filtrado de datos sensibles:** Tokens, cookies, headers eliminados
- ✅ **Ignora errores comunes:** Network errors, extension errors, etc.
- ✅ **Solo activo en producción:** Se habilita automáticamente cuando `NODE_ENV=production` y hay DSN configurado

### 📝 Uso en el Código

Sentry se integra automáticamente con el sistema de logging:

```typescript
import { captureException, captureMessage } from '@/lib/monitoring'

// Capturar excepciones
try {
  // código que puede fallar
} catch (error) {
  captureException(error, { context: 'additional info' })
}

// Capturar mensajes
captureMessage('Algo importante ocurrió', 'info', { userId: '123' })
```

---

## 📈 PostHog - Product Analytics

### ✅ Estructura Implementada

PostHog está configurado y listo para usar:

1. **`apps/web/src/components/providers/posthog-provider/provider.tsx`** - Provider de PostHog
2. **`apps/web/src/components/providers/posthog-provider/client.ts`** - Cliente y funciones helper
3. **`apps/web/src/components/client-layout-providers.tsx`** - PostHogProvider habilitado

### 📋 Variables de Entorno Requeridas

Añade estas variables en **Vercel Dashboard → Settings → Environment Variables**:

```bash
# PostHog API Key (público, seguro para exponer en cliente)
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# PostHog Host (opcional, por defecto usa eu.posthog.com)
NEXT_PUBLIC_POSTHOG_HOST=https://eu.posthog.com
```

### 🔧 Configuración Actual

- ✅ **Privacy-first:** Mask all text habilitado
- ✅ **Session Recording:** Mask all inputs habilitado
- ✅ **Respect Do Not Track:** Respeta la preferencia del usuario
- ✅ **Pageview tracking:** Automático en cada navegación
- ✅ **Feature flags:** Listo para usar

### 📝 Uso en el Código

```typescript
import {
  trackEvent,
  identifyUser,
  resetUser,
  getFeatureFlag,
} from '@/components/providers/posthog-provider/client'

// Trackear eventos
trackEvent('user_signed_up', { method: 'email' })
trackEvent('client_created', { clientId: '123' })
trackEvent('ai_suggestion_used', { suggestionType: 'quick_reply' })

// Identificar usuario
identifyUser(userId, {
  email: user.email,
  plan: user.plan,
  createdAt: user.createdAt,
})

// Resetear al hacer logout
resetUser()

// Feature flags
const isNewFeatureEnabled = getFeatureFlag('new-feature') === true
```

---

## 🚀 Activación

### Paso 1: Obtener Credenciales

1. **Sentry:**
   - Ve a https://sentry.io
   - Crea un proyecto (o usa uno existente)
   - Copia el DSN (Data Source Name)

2. **PostHog:**
   - Ve a https://posthog.com
   - Crea un proyecto (o usa uno existente)
   - Ve a Project Settings → API Keys
   - Copia el Project API Key

### Paso 2: Añadir Variables en Vercel

1. Ve a **Vercel Dashboard → Tu Proyecto → Settings → Environment Variables**
2. Añade las siguientes variables:

```bash
# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://xxx@o123456.ingest.us.sentry.io/123456
SENTRY_DSN=https://xxx@o123456.ingest.us.sentry.io/123456

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://eu.posthog.com  # Opcional
```

3. Selecciona los entornos donde aplicar (Production, Preview, Development)
4. Haz clic en **Save**

### Paso 3: Redeploy

Después de añadir las variables, Vercel redeployará automáticamente. O puedes hacerlo manualmente:

```bash
# Desde Vercel Dashboard
# O desde CLI
vercel --prod
```

### Paso 4: Verificar

1. **Sentry:**
   - Abre la app en producción
   - Genera un error (puedes usar la consola del navegador)
   - Ve a Sentry Dashboard → Issues
   - Deberías ver el error capturado

2. **PostHog:**
   - Abre la app en producción
   - Navega por algunas páginas
   - Ve a PostHog Dashboard → Events
   - Deberías ver los eventos `$pageview` capturados

---

## 🔒 Seguridad

### Sentry

- ✅ **Filtrado automático:** Tokens, cookies, headers sensibles se eliminan antes de enviar
- ✅ **Solo producción:** No se activa en desarrollo local
- ✅ **Source maps:** Solo se suben en builds de producción

### PostHog

- ✅ **Mask all text:** Todo el texto se enmascara por defecto
- ✅ **Mask all inputs:** Todos los inputs se enmascaran
- ✅ **Respect DNT:** Respeta la preferencia "Do Not Track" del navegador
- ✅ **API key público:** Es seguro exponer `NEXT_PUBLIC_POSTHOG_KEY` (es un key de proyecto, no secreto)

---

## 📊 Monitoreo de Estado

Puedes verificar el estado de la configuración en desarrollo:

```typescript
import { checkMonitoringConfig } from '@/lib/monitoring-init'

// En desarrollo, esto mostrará el estado en la consola
checkMonitoringConfig()
```

---

## 🐛 Troubleshooting

### Sentry no captura errores

1. Verifica que `NEXT_PUBLIC_SENTRY_DSN` esté configurado
2. Verifica que `NODE_ENV=production` en Vercel
3. Revisa la consola del navegador para errores de inicialización
4. Verifica que el DSN sea válido en Sentry Dashboard

### PostHog no trackea eventos

1. Verifica que `NEXT_PUBLIC_POSTHOG_KEY` esté configurado
2. Verifica que PostHogProvider esté en el árbol de componentes
3. Revisa la consola del navegador para errores de inicialización
4. Verifica que el API key sea válido en PostHog Dashboard

### Errores de TypeScript

Si ves errores de tipos relacionados con Sentry o PostHog:

```bash
# Reinstalar dependencias
pnpm install

# Verificar tipos
pnpm typecheck
```

---

## 📚 Documentación Adicional

- **Sentry:** https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **PostHog:** https://posthog.com/docs/integrate/client/react
- **Configuración actual:** Ver `apps/web/sentry.*.config.ts` y `apps/web/src/components/providers/posthog-provider/`

---

**Estado:** ✅ **LISTO PARA ACTIVAR** - Solo falta añadir variables de entorno en Vercel
