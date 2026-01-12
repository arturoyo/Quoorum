# Goals System — Especificación Técnica

> **Versión:** 1.0.0 | **Fecha:** 29 Dic 2025
> **Estado:** Implementado | **Prioridad:** ALTA

---

## Resumen Ejecutivo

Sistema de objetivos donde los usuarios pueden definir metas mensuales, trimestrales o anuales con visualización de progreso en tiempo real y beneficios motivacionales.

### Objetivos

1. **Definir metas claras** para el usuario
2. **Visualizar progreso** en tiempo real en el Dashboard
3. **Motivar al usuario** con el beneficio de alcanzar la meta
4. **Seguimiento automático** basado en métricas reales

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                       GOALS SYSTEM                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐        │
│  │   GOALS     │────▶│   METRIC    │────▶│  PROGRESS   │        │
│  │  STORAGE    │     │  CALCULATOR │     │  DISPLAY    │        │
│  └─────────────┘     └─────────────┘     └─────────────┘        │
│       │                    │                    │                │
│       │                    │                    │                │
│       │                    ▼                    │                │
│       │           ┌─────────────┐               │                │
│       │           │    DATA     │               │                │
│       │           │   SOURCES   │               │                │
│       │           │ deals,      │               │                │
│       │           │ clients,    │               │                │
│       │           │ messages    │               │                │
│       │           └─────────────┘               │                │
│       │                    │                    │                │
│       ▼                    ▼                    ▼                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                      WORKER                              │    │
│  │               (Goal Status Check)                        │    │
│  │         Marks goals as completed/missed                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tipos de Objetivos

### Métricas Disponibles

| Métrica        | Descripción                 | Fuente de datos                |
| -------------- | --------------------------- | ------------------------------ |
| `revenue`      | Ingresos totales en €       | `deals.closed_won`             |
| `deals_closed` | Número de deals cerrados    | `deals.closed_won`             |
| `new_clients`  | Nuevos clientes adquiridos  | `clients.createdAt`            |
| `messages`     | Mensajes enviados/recibidos | `messages` via `conversations` |

### Períodos Disponibles

| Período     | Duración              | Caso de uso            |
| ----------- | --------------------- | ---------------------- |
| `monthly`   | 1 mes (calendario)    | Objetivos operativos   |
| `quarterly` | 3 meses (trimestre)   | Objetivos tácticos     |
| `annual`    | 12 meses (año fiscal) | Objetivos estratégicos |

### Estados del Objetivo

| Estado      | Descripción                             |
| ----------- | --------------------------------------- |
| `active`    | Objetivo en progreso                    |
| `completed` | Período terminó y se alcanzó la meta    |
| `missed`    | Período terminó sin alcanzar la meta    |
| `cancelled` | Usuario canceló el objetivo manualmente |

---

## Schema de Base de Datos

### Tabla: user_goals

```sql
CREATE TYPE goal_period AS ENUM ('monthly', 'quarterly', 'annual');
CREATE TYPE goal_metric AS ENUM ('revenue', 'deals_closed', 'new_clients', 'messages');
CREATE TYPE goal_status AS ENUM ('active', 'completed', 'missed', 'cancelled');

CREATE TABLE user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Definición del objetivo
  title TEXT NOT NULL,
  metric goal_metric NOT NULL,
  period goal_period NOT NULL,
  target_value DECIMAL(12, 2) NOT NULL,
  current_value DECIMAL(12, 2) NOT NULL DEFAULT 0,

  -- Motivación
  benefit TEXT,

  -- Período
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,

  -- Estado
  status goal_status NOT NULL DEFAULT 'active',
  show_on_dashboard BOOLEAN NOT NULL DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_target CHECK (target_value > 0),
  CONSTRAINT valid_dates CHECK (end_date > start_date)
);

-- Índices
CREATE INDEX idx_user_goals_user ON user_goals(user_id);
CREATE INDEX idx_user_goals_status ON user_goals(user_id, status);
CREATE INDEX idx_user_goals_period ON user_goals(user_id, start_date, end_date);
CREATE INDEX idx_user_goals_dashboard ON user_goals(user_id, show_on_dashboard, status);
```

---

## API Endpoints (tRPC)

### Router: goalsRouter

```typescript
// packages/api/src/routers/goals.ts

export const goalsRouter = router({
  // Configuración disponible
  getConfig: protectedProcedure.query(() => ({
    metrics: GOAL_METRIC_CONFIG,
    periods: GOAL_PERIOD_CONFIG,
  })),

  // Listar objetivos del usuario
  list: protectedProcedure
    .input(
      z
        .object({
          status: z.enum(['active', 'completed', 'missed', 'cancelled', 'all']).default('all'),
          limit: z.number().min(1).max(50).default(10),
        })
        .optional()
    )
    .query(/* Devuelve goals con progreso calculado */),

  // Objetivo activo para el Dashboard
  getActiveForDashboard: protectedProcedure.query(/* ... */),

  // Obtener objetivo por ID
  getById: protectedProcedure.input(z.object({ id: z.string().uuid() })).query(/* ... */),

  // Crear objetivo
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(100),
        metric: z.enum(['revenue', 'deals_closed', 'new_clients', 'messages']),
        period: z.enum(['monthly', 'quarterly', 'annual']),
        targetValue: z.number().positive(),
        benefit: z.string().max(500).optional(),
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
        showOnDashboard: z.boolean().default(true),
      })
    )
    .mutation(/* Verifica conflictos y crea */),

  // Actualizar objetivo
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(100).optional(),
        targetValue: z.number().positive().optional(),
        benefit: z.string().max(500).optional(),
        showOnDashboard: z.boolean().optional(),
      })
    )
    .mutation(/* Solo permite editar objetivos activos */),

  // Cancelar objetivo
  cancel: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(/* ... */),

  // Eliminar objetivo (solo cancelled o completed)
  delete: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(/* ... */),
})
```

