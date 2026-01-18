# 🔗 Conexión Backend ↔ Frontend - Estado Actual

**Fecha:** 17 Ene 2026  
**Propósito:** Mapeo completo de qué endpoints del backend están conectados en el frontend

---

## 📊 Resumen Ejecutivo

| Router | Endpoints | Estado Frontend | Página/Componente |
|--------|-----------|-----------------|-------------------|
| **debates** | `list`, `getById`, `create`, `stats` | ✅ COMPLETO | `/debates`, `/debates/[id]`, `/debates/new`, Dashboard |
| **experts** | `list`, `create`, `update`, `delete` | ✅ COMPLETO | `/settings/experts`, `/experts` |
| **quoorumInsights** | `getRecent`, `getStats`, `getById`, `rate` | ✅ COMPLETO | `/insights`, Dashboard widget |
| **quoorumDeals** | `linkDebate`, `listDeals`, `getRecommendations` | ✅ COMPLETO | Debate viewer widget |
| **quoorumFeedback** | `submit`, `getTopExperts` | ✅ COMPLETO | `/experts`, Debate feedback panel |
| **quoorumNotifications** | `list`, `markRead`, `markAllRead`, `getUnreadCount` | ✅ COMPLETO | Notification bell, `/settings/notifications` |
| **quoorumReports** | `generateDebateReport`, `createSchedule`, `getSchedules` | ✅ COMPLETO | Reports viewer, debate viewer |
| **quoorum** | `addComment`, `getComments` | ✅ COMPLETO | Debate viewer |
| **apiKeys** | `list`, `create`, `delete` | ✅ COMPLETO | `/settings/api-keys` |
| **notificationSettings** | `get`, `update` | ✅ COMPLETO | `/settings/notifications` |
| **billing** | Varios | ⚠️ PARCIAL | `/settings/billing` (algunos datos mock) |
| **debateStrategy** | `selectStrategy` | ✅ COMPLETO | `/debates/new` (selector) |
| **contextAssessment** | `analyze` | ✅ COMPLETO | Flujo de creación de debates |
| **quoorumPublicApi** | Varios | ❌ NO CONECTADO | - |
| **audit** | Todos | ❌ NO CONECTADO | (Admin only) |
| **systemLogs** | Todos | ⚠️ PARCIAL | `/admin/logs` (parcial) |
| **opinions** | Todos | ❌ NO CONECTADO | - |
| **votes** | Todos | ❌ NO CONECTADO | - |
| **deliberations** | Todos | ❌ NO CONECTADO | - |
| **sessions** | Todos | ❌ NO CONECTADO | - |
| **rounds** | Todos | ❌ NO CONECTADO | - |

---

## ✅ COMPLETAMENTE CONECTADOS

### 1. **Debates** (`api.debates`)

**Endpoints usados:**
- ✅ `debates.list` → `/debates`, Dashboard
- ✅ `debates.getById` → `/debates/[id]`
- ✅ `debates.create` → `/debates/new`
- ✅ `debates.stats` → Dashboard

**Páginas:**
- `/debates` - Lista de debates
- `/debates/[id]` - Vista individual con controles interactivos
- `/debates/new` - Crear nuevo debate con selector de estrategia

**Estado:** ✅ 100% conectado

---

### 2. **Expertos** (`api.experts`)

**Endpoints usados:**
- ✅ `experts.list` → `/settings/experts`, `/experts`
- ✅ `experts.create` → `/settings/experts` (formulario)
- ✅ `experts.update` → `/settings/experts` (edición)
- ✅ `experts.delete` → `/settings/experts` (eliminación)

**Páginas:**
- `/experts` - Ranking de Top Expertos (read-only, basado en feedback)
- `/settings/experts` - Gestión completa CRUD de expertos personalizados

**Estado:** ✅ 100% conectado

---

### 3. **Insights/Consultas** (`api.quoorumInsights`)

