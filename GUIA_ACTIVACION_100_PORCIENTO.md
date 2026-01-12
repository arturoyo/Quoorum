# 🚀 Guía de Activación al 100% - Wallie Project

> **Fecha:** 3 Enero 2025
> **Objetivo:** Llevar Wallie al 100% de éxito
> **Tiempo estimado:** 45-60 minutos

---

## 🎯 MISIÓN

Activar todas las funcionalidades y garantizar que el proyecto esté al **100% de éxito** antes de deployment.

---

## ✅ PASO 1: MIGRACIÓN DE BASE DE DATOS (5 minutos) 🔴 CRÍTICO

### ⚠️ **BLOQUEANTE** - Sin esto, el wizard NO funcionará

**Archivo:** `packages/db/src/migrations/0034_add_wizard_v2_columns.sql`

**Instrucciones paso a paso:**

1. **Abrir Supabase:**
   - Ve a: https://supabase.com/dashboard
   - Selecciona tu proyecto Wallie

2. **Abrir SQL Editor:**
   - Click en **SQL Editor** (sidebar izquierdo)
   - Click en **New query** (botón verde arriba)

3. **Ejecutar migración:**
   - Abre el archivo: `packages/db/src/migrations/0034_add_wizard_v2_columns.sql`
   - Copia TODO el contenido (Ctrl+A, Ctrl+C)
   - Pégalo en el SQL Editor
   - Click en **Run** (o `Ctrl+Enter`)

4. **Verificar resultado:**
   - Deberías ver: `Success. No rows returned`
   - Si hay error, cópialo y compártelo

5. **Verificar columnas creadas:**
   ```sql
   SELECT column_name, data_type, column_default
   FROM information_schema.columns
   WHERE table_name = 'profiles'
   AND column_name IN ('onboarding_step', 'onboarding_version');
   ```
   - Debe retornar 2 filas

✅ **Marca cuando veas las 2 columnas en la query**

---

## ✅ PASO 2: VARIABLES DE ENTORNO EN VERCEL (15 minutos) 🔴 CRÍTICO

### ⚠️ **BLOQUEANTE** - Sin estas, la app NO funcionará

**URL:** https://vercel.com/dashboard → Tu proyecto → Settings → Environment Variables

### Variables CRÍTICAS (5) - Copia y pega esta lista:

```bash
# 1. DATABASE_URL
# Valor: postgresql://postgres:[password]@[host]:5432/postgres
# Scope: Production, Preview, Development
# ✅ Agregar

# 2. NEXT_PUBLIC_SUPABASE_URL
# Valor: https://[project-ref].supabase.co
# Scope: Production, Preview, Development
# ✅ Agregar

# 3. NEXT_PUBLIC_SUPABASE_ANON_KEY
# Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# Scope: Production, Preview, Development
# ✅ Agregar

# 4. SUPABASE_SERVICE_ROLE_KEY
# Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# Scope: Production, Preview (NO Development)
# ✅ Agregar

# 5. NEXT_PUBLIC_APP_URL
# Valor: https://app.wallie.com (o tu dominio)
# Scope: Production, Preview, Development
# ✅ Agregar
```

**Cómo agregar en Vercel:**
1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto Wallie
3. Settings → Environment Variables
4. Para cada variable:
   - Click en **Add New**
   - Key: (nombre de la variable)
   - Value: (el valor)
   - Scope: Selecciona Production, Preview, Development según corresponda
   - Click en **Save**

**Verificación rápida:**
- Deberías ver las 5 variables listadas
- Cada una debe tener el Scope correcto

✅ **Marca cuando las 5 estén configuradas**

---

## ✅ PASO 3: MONITOREO - SENTRY (10 minutos) 🟠 ALTA PRIORIDAD

### Configurar Sentry para Error Tracking

**1. Crear cuenta/proyecto en Sentry:**
- Ve a: https://sentry.io
- Sign up o Login
- Create New Project → **Next.js**
- Copia el **DSN** (Client Key)

**2. Agregar en Vercel:**
```bash
# Variable: SENTRY_DSN
# Valor: https://xxxxx@xxxx.ingest.sentry.io/xxxxx
# Scope: Production, Preview
```

**3. (Opcional) Para source maps:**
```bash
# Variable: SENTRY_AUTH_TOKEN
# Obtener en: Sentry → Account → API Keys
# Scope: Production
```

