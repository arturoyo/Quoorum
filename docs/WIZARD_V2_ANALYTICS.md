# 📊 Wizard V2 - Analytics & Métricas

> **Última actualización:** 31 Dic 2024
> **Versión:** 1.0.0

---

## 🎯 Objetivo

Monitorear la efectividad del Wizard V2 de onboarding y optimizar la tasa de completación mediante análisis de datos en PostHog.

---

## 📈 Métricas Clave (KPIs)

### 1. **Tasa de Completación**

```
Completion Rate = (wizard_completed / wizard_step_01_view) * 100

```

- **Meta:** >80%
- **Benchmark actual:** Por determinar (primera implementación)
- **Acción si <70%:** Analizar funnel de abandono por paso

### 2. **Tasa de Abandono por Paso**

```
Abandonment Rate (Step X) = (wizard_abandoned at Step X / wizard_step_X_view) * 100
```

- **Pasos críticos a monitorear:**
  - Step 9 (WhatsApp): Mayor fricción esperada

  - Step 12 (RAG): Requiere scraping web
  - Step 10 (Analysis): Espera mientras IA analiza

### 3. **Tiempo Promedio de Completación**

```
Avg Completion Time = AVG(timestamp(wizard_completed) - timestamp(wizard_step_01_view))

```

- **Meta:** <10 minutos

- **Alerta si >15 min:** Pasos demasiado complejos

### 4. **Progreso por Milestone**

```
Milestone Reach Rate = (wizard_progress_milestone[milestone] / wizard_step_01_view) * 100
```

- **Milestones:**
  - `beginning` (15% progress)
  - `started` (30% progress)
  - `halfway` (50% progress)
  - `three_quarters` (70% progress)
  - `almost_done` (85% progress)
  - `finishing` (95% progress)

---

## 🔍 Eventos PostHog Trackeados

### Eventos Existentes (Pre-UX Upgrade)

#### `wizard_step_XX_view`

**Descripción:** Usuario ve un paso específico del wizard

**Properties:**

```typescript
{

  stepNumber: number,        // 1-14
  stepName: string,          // "¿Cómo te llamas?", etc.
  timestamp: string,         // ISO 8601
  aiTier: string,            // "BASIC" | "PRO" | "BUSINESS"
  waSkipped: boolean,        // Si saltó WhatsApp

  voiceSkipped: boolean      // Si saltó Voice (plan BASIC)
}
```

**Uso:**

- Construir funnel de conversión
- Identificar pasos problemáticos
- Calcular tiempo por paso

#### `wizard_step_XX_complete`

**Descripción:** Usuario completa un paso y avanza al siguiente

**Properties:**

```typescript
{
  stepNumber: number,
  stepName: string,
  timeSpent: number,         // Milisegundos en el paso

  timestamp: string,
  aiTier: string,
  waSkipped: boolean,

  voiceSkipped: boolean
}
```

**Uso:**

- Calcular tiempo promedio por paso
- Detectar pasos lentos
- Optimizar UX de pasos problemáticos

#### `wizard_completed`

**Descripción:** Usuario termina el wizard completo

**Properties:**

```typescript
{
  totalSteps: number,        // 14 (o menos si saltó pasos)

  completedAt: string,
  aiTier: string,
  waSkipped: boolean,

  voiceSkipped: boolean,
  userName: string,
  businessName: string,
  sector: string
}
```

**Uso:**

- Calcular tasa de completación
- Segmentar por plan (BASIC vs PRO/BUSINESS)
- Correlacionar con retención posterior

#### `wizard_abandoned`

**Descripción:** Usuario cierra wizard sin completar

**Properties:**

```typescript
{
  abandonedAtStep: number,

  stepName: string,
  timeSpent: number,         // Tiempo en el paso donde abandonó
  timestamp: string,

  aiTier: string,
  waSkipped: boolean,
  voiceSkipped: boolean
}
```

**Uso:**

