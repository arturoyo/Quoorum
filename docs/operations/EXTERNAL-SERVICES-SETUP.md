# External Services Setup Guide

> **Versión:** 1.0.0 | **Última actualización:** 10 Dic 2025
> **Propósito:** Guía paso a paso para configurar servicios externos

---

## 🔴 CRÍTICO - Configurar Antes de Launch

### 1. Sentry (Error Tracking)

**Tiempo estimado:** 15 minutos

#### Paso 1: Crear cuenta/proyecto

```bash
# 1. Ve a https://sentry.io
# 2. Sign up o Login
# 3. Create New Project → Next.js
# 4. Copia el DSN
```

#### Paso 2: Configurar en Vercel

```bash
# En Vercel Dashboard:
# Settings → Environment Variables → Add:

SENTRY_DSN=https://xxxxx@xxxx.ingest.sentry.io/xxxxx
SENTRY_AUTH_TOKEN=sntrys_xxxxx  # Para source maps
SENTRY_ORG=tu-organizacion
SENTRY_PROJECT=wallie
```

#### Paso 3: Configurar Alertas

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

#### Verificar

```bash
# Trigger un error de prueba en local:
throw new Error('Test Sentry Integration')

# Debería aparecer en Sentry Dashboard en < 1 minuto
```

---

### 2. Google Cloud (Billing Alerts)

**Tiempo estimado:** 30 minutos

#### Paso 1: Acceder a Console

```bash
# 1. Ve a https://console.cloud.google.com
# 2. Billing → Budgets & alerts
```

#### Paso 2: Crear Budget

```
1. Click "Create Budget"

2. Budget name: "Wallie Monthly"

3. Budget amount:
   - Type: Specified amount
   - Amount: $100 (warning), $200 (cap)

4. Alert thresholds:
   - 50% → Email
   - 80% → Email + Slack webhook
   - 100% → Email + Slack + Consider auto-stop

5. Manage notifications:
   - Link Cloud Monitoring
   - Add email: alerts@tudominio.com
```

#### Paso 3: Configurar Webhook (Opcional)

```bash
# Para recibir alertas en Slack:
# 1. Crear Incoming Webhook en Slack
# 2. En Cloud Monitoring → Notification Channels → Add Webhook
# 3. URL: https://hooks.slack.com/services/xxx/xxx/xxx
```

#### APIs a Monitorear

| API | Free Tier | Límite Recomendado |
|-----|-----------|-------------------|
| Gemini | $0 (1M tokens) | $50/mes |
| Cloud Storage | 5GB | $10/mes |
| Cloud Functions | 2M invocaciones | $20/mes |

---

### 3. Supabase (Backups)

**Tiempo estimado:** 10 minutos

#### Verificar Backups Automáticos

```bash
# 1. Supabase Dashboard → Project Settings → Database
# 2. Verificar que dice:
#    "Point-in-time Recovery: Enabled"
#    "Daily backups: Enabled"
```

#### Configurar Retención

```
Free tier:
- 7 días de backups

Pro tier ($25/mes):
- 30 días de backups
- Point-in-time recovery
- ← RECOMENDADO para producción
```

#### Backup Manual (Antes de Cambios Grandes)

```bash
# Desde CLI:
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# O desde Dashboard:
# Database → Backups → Create backup
```

#### Verificar Restore

```bash
# Importante: Probar restore en staging primero
# Dashboard → Backups → Select backup → Restore to new project
```

---

## 🟡 ALTO - Configurar Primera Semana

### 4. Upstash Redis (Rate Limiting)

**Tiempo estimado:** 10 minutos

```bash
# 1. Ve a https://console.upstash.com
# 2. Create Database → Global (recomendado)
# 3. Copia las credenciales:

UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxx
```

### 5. Resend (Emails)

**Tiempo estimado:** 15 minutos

```bash
# 1. Ve a https://resend.com
# 2. API Keys → Create API Key
# 3. Domains → Add domain → Verificar DNS

RESEND_API_KEY=re_xxxx
EMAIL_FROM=Wallie <hello@wallie.pro>
```

### 6. Stripe (Payments)

**Tiempo estimado:** 30 minutos

```bash
# 1. Dashboard → Developers → API keys
# 2. Webhooks → Add endpoint:
#    URL: https://app.wallie.com/api/webhooks/stripe
#    Events: checkout.session.completed, customer.subscription.*,
#            invoice.*, payment_intent.*

STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# Price IDs (crear en Products):
STRIPE_PRICE_STARTER=price_xxx
STRIPE_PRICE_PRO=price_xxx
STRIPE_PRICE_BUSINESS=price_xxx
```

