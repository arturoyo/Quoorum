# Uptime Monitoring

> **Version:** 1.0.0 | **Last Updated:** 10 Dec 2025

Este documento describe la configuracion de monitoreo de uptime para Wallie.

---

## Arquitectura de Monitoreo

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL MONITORING                          │
│  ┌─────────────────┐         ┌─────────────────┐               │
│  │   BetterStack   │         │     Checkly     │               │
│  │   (Primary)     │         │   (Secondary)   │               │
│  └────────┬────────┘         └────────┬────────┘               │
│           │                           │                         │
│           └───────────┬───────────────┘                         │
│                       │                                         │
│                       ▼                                         │
└─────────────────────────────────────────────────────────────────┘
                        │
                        │ HTTPS GET/HEAD
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      WALLIE API                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ /api/health (Detailed)                                  │   │
│  │ - Database check                                        │   │
│  │ - Supabase check                                        │   │
│  │ - AI services check                                     │   │
│  │ - WhatsApp check                                        │   │
│  │ - Stripe check                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ /api/status (Public)                                    │   │
│  │ - Service status                                        │   │
│  │ - Active incidents                                      │   │
│  │ - Uptime percentages                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                        │
                        │ Inngest Cron (*/5 min)
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                 INTERNAL MONITORING                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ healthMonitor Worker                                    │   │
│  │ - Runs every 5 minutes                                  │   │
│  │ - Saves to system_health_checks table                   │   │
│  │ - Calculates uptime percentages                         │   │
│  │ - Updates service_status table                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ healthHistoryCleanup Worker                             │   │
│  │ - Runs daily at 3 AM                                    │   │
│  │ - Removes records older than 90 days                    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Endpoints de Health Check

### `/api/health` (Detallado)

Health check completo con verificacion de todos los servicios.

```bash
curl https://wallie.pro/api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-10T12:00:00.000Z",
  "version": "0.2.0",
  "uptime": 86400,
  "services": {
    "database": {
      "status": "healthy",
      "latency": 12
    },
    "supabase": {
      "status": "healthy",
      "latency": 45
    },
    "ai": {
      "status": "healthy",
      "latency": 2
    },
    "whatsapp": {
      "status": "healthy",
      "latency": 1
    },
    "stripe": {
      "status": "healthy",
      "latency": 1
    }
  }
}
```

**Status Codes:**
- `200` - All systems operational or degraded
- `503` - Critical service unavailable

### `/api/status` (Publico)

Status page API para integracion con dashboards externos.

```bash
curl https://wallie.pro/api/status
```

**Response:**
```json
{
  "status": "operational",
  "timestamp": "2025-12-10T12:00:00.000Z",
  "services": [
    {
      "id": "api",
      "name": "API",
      "status": "operational",
      "uptimePercent24h": 99.95
    }
  ],
  "activeIncidents": []
}
```

### HEAD Requests

Para checks simples de uptime:

```bash
curl -I https://wallie.pro/api/health
# Returns 200 if healthy, 503 if not
```

---

## Configuracion BetterStack (Recomendado)

