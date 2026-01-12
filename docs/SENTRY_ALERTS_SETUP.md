# Sentry Alerts Configuration

## Configuración de Alertas Críticas

Sentry ya está configurado en el proyecto. Para habilitar alertas automáticas:

### 1. Configurar Alertas en Sentry Dashboard

1. Ve a [sentry.io](https://sentry.io)
2. Selecciona el proyecto Wallie
3. Ve a **Alerts** → **Create Alert**

### 2. Alert Rules Recomendadas

#### Alert 1: Errores Críticos
- **Nombre:** Critical Errors
- **Condición:** Error count > 10 in 5 minutes
- **Severidad:** Critical
- **Acciones:**
  - Email a equipo
  - Slack webhook
  - PagerDuty (opcional)

#### Alert 2: Error Rate Spike
- **Nombre:** Error Rate Spike
- **Condición:** Error rate increases by 50% compared to previous hour
- **Severidad:** High
- **Acciones:**
  - Email a equipo
  - Slack webhook

#### Alert 3: Performance Degradation
- **Nombre:** Slow Transactions
- **Condición:** P95 transaction duration > 3 seconds
- **Severidad:** Medium
- **Acciones:**
  - Email a equipo

#### Alert 4: High Memory Usage
- **Nombre:** Memory Leak Detection
- **Condición:** Memory usage > 80%
- **Severidad:** High
- **Acciones:**
  - Email a equipo
  - Slack webhook

### 3. Integración con Slack

1. En Sentry Dashboard: **Settings** → **Integrations**
2. Busca "Slack" y haz clic en **Add to Slack**
3. Autoriza la integración
4. Configura el canal (ej: `#wallie-alerts`)

### 4. Integración con Email

1. En Sentry Dashboard: **Settings** → **Teams**
2. Agrega miembros del equipo
3. Configura notificaciones por email en **User Settings** → **Notifications**

### 5. Variables de Entorno Necesarias

```bash
# .env.production
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=xxx  # Para releases
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

### 6. Testing de Alertas

Para probar que las alertas funcionan:

```typescript
// En cualquier endpoint
throw new Error("TEST ALERT - Please ignore");
```

Deberías recibir una alerta en < 5 minutos.

### 7. Configuración de Severidad

Sentry ya filtra errores automáticamente:
- ✅ Ignora errores de desarrollo
- ✅ Ignora errores de red
- ✅ Ignora requests cancelados
- ✅ Filtra datos sensibles (auth headers, cookies)

### 8. Dashboard Recomendado

Crea un dashboard en Sentry con:
- Error count (last 24h)
- Error rate trend
- Top 10 errors
- P95 transaction duration
- Memory usage
- Active users

### 9. On-Call Rotation

Para configurar on-call:
1. Usa PagerDuty o similar
2. Integra con Sentry
3. Define rotación semanal
4. Configura escalación (15min → 30min → 1h)

### 10. Post-Mortem Process

Cuando ocurra un incidente:
1. Sentry crea issue automáticamente
2. Asigna a responsable
3. Investiga y resuelve
4. Marca como "Resolved"
5. Crea post-mortem en Notion/Confluence
6. Actualiza runbooks

## Checklist de Verificación

- [ ] Sentry DSN configurado en producción
- [ ] Alertas de errores críticos configuradas
- [ ] Integración con Slack funcionando
- [ ] Emails de alerta configurados
- [ ] Dashboard de monitoreo creado
- [ ] On-call rotation definida
- [ ] Runbooks actualizados
- [ ] Post-mortem process documentado

## Recursos

- [Sentry Alerts Documentation](https://docs.sentry.io/product/alerts/)
- [Sentry Slack Integration](https://docs.sentry.io/product/integrations/slack/)
- [Sentry Best Practices](https://docs.sentry.io/platforms/javascript/guides/nextjs/best-practices/)