- Identificar drop-off points
- A/B testing de mejoras
- Calcular impacto de cambios UX

---

### 🆕 Nuevos Eventos (Post-UX Upgrade)

#### `wizard_progress_milestone`

**Descripción:** Usuario alcanza un milestone de progreso (15%, 30%, 50%, 70%, 85%, 95%)

**Properties:**

```typescript
{
  milestone: "beginning" | "started" | "halfway" | "three_quarters" | "almost_done" | "finishing",
  progress: number,          // Porcentaje exacto (ej: 50)
  currentStep: number,       // Paso efectivo actual
  totalSteps: number,        // Total de pasos (ajustado por saltos)
  message: string,           // Mensaje de aliento mostrado
  timestamp: string
}
```

**Uso:**

- Analizar drop-off entre milestones
- Medir efectividad de mensajes de aliento
- Comparar tasa de abandono antes/después de milestone

**Ejemplo de análisis:**

```sql
-- Usuarios que llegan a 50% pero no completan
SELECT count(DISTINCT user_id)
FROM events
WHERE event = 'wizard_progress_milestone'
  AND properties.milestone = 'halfway'
  AND user_id NOT IN (
    SELECT DISTINCT user_id FROM events WHERE event = 'wizard_completed'
  )
```

---

## 📊 Dashboards Recomendados en PostHog

### Dashboard 1: **Wizard Funnel Overview**

**Insights:**

1. **Funnel de Pasos**
   - Filtro: `wizard_step_01_view` → `wizard_step_02_view` → ... → `wizard_completed`
   - Segmentación: Por `aiTier`

2. **Tasa de Completación (Trend)**
   - Metric: `(wizard_completed / wizard_step_01_view) * 100`
   - Intervalo: Diario
   - Comparación: Semana anterior

3. **Tiempo Promedio de Completación**
   - Metric: `AVG(time_to_convert)` de `wizard_step_01_view` a `wizard_completed`
   - Segmentación: Por `aiTier`

### Dashboard 2: **Abandonment Analysis**

**Insights:**

1. **Top 5 Pasos con Mayor Abandono**
   - Event: `wizard_abandoned`
   - Group by: `abandonedAtStep`
   - Ordenar: Descendente por count

2. **Tiempo Promedio Antes de Abandonar**
   - Metric: `AVG(properties.timeSpent)` de `wizard_abandoned`
   - Comparar con tiempo promedio de `wizard_step_XX_complete`

3. **Tasa de Abandono por Plan**
   - Event: `wizard_abandoned`
   - Segmentación: Por `aiTier`
   - Hipótesis: BASIC abandona más en step 8 (voice skipped)

### Dashboard 3: **🆕 Milestone Progress Tracking**

**Insights:**

1. **Funnel de Milestones**
   - Filtro: `beginning` → `started` → `halfway` → `three_quarters` → `almost_done` → `finishing` → `wizard_completed`
   - Ver caída entre milestones

2. **Efectividad de Mensajes de Aliento**
   - Metric: Tasa de continuación después de cada milestone
   - Formula: `(next_milestone_count / current_milestone_count) * 100`

3. **Comparación Pre vs Post UX Upgrade**
   - Period Comparison: Últimos 7 días vs 7 días anteriores
   - Metric: Completion Rate
   - Hipótesis: Nuevo progress bar aumenta completación

---

## 🧪 A/B Testing Sugerido

### Experimento 1: **Mensajes de Aliento**

**Hipótesis:** Mensajes más motivacionales aumentan tasa de completación

**Variantes:**

- **Control (actual):**
  - "¡Empecemos! 🚀", "¡Buen comienzo! 💪", etc.

- **Variante A - Enfoque en Beneficios:**
  - "¡Tu IA se está configurando! 🤖"
  - "¡Pronto ahorrarás horas de trabajo! ⏱️"
  - "¡Tu asistente casi listo! 🎯"