---

## Componentes UI

### Dashboard Widget (GoalProgress)

```
┌─────────────────────────────────────────────────────────────────┐
│  ┌──────┐                                                        │
│  │  🎯  │  Objetivo de ventas Q1                                │
│  └──────┘  87d restantes · Trimestre                     →      │
│                                                                   │
│  €3,500                                           de €10,000    │
│  ████████████████░░░░░░░░░░░░░░░░░░░░░░░░  35%                 │
│                                                                   │
│  35%                    Contratar un asistente                  │
└─────────────────────────────────────────────────────────────────┘
```

### Colores de Progreso

| Porcentaje | Color | Hex       |
| ---------- | ----- | --------- |
| < 25%      | Gris  | `#64748b` |
| 25% - 50%  | Ámbar | `#f59e0b` |
| 50% - 100% | Verde | `#00a884` |
| ≥ 100%     | Verde | `#22c55e` |

### Página de Settings (Goals)

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Ajustes                                                       │
│  ┌──────┐                                                        │
│  │  🎯  │  Objetivos                                             │
│  └──────┘  Define tus metas mensuales o anuales                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  + Crear nuevo objetivo                              →   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ACTIVOS                                                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  €3,500 / €10,000                              35%   ⋮  │    │
│  │  Objetivo de ventas Q1                                   │    │
│  │  ████████████░░░░░░░░░░░░░                              │    │
│  │  "Contratar un asistente a tiempo completo"             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  HISTORIAL                                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  50/50 clientes                         ✓ Completado    │    │
│  │  Nuevos clientes Diciembre                              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Worker: Goal Status Check

### Función

El worker `goalStatusCheck` se ejecuta diariamente a medianoche para:

1. **Identificar** objetivos activos cuyo período ha terminado
2. **Calcular** el valor actual basado en la métrica
3. **Actualizar** el estado a `completed` o `missed`
4. **Notificar** al usuario del resultado

### Configuración

```typescript
// packages/workers/src/functions/goal-status-check.ts

export const goalStatusCheck = inngest.createFunction(
  {
    id: 'goal-status-check',
    name: 'Check Goal Completion Status',
  },
  { cron: '0 0 * * *' }, // Cada día a medianoche
  async ({ step }) => {
    // 1. Obtener objetivos expirados
    // 2. Calcular valor actual
    // 3. Actualizar estado
    // 4. Enviar notificaciones
  }
)
```

---

## Tests

### Archivo: goals-validation.test.ts

| Suite               | Tests  | Descripción                       |
| ------------------- | ------ | --------------------------------- |
| createGoalSchema    | 12     | Validación de creación            |
| updateGoalSchema    | 8      | Validación de actualización       |
| listGoalsSchema     | 6      | Validación de filtros de lista    |
| goalIdSchema        | 4      | Validación de ID                  |
| progressCalculation | 7      | Cálculo de porcentaje de progreso |
| **Total**           | **37** | Cobertura completa de validación  |

---

## Archivos Implementados

| Archivo                                               | Propósito                |
| ----------------------------------------------------- | ------------------------ |
| `packages/db/src/schema/goals.ts`                     | Schema Drizzle + helpers |
| `packages/api/src/routers/goals.ts`                   | Router tRPC completo     |
| `packages/workers/src/functions/goal-status-check.ts` | Worker de verificación   |
| `apps/web/src/components/dashboard/goal-progress.tsx` | Widget para Dashboard    |
| `apps/web/src/app/settings/goals/page.tsx`            | Página de settings       |
| `packages/api/src/__tests__/goals-validation.test.ts` | Tests de validación      |

---

## Dependencias

- `deals` schema (para calcular revenue)
- `clients` schema (para contar new_clients)
- `messages` + `conversations` schemas (para contar mensajes)
- `profiles` schema (para userId)
- Inngest para workers programados
- lucide-react para iconos (Target, Plus, etc.)

---

## Fases de Implementación

### Fase 1: MVP ✅ COMPLETADA

- [x] Schema de base de datos
- [x] Router tRPC con CRUD completo
- [x] Widget de progreso para Dashboard
- [x] Página de settings para gestionar objetivos
- [x] Cálculo en tiempo real de métricas

### Fase 2: Automatización ✅ COMPLETADA

- [x] Worker para verificar objetivos expirados
- [x] Tests de validación
- [x] Documentación técnica

### Fase 3: Mejoras Futuras

- [ ] Notificaciones push cuando se acerca el deadline
- [ ] Gráficos de tendencia de progreso
- [ ] Objetivos compartidos/de equipo
- [ ] Predicción de cumplimiento con IA

---

_Última actualización: 29 Dic 2025_
