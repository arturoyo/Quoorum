# 🚀 DEPLOYMENT CHECKLIST - WALLIE PRO

**Generado:** 04 Enero 2026
**Estado:** 🟡 PARCIALMENTE COMPLETADO - Requiere acción manual

---

## ✅ TAREAS COMPLETADAS (Automatizadas)

### Día 1: Correcciones TypeScript

- [x] **admin/invoices/page.tsx** - Corregido tipo `subtotal` de number → string (decimal DB)
- [x] **admin/preview-onboarding/page.tsx** - Añadido prop `isPreview` a WizardV2ModalProps
- [x] **admin/support/page.tsx** - Corregido tipo `newStatus` y interfaz `SupportStats`
- [x] **admin/workers/page.tsx** - Añadidos props opcionales a `WorkerCardProps`
- [x] **clients/components/\*.tsx** - Corregido import `Temperature` (type import)
- [x] **conversations/[id]/page.tsx** - Añadidos null coalescing para `isPinned` e `isSystemConversation`

**Archivos modificados:**

```
apps/web/src/app/admin/invoices/components/invoice-table.tsx
apps/web/src/components/onboarding/wizard-v2/components/types.ts
apps/web/src/components/onboarding/wizard-v2/index.tsx
apps/web/src/app/admin/support/page.tsx
apps/web/src/app/admin/support/components/support-stats.tsx
apps/web/src/app/admin/workers/components/worker-card.tsx
apps/web/src/app/clients/components/search-filters.tsx
apps/web/src/app/clients/components/types.ts
apps/web/src/app/clients/page.tsx
apps/web/src/app/conversations/[id]/page.tsx
```

---

## ⚠️ TAREAS PENDIENTES (Requieren Acción Manual)

### 🔴 CRÍTICAS - BLOQUEANTES

#### 1. Configurar Variables de Entorno en Vercel

**Ubicación:** Vercel Dashboard → wallie.pro → Settings → Environment Variables

**Variables CRÍTICAS (sin estas la app crashea):**

```bash
# Database
DATABASE_URL=postgresql://postgres.xxx:xxx@aws-xxx.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.xxx:xxx@aws-xxx.pooler.supabase.com:5432/postgres

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# AI Principal (core feature)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
GROQ_API_KEY=gsk_...
```

**Acción:**

1. Ir a Supabase Dashboard → Settings → API
2. Copiar `URL` → Pegar en `NEXT_PUBLIC_SUPABASE_URL`
3. Copiar `anon public` → Pegar en `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Ir a Settings → Database → Connection String
5. Copiar `Transaction Pooler` → Pegar en `DIRECT_URL`
6. Copiar `Session Pooler` → Pegar en `DATABASE_URL`
7. Configurar API keys de IA desde sus dashboards respectivos

**Tiempo estimado:** 30 minutos

---

#### 2. Aplicar Migraciones RLS en Producción

**⚠️ CRÍTICO:** Row Level Security NO está activa en producción

**Archivos pendientes:**

```
packages/db/src/migrations/0020_rls_dashboard_fix_final.sql
packages/db/src/migrations/0021_rls_remaining_ABSOLUTE_FINAL.sql
```

**Acción:**

```bash
# OPCIÓN 1: Via CLI (recomendado con backup previo)
# 1. Backup primero:
pnpm db:backup  # Si existe script

# 2. Aplicar migraciones:
pnpm db:push

# OPCIÓN 2: Manual via Supabase Dashboard (más seguro)
# 1. Ir a Supabase Dashboard → SQL Editor
# 2. Copiar contenido de packages/db/src/migrations/0020_rls_dashboard_fix_final.sql
# 3. Pegar y ejecutar
# 4. Repetir con 0021_rls_remaining_ABSOLUTE_FINAL.sql
```

**⚠️ BACKUP OBLIGATORIO** antes de ejecutar

**Tiempo estimado:** 1 hora (con testing)

---

#### 3. Cambiar Stripe a Modo LIVE

**Variables a actualizar en Vercel:**

```bash
STRIPE_SECRET_KEY=sk_live_...  # ⚠️ Actualmente sk_test_
STRIPE_SIGNING_SECRET=whsec_...  # Del webhook LIVE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