**4. Configurar alertas en Sentry:**
- Ve a: Sentry Dashboard → Alerts → Create Alert Rule
- **Error Rate Alert:**
  - When: Error count > 10 in 1 hour
  - Action: Email notification
- **New Issue Alert:**
  - When: First occurrence of issue
  - Action: Email notification

✅ **Marca cuando SENTRY_DSN esté configurado en Vercel**

---

## ✅ PASO 4: ANALYTICS - POSTHOG (10 minutos) 🟠 ALTA PRIORIDAD

### Configurar PostHog para Analytics

**1. Crear cuenta/proyecto en PostHog:**
- Ve a: https://posthog.com
- Sign up o Login
- Create New Project
- Settings → Project API key → Copia el key

**2. Agregar en Vercel:**
```bash
# Variable: NEXT_PUBLIC_POSTHOG_KEY
# Valor: phc_xxxxx
# Scope: Production, Preview, Development

# Variable: NEXT_PUBLIC_POSTHOG_HOST (opcional)
# Valor: https://eu.posthog.com (o tu región)
# Scope: Production, Preview, Development
```

✅ **Marca cuando NEXT_PUBLIC_POSTHOG_KEY esté configurado**

---

## ✅ PASO 5: WEBHOOKS (20 minutos) 🟠 ALTA PRIORIDAD

### Stripe Webhook

**URL:** `https://app.wallie.com/api/webhooks/stripe`

**Configurar:**
1. Ve a: https://dashboard.stripe.com
2. Developers → Webhooks
3. Click en **Add endpoint**
4. **Endpoint URL:** `https://app.wallie.com/api/webhooks/stripe`
5. **Events to send:**
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.paid`
   - ✅ `invoice.payment_failed`
6. Click en **Add endpoint**
7. **Copia el Signing secret** (empieza con `whsec_`)
8. **Agregar en Vercel:**
   ```bash
   # Variable: STRIPE_WEBHOOK_SECRET
   # Valor: whsec_xxxxx
   # Scope: Production
   ```

✅ **Marca cuando el webhook esté configurado y el secret agregado**

### WhatsApp Webhook (Meta)

**URL:** `https://app.wallie.com/api/webhooks/whatsapp`

**Configurar:**
1. Ve a: https://developers.facebook.com
2. Tu App → WhatsApp → Configuration
3. **Webhook URL:** `https://app.wallie.com/api/webhooks/whatsapp`
4. **Verify Token:** (el valor de `WHATSAPP_WEBHOOK_VERIFY_TOKEN` en Vercel)
5. **Webhook Fields:**
   - ✅ `messages`
   - ✅ `message_status`
6. Click en **Verify and Save**

✅ **Marca cuando el webhook esté verificado**

---

## ✅ PASO 6: VERIFICACIÓN LOCAL (5 minutos)

### Ejecutar Script de Verificación

**Windows (PowerShell):**
```powershell
cd C:\_WALLIE
.\scripts\verify-production-readiness.ps1
```

**Linux/Mac:**
```bash
cd /path/to/WALLIE
chmod +x scripts/verify-production-readiness.sh
./scripts/verify-production-readiness.sh
```

**Resultado esperado:**
```
✅ Build exitoso
✅ Migración 0034 existe
✅ ErrorBoundary integrado
✅ No hay console.logs en producción
✅ Proyecto listo para producción
```

Si hay errores, corrígelos antes de continuar.

✅ **Marca cuando el script pase sin errores**

---

## ✅ PASO 7: TEST MANUAL (10 minutos)

### Test del Wizard

1. **Iniciar servidor:**
   ```bash
   pnpm dev
   ```

2. **Abrir navegador:**
   - Ve a: `http://localhost:3000/dashboard`
   - Deberías ver el wizard (NO el sidebar)

3. **Test de completar:**
   - Completa todos los pasos del wizard
   - Verifica que NO hay errores en consola (F12)
   - Al finalizar, deberías ver el dashboard con sidebar

4. **Test de cerrar (admin):**
   - Si eres admin, prueba el botón "Cerrar"
   - Debe cerrar sin errores
   - El sidebar debe aparecer

5. **Test de reanudar:**
   - Completa hasta paso 5
   - Cierra el navegador
   - Reabre y ve a `/dashboard`
   - Debe continuar en paso 5

✅ **Marca cuando todos los tests pasen**

---

## ✅ PASO 8: VERIFICACIÓN DE ERRORES (5 minutos)

### Abrir DevTools (F12)

