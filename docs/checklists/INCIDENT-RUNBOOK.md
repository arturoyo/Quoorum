# Incident Runbook

> **Versión:** 1.0.0 | **Última actualización:** 10 Dic 2025
> **Propósito:** Guía paso a paso para resolver incidentes en producción

---

## Severidad de Incidentes

| Nivel | Descripción | Tiempo de Respuesta | Ejemplos |
|-------|-------------|---------------------|----------|
| **P0** | Crítico - Sistema caído | < 15 min | App no carga, DB down |
| **P1** | Alto - Feature principal rota | < 1 hora | WhatsApp no funciona, pagos fallan |
| **P2** | Medio - Feature secundaria rota | < 4 horas | Reports no cargan, export falla |
| **P3** | Bajo - Bug menor | < 24 horas | UI glitch, typo |

---

## Proceso General de Incidentes

```
┌─────────────────┐
│ 1. DETECTAR     │ ← Sentry alert, usuario reporta, monitoring
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. EVALUAR      │ ← Determinar severidad (P0-P3)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. COMUNICAR    │ ← Notificar stakeholders
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. MITIGAR      │ ← Restaurar servicio (rollback, hotfix)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 5. RESOLVER     │ ← Fix permanente
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 6. POST-MORTEM  │ ← Documentar y prevenir
└─────────────────┘
```

---

## Incidentes Comunes

### 1. App No Carga (P0)

**Síntomas:**
- Página en blanco
- Error 500
- "Application error"

**Diagnóstico:**

```bash
# 1. Verificar status de Vercel
# https://www.vercel-status.com/

# 2. Verificar logs
# Vercel Dashboard → Project → Logs

# 3. Verificar health check
curl -I https://app.wallie.com/api/health

# 4. Verificar Supabase
# https://status.supabase.com/
```

**Solución:**

```bash
# Si es deploy reciente → Rollback
# Vercel Dashboard → Deployments → Deploy anterior → Redeploy

# Si es Supabase → Esperar o contactar soporte

# Si es código → Hotfix inmediato
git checkout main
git checkout -b hotfix/critical-fix
# ... fix ...
git push && PR → main
```

---

### 2. WhatsApp No Recibe Mensajes (P1)

**Síntomas:**
- Mensajes no llegan a la app
- Webhook no se ejecuta
- Usuarios reportan "no me contestan"

**Diagnóstico:**

```bash
# 1. Verificar webhook en Meta
# developers.facebook.com → App → WhatsApp → Configuration → Webhook

# 2. Verificar logs del webhook
# Vercel Dashboard → Functions → api/webhooks/whatsapp

# 3. Verificar token
curl -X GET "https://graph.facebook.com/v18.0/me?access_token=$WHATSAPP_ACCESS_TOKEN"

# 4. Test webhook manualmente
curl -X POST https://app.wallie.com/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"object":"whatsapp_business_account","entry":[]}'
```

**Soluciones:**

| Causa | Solución |
|-------|----------|
| Token expirado | Regenerar en Meta Business |
| Webhook URL incorrecta | Actualizar en Meta Dashboard |
| Verificación fallida | Revisar `WHATSAPP_WEBHOOK_VERIFY_TOKEN` |
| Rate limit | Esperar o contactar Meta |

---

### 3. Pagos No Funcionan (P1)

**Síntomas:**
- Checkout no carga
- Error al procesar pago
- Webhook de Stripe no llega

**Diagnóstico:**

```bash
# 1. Verificar Stripe Dashboard
# https://dashboard.stripe.com/

# 2. Verificar webhooks
# Stripe Dashboard → Developers → Webhooks → Ver eventos

# 3. Verificar keys
# ¿STRIPE_SECRET_KEY es live o test?
# ¿STRIPE_WEBHOOK_SECRET es correcto?

# 4. Test webhook
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Soluciones:**

| Causa | Solución |
|-------|----------|
| Key incorrecta | Actualizar en Vercel env |
| Webhook secret mal | Regenerar y actualizar |
| Cuenta restringida | Contactar Stripe |

---

### 4. AI No Responde (P1)

**Síntomas:**
- Respuestas automáticas no funcionan
- Error "AI service unavailable"
- Timeout en generación

**Diagnóstico:**

```bash
# 1. Verificar API key
curl "https://generativelanguage.googleapis.com/v1/models?key=$GEMINI_API_KEY"

