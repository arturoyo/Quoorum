# Deployment Action Items - Wallie

> **Versión:** 1.0.0 | **Última actualización:** 10 Dic 2025
> **Estado:** MVP Ready (75/100) | **Objetivo:** Production Launch

---

## Resumen de Estado

| Área | Score | Estado |
|------|-------|--------|
| Seguridad | 85/100 | ✅ Bueno |
| Monitoreo | 60/100 | ⚠️ Necesita SENTRY_DSN |
| Resiliencia | 80/100 | ✅ Bueno |
| Costos | 65/100 | ⚠️ Necesita billing alerts |
| Escalabilidad | 75/100 | ✅ Bueno |
| Testing | 70/100 | ✅ Aceptable |
| Legal | 90/100 | ✅ Completo |

---

## 🔴 CRÍTICO - Antes de Launch (< 1 hora total)

### 1. Configurar SENTRY_DSN en Vercel
**Tiempo:** 15 minutos | **Impacto:** Visibilidad de errores en producción

```bash
# Pasos:
# 1. Ir a https://sentry.io
# 2. Create Project → Next.js
# 3. Copiar DSN

# En Vercel Dashboard:
# Settings → Environment Variables → Add:
SENTRY_DSN=https://xxxxx@xxxx.ingest.sentry.io/xxxxx
SENTRY_AUTH_TOKEN=sntrys_xxxxx
SENTRY_ORG=tu-organizacion
SENTRY_PROJECT=wallie
```

**Verificación:**
```bash
# Trigger error de prueba y verificar en Sentry Dashboard
throw new Error('Test Sentry Integration')
```

- [ ] DSN configurado en Vercel
- [ ] Error de prueba aparece en Sentry

---

### 2. Configurar Google Cloud Billing Alerts
**Tiempo:** 30 minutos | **Impacto:** Control de costos de APIs

```bash
# Pasos:
# 1. Ir a https://console.cloud.google.com
# 2. Billing → Budgets & alerts → Create Budget

# Configuración recomendada:
# - Budget name: "Wallie Monthly"
# - Amount: $100 (warning), $200 (cap)
# - Alertas: 50%, 80%, 100%
```

| API | Free Tier | Límite Recomendado |
|-----|-----------|-------------------|
| Gemini | $0 (1M tokens) | $50/mes |
| Cloud Storage | 5GB | $10/mes |
| Cloud Functions | 2M invocaciones | $20/mes |

- [ ] Budget creado
- [ ] Alertas configuradas (50%, 80%, 100%)
- [ ] Email de alertas verificado

---

### 3. Verificar Supabase Backups
**Tiempo:** 10 minutos | **Impacto:** Recuperación de datos

```bash
# Pasos:
# 1. Supabase Dashboard → Project Settings → Database
# 2. Verificar:
#    - "Point-in-time Recovery: Enabled" ✅
#    - "Daily backups: Enabled" ✅
```

**Retención:**
| Plan | Retención | Recomendación |
|------|-----------|---------------|
| Free | 7 días | OK para MVP |
| Pro ($25/mes) | 30 días | Recomendado para producción |

- [ ] Daily backups habilitados
- [ ] Probar restore en staging (opcional pero recomendado)

---

## 🟡 ALTO - Primera Semana

### 4. Configurar Alertas de Sentry
**Tiempo:** 20 minutos

```
Sentry Dashboard → Alerts → Create Alert Rule:

1. Error Rate Alert:
   - When: Error count > 10 in 1 hour
   - Action: Email + Slack

2. New Issue Alert:
   - When: First occurrence of issue
   - Action: Email

3. Performance Alert (opcional):
   - When: p95 latency > 3s
   - Action: Slack
```

- [ ] Alert de error rate configurada
- [ ] Alert de new issues configurada
- [ ] Canales de notificación verificados

---

### 5. Ejecutar Load Test Básico
**Tiempo:** 2 horas

```bash
# Usar k6 o artillery
# Objetivo: 100 usuarios concurrentes

# Flujos a probar:
# - Login/Auth
# - Crear cliente
# - Enviar mensaje
# - Dashboard principal
```

- [ ] Herramienta seleccionada (k6/artillery)
- [ ] Scripts de test creados
- [ ] Test ejecutado en staging
- [ ] Resultados documentados

---

### 6. Configurar Upstash Redis (si no está)
**Tiempo:** 10 minutos

```bash
# 1. https://console.upstash.com
# 2. Create Database → Global

# En Vercel:
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxx
```

- [ ] Base de datos creada
- [ ] Variables en Vercel
- [ ] Rate limiting verificado

---

### 7. Configurar Resend (Emails)
**Tiempo:** 15 minutos

```bash
# 1. https://resend.com
# 2. API Keys → Create
# 3. Domains → Add domain → Verificar DNS

# En Vercel:
RESEND_API_KEY=re_xxxx
EMAIL_FROM=Wallie <hello@wallie.pro>
```

- [ ] API key creada
- [ ] Dominio verificado
- [ ] Email de prueba enviado

---

## 🟢 MEDIO - Primer Mes

### 8. Configurar PostHog Analytics
**Tiempo:** 15 minutos

```bash
# 1. https://posthog.com → Create project
# 2. Settings → Project API key

# En Vercel:
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://eu.posthog.com
```

- [ ] Proyecto creado
- [ ] Key en Vercel
- [ ] Eventos principales trackeados

---

### 9. Configurar pg_stat_statements
**Tiempo:** 30 minutos

```sql
-- En Supabase SQL Editor:
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Ver queries lentas:
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;
```

- [ ] Extensión habilitada
- [ ] Dashboard de queries lentas

---

### 10. Crear Email DPO Funcional
**Tiempo:** 10 minutos

