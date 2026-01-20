# 🔄 Inngest Setup Guide - Activar Workers en Quoorum

> **Versión:** 1.0.0 | **Fecha:** 20 Ene 2026
> **Para:** Configurar y activar workers de Inngest (incluido Auto-Healer)

---

## 📋 ¿Qué es Inngest?

**Inngest** es un sistema de background jobs que ejecuta tareas en segundo plano:

- ⏰ **Cron jobs** - Tareas programadas (cada 5 min, diario, semanal)
- 🎯 **Event-driven** - Tareas que se ejecutan al recibir un evento
- 🔄 **Retry automático** - Si falla, reintenta automáticamente
- 📊 **Dashboard** - Monitoreo visual de todas las ejecuciones

### Arquitectura Simple

```
Inngest Cloud ──(HTTP)──> tu-app.com/api/inngest ──> Workers ejecutan
     │                            │
     │                            ├─> nextjsAutoHealer (cada 5min)
     │                            ├─> quoorumWeeklyDigest (lunes 9am)
     │                            └─> otros workers...
     │
  (Schedule)                   (Tu código)
```

---

## 🚀 Paso 1: Modo Desarrollo (Local)

En **desarrollo**, Inngest funciona en modo **"Dev Server"** SIN necesidad de cuenta.

### 1.1 Instalar Inngest CLI (Opcional pero recomendado)

```bash
# Con npm
npm install -g inngest-cli

# Con pnpm
pnpm add -g inngest-cli

# Verificar instalación
inngest version
```

### 1.2 Iniciar Dev Server de Inngest

**Opción A: Desde tu app Next.js (Recomendado)**

```bash
# Terminal 1: Iniciar Next.js
pnpm dev

# Tu app ya expone /api/inngest que Inngest puede llamar
# Abre: http://localhost:3000/api/inngest
# Deberías ver una página de Inngest con tus funciones listadas
```

**Opción B: Con Inngest CLI**

```bash
# Terminal 1: Next.js
pnpm dev

# Terminal 2: Inngest Dev Server
inngest dev

# El dev server se conectará automáticamente a http://localhost:3000/api/inngest
```

### 1.3 Verificar que el Auto-Healer está Registrado

1. Abre en el navegador:
   ```
   http://localhost:3000/api/inngest
   ```

2. Deberías ver una página con una lista de funciones:
   ```
   ✅ nextjs-auto-healer
   ✅ nextjs-auto-healer-manual
   ✅ quoorum-debate-completed
   ✅ quoorum-weekly-digest
   ... etc
   ```

3. Si ves el auto-healer en la lista, **¡está activado!** 🎉

### 1.4 Trigger Manual del Auto-Healer (Testing)

Para probarlo inmediatamente sin esperar 5 minutos:

```bash
# Con Inngest CLI
inngest send nextjs/auto-healer.trigger

# O desde código TypeScript
import { inngest } from '@quoorum/workers'

await inngest.send({
  name: 'nextjs/auto-healer.trigger',
  data: {}
})
```

---

## 🌐 Paso 2: Modo Producción (Inngest Cloud)

Para **producción**, necesitas una cuenta de Inngest Cloud.

### 2.1 Crear Cuenta de Inngest

1. Ve a: https://app.inngest.com/sign-up
2. Crea una cuenta (gratis hasta 1M de ejecuciones/mes)
3. Crea un nuevo "App"

### 2.2 Obtener Credenciales

En el dashboard de Inngest:

1. Ve a **Settings** → **Keys**
2. Copia estas 2 claves:
   - **Event Key**: `inngest-event-key-...`
   - **Signing Key**: `signkey-prod-...`

### 2.3 Configurar Variables de Entorno

**En Desarrollo (.env.local):**

```bash
# Inngest (opcional en dev)
INNGEST_EVENT_KEY=inngest-event-key-dev-...
INNGEST_SIGNING_KEY=signkey-dev-...
```

**En Producción (Vercel/Railway/etc):**

```bash
# Inngest Cloud (OBLIGATORIO en producción)
INNGEST_EVENT_KEY=inngest-event-key-prod-...
INNGEST_SIGNING_KEY=signkey-prod-...
```

### 2.4 Sync de Funciones a Inngest Cloud

Una vez configuradas las variables, Inngest automáticamente detecta tus funciones:

```bash
# Deploy a producción
git push origin main

# Vercel/Railway automáticamente:
# 1. Hace build de tu app
# 2. Expone /api/inngest
# 3. Inngest Cloud lo detecta y empieza a ejecutar workers
```

### 2.5 Verificar en Dashboard de Inngest

1. Ve a: https://app.inngest.com
2. Navega a **Functions**
3. Deberías ver:
   ```
   nextjs-auto-healer          ← Schedule: */5 * * * *
   nextjs-auto-healer-manual   ← Event: nextjs/auto-healer.trigger
   quoorum-debate-completed    ← Event: quoorum/debate.completed
   ... etc
   ```

4. Si ves el auto-healer, **¡está corriendo en producción!** 🚀

---

## 📊 Paso 3: Monitorear el Auto-Healer

### 3.1 Ver Ejecuciones en Inngest Dashboard

1. Ve a: https://app.inngest.com
2. Click en **Functions** → **nextjs-auto-healer**
3. Verás:
   - 📅 **Runs** - Historial de todas las ejecuciones
   - ⏱️ **Duration** - Cuánto tardó cada ejecución
   - ✅/❌ **Status** - Éxito o fallo
   - 📝 **Logs** - Output de cada ejecución

### 3.2 Ver Correcciones Aplicadas en TIMELINE.md

```bash
# Ver últimas correcciones del auto-healer
grep -A 10 "AUTO-HEALER" TIMELINE.md

# Ver solo resultados exitosos
grep "✅ Correcciones aplicadas" TIMELINE.md
```