[BetterStack](https://betterstack.com/) es nuestra solucion recomendada para uptime monitoring.

### Paso 1: Crear cuenta

1. Ir a [betterstack.com](https://betterstack.com/)
2. Crear cuenta o login con GitHub
3. El plan Free incluye 5 monitors

### Paso 2: Crear Monitor

1. Dashboard > Monitors > Create Monitor
2. Configurar:

```yaml
Monitor Type: HTTP(S)
URL: https://wallie.pro/api/health
Request Method: GET
Check Frequency: 1 minute
Timeout: 30 seconds

# Expected Response
Expected Status Code: 200
Check Response Body: true
Response Body Contains: "status":"healthy"

# Alerting
Alert After: 1 failure
Notify: Email + Slack
```

### Paso 3: Crear Monitors Adicionales

| Monitor | URL | Check | Alert After |
|---------|-----|-------|-------------|
| API Health | `/api/health` | Body contains "healthy" | 1 failure |
| Homepage | `/` | Status 200 | 2 failures |
| Dashboard | `/dashboard` | Status 200/302 | 2 failures |
| tRPC | `/api/trpc/health.check` | Status 200 | 1 failure |

### Paso 4: Configurar Status Page

1. Status Pages > Create Status Page
2. Configurar subdomain: `status.wallie.pro`
3. Añadir todos los monitors
4. Personalizar branding

### Paso 5: Configurar Alertas

```yaml
# Slack Integration
Webhook URL: https://hooks.slack.com/services/xxx/xxx/xxx
Channel: #alerts-production

# Email
Recipients:
  - team@wallie.pro
  - on-call@wallie.pro

# Escalation Policy
1. Email immediately
2. Slack after 1 minute
3. PagerDuty after 5 minutes (optional)
```

---

## Configuracion Checkly (Alternativa)

[Checkly](https://www.checklyhq.com/) es una alternativa con soporte para Playwright.

### Paso 1: Crear cuenta

1. Ir a [checklyhq.com](https://www.checklyhq.com/)
2. Crear cuenta
3. Plan Hobby: 5 checks gratis

### Paso 2: Crear API Check

```javascript
// check.js
const { expect } = require('@playwright/test');

exports.handler = async () => {
  const response = await fetch('https://wallie.pro/api/health');
  const data = await response.json();

  expect(response.status).toBe(200);
  expect(data.status).toBe('healthy');
  expect(data.services.database.status).toBe('healthy');

  return {
    statusCode: response.status,
    body: JSON.stringify(data),
  };
};
```

### Paso 3: Configurar Check

```yaml
Name: Wallie API Health
Type: API Check
Frequency: 1 minute
Locations:
  - us-east-1
  - eu-west-1
  - ap-southeast-1

Assertions:
  - response.status === 200
  - response.jsonBody.status === 'healthy'
  - response.time < 5000

Alert Settings:
  - After 1 failure
  - Recovery after 2 passes
```

### Paso 4: Integrar con CLI

```bash
# Instalar CLI
npm install -g checkly

# Login
checkly login

# Deploy checks
checkly deploy
```

---

## Workers Internos (Inngest)

### healthMonitor

Ejecuta cada 5 minutos para:
- Verificar estado de todos los servicios
- Guardar historial en `system_health_checks`
- Calcular porcentajes de uptime
- Actualizar `service_status`

```typescript
// Trigger manual si es necesario
await inngest.send({
  name: 'health/monitor',
  data: {},
});
```

### healthHistoryCleanup

Ejecuta diariamente a las 3 AM para:
- Eliminar registros antiguos (>90 dias)
- Mantener la base de datos limpia

---

## Base de Datos

### Tablas

```sql
-- Historial de health checks
CREATE TABLE system_health_checks (
  id UUID PRIMARY KEY,
  service TEXT NOT NULL,
  status service_status_enum NOT NULL,
  response_time INTEGER,
  is_healthy INTEGER NOT NULL,
  error_message TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Estado actual de servicios
CREATE TABLE service_status (
  id UUID PRIMARY KEY,
  service TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  status service_status_enum NOT NULL DEFAULT 'operational',
  uptime_percent_24h REAL DEFAULT 100,
  uptime_percent_7d REAL DEFAULT 100,
  uptime_percent_30d REAL DEFAULT 100,
  avg_response_time_24h INTEGER,
  last_check_at TIMESTAMPTZ,
  last_healthy_at TIMESTAMPTZ
);

-- Incidentes
CREATE TABLE incidents (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity incident_severity_enum NOT NULL,
  status incident_status_enum NOT NULL DEFAULT 'investigating',
  affected_services TEXT[] NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  is_public INTEGER DEFAULT 1
);
```

---

## Status Page Publica

La pagina de estado publica esta disponible en `/status`:

- URL: `https://wallie.pro/status`
- Sin autenticacion requerida
- Auto-refresh cada 30 segundos
- Muestra:
  - Estado general del sistema
  - Estado de cada servicio
  - Latencia de respuesta
  - Incidentes activos

---

## Alertas y Notificaciones

### Canales de Alerta

| Canal | Uso | Configuracion |
|-------|-----|---------------|
| Email | Primary | team@wallie.pro |
| Slack | Real-time | #alerts-production |
| PagerDuty | Critical | On-call rotation |
| SMS | Critical only | Via BetterStack |

### Escalation Policy

```
Minuto 0: Email + Slack
Minuto 5: PagerDuty (si es critical)
Minuto 15: SMS al on-call
Minuto 30: Escalate a backup
```

### Tipos de Alerta

| Severidad | Condicion | Accion |
|-----------|-----------|--------|
| Critical | Database down | PagerDuty + SMS |
| High | API response >5s | Slack + Email |
| Medium | Service degraded | Email |
| Low | Scheduled maintenance | Email 24h antes |

---

## Metricas de SLA

### Objetivos

| Servicio | SLA Target | Medicion |
|----------|------------|----------|
| API | 99.9% | Monthly uptime |
| Database | 99.95% | Monthly uptime |
| WhatsApp | 99.5% | Monthly uptime |
| Response Time | <500ms | P95 |

### Calculo de Uptime

```
Uptime % = (Total Minutes - Downtime Minutes) / Total Minutes * 100

Monthly (30 days):
- 99.9% = max 43.2 min downtime
- 99.5% = max 216 min downtime
- 99.0% = max 432 min downtime
```

---

## Runbook: Incidente

### 1. Detectar

- Alerta de BetterStack/Checkly
- Dashboard muestra servicio degradado
- Usuario reporta problema

### 2. Diagnosticar

```bash
# Verificar health
curl https://wallie.pro/api/health | jq

# Verificar logs (Vercel)
vercel logs --follow

# Verificar Supabase
# Dashboard > Logs > API
```

### 3. Comunicar

1. Crear incidente en Admin Panel
2. Publicar en Status Page
3. Notificar en Slack

### 4. Resolver

1. Identificar root cause
2. Aplicar fix
3. Verificar recuperacion
4. Actualizar incidente a "resolved"

### 5. Post-Mortem

1. Documentar timeline
2. Identificar root cause
3. Definir prevention measures
4. Actualizar runbooks

---

## Checklist de Setup

- [ ] Crear cuenta en BetterStack
- [ ] Configurar monitor principal (/api/health)
- [ ] Configurar monitores secundarios
- [ ] Crear status page publica
- [ ] Configurar integracion Slack
- [ ] Configurar escalation policy
- [ ] Verificar alertas funcionan
- [ ] Documentar contactos on-call
- [ ] Configurar Inngest workers (automatico con deploy)
- [ ] Verificar /status page funciona

---

## Variables de Entorno

No se requieren variables adicionales para uptime monitoring.
Los workers usan las mismas variables que la aplicacion principal.

---

## Costos

| Servicio | Plan | Costo | Incluye |
|----------|------|-------|---------|
| BetterStack | Free | $0 | 5 monitors, 1 status page |
| BetterStack | Starter | $25/mo | 20 monitors, custom domain |
| Checkly | Hobby | $0 | 5 checks |
| Checkly | Team | $45/mo | 20 checks, Playwright |

**Recomendacion:** Empezar con BetterStack Free, upgrade cuando sea necesario.

---

*Last Updated: 10 Dec 2025*
