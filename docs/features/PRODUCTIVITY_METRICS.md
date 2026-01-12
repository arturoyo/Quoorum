# Productivity Metrics — Especificacion Tecnica

> **Version:** 1.0.0 | **Fecha:** 3 Dic 2025
> **Estado:** Planificado | **Prioridad:** ALTA

---

## Resumen Ejecutivo

Sistema completo de metricas orientadas a ventas, inicialmente para WhatsApp y extensible a otros canales (Email, Instagram, SMS, etc.).

### Objetivos

1. **Medir productividad** del usuario en tiempo real
2. **Identificar patrones** de exito en ventas
3. **Predecir resultados** usando IA
4. **Multi-canal** desde el diseno

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRODUCTIVITY METRICS SYSTEM                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐        │
│  │  ACTIVITY   │────▶│   DAILY     │────▶│  INSIGHTS   │        │
│  │    LOGS     │     │  METRICS    │     │   ENGINE    │        │
│  └─────────────┘     └─────────────┘     └─────────────┘        │
│       │                    │                    │                │
│       │                    │                    ▼                │
│       │                    │           ┌─────────────┐          │
│       │                    │           │ PREDICTIONS │          │
│       │                    │           │    (IA)     │          │
│       │                    │           └─────────────┘          │
│       │                    │                    │                │
│       ▼                    ▼                    ▼                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                     DASHBOARD UI                         │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │    │
│  │  │Overview │  │ Trends  │  │Leaderb. │  │ Goals   │    │    │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Metricas por Canal

### Fase 1: WhatsApp (MVP)

| Metrica                     | Descripcion                  | Calculo                                 |
| --------------------------- | ---------------------------- | --------------------------------------- |
| **Tiempo de respuesta**     | Tiempo promedio en responder | `AVG(first_response_time)`              |
| **Mensajes/hora**           | Productividad por hora       | `COUNT(messages) / hours_active`        |
| **Tasa de respuesta**       | % de mensajes respondidos    | `responded / total_received * 100`      |
| **Conversaciones cerradas** | Deals cerrados via WhatsApp  | `COUNT(deals WHERE channel='whatsapp')` |
| **Mensajes por cliente**    | Engagement promedio          | `AVG(messages_per_client)`              |

### Fase 2: Email

| Metrica                      | Descripcion             | Calculo                    |
| ---------------------------- | ----------------------- | -------------------------- |
| **Open rate**                | Tasa de apertura        | `opened / sent * 100`      |
| **Click rate**               | Clics en enlaces        | `clicked / opened * 100`   |
| **Reply rate**               | Tasa de respuesta       | `replied / sent * 100`     |
| **Threads resueltos**        | Conversaciones cerradas | `COUNT(resolved_threads)`  |
| **Tiempo primera respuesta** | SLA de respuesta        | `AVG(first_response_time)` |

### Fase 3: Multi-canal

| Metrica                    | Descripcion               | Calculo                      |
| -------------------------- | ------------------------- | ---------------------------- |
| **Cross-channel journey**  | Seguimiento entre canales | Mapa de interacciones        |
| **Channel effectiveness**  | ROI por canal             | `revenue / cost_per_channel` |
| **Atribucion multi-touch** | Credito de conversion     | Modelo ponderado             |
| **Unified response time**  | Tiempo global             | `AVG(all_channels)`          |

---

## Metricas de Ventas

### Funnel de Conversion

```
LEAD ──▶ CONTACTADO ──▶ PROPUESTA ──▶ NEGOCIACION ──▶ CERRADO
  │          │              │              │             │
  │          │              │              │             │
  ▼          ▼              ▼              ▼             ▼
100%        70%            45%            25%           15%
(meta)     (meta)         (meta)         (meta)        (meta)
```

### Metricas del Pipeline

| Metrica                    | Descripcion     | Formula                              |
| -------------------------- | --------------- | ------------------------------------ |
| **Valor del pipeline**     | Suma por etapa  | `SUM(deal_value) GROUP BY stage`     |
| **Tiempo en etapa**        | Dias promedio   | `AVG(DATEDIFF(entered, exited))`     |
| **Win rate**               | Tasa de cierre  | `won / (won + lost) * 100`           |
| **Ticket promedio**        | Valor medio     | `AVG(deal_value WHERE status='won')` |
| **Velocidad del pipeline** | Deals/semana    | `COUNT(stage_changes) / weeks`       |
| **Prediccion de cierre**   | Probabilidad IA | ML model output                      |