### 3.3 Ver Logs en Consola

Si ejecutaste con Inngest CLI, verás logs en tiempo real:

```
[Inngest] nextjs-auto-healer started
[Auto-Healer] Starting health check...
[Auto-Healer] Detected errors { total: 3 }
[Auto-Healer] Applying fix { file: 'chart.tsx' }
[Auto-Healer] Fix applied successfully
[Auto-Healer] 🔧 Auto-healing summary { fixesApplied: 3 }
[Inngest] nextjs-auto-healer completed in 2.3s
```

---

## 🔧 Configuración Avanzada

### Cambiar Frecuencia del Auto-Healer

**Ubicación:** `packages/workers/src/functions/nextjs-auto-healer.ts`

```typescript
const AUTO_HEAL_CONFIG = {
  cronSchedule: '*/5 * * * *', // ← Cambiar aquí
}
```

**Ejemplos de Cron:**

| Cron | Descripción |
|------|-------------|
| `*/1 * * * *` | Cada 1 minuto (⚠️ muy frecuente) |
| `*/5 * * * *` | Cada 5 minutos (recomendado) |
| `*/15 * * * *` | Cada 15 minutos |
| `0 * * * *` | Cada hora |
| `0 9 * * 1-5` | Lunes a Viernes a las 9 AM |

### Desactivar Temporalmente el Auto-Healer

**Opción 1: Comentar en route.ts**

```typescript
// apps/web/src/app/api/inngest/route.ts
functions: [
  // ... otros workers
  // nextjsAutoHealer,        // ← Comentar para desactivar
  // nextjsAutoHealerManual,  // ← Comentar para desactivar
]
```

**Opción 2: Pausar desde Inngest Dashboard**

1. Ve a Functions → nextjs-auto-healer
2. Click en **Pause** (botón en la esquina)
3. El worker no se ejecutará hasta que lo reactives

### Configurar Notificaciones

En el dashboard de Inngest:

1. Ve a **Settings** → **Notifications**
2. Configura notificaciones por:
   - Slack
   - Email
   - Webhook
3. Recibe alertas cuando:
   - Un worker falla
   - Un worker tarda más de X segundos
   - Hay errores críticos

---

## 🐛 Troubleshooting

### Problema 1: "No veo el auto-healer en /api/inngest"

**Solución:**

```bash
# 1. Verificar que el worker está exportado
cat packages/workers/src/index.ts | grep nextjsAutoHealer

# 2. Rebuild del paquete workers
cd packages/workers
pnpm build

# 3. Reiniciar Next.js
pnpm dev
```

### Problema 2: "Worker no se ejecuta cada 5 minutos"

**Posibles causas:**

1. **En desarrollo**: Inngest dev server no está corriendo
   ```bash
   inngest dev
   ```

2. **En producción**: Variables de entorno faltantes
   ```bash
   # Verificar en Vercel/Railway que existen:
   INNGEST_EVENT_KEY
   INNGEST_SIGNING_KEY
   ```

3. **Worker pausado**: Revisar dashboard de Inngest

### Problema 3: "Error: inngest is not a function"

**Solución:**

El stub de desarrollo está activo. Esto es normal si no tienes `INNGEST_EVENT_KEY`.

```typescript
// packages/workers/src/client.ts verifica:
if (isDev && !process.env.INNGEST_EVENT_KEY) {
  // Usa stub (solo logs, no ejecuta realmente)
}
```

Para probarlo realmente en dev:

```bash
# Añadir a .env.local
INNGEST_EVENT_KEY=any-value-for-dev

# Reiniciar
pnpm dev
```

### Problema 4: "Workers se ejecutan 2 veces"

Si tienes:
- Inngest CLI corriendo (`inngest dev`)
- Y el endpoint Next.js expuesto

Puede que se registren 2 veces. Solución: usa solo uno.

---

## 📚 Recursos Útiles

- **Documentación oficial**: https://www.inngest.com/docs
- **Dashboard**: https://app.inngest.com
- **Ejemplos de cron**: https://crontab.guru/
- **Pricing**: https://www.inngest.com/pricing (1M ejecuciones gratis/mes)

---

## 📋 Checklist de Activación

Para asegurarte de que el auto-healer está activo:

### Desarrollo:
- [ ] Next.js corriendo en `http://localhost:3000`
- [ ] Endpoint `/api/inngest` accesible
- [ ] Auto-healer visible en la lista de funciones
- [ ] Trigger manual funciona
- [ ] TIMELINE.md se actualiza después de ejecución

### Producción:
- [ ] Cuenta de Inngest creada
- [ ] Variables `INNGEST_EVENT_KEY` y `INNGEST_SIGNING_KEY` configuradas
- [ ] App deployada en Vercel/Railway/etc
- [ ] Auto-healer visible en dashboard de Inngest
- [ ] Runs aparecen cada 5 minutos
- [ ] TIMELINE.md se actualiza automáticamente

---

## 🎯 Resumen Rápido

```bash
# 1. Desarrollo Local (Testing)
pnpm dev                          # Iniciar Next.js
# Abrir: http://localhost:3000/api/inngest
# Ver que nextjs-auto-healer está listado

# 2. Trigger Manual (Testing inmediato)
inngest send nextjs/auto-healer.trigger

# 3. Producción (Inngest Cloud)
# Configurar INNGEST_EVENT_KEY + INNGEST_SIGNING_KEY
# Deploy → Auto-healer corre cada 5 min automáticamente

# 4. Monitoreo
grep "AUTO-HEALER" TIMELINE.md    # Ver correcciones locales
# Dashboard: https://app.inngest.com/runs
```

---

**Última actualización:** 20 Ene 2026
**Versión:** 1.0.0