- **Variante B - Enfoque en Tiempo:**
  - "Solo 2 minutos más 🚀"

  - "Casi terminamos ✨"
  - "Un último paso 🎉"

**Métricas de Éxito:**

- Completion Rate: >+5%

- Avg Time to Complete: Reducción >10%
- Abandonment Rate: <-5%

**Duración:** 2 semanas mínimo (mínimo 200 usuarios por variante)

### Experimento 2: **Posición de Progress Bar**

**Hipótesis:** Barra de progreso más prominente reduce abandono

**Variantes:**

- **Control (actual):** Debajo del header, encima del título
- **Variante A:** Sticky top (siempre visible en scroll)
- **Variante B:** Sidebar lateral con pasos + progreso

**Métricas de Éxito:**

- Abandonment Rate: <-10%
- Engagement con Progress Bar: Click-through en porcentaje

---

## 🔔 Alertas Configurar en PostHog

### Alerta 1: **Completion Rate Baja**

```
IF completion_rate < 70% DURING last_24h

THEN notify #product-team on Slack
```

### Alerta 2: **Spike en Abandono de Paso Específico**

```
IF wizard_abandoned[step=9] > 30% DURING last_6h
THEN notify #eng-team (posible bug en WhatsApp connection)
```

### Alerta 3: **Tiempo de Completación Anormal**

```
IF avg_completion_time > 900s (15 min) DURING last_12h
THEN notify #product-team (posible performance issue)
```

---

## 📋 Checklist Post-Deployment

### Semana 1

- [ ] Verificar que todos los eventos se trackean correctamente
- [ ] Crear Dashboard 1, 2, 3 en PostHog

- [ ] Establecer baselines de métricas (Completion Rate, Avg Time, etc.)
- [ ] Configurar alertas

### Semana 2

- [ ] Analizar funnel por primera vez
- [ ] Identificar top 3 pasos con mayor abandono
- [ ] Revisar correlación entre milestones y completación
- [ ] Documentar insights en reunión de producto

### Mes 1

- [ ] Comparar métricas pre vs post UX upgrade
- [ ] Preparar experimento A/B de mensajes

- [ ] Calcular ROI de mejora UX (si completion rate aumentó)
- [ ] Iterar sobre hallazgos

---

## 🎓 Ejemplo de Análisis Real

### Caso: "Usuarios abandonan en Step 9 (WhatsApp)"

**Query PostHog:**

```sql

SELECT
  properties.abandonedAtStep,
  COUNT(*) as abandonments,
  AVG(properties.timeSpent) as avg_time_on_step
FROM events
WHERE event = 'wizard_abandoned'
  AND timestamp > NOW() - INTERVAL 7 DAY
GROUP BY properties.abandonedAtStep
ORDER BY abandonments DESC
```

**Resultado Hipotético:**

```
abandonedAtStep | abandonments | avg_time_on_step
----------------|--------------|-----------------
9               | 342          | 45000 (45s)
10              | 156          | 120000 (2min)
12              | 89           | 180000 (3min)
```

**Interpretación:**

- Step 9 (WhatsApp) tiene más abandonos, pero tiempo bajo (45s)
- Hipótesis: UX confusa, no es problema técnico
- Acción: Mejorar copy explicativo en step 9

**Mejora Implementada:**

```tsx
// Antes
<p>Conecta tu WhatsApp</p>

// Después
<p>Conecta WhatsApp para que Wallie responda automáticamente</p>
<p className="text-sm text-gray-500">
  ⚡ Opcional - Puedes hacerlo después en Ajustes
</p>
```

**Seguimiento:**

- Medir si abandonment rate en step 9 disminuye >20%
- Trackear con evento `wizard_step_09_view` + `wizard_step_09_complete`

---

## 📞 Contacto

**Dueño de Métricas:** Product Team
**Responsable de Dashboards:** Data/Analytics Lead
**Escalación de Bugs:** Engineering Team

---

_Generado con [Claude Code](https://claude.com/claude-code) el 31 Dic 2024_
