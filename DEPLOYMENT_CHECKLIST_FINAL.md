# ✅ Checklist Final de Deployment - 100% Éxito Garantizado

> **Fecha:** 3 Enero 2025
> **Estado:** Listo para ejecutar
> **Tiempo estimado:** 30-45 minutos

---

## 🎯 OBJETIVO

Garantizar que Wallie esté al **100% de éxito** antes de deployment a producción.

---

## 📋 PASO 1: MIGRACIÓN DE BASE DE DATOS (CRÍTICO)

### ⚠️ **BLOQUEANTE** - Sin esto, el wizard NO funcionará

**Archivo:** `packages/db/src/migrations/0034_add_wizard_v2_columns.sql`

**Instrucciones:**

1. Abre Supabase Dashboard: https://supabase.com/dashboard
2. Selecciona tu proyecto Wallie
3. Ve a **SQL Editor** (sidebar izquierdo)
4. Click en **New query**
5. Copia TODO el contenido de `packages/db/src/migrations/0034_add_wizard_v2_columns.sql`
6. Pégalo en el editor
7. Click en **Run** (o `Ctrl+Enter`)
8. **Resultado esperado:** `Success. No rows returned`

**Verificación:**
```sql
-- Ejecuta esto para verificar:
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('onboarding_step', 'onboarding_version');
```

**Deberías ver 2 filas:**
- `onboarding_step` | `integer` | `0`
- `onboarding_version` | `text` | `'v1'`

✅ **Marca como completado cuando veas las 2 columnas**

---

## 📋 PASO 2: VARIABLES DE ENTORNO EN VERCEL (CRÍTICO)

### ⚠️ **BLOQUEANTE** - Sin estas, la app NO funcionará

**URL:** https://vercel.com/dashboard → Tu proyecto → Settings → Environment Variables

### Variables CRÍTICAS (5):

```bash
✅ DATABASE_URL
   Valor: postgresql://postgres:[password]@[host]:5432/postgres
   Scope: Production, Preview, Development

✅ NEXT_PUBLIC_SUPABASE_URL
   Valor: https://[project-ref].supabase.co
   Scope: Production, Preview, Development

✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
   Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   Scope: Production, Preview, Development

✅ SUPABASE_SERVICE_ROLE_KEY
   Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   Scope: Production, Preview (NO Development por seguridad)

✅ NEXT_PUBLIC_APP_URL
   Valor: https://app.wallie.com (o tu dominio)
   Scope: Production, Preview, Development
```

**Cómo verificar:**
1. Ve a Vercel Dashboard
2. Settings → Environment Variables
3. Busca cada variable
4. Verifica que el Scope incluye "Production"

✅ **Marca como completado cuando las 5 estén configuradas**

---

## 📋 PASO 3: VARIABLES IMPORTANTES (ALTA PRIORIDAD)

### Variables para Features Principales:

```bash
✅ GEMINI_API_KEY (o OPENAI_API_KEY como fallback)
   Scope: Production, Preview, Development

✅ WHATSAPP_ACCESS_TOKEN
   Scope: Production, Preview

✅ WHATSAPP_PHONE_NUMBER_ID
   Scope: Production, Preview

✅ WHATSAPP_WEBHOOK_VERIFY_TOKEN
   Scope: Production, Preview

✅ STRIPE_SECRET_KEY
   Scope: Production (NO Preview/Development - usa test keys)

✅ STRIPE_WEBHOOK_SECRET
   Scope: Production

✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   Scope: Production, Preview, Development
```

✅ **Marca como completado cuando estén configuradas**

---

## 📋 PASO 4: MONITOREO Y ANALYTICS (RECOMENDADO)

### Sentry (Error Tracking)

```bash
✅ SENTRY_DSN
   Obtener en: https://sentry.io → Project Settings → Client Keys
   Scope: Production, Preview

✅ SENTRY_AUTH_TOKEN (opcional, para source maps)
   Obtener en: https://sentry.io → Account → API Keys
   Scope: Production
```