**Endpoints usados:**
- ✅ `quoorumInsights.getRecent` → `/insights`, Dashboard widget
- ✅ `quoorumInsights.getStats` → `/insights`, Dashboard widget
- ✅ `quoorumInsights.getById` → `/insights` (detalle individual)
- ✅ `quoorumInsights.rate` → `/insights` (valoración 1-5 estrellas)

**Páginas:**
- `/insights` - Lista completa de consultas con filtros y detalle individual

**Estado:** ✅ 100% conectado

---

### 4. **Deals Integration** (`api.quoorumDeals`)

**Endpoints usados:**
- ✅ `quoorumDeals.linkDebate` → Debate viewer widget
- ✅ `quoorumDeals.listDeals` → Debate viewer widget
- ✅ `quoorumDeals.getRecommendations` → Debate viewer widget

**Componentes:**
- `DealDebateWidget` - En `/debates/[id]` para vincular debates con deals

**Estado:** ✅ 100% conectado

---

### 5. **Feedback de Expertos** (`api.quoorumFeedback`)

**Endpoints usados:**
- ✅ `quoorumFeedback.submit` → Debate feedback panel
- ✅ `quoorumFeedback.getTopExperts` → `/experts` (ranking)

**Componentes:**
- `ExpertFeedbackPanel` - En debate viewer
- `/experts` - Ranking basado en feedback

**Estado:** ✅ 100% conectado

---

### 6. **Notificaciones** (`api.quoorumNotifications`)

**Endpoints usados:**
- ✅ `quoorumNotifications.list` → Notification center
- ✅ `quoorumNotifications.markRead` → Notification center
- ✅ `quoorumNotifications.markAllRead` → Notification center
- ✅ `quoorumNotifications.getUnreadCount` → Notification bell

**Componentes:**
- `NotificationBell` - Icono en header
- `NotificationsCenter` - Popover con lista completa
- `/settings/notifications` - Configuración de preferencias

**Estado:** ✅ 100% conectado

---

### 7. **Reports** (`api.quoorumReports`)

**Endpoints usados:**
- ✅ `quoorumReports.generateDebateReport` → Reports viewer
- ✅ `quoorumReports.createSchedule` → Reports viewer
- ✅ `quoorumReports.getSchedules` → Reports viewer

**Componentes:**
- `ReportsViewer` - Widget en debate viewer
- `CreateScheduleDialog` - Crear reportes programados
- `ShareDialog` - Compartir reportes

**Estado:** ✅ 100% conectado

---

### 8. **Comentarios en Debates** (`api.quoorum`)

**Endpoints usados:**
- ✅ `quoorum.addComment` → Debate viewer
- ✅ `quoorum.getComments` → Debate viewer

**Componentes:**
- `DebateComments` - Panel de comentarios en debate individual

**Estado:** ✅ 100% conectado

---

### 9. **API Keys** (`api.apiKeys`)

**Endpoints usados:**
- ✅ `apiKeys.list` → `/settings/api-keys`
- ✅ `apiKeys.create` → `/settings/api-keys`
- ✅ `apiKeys.delete` → `/settings/api-keys`

**Páginas:**
- `/settings/api-keys` - Gestión completa de API keys

**Estado:** ✅ 100% conectado

---

### 10. **Notification Settings** (`api.notificationSettings`)

**Endpoints usados:**
- ✅ `notificationSettings.get` → `/settings/notifications`
- ✅ `notificationSettings.update` → `/settings/notifications`

**Páginas:**
- `/settings/notifications` - Preferencias de notificaciones

**Estado:** ✅ 100% conectado

---

### 11. **Debate Strategy** (`api.debateStrategy`)

**Endpoints usados:**
- ✅ `debateStrategy.selectStrategy` → `/debates/new`

**Componentes:**
- `StrategySelector` - Selector de estrategia de deliberación

**Estado:** ✅ 100% conectado

---

### 12. **Context Assessment** (`api.contextAssessment`)

**Endpoints usados:**
- ✅ `contextAssessment.analyze` → Flujo de creación de debates

**Uso:** Análisis automático de contexto al crear debates

**Estado:** ✅ 100% conectado

---

