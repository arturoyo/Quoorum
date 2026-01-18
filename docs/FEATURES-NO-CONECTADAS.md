# 🔍 Features del Backend NO Conectadas en el Frontend

**Fecha:** 16 Ene 2026
**Propósito:** Análisis completo de funcionalidades del backend que aún no están expuestas en la UI

---

## 📊 Resumen Ejecutivo

| Categoría | Routers | Endpoints No Usados | Prioridad |
|-----------|---------|---------------------|-----------|
| **Gestión de Expertos** | `experts` | `create`, `update`, `delete` | 🔴 ALTA |
| **Insights/Consultas** | `quoorumInsights` | Todos (`getRecent`, `getStats`, `getById`, `rate`) | 🔴 ALTA |
| **API Pública** | `quoorumPublicApi` | Todos (`generateApiKey`, `listApiKeys`, etc.) | 🟡 MEDIA |
| **Auditoría** | `audit` | Todos (logs de auditoría) | 🟢 BAJA |
| **Sistema** | `systemLogs`, `sessions`, `rounds`, etc. | Varios | 🟢 BAJA |

---

## 🔴 ALTA PRIORIDAD - Features Críticas

### 1. Gestión de Expertos Personalizados (`/settings/experts`)

**Router:** `packages/api/src/routers/experts.ts`

**Endpoints disponibles:**
- ✅ `experts.list` - **USADO** (en `/experts` pero solo lectura)
- ❌ `experts.create` - **NO USADO** (crear expertos personalizados)
- ❌ `experts.update` - **NO USADO** (editar expertos)
- ❌ `experts.delete` - **NO USADO** (desactivar expertos)
- ✅ `experts.getById` - **USADO** (parcialmente)

**Estado actual:**
- `/experts` solo muestra ranking de expertos (Top Experts basado en feedback)
- **NO existe página `/settings/experts`** para crear/editar expertos personalizados

**Lo que falta:**
- Página `/settings/experts` para gestión completa
- Formulario para crear expertos con:
  - Nombre, expertise, descripción
  - System prompt personalizado
  - Configuración AI (provider, model, temperature)
  - Categoría
- Lista de expertos personalizados del usuario
- Editar/eliminar expertos propios

**Impacto:** Los usuarios no pueden crear sus propios expertos especializados

---

### 2. Página de Insights/Consultas (`/insights`)

**Router:** `packages/api/src/routers/quoorumInsights.ts`

**Endpoints disponibles:**
- ❌ `quoorumInsights.getRecent` - **NO USADO** (consultas recientes)
- ❌ `quoorumInsights.getStats` - **NO USADO** (estadísticas de consultas)
- ❌ `quoorumInsights.getById` - **NO USADO** (detalle de consulta)
- ❌ `quoorumInsights.rate` - **NO USADO** (valorar consulta)
- ✅ `quoorumInsights.store` - **USADO** (backend interno, almacena consultas)

**Estado actual:**
- Solo existe widget en dashboard (`quoorum-insights-widget.tsx`) que usa `getRecent` y `getStats`
- **NO existe página `/insights`** para ver todas las consultas y detalle

**Lo que falta:**
- Página `/insights` con:
  - Lista completa de consultas (tabla/filtros)
  - Detalle individual de cada consulta
  - Rating de consultas (1-5 estrellas)
  - Filtros por urgencia, trigger, fecha
  - Estadísticas globales

**Impacto:** Los usuarios no pueden revisar el historial completo de cómo se ha usado Forum en sus conversaciones

**Schema relacionado:**
- `packages/db/src/schema/quoorum-consultations.ts` - Tabla completa con todos los campos

---

### 3. API Pública de Quoorum

**Router:** `packages/api/src/routers/quoorumPublicApi.ts`

**Endpoints disponibles:**
- ❌ `quoorumPublicApi.generateApiKey` - **NO USADO** (generar API keys)
- ❌ `quoorumPublicApi.listApiKeys` - **NO USADO** (listar API keys)
- ❌ `quoorumPublicApi.revokeApiKey` - **NO USADO** (revocar API keys)
- ❌ Varios endpoints de webhooks, debates, etc.

**Estado actual:**
- Existe `/settings/api-keys` pero usa `api.apiKeys` (router diferente)
- `quoorumPublicApi` es un router separado para API pública de Forum

**Lo que falta:**
- Integrar endpoints de `quoorumPublicApi` en UI de API Keys
- O explicar diferencia entre `apiKeys` y `quoorumPublicApi`

**Nota:** Puede ser que `quoorumPublicApi` sea para uso externo (no UI) - confirmar

---

## 🟡 MEDIA PRIORIDAD - Features Útiles

### 4. Sistema de Opiniones (`opinions`)

**Router:** `packages/api/src/routers/opinions.ts`

**Endpoints:**
- Listar opiniones
- Crear opinión
- Actualizar opinión
- Eliminar opinión

**Estado:** Router existe pero **NO usado en frontend**

**Uso potencial:** Sistema de votación/opiniones en debates (complementario a feedback de expertos)

---

### 5. Sistema de Votos (`votes`)

**Router:** `packages/api/src/routers/votes.ts`

**Endpoints:**
- Listar votos
- Crear voto
- Actualizar voto

**Estado:** Router existe pero **NO usado en frontend**

**Uso potencial:** Votar opciones en debates, ranking colaborativo

---

### 6. Deliberaciones (`deliberations`)

**Router:** `packages/api/src/routers/deliberations.ts`

**Endpoints:**
- Listar deliberaciones
- Crear deliberación
- Actualizar deliberación

**Estado:** Router existe pero **NO usado en frontend**