**Configurar alertas en Sentry:**
1. Ve a Sentry Dashboard
2. Alerts → Create Alert Rule
3. Configura:
   - **Error Rate Alert**: > 10 errores en 1 hora → Email
   - **New Issue Alert**: Primera ocurrencia → Email
   - **Performance Alert**: p95 > 3s → Email

### PostHog (Analytics)

```bash
✅ NEXT_PUBLIC_POSTHOG_KEY
   Obtener en: https://posthog.com → Project Settings → API Key
   Scope: Production, Preview, Development

✅ NEXT_PUBLIC_POSTHOG_HOST (opcional)
   Valor: https://eu.posthog.com (o tu región)
   Scope: Production, Preview, Development
```

✅ **Marca como completado cuando estén configuradas**

---

## 📋 PASO 5: WEBHOOKS (CRÍTICO PARA INTEGRACIONES)

### Stripe Webhook

**URL:** `https://app.wallie.com/api/webhooks/stripe`

**Configurar:**
1. Ve a https://dashboard.stripe.com
2. Developers → Webhooks
3. Add endpoint
4. URL: `https://app.wallie.com/api/webhooks/stripe`
5. Events a escuchar:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
6. Copia el **Signing secret** → Agregar como `STRIPE_WEBHOOK_SECRET` en Vercel

✅ **Marca como completado cuando el webhook esté configurado**

### WhatsApp Webhook (Meta)

**URL:** `https://app.wallie.com/api/webhooks/whatsapp`

**Configurar:**
1. Ve a https://developers.facebook.com
2. Tu App → WhatsApp → Configuration
3. Webhook URL: `https://app.wallie.com/api/webhooks/whatsapp`
4. Verify Token: (el valor de `WHATSAPP_WEBHOOK_VERIFY_TOKEN`)
5. Webhook Fields:
   - ✅ `messages`
   - ✅ `message_status`
6. Click en **Verify and Save**

✅ **Marca como completado cuando el webhook esté verificado**

---

## 📋 PASO 6: VERIFICACIÓN LOCAL

### Ejecutar Script de Verificación

**Windows (PowerShell):**
```powershell
.\scripts\verify-production-readiness.ps1
```

**Linux/Mac:**
```bash
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

✅ **Marca como completado cuando el script pase sin errores**

---

## 📋 PASO 7: TEST MANUAL DEL WIZARD

### Test End-to-End

1. **Iniciar servidor local:**
   ```bash
   pnpm dev
   ```

2. **Abrir navegador:**
   - Ve a `http://localhost:3000/dashboard`
   - Deberías ver el wizard (no el sidebar)

3. **Test de completar wizard:**
   - Completa todos los pasos
   - Verifica que no hay errores en consola
   - Al finalizar, deberías ver el dashboard con sidebar

4. **Test de cerrar wizard (admin):**
   - Si eres admin, prueba el botón "Cerrar"
   - Debería cerrar sin errores
   - El sidebar debería aparecer

5. **Test de reanudar wizard:**
   - Completa hasta paso 5
   - Cierra el navegador
   - Reabre y ve a `/dashboard`
   - Debería continuar en paso 5

✅ **Marca como completado cuando todos los tests pasen**

---

## 📋 PASO 8: VERIFICACIÓN DE ERRORES EN CONSOLA

### Abrir DevTools (F12)

**Verificar:**
- ❌ No hay errores rojos
- ❌ No hay warnings de React Hooks
- ❌ No hay errores 500 en Network tab
- ✅ Solo logs de desarrollo (si estás en modo desarrollo)

**Errores comunes a verificar:**
- `Rendered more hooks than during the previous render` → ❌ Debe estar corregido
- `Failed query: update "profiles"` → ❌ Debe estar corregido (migración aplicada)
- `Hydration errors` → ❌ No debería haber