---

## Metricas de Productividad Personal

### Indicadores Clave

| Metrica                    | Descripcion         | Objetivo             |
| -------------------------- | ------------------- | -------------------- |
| **Horas mas productivas**  | Cuando cierras mas  | Identificar patron   |
| **Clientes atendidos/dia** | Volumen de trabajo  | Baseline personal    |
| **Score de seguimiento**   | Clientes "frios"    | < 5% sin contacto 7d |
| **Comparativa temporal**   | vs periodo anterior | +10% mensual         |
| **Efficiency score**       | Resultado/Esfuerzo  | Maximizar            |

### Calculo del Productivity Score

```typescript
function calculateProductivityScore(metrics: DailyMetrics): number {
  const weights = {
    responseTime: 0.25, // Menor es mejor
    messagesHandled: 0.2, // Mayor es mejor
    dealsProgressed: 0.25, // Mayor es mejor
    followUpRate: 0.15, // Mayor es mejor
    clientSatisfaction: 0.15, // Mayor es mejor
  }

  // Normalizar cada metrica a 0-100
  const normalized = {
    responseTime: normalizeInverse(metrics.avgResponseTime, 5, 60), // 5min ideal, 60min malo
    messagesHandled: normalize(metrics.messagesSent, 0, 50),
    dealsProgressed: normalize(metrics.dealsProgressed, 0, 10),
    followUpRate: normalize(metrics.followUpRate, 0, 100),
    clientSatisfaction: normalize(metrics.satisfaction, 0, 5),
  }

  // Calcular score ponderado
  return Object.entries(weights).reduce((score, [key, weight]) => {
    return score + normalized[key] * weight
  }, 0)
}
```

---

## Schema de Base de Datos

### Tabla: activity_logs

```sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,

  -- Accion
  channel VARCHAR(20) NOT NULL, -- 'whatsapp', 'email', 'manual', 'system'
  action_type VARCHAR(50) NOT NULL, -- 'message_sent', 'message_received', 'deal_moved', etc.
  action_subtype VARCHAR(50), -- Detalle adicional

  -- Metadata flexible
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Indices
  CONSTRAINT valid_channel CHECK (channel IN ('whatsapp', 'email', 'manual', 'system', 'instagram', 'facebook', 'sms'))
);

CREATE INDEX idx_activity_logs_user_date ON activity_logs(user_id, created_at DESC);
CREATE INDEX idx_activity_logs_client ON activity_logs(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_activity_logs_type ON activity_logs(action_type);
CREATE INDEX idx_activity_logs_channel ON activity_logs(channel);
```

### Tabla: daily_metrics

```sql
CREATE TABLE daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  channel VARCHAR(20), -- NULL para metricas globales

  -- Metricas de mensajes
  messages_sent INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  avg_response_time_minutes INTEGER, -- Promedio en minutos

  -- Metricas de clientes
  new_leads INTEGER DEFAULT 0,
  clients_contacted INTEGER DEFAULT 0,
  follow_ups_completed INTEGER DEFAULT 0,

  -- Metricas de ventas
  deals_created INTEGER DEFAULT 0,
  deals_progressed INTEGER DEFAULT 0,
  deals_closed INTEGER DEFAULT 0,
  deals_lost INTEGER DEFAULT 0,
  revenue_generated NUMERIC(12, 2) DEFAULT 0,

  -- Score calculado
  productivity_score INTEGER, -- 0-100

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id, date, channel)
);

CREATE INDEX idx_daily_metrics_user_date ON daily_metrics(user_id, date DESC);
CREATE INDEX idx_daily_metrics_channel ON daily_metrics(channel) WHERE channel IS NOT NULL;
```

### Tabla: productivity_goals

```sql
CREATE TABLE productivity_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Tipo de meta
  metric_type VARCHAR(50) NOT NULL, -- 'messages_sent', 'deals_closed', etc.
  period VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'

  -- Valores
  target_value INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,

  -- Periodo
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Estado
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'failed'
  completed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_goals_user_active ON productivity_goals(user_id, status) WHERE status = 'active';
```

---

## API Endpoints (tRPC)

### Router: productivityRouter