**Verificar:**
- ❌ **NO** hay errores rojos en Console
- ❌ **NO** hay warnings de React Hooks
- ❌ **NO** hay errores 500 en Network tab
- ✅ Solo logs de desarrollo (si estás en modo desarrollo)

**Errores que NO deberían aparecer:**
- `Rendered more hooks than during the previous render` → ✅ Corregido
- `Failed query: update "profiles"` → ✅ Corregido (después de migración)
- `Hydration errors` → ❌ No debería haber

✅ **Marca cuando no haya errores críticos**

---

## ✅ PASO 9: DEPLOYMENT (5 minutos)

### Pre-Deployment Checklist

- [ ] Migración ejecutada en Supabase
- [ ] 5 variables críticas en Vercel
- [ ] SENTRY_DSN configurado (opcional pero recomendado)
- [ ] NEXT_PUBLIC_POSTHOG_KEY configurado (opcional pero recomendado)
- [ ] Webhooks configurados
- [ ] Tests manuales pasados
- [ ] No hay errores en consola

### Deployment

**Opción 1: Vercel CLI**
```bash
vercel --prod
```

**Opción 2: Git Push (si tienes CI/CD)**
```bash
git add .
git commit -m "feat: optimizations for 100% success"
git push origin main
```

### Post-Deployment

- [ ] Verificar que la app carga: `https://app.wallie.com`
- [ ] Verificar que el wizard funciona
- [ ] Verificar que no hay errores en Sentry (si configurado)
- [ ] Verificar que PostHog está recibiendo eventos (si configurado)

✅ **Marca cuando todo funcione en producción**

---

## 📊 RESUMEN DE ESTADO

### ✅ COMPLETADO (Código)
- ✅ Error Boundaries integrados
- ✅ PostHog analytics configurado
- ✅ Sentry configurado (requiere DSN)
- ✅ Webhooks implementados
- ✅ Fallback de AI providers
- ✅ Wizard reanudable
- ✅ Sidebar responsive
- ✅ Console.logs protegidos para producción
- ✅ Monitoring integrado con Sentry

### ⚠️ PENDIENTE (Requiere Tu Acción)
- [ ] Migración `0034_add_wizard_v2_columns.sql` ejecutada
- [ ] 5 variables críticas en Vercel
- [ ] SENTRY_DSN en Vercel (recomendado)
- [ ] NEXT_PUBLIC_POSTHOG_KEY en Vercel (recomendado)
- [ ] Webhooks configurados en Stripe y WhatsApp

---

## 🎯 CHECKLIST RÁPIDO

Copia esto y marca cada item:

```
[ ] Migración ejecutada en Supabase
[ ] DATABASE_URL en Vercel
[ ] NEXT_PUBLIC_SUPABASE_URL en Vercel
[ ] NEXT_PUBLIC_SUPABASE_ANON_KEY en Vercel
[ ] SUPABASE_SERVICE_ROLE_KEY en Vercel
[ ] NEXT_PUBLIC_APP_URL en Vercel
[ ] SENTRY_DSN en Vercel (opcional)
[ ] NEXT_PUBLIC_POSTHOG_KEY en Vercel (opcional)
[ ] Stripe webhook configurado
[ ] WhatsApp webhook configurado
[ ] Test manual del wizard pasado
[ ] No hay errores en consola
[ ] Deployment a producción exitoso
```

---

## 🚨 SI ALGO FALLA

### Error: "Failed query: update profiles"
**Solución:** Ejecuta la migración `0034_add_wizard_v2_columns.sql` en Supabase

### Error: "Rendered more hooks than during the previous render"
**Solución:** ✅ Ya corregido - recarga la página

### Error: 500 en todas las llamadas API
**Solución:** Verifica que `DATABASE_URL` esté correcta en Vercel

### Error: Wizard no se cierra
**Solución:** Verifica que la migración esté aplicada y recarga la página

---

## 📞 SOPORTE

Si encuentras problemas:

1. **Revisa logs del servidor** (terminal donde corre `pnpm dev`)
2. **Revisa consola del navegador** (F12 → Console)
3. **Revisa Network tab** (F12 → Network) para errores 500
4. **Verifica variables de entorno** en Vercel
5. **Verifica migraciones** en Supabase SQL Editor

---

**Última actualización:** 3 Enero 2025
**Versión:** 1.0.0
**Estado:** ✅ Listo para ejecutar

**Tiempo total estimado:** 60 minutos

