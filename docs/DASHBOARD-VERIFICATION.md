# 🔍 Verificación Automática de Interacciones del Dashboard

**Versión:** 1.0.0
**Última actualización:** 31 Dic 2025

---

## 📋 Resumen

Sistema automatizado para verificar todas las interacciones del dashboard:

- ✅ Health check endpoint (`/api/dashboard-health`)
- ✅ Tests E2E con Playwright
- ✅ Script de verificación CLI
- ✅ Monitoreo de performance

---

## 🚀 Uso Rápido

### 1. Health Check Endpoint

```bash
# Verificar todas las interacciones
curl http://localhost:3001/api/dashboard-health

# Con formato JSON legible
curl http://localhost:3001/api/dashboard-health | jq
```

### 2. Script CLI

```bash
# Verificación automática completa
pnpm verify:dashboard

# Con URL personalizada
DASHBOARD_URL=http://localhost:3001 pnpm verify:dashboard
```

### 3. Tests E2E

```bash
# Ejecutar tests de interacciones del dashboard
pnpm test:e2e:dashboard

# Con UI de Playwright
pnpm --filter @wallie/web exec playwright test dashboard-interactions.spec.ts --ui
```

---

## 📊 Qué Verifica

### Interacciones Verificadas

| Interacción              | Endpoint              | Tipo            | Crítico |
| ------------------------ | --------------------- | --------------- | ------- |
| **Database Connection**  | `database`            | Infraestructura | ✅ Sí   |
| **Table: profiles**      | `table:profiles`      | Infraestructura | ✅ Sí   |
| **Table: clients**       | `table:clients`       | Infraestructura | ✅ Sí   |
| **Table: conversations** | `table:conversations` | Infraestructura | ✅ Sí   |
| **Table: messages**      | `table:messages`      | Infraestructura | ✅ Sí   |
| **Table: subscriptions** | `table:subscriptions` | Infraestructura | ✅ Sí   |
| **Table: user_addons**   | `table:user_addons`   | Infraestructura | ✅ Sí   |
| **Stats Overview**       | `stats.overview`      | Query           | ✅ Sí   |
| **Conversations Count**  | `conversations.count` | Query           | ✅ Sí   |
| **Messages This Month**  | `messages.monthly`    | Query           | ✅ Sí   |
| **Inbox Feed**           | `inbox.getFeed`       | Query           | ✅ Sí   |

### Queries tRPC Verificadas (E2E)

- ✅ `profiles.checkOnboarding`
- ✅ `stats.overview`
- ✅ `stats.pipelineDistribution`
- ✅ `stats.conversionFunnel`
- ✅ `inbox.getFeed`
- ✅ `usage.getSummary`

### Componentes Verificados (E2E)

- ✅ Quick Stats Cards (4 cards)
- ✅ PointsWidget (Gamificación)
- ✅ SuggestedReminders
- ✅ Inbox Feed (Actividad Reciente)
- ✅ ProductAnnouncements

---

## 🔧 Configuración

### Variables de Entorno

```bash
# URL del dashboard (default: http://localhost:3001)
DASHBOARD_URL=http://localhost:3001

# Para tests E2E
TEST_ADMIN_EMAIL=admin@wallie.com
TEST_ADMIN_PASSWORD=admin123
```

### Integración con CI/CD

```yaml
# .github/workflows/dashboard-health.yml
name: Dashboard Health Check

on:
  schedule:
    - cron: '*/5 * * * *' # Cada 5 minutos
  workflow_dispatch:

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: pnpm install
      - run: pnpm verify:dashboard
        env:
          DASHBOARD_URL: https://wallie.pro
```

---

## 📈 Interpretación de Resultados

### Estados

| Estado       | Significado                                   | Acción           |
| ------------ | --------------------------------------------- | ---------------- |
| **healthy**  | ✅ Todo funciona correctamente                | Ninguna          |
| **degraded** | ⚠️ Funciona pero con problemas de performance | Investigar       |
| **down**     | ❌ Servicio no disponible                     | Acción inmediata |

### Thresholds de Performance

| Métrica       | Healthy | Degraded | Down         |
| ------------- | ------- | -------- | ------------ |
| Response Time | < 2s    | 2-5s     | > 5s o error |
| Success Rate  | 100%    | 95-99%   | < 95%        |

---

## 🐛 Troubleshooting

### Health Check Retorna 503

**Problema:** Base de datos no disponible

```bash
# Verificar conexión a DB
pnpm db:studio

# Verificar variables de entorno
echo $DATABASE_URL
```

### Queries tRPC Fallan

**Problema:** Endpoints no responden

```bash
# Verificar que el servidor está corriendo
curl http://localhost:3001/api/health

# Verificar logs
pnpm dev  # Ver logs en consola
```

### Tests E2E Fallan

**Problema:** Autenticación o datos de prueba

```bash
# Verificar credenciales de test
echo $TEST_ADMIN_EMAIL
echo $TEST_ADMIN_PASSWORD

# Ejecutar con modo debug
pnpm test:e2e:dashboard --debug
```

---

## 📝 Ejemplos de Uso

### Verificación Manual

```bash
# 1. Health check rápido
curl http://localhost:3001/api/dashboard-health | jq '.status'

# 2. Ver todas las interacciones
curl http://localhost:3001/api/dashboard-health | jq '.interactions[] | {name, status, responseTime}'

# 3. Filtrar solo las que están down
curl http://localhost:3001/api/dashboard-health | jq '.interactions[] | select(.status == "down")'
```

### Monitoreo Continuo

```bash
# Script de monitoreo cada 5 minutos
watch -n 300 'pnpm verify:dashboard'
```

### Integración con Alertas

```typescript
// Ejemplo: Webhook de alerta
const result = await fetch('/api/dashboard-health')
const data = await result.json()

if (data.status === 'down') {
  await sendSlackAlert({
    channel: '#alerts',
    message: `🚨 Dashboard está DOWN: ${data.down} servicios caídos`,
  })
}
```

---

## 🔗 Archivos Relacionados

- **Health Check Endpoint:** `apps/web/src/app/api/dashboard-health/route.ts`
- **Tests E2E:** `apps/web/e2e/dashboard-interactions.spec.ts`
- **Script CLI:** `scripts/verify-dashboard-interactions.ts`
- **Dashboard Page:** `apps/web/src/app/dashboard/page.tsx`
- **Hook de Datos:** `apps/web/src/hooks/use-dashboard-data.ts`

---

## ✅ Checklist de Verificación

Antes de cada deploy, ejecutar:

- [ ] `pnpm verify:dashboard` → Todos los checks pasan
- [ ] `pnpm test:e2e:dashboard` → Todos los tests pasan
- [ ] Verificar que no hay errores en consola
- [ ] Verificar que todos los widgets cargan
- [ ] Verificar que las queries responden en < 2s

---

**Última actualización:** 31 Dic 2025