```typescript
// packages/api/src/routers/productivity.ts

export const productivityRouter = router({
  // Obtener resumen de productividad
  getOverview: protectedProcedure
    .input(
      z.object({
        period: z.enum(['today', 'week', 'month', 'quarter']).default('week'),
        channel: z.string().optional(),
      })
    )
    .query(/* ... */),

  // Obtener metricas diarias
  getDailyMetrics: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        channel: z.string().optional(),
      })
    )
    .query(/* ... */),

  // Obtener tendencias
  getTrends: protectedProcedure
    .input(
      z.object({
        metric: z.string(),
        period: z.enum(['7d', '30d', '90d']).default('30d'),
      })
    )
    .query(/* ... */),

  // Comparar con periodo anterior
  getComparison: protectedProcedure
    .input(
      z.object({
        period: z.enum(['week', 'month']),
      })
    )
    .query(/* ... */),

  // Obtener horas mas productivas
  getProductiveHours: protectedProcedure
    .input(
      z.object({
        period: z.enum(['week', 'month']).default('month'),
      })
    )
    .query(/* ... */),

  // Metas
  getGoals: protectedProcedure.query(/* ... */),

  createGoal: protectedProcedure
    .input(
      z.object({
        metricType: z.string(),
        targetValue: z.number(),
        period: z.enum(['daily', 'weekly', 'monthly']),
      })
    )
    .mutation(/* ... */),

  updateGoalProgress: protectedProcedure
    .input(
      z.object({
        goalId: z.string().uuid(),
        currentValue: z.number(),
      })
    )
    .mutation(/* ... */),
})
```

---

## Componentes UI

### Dashboard de Productividad

```
┌─────────────────────────────────────────────────────────────────┐
│  📊 Productividad                              [Esta semana ▼]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Score: 78    │  │ Mensajes     │  │ Deals        │          │
│  │ ████████░░   │  │ 234 (+12%)   │  │ 5 cerrados   │          │
│  │ +5 vs semana │  │ ↑ vs ayer    │  │ $12,500      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Tendencia semanal                                       │    │
│  │  100┤                                    ╭───╮           │    │
│  │   80┤            ╭───╮      ╭───╮      │   │           │    │
│  │   60┤   ╭───╮   │   │     │   │      │   │           │    │
│  │   40┤  │   │   │   │     │   │      │   │           │    │
│  │   20┤  │   │   │   │     │   │      │   │           │    │
│  │    0┼──┴───┴───┴───┴─────┴───┴──────┴───┴───────────│    │
│  │      Lun  Mar  Mie  Jue  Vie  Sab  Dom              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Horas mas productivas                                   │    │
│  │  ████████████░░░░░░░░░░░░  10:00 - 12:00 (32 deals)    │    │
│  │  ██████████░░░░░░░░░░░░░░  15:00 - 17:00 (28 deals)    │    │
│  │  ██████░░░░░░░░░░░░░░░░░░  09:00 - 10:00 (18 deals)    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Integracion con IA

### Predicciones

1. **Prediccion de cierre**: Probabilidad de cerrar un deal basada en historico
2. **Momento optimo de contacto**: Cuando es mejor contactar a cada cliente
3. **Deteccion de riesgo**: Clientes en riesgo de perderse
4. **Sugerencias de mejora**: Recomendaciones personalizadas

### Insights Automaticos

```typescript
// Ejemplo de insight generado
interface ProductivityInsight {
  type: 'improvement' | 'warning' | 'celebration'
  metric: string
  message: string
  suggestion?: string
  data: {
    current: number
    previous: number
    change: number
  }
}

// "Tu tiempo de respuesta mejoro 23% esta semana.
//  Sigue asi - los clientes valoran las respuestas rapidas."
```

---

## Fases de Implementacion

### Fase 1: MVP (2 semanas)

- [ ] Schema de base de datos
- [ ] Activity logging automatico
- [ ] Metricas basicas (mensajes, tiempo respuesta)
- [ ] Dashboard simple

### Fase 2: Avanzado (2 semanas)

- [ ] Metricas de ventas completas
- [ ] Sistema de metas
- [ ] Comparativas temporales
- [ ] Graficos de tendencias

### Fase 3: IA (3 semanas)

- [ ] Predicciones de cierre
- [ ] Insights automaticos
- [ ] Recomendaciones personalizadas
- [ ] Alertas proactivas

---

## Dependencias

- `statsRouter` existente (extender)
- `clients` schema
- `conversations` schema
- `messages` schema
- Recharts para graficos

---

_Ultima actualizacion: 3 Dic 2025_