# 2. Verificar quota
# https://console.cloud.google.com/ → APIs → Gemini → Quotas

# 3. Verificar logs
# Buscar errores en Sentry relacionados con AI
```

**Soluciones:**

| Causa | Solución |
|-------|----------|
| API key inválida | Regenerar en Google Cloud |
| Quota excedida | Esperar reset o upgrade plan |
| Modelo no disponible | Usar fallback model |
| Timeout | Aumentar timeout o simplificar prompt |

---

### 5. Base de Datos Lenta (P2)

**Síntomas:**
- Queries tardan > 5s
- Timeouts frecuentes
- App lenta en general

**Diagnóstico:**

```sql
-- En Supabase SQL Editor:

-- 1. Queries lentas
SELECT * FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;

-- 2. Conexiones activas
SELECT count(*) FROM pg_stat_activity;

-- 3. Tablas grandes
SELECT relname, n_live_tup
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- 4. Índices faltantes
SELECT schemaname, relname, seq_scan, idx_scan
FROM pg_stat_user_tables
WHERE seq_scan > idx_scan
ORDER BY seq_scan DESC;
```

**Soluciones:**

| Causa | Solución |
|-------|----------|
| Falta índice | `CREATE INDEX` en columnas filtradas |
| Muchas conexiones | Revisar connection pooling |
| Tabla muy grande | Particionar o archivar datos viejos |
| Query N+1 | Optimizar con JOINs o batch |

---

### 6. Error de Autenticación (P1)

**Síntomas:**
- "Session expired" constante
- No puede hacer login
- Redirect loop

**Diagnóstico:**

```bash
# 1. Verificar Supabase Auth
# Supabase Dashboard → Authentication → Users

# 2. Verificar cookies
# Browser DevTools → Application → Cookies

# 3. Verificar JWT
# jwt.io → Pegar token → Verificar expiración

# 4. Verificar env vars
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**Soluciones:**

| Causa | Solución |
|-------|----------|
| Cookies bloqueadas | Verificar dominio y SameSite |
| Token expirado | Implementar refresh automático |
| Supabase down | Esperar o usar fallback |

---

## Comandos Útiles

### Logs

```bash
# Vercel logs (requiere CLI)
vercel logs --follow

# Filtrar por error
vercel logs | grep -i error

# Últimas 100 líneas
vercel logs --limit 100
```

### Database

```bash
# Backup manual
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20241210.sql

# Query rápida
psql $DATABASE_URL -c "SELECT count(*) FROM clients"
```

### Testing Rápido

```bash
# Health check
curl https://app.wallie.com/api/health | jq

# Test WhatsApp
curl -X POST https://app.wallie.com/api/test/whatsapp

# Test AI
curl -X POST https://app.wallie.com/api/test/ai \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hola"}'
```

---

## Template de Post-Mortem

```markdown
# Post-Mortem: [Título del Incidente]

**Fecha:** YYYY-MM-DD
**Duración:** X horas
**Severidad:** P0/P1/P2/P3
**Impacto:** X usuarios afectados

## Resumen
[1-2 oraciones describiendo qué pasó]

## Timeline
- HH:MM - Incidente detectado
- HH:MM - Investigación iniciada
- HH:MM - Causa identificada
- HH:MM - Mitigación aplicada
- HH:MM - Servicio restaurado

## Causa Raíz
[Descripción técnica de la causa]

## Resolución
[Qué se hizo para resolver]

## Lecciones Aprendidas
1. [Qué funcionó bien]
2. [Qué no funcionó]
3. [Qué podemos mejorar]

## Action Items
- [ ] [Acción preventiva 1]
- [ ] [Acción preventiva 2]
```

---

## Escalación

| Tiempo sin resolver | Acción |
|---------------------|--------|
| 15 min (P0) | Escalar a Lead |
| 1 hora (P1) | Escalar a Lead |
| 4 horas (P2) | Revisar prioridad |

---

_Última actualización: 10 Dic 2025_