**Uso potencial:** Historial de deliberaciones separado de debates

---

## 🟢 BAJA PRIORIDAD - Features de Sistema

### 7. Auditoría (`audit`)

**Router:** `packages/api/src/routers/audit.ts`

**Estado:** Solo para administradores, logs de auditoría
**Uso:** Panel de admin (no crítico para usuarios)

---

### 8. System Logs (`systemLogs`)

**Router:** `packages/api/src/routers/systemLogs.ts`

**Estado:** Existe `/admin/logs` que lo usa parcialmente
**Uso:** Debugging y monitoreo (admin only)

---

### 9. Sessions (`sessions`)

**Router:** `packages/api/src/routers/sessions.ts`

**Estado:** Router existe pero uso limitado
**Uso potencial:** Gestión de sesiones de usuario

---

### 10. Rounds (`rounds`)

**Router:** `packages/api/src/routers/rounds.ts`

**Estado:** Router existe pero debates usan `rounds` embebido
**Uso:** Posiblemente legacy o para consultas específicas

---

## 📋 Schemas de Base de Datos Sin UI

### Schemas con datos pero sin página:

1. **`quoorum-consultations`** - Tabla completa, solo widget en dashboard
2. **`experts`** - Tabla completa, solo ranking visible, sin gestión CRUD
3. **`quoorum-api-keys`** - Tabla completa, pero posiblemente duplicada con `api-keys`

### Schemas legacy/legacy:
- `consensus`, `deliberations`, `opinions`, `votes`, `rounds` - Pueden ser versiones anteriores o especializadas

---

## 🎯 Recomendaciones de Implementación

### Prioridad 1: Gestión de Expertos

**Crear:** `/settings/experts`

**Features:**
1. Lista de expertos personalizados del usuario
2. Botón "Crear Experto"
3. Formulario modal/dialog con:
   - Nombre, expertise, descripción
   - System prompt (textarea grande)
   - AI Config (provider, model, temperature)
   - Categoría
4. Acciones: Editar, Desactivar, Eliminar
5. Vista previa del experto

**Router a usar:** `api.experts.*`

---

### Prioridad 2: Página de Insights

**Crear:** `/insights`

**Features:**
1. Tabla con todas las consultas:
   - Original message
   - Client (si aplica)
   - Urgency badge
   - Triggers badges
   - Confidence score
   - Date
   - Rating (si existe)
2. Filtros:
   - Por urgencia
   - Por trigger
   - Por fecha
   - Por rating
3. Detalle individual:
   - Click en fila → modal/detalle completo
   - Muestra todos los campos: strategy, responseApproach, talkingPoints, etc.
   - Botón para rate (1-5 estrellas)
4. Estadísticas en sidebar:
   - Total consultas
   - Urgency breakdown
   - Top triggers
   - Avg confidence

**Router a usar:** `api.quoorumInsights.*`

---

### Prioridad 3: Clarificar API Keys

**Investigar:**
- ¿Diferencia entre `apiKeys` router y `quoorumPublicApi`?
- ¿Son para diferentes propósitos?
- ¿Unificar en una sola UI?

---

## ✅ Features Ya Conectadas (Referencia)

Estos routers/features **SÍ están conectados** y funcionando:

- ✅ `debates` - Lista, crear, ver individual, controles interactivos
- ✅ `debateStrategy` - Selector de estrategia en crear debate
- ✅ `quoorumDeals` - Link debates ↔ deals (widget en debate individual)
- ✅ `quoorumFeedback` - Top Experts page, feedback panel
- ✅ `quoorumNotifications` - Centro de notificaciones (bell icon)
- ✅ `quoorumReports` - Viewer con schedules y sharing
- ✅ `quoorum` - Comments en debates
- ✅ `contextAssessment` - Flujo de creación de debates
- ✅ `apiKeys` - Página `/settings/api-keys` (pero verificar si falta quoorumPublicApi)
- ✅ `notificationSettings` - Página `/settings/notifications`
- ✅ `billing` - Página `/settings/billing` (parcial, algunos datos mock)

---

## 📝 Notas Adicionales

### Funcionalidades Parcialmente Conectadas:

1. **Billing (`billing` router)**
   - Existe página `/settings/billing`
   - Algunos datos son mock (TODO en código: "Replace with actual API call")
   - Verificar qué endpoints de `billing` router realmente se usan

2. **Expertos (`experts` router)**
   - Solo lectura en `/experts` (ranking)
   - CRUD completo disponible pero sin UI

3. **Insights (`quoorumInsights`)**
   - Widget en dashboard usa `getRecent` y `getStats`
   - Pero NO existe página dedicada con lista completa y detalle

---

## 🔗 Archivos Relacionados

**Routers del backend:**
- `packages/api/src/routers/experts.ts` - CRUD completo
- `packages/api/src/routers/quoorum-insights.ts` - Consultas Forum
- `packages/api/src/routers/quoorum-public-api.ts` - API pública

**Schemas de DB:**
- `packages/db/src/schema/experts.ts` - Expertos personalizados
- `packages/db/src/schema/quoorum-consultations.ts` - Consultas Forum

**UI existente (parcial):**
- `apps/web/src/app/experts/page.tsx` - Solo ranking (read-only)
- `apps/web/src/components/dashboard/quoorum-insights-widget.tsx` - Widget dashboard

**UI faltante:**
- ❌ `apps/web/src/app/settings/experts/page.tsx` - Gestión CRUD
- ❌ `apps/web/src/app/insights/page.tsx` - Lista y detalle de consultas

---

_Última actualización: 16 Ene 2026_