✅ **Marca como completado cuando no haya errores críticos**

---

## 📋 PASO 9: PERFORMANCE CHECK

### Lighthouse Test

1. Abre Chrome DevTools (F12)
2. Ve a tab **Lighthouse**
3. Selecciona:
   - ✅ Performance
   - ✅ Accessibility
   - ✅ Best Practices
   - ✅ SEO
4. Click en **Generate report**
5. **Resultados esperados:**
   - Performance: > 80
   - Accessibility: > 90
   - Best Practices: > 90
   - SEO: > 80

✅ **Marca como completado cuando los scores sean aceptables**

---

## 📋 PASO 10: DEPLOYMENT A PRODUCCIÓN

### Pre-Deployment

- [ ] Todas las migraciones aplicadas
- [ ] Variables de entorno configuradas
- [ ] Webhooks configurados
- [ ] Tests manuales pasados
- [ ] No hay errores en consola
- [ ] Performance aceptable

### Deployment

```bash
# Opción 1: Vercel CLI
vercel --prod

# Opción 2: Git push (si tienes CI/CD)
git push origin main
```

### Post-Deployment

- [ ] Verificar que la app carga: `https://app.wallie.com`
- [ ] Verificar que el wizard funciona
- [ ] Verificar que no hay errores en Sentry (si configurado)
- [ ] Verificar que PostHog está recibiendo eventos (si configurado)

✅ **Marca como completado cuando todo funcione en producción**

---

## 🚨 CHECKLIST RÁPIDO PRE-DEPLOYMENT

Copia y pega esto en tu terminal para verificar rápidamente:

```bash
# 1. Build funciona
pnpm build

# 2. No hay errores de TypeScript críticos
pnpm --filter @wallie/web type-check

# 3. Migración existe
ls packages/db/src/migrations/0034_add_wizard_v2_columns.sql

# 4. ErrorBoundary integrado
grep -q "ErrorBoundary" apps/web/src/app/layout.tsx && echo "✅" || echo "❌"

# 5. Console.logs protegidos
grep -r "console\.log" apps/web/src --exclude-dir=node_modules | grep -v "NODE_ENV === 'development'" | wc -l
# Debe retornar 0
```

---

## 📊 ESTADO ACTUAL DEL PROYECTO

### ✅ COMPLETADO (Código)
- Error Boundaries integrados
- PostHog analytics configurado
- Sentry configurado (requiere DSN)
- Webhooks implementados
- Fallback de AI providers
- Wizard reanudable
- Sidebar responsive
- Console.logs protegidos para producción

### ⚠️ PENDIENTE (Requiere Acción Manual)
- [ ] Migración `0034_add_wizard_v2_columns.sql` ejecutada
- [ ] Variables de entorno en Vercel (5 críticas)
- [ ] Webhooks configurados en servicios externos
- [ ] Sentry DSN configurado
- [ ] PostHog key configurado

### ❌ NO VERIFICABLE (Requiere Acceso)
- Estado de migraciones en DB
- Configuración de Vercel
- Configuración de servicios externos

---

## 🎯 PRÓXIMOS PASOS INMEDIATOS

1. **🔴 CRÍTICO**: Ejecutar migración en Supabase (5 minutos)
2. **🔴 CRÍTICO**: Verificar 5 variables críticas en Vercel (10 minutos)
3. **🟠 ALTA**: Configurar `SENTRY_DSN` en Vercel (5 minutos)
4. **🟠 ALTA**: Configurar `NEXT_PUBLIC_POSTHOG_KEY` en Vercel (5 minutos)
5. **🟠 ALTA**: Configurar webhooks en Stripe y WhatsApp (15 minutos)
6. **🟡 MEDIA**: Test manual del wizard (10 minutos)
7. **🟡 MEDIA**: Lighthouse performance test (5 minutos)

**Tiempo total estimado:** 55 minutos

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