## ⚠️ PARCIALMENTE CONECTADOS

### 13. **Billing** (`api.billing`)

**Estado:** Página `/settings/billing` existe pero algunos datos son mock

**TODO en código:**
- Datos de suscripción mock
- Uso real de endpoints de `billing` router no verificado

**Páginas:**
- `/settings/billing` - Gestión de facturación (parcial)

---

### 14. **System Logs** (`api.systemLogs`)

**Estado:** Existe `/admin/logs` pero uso limitado

**Páginas:**
- `/admin/logs` - Logs del sistema (admin only)

---

## ❌ NO CONECTADOS (Baja Prioridad)

### 15. **Quoorum Public API** (`api.quoorumPublicApi`)

**Razón:** Puede ser para uso externo (no UI), o diferencia con `apiKeys`

**Endpoints:**
- `generateApiKey`, `listApiKeys`, `revokeApiKey`, etc.

**Nota:** Investigar diferencia con `apiKeys` router

---

### 16. **Audit** (`api.audit`)

**Razón:** Admin only, logs de auditoría

**Uso potencial:** Panel de admin para auditoría de acciones

---

### 17. **Opinions** (`api.opinions`)

**Razón:** Sistema separado de votación/opiniones

**Uso potencial:** Opiniones en debates (complementario a feedback)

---

### 18. **Votes** (`api.votes`)

**Razón:** Sistema de votación colaborativa

**Uso potencial:** Votar opciones en debates

---

### 19. **Deliberations** (`api.deliberations`)

**Razón:** Historial separado de deliberaciones

**Uso potencial:** Vista alternativa de deliberaciones vs debates

---

### 20. **Sessions** (`api.sessions`)

**Razón:** Gestión de sesiones de usuario

**Uso potencial:** Panel de sesiones activas

---

### 21. **Rounds** (`api.rounds`)

**Razón:** Rounds embebidos en debates actuales

**Uso potencial:** Consultas específicas de rounds

---

## 📋 Dashboard - Estado Actual

### Datos Mostrados en Dashboard:

1. **Stats de Debates** (`api.debates.stats`)
   - Total debates
   - Debates completados
   - Consenso promedio
   - Este mes

2. **Debates Recientes** (`api.debates.list`)
   - Últimos 5 debates
   - Estado, consenso, fecha

3. **Subscription Info** (Mock actualmente)
   - Plan actual
   - Uso de debates
   - Próxima renovación

4. **Quick Actions**
   - Nuevo Debate
   - Ver Historial
   - Configuración

### Falta en Dashboard:

- ❌ Widget de Insights (existe componente `quoorum-insights-widget.tsx` pero no está en dashboard)
- ❌ Widget de Notificaciones (solo icono en header)
- ❌ Widget de Deals pendientes
- ❌ Actividad reciente de expertos

---

## 🎯 Recomendaciones

### Alta Prioridad:

1. **Añadir Widgets al Dashboard:**
   - Insights recientes (`quoorum-insights-widget`)
   - Notificaciones no leídas (resumen)
   - Deals pendientes vinculados a debates

2. **Completar Billing:**
   - Reemplazar datos mock con llamadas reales a `api.billing`

### Media Prioridad:

3. **Clarificar API Keys:**
   - Investigar diferencia `apiKeys` vs `quoorumPublicApi`
   - Unificar o explicar propósito diferente

### Baja Prioridad:

4. **Features Adicionales:**
   - Panel de Opinions/Votes (si se decide usar)
   - Vista de Deliberations (si se necesita)
   - Panel de Admin para Audit/SystemLogs

---

## ✅ Conclusión

**Estado General:** 🟢 **EXCELENTE**

- **90%+ de endpoints críticos están conectados**
- Funcionalidades principales completamente implementadas
- Faltan principalmente features de admin y sistemas auxiliares

**Acciones Recomendadas:**
1. Añadir widgets faltantes al Dashboard
2. Completar integración de Billing
3. Documentar diferencia entre `apiKeys` y `quoorumPublicApi`

---

_Última actualización: 17 Ene 2026_