**Acción:**

1. Login a Stripe Dashboard
2. Activar cuenta LIVE (completar verificación si pendiente)
3. Developers → API Keys → Revelar claves LIVE
4. Copiar `Secret key` → Actualizar `STRIPE_SECRET_KEY` en Vercel
5. Copiar `Publishable key` → Actualizar `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
6. Webhooks → Añadir endpoint para producción:
   - URL: `https://wallie.pro/api/webhooks/stripe`
   - Eventos: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`
7. Copiar `Webhook signing secret` → Actualizar `STRIPE_SIGNING_SECRET`

**Testing con Stripe CLI:**

```bash
# 1. Instalar Stripe CLI (si no está instalado)
# Ver: docs/STRIPE_CLI_SETUP.md

# 2. Autenticar
stripe login

# 3. Forward webhooks a localhost para testing local
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# ⚠️ Copiar el whsec_xxx que aparece → Actualizar en .env.local

# 4. En otra terminal, iniciar app
pnpm dev

# 5. Simular eventos de prueba
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded

# 6. Verificar en logs que:
# - ✅ Webhook recibido correctamente
# - ✅ Signature validada
# - ✅ Suscripción creada en DB

# 7. O usar el helper script
.\scripts\stripe-dev.ps1 listen      # Terminal 1
.\scripts\stripe-dev.ps1 test-checkout  # Terminal 2
```

**Tiempo estimado:** 1 hora

---

### 🟠 IMPORTANTES - Antes de Launch Público

#### 4. Eliminar console.logs de Producción

**Archivos afectados (16 total):**

```
apps/web/src/lib/monitoring.ts
apps/web/src/components/onboarding/*.tsx (3)
apps/web/src/components/layout/dashboard-layout.tsx
apps/web/src/hooks/use-*.ts (3)
apps/web/src/instrumentation.ts

packages/api/src/services/context.service.ts
packages/api/src/lib/logger.ts
packages/api/src/routers/wallie-support.ts
packages/api/src/routers/admin-knowledge.ts
packages/api/src/routers/__tests__/*.test.ts (2)
```

**Acción automatizada:**

```bash
# Ejecutar script para reemplazar console.logs:
pnpm clean-logs

# O manualmente:
# Reemplazar console.log → logger.info (en production code)
# Eliminar console.log de tests si no son necesarios
```

**Tiempo estimado:** 2 horas

---

#### 5. Corregir ESLint Errors en Admin

**Archivos con errores:**

```
apps/web/src/app/admin/ab-testing.disabled/page.tsx  # @ts-nocheck
apps/web/src/app/admin/forum.disabled/page.tsx        # @ts-nocheck
apps/web/src/app/(app)/quoorum/experts/page.tsx         # CustomExpert no usado
```

**Acción:**

```bash
# Opción 1: Eliminar archivos .disabled si no se usan
rm apps/web/src/app/admin/ab-testing.disabled/page.tsx
rm apps/web/src/app/admin/forum.disabled/page.tsx

# Opción 2: Corregir @ts-nocheck (quitar y arreglar tipos)
# Opción 3: Renombrar a .tsx.bak si queremos mantenerlos
```

**Tiempo estimado:** 30 minutos

---

#### 6. Verificar Workers en Inngest Dashboard

**Acción:**

1. Login a Inngest Dashboard (https://app.inngest.com)
2. Ir a Functions
3. Verificar que aparecen TODOS los workers (44 esperados)
4. Hacer trigger manual de workers críticos:
   - `gmail-sync`
   - `conversation-analysis`
   - `emotion-analysis`
   - `campaign-scheduler`
   - `referral-invites`
5. Verificar que se ejecutan sin errores
6. Revisar logs de ejecución

**Tiempo estimado:** 30 minutos

---

#### 7. Configurar Uptime Monitoring

**Servicio recomendado:** BetterStack o Checkly

**Endpoints a monitorear:**

```
GET https://wallie.pro/                    # Landing (cada 1 min)
GET https://wallie.pro/api/health          # Health check (cada 1 min)
POST https://wallie.pro/api/trpc/health    # tRPC funcionando (cada 5 min)
```

**Alertas:**

- Email a admin@wallie.pro
- Slack/Telegram (opcional)
- SMS para downtimes >5 min

**Acción:**

1. Crear cuenta en BetterStack
2. Añadir los 3 endpoints
3. Configurar alertas por email
4. Test: Forzar downtime y verificar que llega alerta

**Tiempo estimado:** 1 hora

---

### 🟡 MEJORAS RECOMENDADAS - No Bloquean

#### 8. Verificar Email Sending (Resend)

```bash
# Verificar que RESEND_API_KEY está configurado en Vercel

# Test desde admin panel:
# 1. Login a app.wallie.pro/admin
# 2. Ir a Email Testing (si existe)
# 3. Enviar email de prueba
# 4. Verificar que llega
```

**Tiempo estimado:** 15 minutos

---

#### 9. PostHog Analytics

```bash
# Actualizar en Vercel:
NEXT_PUBLIC_POSTHOG_KEY=phc_real_key_here  # ⚠️ Actualmente placeholder
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

**Acción:**

1. Crear cuenta PostHog (https://posthog.com)
2. Crear nuevo proyecto "Wallie Production"
3. Copiar API key → Actualizar variable en Vercel
4. Redeploy
5. Verificar que eventos llegan (visitar landing page)

**Tiempo estimado:** 30 minutos

---

#### 10. Verificar Database Backups en Supabase

**Acción:**

1. Login a Supabase Dashboard
2. Settings → Backups
3. Verificar:
   - ✅ Backups automáticos activos
   - ✅ Frecuencia: Diaria
   - ✅ Retention: 7 días mínimo
   - ✅ Point-in-time recovery disponible
4. Si no está activo: Activar en plan Pro

**Tiempo estimado:** 10 minutos

---

#### 11. Verificar SSL Certificate

```bash
# Verificar dominio y SSL:
curl -I https://wallie.pro | grep -i "strict-transport"

# Verificar que redirige HTTP → HTTPS:
curl -I http://wallie.pro | grep -i location
```

**Esperado:**

- ✅ HTTPS activo
- ✅ Certificado válido
- ✅ HTTP redirige a HTTPS

**Si falla:** Revisar configuración en Vercel Dashboard → Domains

**Tiempo estimado:** 5 minutos

---

#### 12. Medir Test Coverage

```bash
pnpm test --coverage

# Verificar que cumple mínimos:
# - API Routers: 90%+
# - Services: 85%+
# - Components: 80%+
```

**Tiempo estimado:** 10 minutos (solo verificación)

---

## 📊 RESUMEN DE TIEMPO ESTIMADO

| Fase             | Tareas | Tiempo        |
| ---------------- | ------ | ------------- |
| **Críticas**     | 1-3    | 2.5 horas     |
| **Importantes**  | 4-7    | 5 horas       |
| **Recomendadas** | 8-12   | 2 horas       |
| **Total**        |        | **9.5 horas** |

---

## 🎯 PLAN DE EJECUCIÓN RECOMENDADO

### DÍA 1 (2.5 horas) - VIERNES

**Objetivo:** Resolver bloqueantes críticos

1. ✅ Configurar variables de entorno en Vercel (30 min)
2. ✅ Aplicar migraciones RLS (1h con testing)
3. ✅ Cambiar Stripe a LIVE (1h)
4. ✅ Test: Verificar que app arranca sin crashes
5. ✅ Test: Crear subscription de prueba

**Al final del día:** App funcional pero con warnings menores

---

### DÍA 2 (5 horas) - SÁBADO

**Objetivo:** Resolver issues importantes

6. ✅ Eliminar console.logs (2h)
7. ✅ Corregir ESLint errors (30 min)
8. ✅ Verificar workers en Inngest (30 min)
9. ✅ Configurar uptime monitoring (1h)
10. ✅ Build completo y verificación (1h)

**Al final del día:** App production-ready sin issues conocidos

---

### DÍA 3 (2 horas) - DOMINGO (Opcional)

**Objetivo:** Mejoras de calidad

11. ✅ Verificar email sending (15 min)
12. ✅ Configurar PostHog (30 min)
13. ✅ Verificar backups (10 min)
14. ✅ Verificar SSL (5 min)
15. ✅ Medir coverage (10 min)
16. ✅ Documentar en TIMELINE.md (30 min)

**Al final del día:** App pulida y monitoreada

---

## ✅ CRITERIOS DE APROBACIÓN FINAL

Antes de dar el GO para deployment público:

### Checklist Pre-Launch

- [ ] **Build pasa:** `pnpm typecheck && pnpm lint && pnpm build` sin errores
- [ ] **Variables env:** Todas las críticas configuradas en Vercel
- [ ] **DB Migrations:** Aplicadas en producción, RLS activo
- [ ] **Stripe:** Modo LIVE, webhook funcionando
- [ ] **Workers:** Verificados en Inngest, ejecutándose correctamente
- [ ] **Uptime:** Monitoring activo con alertas configuradas
- [ ] **Email:** RESEND_API_KEY configurado, email de prueba enviado
- [ ] **Backups:** Activos en Supabase
- [ ] **SSL:** Certificado válido, HTTPS activo

### Tests de Humo (Smoke Tests)

```bash
# 1. Landing page carga
curl -I https://wallie.pro | grep "200 OK"

# 2. Dashboard requiere auth
curl -I https://wallie.pro/dashboard | grep "30[12]"

# 3. Health check responde
curl https://wallie.pro/api/health
# Esperado: {"status":"ok"}

# 4. Signup flow completo:
# - Visitar https://wallie.pro
# - Click "Empezar gratis"
# - Completar registro
# - Verificar email recibido
# - Completar onboarding
# - Llegar a dashboard

# 5. Checkout flow:
# - Ir a /pricing
# - Seleccionar plan Pro
# - Completar checkout con tarjeta test (en modo test primero)
# - Verificar que crea subscription en Stripe
# - Verificar que webhook llega y actualiza DB
```

---

## 🚨 ROLLBACK PLAN

Si algo sale mal después del deployment:

```bash
# 1. Rollback inmediato en Vercel
vercel rollback

# 2. O vía Dashboard:
# Vercel → wallie.pro → Deployments → Click en deployment anterior → "Promote to Production"

# 3. Si es problema de DB:
# Supabase → Backups → Restore to point in time

# 4. Si es problema de env vars:
# Vercel → Settings → Environment Variables → Revertir cambios

# 5. Notificar:
# - Usuarios activos (si hay)
# - Equipo interno
# - Poner banner "Under maintenance"
```

---

## 📞 CONTACTOS DE EMERGENCIA

| Servicio | Dashboard                    | Support              |
| -------- | ---------------------------- | -------------------- |
| Vercel   | https://vercel.com/dashboard | support@vercel.com   |
| Supabase | https://app.supabase.com     | support@supabase.com |
| Stripe   | https://dashboard.stripe.com | support@stripe.com   |
| Inngest  | https://app.inngest.com      | support@inngest.com  |

---

## 📝 PRÓXIMOS PASOS POST-LAUNCH

Una vez en producción estable:

1. **Monitorear primeras 48h:**
   - Revisar Sentry para errores
   - Revisar logs de Vercel
   - Revisar métricas de PostHog

2. **Completar verificación WhatsApp:**
   - Meta Business verification
   - Salir de modo sandbox (100 msg/día → unlimited)

3. **Optimizaciones:**
   - Añadir `updatedAt` a schemas faltantes
   - Resolver TODOs críticos del código
   - Mejorar coverage de tests a 90%+

4. **Growth:**
   - Activar campañas de marketing
   - Invitar beta users
   - Configurar referral program

---

**Última actualización:** 04 Enero 2026 19:30 UTC
**Autor:** Claude Sonnet 4.5 (Automated Audit System)