```bash
# Crear dpo@wallie.pro
# Configurar forwarding al equipo legal
# Actualizar Privacy Policy con email correcto
```

- [ ] Email creado
- [ ] Forwarding configurado
- [ ] Privacy Policy actualizada

---

## ✅ YA IMPLEMENTADO

| Feature | Ubicación | Estado |
|---------|-----------|--------|
| Rate Limiting | `packages/api/src/lib/rate-limit.ts` | ✅ Upstash Redis |
| Webhook Signatures | `packages/whatsapp/src/webhook.ts` | ✅ timingSafeEqual |
| Security Headers | `next.config.js` | ✅ CSP, HSTS, X-Frame |
| Input Validation | Todos los routers | ✅ Zod |
| AI Fallback | `packages/ai/src/providers/unified-client.ts` | ✅ Gemini → Groq → OpenAI |
| Health Check | `/api/health` | ✅ DB, Supabase, AI, WA, Stripe |
| GDPR Router | `packages/api/src/routers/gdpr.ts` | ✅ Export + Delete |
| Audit Logging | `packages/api/src/lib/activity-logger.ts` | ✅ Login failures |
| Stripe Webhooks Tests | `packages/stripe/src/__tests__/` | ✅ 29 tests |
| Monitoring Dashboard | `/admin/monitoring` | ✅ Real-time |
| Legal Pages | `/legal/*` | ✅ Terms, Privacy, Cookies |
| DB Indexes | Múltiples schemas | ✅ 40+ índices |

---

## Variables de Entorno - Checklist

### Producción (Vercel)

```env
# === CRÍTICAS (App no funciona sin estas) ===
DATABASE_URL=✅ Configurado
NEXT_PUBLIC_SUPABASE_URL=✅ Configurado
NEXT_PUBLIC_SUPABASE_ANON_KEY=✅ Configurado
SUPABASE_SERVICE_ROLE_KEY=✅ Configurado
NEXT_PUBLIC_APP_URL=https://app.wallie.com

# === IMPORTANTES (Features principales) ===
GEMINI_API_KEY=✅ Configurado
WHATSAPP_ACCESS_TOKEN=✅ Configurado
WHATSAPP_PHONE_NUMBER_ID=✅ Configurado
WHATSAPP_WEBHOOK_VERIFY_TOKEN=✅ Configurado
STRIPE_SECRET_KEY=✅ Configurado
STRIPE_WEBHOOK_SECRET=✅ Configurado
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=✅ Configurado

# === MONITOREO (Pendientes) ===
SENTRY_DSN=⚠️ PENDIENTE
SENTRY_AUTH_TOKEN=⚠️ PENDIENTE
UPSTASH_REDIS_REST_URL=⚠️ VERIFICAR
UPSTASH_REDIS_REST_TOKEN=⚠️ VERIFICAR

# === OPCIONALES ===
RESEND_API_KEY=⚠️ PENDIENTE
NEXT_PUBLIC_POSTHOG_KEY=⚠️ PENDIENTE
```

---

## Métricas de Salud Actuales

```
Código
├── TypeScript Errors: 0 ✅
├── Lint Errors: 0 (críticos) ✅
├── Build: Passing ✅
└── Tests: 195+ passing ✅

Infraestructura
├── Health Endpoint: /api/health ✅
├── Rate Limiting: Configurado ✅
├── Webhooks: Verificados ✅
├── HTTPS: Enforced ✅
└── Monitoring: /admin/monitoring ✅

Legal
├── Terms: Publicados ✅
├── Privacy: GDPR compliant ✅
├── GDPR Router: Funcional ✅
└── Consent: Tracking ✅
```

---

## Orden de Ejecución Recomendado

```
Día 1 (Antes de launch):
├── 1. SENTRY_DSN (15 min)
├── 2. Google Cloud Billing (30 min)
└── 3. Verificar Supabase Backups (10 min)

Semana 1:
├── 4. Alertas de Sentry (20 min)
├── 5. Load Test (2h)
├── 6. Upstash Redis (10 min)
└── 7. Resend Emails (15 min)

Mes 1:
├── 8. PostHog Analytics (15 min)
├── 9. pg_stat_statements (30 min)
└── 10. Email DPO (10 min)
```

---

## Links Rápidos

| Servicio | Dashboard | Docs |
|----------|-----------|------|
| Vercel | [vercel.com/dashboard](https://vercel.com/dashboard) | [docs](https://vercel.com/docs) |
| Supabase | [supabase.com/dashboard](https://supabase.com/dashboard) | [docs](https://supabase.com/docs) |
| Sentry | [sentry.io](https://sentry.io) | [docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/) |
| Stripe | [dashboard.stripe.com](https://dashboard.stripe.com) | [docs](https://stripe.com/docs) |
| Google Cloud | [console.cloud.google.com](https://console.cloud.google.com) | [docs](https://cloud.google.com/docs) |
| Upstash | [console.upstash.com](https://console.upstash.com) | [docs](https://docs.upstash.com) |
| Resend | [resend.com](https://resend.com) | [docs](https://resend.com/docs) |
| PostHog | [posthog.com](https://posthog.com) | [docs](https://posthog.com/docs) |

---

## Conclusión

**El proyecto está LISTO para MVP/Beta** con las siguientes condiciones:

1. ✅ Seguridad básica implementada
2. ✅ Legal completo (GDPR, Terms, Privacy)
3. ✅ Health checks y monitoring dashboard
4. ⚠️ **Necesita:** SENTRY_DSN configurado
5. ⚠️ **Necesita:** Billing alerts en Google Cloud
6. ⚠️ **Necesita:** Verificar backups de Supabase

**Recomendación:** Proceder con launch limitado (beta cerrada) mientras se implementan las mejoras restantes.

---

_Generado: 10 Dic 2025_