---

## 🟢 MEDIO - Configurar Primer Mes

### 7. PostHog (Analytics)

```bash
# 1. https://posthog.com → Create project
# 2. Settings → Project API key

NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://eu.posthog.com
```

### 8. WhatsApp Business API

```bash
# 1. https://developers.facebook.com
# 2. Create App → Business → WhatsApp
# 3. Add WhatsApp product
# 4. Get Access Token (System User con permisos)

WHATSAPP_ACCESS_TOKEN=EAAxx (permanent token)
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_WEBHOOK_VERIFY_TOKEN=mi-token-secreto-random
WHATSAPP_APP_SECRET=xxx (para verificar firmas)

# Webhook URL:
# https://app.wallie.com/api/webhooks/whatsapp

# Webhook Fields:
# messages, message_status
```

### 9. Google OAuth (Calendar, Gmail)

```bash
# 1. Google Cloud Console → APIs & Services → Credentials
# 2. Create OAuth 2.0 Client ID
# 3. Authorized redirect URIs:
#    - https://app.wallie.com/api/auth/callback/google

GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
```

---

## 📋 Checklist de Variables de Entorno

### Producción (Vercel)

```env
# === CRÍTICAS (Bloquean funcionamiento) ===
DATABASE_URL=✅
NEXT_PUBLIC_SUPABASE_URL=✅
NEXT_PUBLIC_SUPABASE_ANON_KEY=✅
SUPABASE_SERVICE_ROLE_KEY=✅
NEXT_PUBLIC_APP_URL=https://app.wallie.com

# === IMPORTANTES (Features principales) ===
GEMINI_API_KEY=✅
WHATSAPP_ACCESS_TOKEN=✅
WHATSAPP_PHONE_NUMBER_ID=✅
WHATSAPP_WEBHOOK_VERIFY_TOKEN=✅
STRIPE_SECRET_KEY=✅
STRIPE_WEBHOOK_SECRET=✅
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=✅

# === MONITOREO (Recomendadas) ===
SENTRY_DSN=⚠️ CONFIGURAR
UPSTASH_REDIS_REST_URL=⚠️ CONFIGURAR
UPSTASH_REDIS_REST_TOKEN=⚠️ CONFIGURAR

# === OPCIONALES ===
RESEND_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_POSTHOG_KEY=
```

---

## 🔗 Links Rápidos

| Servicio | Dashboard | Docs |
|----------|-----------|------|
| Vercel | [vercel.com/dashboard](https://vercel.com/dashboard) | [docs](https://vercel.com/docs) |
| Supabase | [supabase.com/dashboard](https://supabase.com/dashboard) | [docs](https://supabase.com/docs) |
| Sentry | [sentry.io](https://sentry.io) | [docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/) |
| Stripe | [dashboard.stripe.com](https://dashboard.stripe.com) | [docs](https://stripe.com/docs) |
| Meta/WhatsApp | [developers.facebook.com](https://developers.facebook.com) | [docs](https://developers.facebook.com/docs/whatsapp) |
| Google Cloud | [console.cloud.google.com](https://console.cloud.google.com) | [docs](https://cloud.google.com/docs) |
| Upstash | [console.upstash.com](https://console.upstash.com) | [docs](https://docs.upstash.com) |
| Resend | [resend.com](https://resend.com) | [docs](https://resend.com/docs) |
| PostHog | [posthog.com](https://posthog.com) | [docs](https://posthog.com/docs) |

---

## 🆘 Troubleshooting

### Sentry no recibe errores

```bash
# 1. Verificar DSN en env
echo $SENTRY_DSN

# 2. Verificar que no está en modo dev
# sentry.client.config.ts debe tener:
# enabled: process.env.NODE_ENV === 'production'

# 3. Verificar que el proyecto existe en Sentry
```

### Stripe webhooks no llegan

```bash
# 1. Verificar endpoint en Stripe Dashboard
# 2. Verificar STRIPE_WEBHOOK_SECRET
# 3. Ver logs de webhook en Stripe → Developers → Webhooks → Events

# Test local:
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### WhatsApp no responde

```bash
# 1. Verificar token no expirado
curl -X GET "https://graph.facebook.com/v18.0/me?access_token=$WHATSAPP_ACCESS_TOKEN"

# 2. Verificar webhook configurado
# Meta Dashboard → WhatsApp → Configuration

# 3. Verificar verify token coincide
echo $WHATSAPP_WEBHOOK_VERIFY_TOKEN
```

---

_Última actualización: 10 Dic 2025_
