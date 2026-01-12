# 📊 Impact Analytics & Case Studies System

> **Sistema completo para capturar el valor real que Wallie aporta a cada usuario y generar casos de estudio automáticos basados en datos reales.**

---

## 🎯 Objetivo

Generar casos de estudio tipo:

**"Cómo [Nombre] cerró 30% más ventas con Wallie"**

- **Problema**: Perdía leads por responder tarde
- **Solución**: Wallie responde en <2 min, 24/7
- **Resultado**: +30% conversión, -5h/semana ahorradas
- **ROI**: 10x el costo de Wallie

---

## 📐 Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    IMPACT ANALYTICS SYSTEM                      │
└─────────────────────────────────────────────────────────────────┘

1. DATA COLLECTION (Real-time via PostHog Events)
   ├─ message_response_time → Track every message response
   ├─ deal_closed           → Track deals WON/LOST
   ├─ time_saved_calculated → Track AutoPilot efficiency
   └─ roi_calculated        → Monthly ROI calculation

2. MONTHLY WORKER (1st day of month at 3 AM UTC)
   ├─ Calculate metrics for all active users
   ├─ Compare baseline vs current performance
   ├─ Determine ROI (revenue / subscription cost)
   ├─ Flag potential case studies (ROI > 5x or conversion +20%)
   └─ Insert snapshot in user_impact_metrics table

3. ADMIN DASHBOARD (Next Step - Pendiente)
   ├─ View top users by ROI
   ├─ Generate case study drafts
   ├─ Request publication permission
   └─ Publish to /casos-de-exito landing page

4. LANDING PAGE (Next Step - Pendiente)
   ├─ Grid of approved case studies
   ├─ Filter by sector (inmobiliarias, concesionarios, etc.)
   └─ Highlight key metrics (+30% conversión, 10x ROI)
```

---

## 🗄️ Database Schema

### Table: `user_impact_metrics`

**Migration**: `packages/db/src/migrations/0031_add_user_impact_metrics.sql`

Almacena snapshots mensuales de métricas de impacto por usuario:

| Categoría                      | Campos                                                                                                | Descripción                               |
| ------------------------------ | ----------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| **Period**                     | `period_start`, `period_end`                                                                          | Rango del snapshot mensual                |
| **Baseline (Antes de Wallie)** | `baseline_response_time_minutes`, `baseline_conversion_rate`, `baseline_weekly_manual_messages`       | Self-reported o industry benchmark        |
| **Current (Con Wallie)**       | `avg_response_time_minutes`, `conversion_rate`, `total_messages`, `autopilot_messages`                | Calculados automáticamente del mes pasado |
| **Deals & Revenue**            | `deals_created`, `deals_closed`, `deals_lost`, `total_revenue_cents`                                  | Suma de deals del periodo                 |
| **Time Saved**                 | `hours_automated_per_week`                                                                            | autopilot_messages \* 3 min/msg           |
| **ROI**                        | `roi`, `subscription_cost_cents`                                                                      | (revenue / cost) \* 100                   |
| **Improvement**                | `response_time_improvement_percent`, `conversion_rate_improvement_percent`                            | % de mejora vs baseline                   |
| **Case Study Flags**           | `is_potential_case_study`, `case_study_approved`, `case_study_testimonial`, `case_study_published_at` | Para marketing                            |

### Example Row

```json
{
  "userId": "abc-123",
  "periodStart": "2025-01-01T00:00:00Z",
  "periodEnd": "2025-02-01T00:00:00Z",

  // Baseline (antes de Wallie)
  "baselineResponseTimeMinutes": 120, // 2 horas
  "baselineConversionRate": 15, // 15%

  // Current (con Wallie)
  "avgResponseTimeMinutes": 2, // 2 minutos
  "conversionRate": 45, // 45%
  "totalMessages": 230,
  "autopilotMessages": 184, // 80% autopilot
  "manualMessages": 46,

  // Deals
  "dealsCreated": 20,
  "dealsClosed": 9, // 45% conversion
  "dealsLost": 11,
  "totalRevenueCents": 49000, // 490€ generados

  // Time Saved
  "hoursAutomatedPerWeek": 12, // 184 msgs * 3 min / 60 / 4 weeks

  // ROI
  "subscriptionCostCents": 4900, // 49€ PRO plan
  "roi": 1000, // 10x ROI (10,000% return)

  // Improvement
  "responseTimeImprovementPercent": 98, // 98% faster (120min → 2min)
  "conversionRateImprovementPercent": 200, // 200% increase (15% → 45%)

  // Case Study
  "isPotentialCaseStudy": true, // ROI > 5x ✅
  "caseStudyApproved": false,
  "caseStudyTestimonial": null,
  "caseStudyPublishedAt": null
}
```

---

## 📈 PostHog Events

### 1. `message_response_time`

**Triggered**: Cada vez que Wallie o el usuario responde a un mensaje

```typescript
trackMessageResponseTime({
  conversationId: string
  responseTimeMinutes: number
  wasAutoPilot: boolean  // true si fue AutoPilot, false si manual
  messageType: 'whatsapp' | 'email' | 'voice'
})
```

**Use Cases**:

- Calcular response time promedio mensual
- Comparar AutoPilot vs Manual
- Funnel: % de usuarios que mejoran response time > 50%

---

### 2. `deal_closed`

**Triggered**: Cuando se cambia un deal a status WON o LOST

```typescript
trackDealClosed({
  dealId: string
  status: 'WON' | 'LOST'
  amountCents: number
  daysToClose: number
  dealSource?: string  // 'wallie_autopilot' | 'manual' | 'cold_calling'
})
```

**Use Cases**:

- Calcular conversion rate mensual (WON / total)
- Sumar revenue generado
- Funnel: Deals initiated by AutoPilot → closed WON

---

### 3. `time_saved_calculated`

**Triggered**: Cuando el worker calcula tiempo ahorrado (mensual, pero también puede ser on-demand)

```typescript
trackTimeSaved({
  period: 'daily' | 'weekly' | 'monthly'
  hoursSaved: number
  autopilotMessagesCount: number
})
```

**Use Cases**:

- Dashboard de ROI del usuario
- Email mensual: "Este mes ahorraste 20 horas con Wallie"

---

### 4. `roi_calculated`

**Triggered**: Worker mensual `calculate-user-roi` después de calcular métricas

```typescript
trackROICalculated({
  period: 'monthly'
  roi: number                    // 1000 = 10x ROI
  totalRevenueCents: number
  subscriptionCostCents: number
  conversionRate: number
  isPotentialCaseStudy: boolean
})
```

**Use Cases**:

- Identificar success stories para marketing
- Admin dashboard: "12 usuarios con ROI > 5x este mes"
- Trigger email al usuario: "¡Wallie generó 10x su inversión!"

---

## ⚙️ Worker: `calculate-user-roi`

**File**: `packages/workers/src/functions/calculate-user-roi.ts`

**Schedule**: Cron `0 3 1 * *` → **1er día de cada mes a las 3 AM UTC**

### Flujo de Ejecución

```
STEP 1: Get Active Users
├─ SELECT from profiles WHERE onboarding_completed = true AND is_active = true
└─ Filter por subscription tier

STEP 2: For Each User (parallel, limit 5)
  ├─ Define period (last month: 1st day to last day)
  │
  ├─ 2.1. Message Metrics
  │  ├─ COUNT total messages (outgoing)
  │  ├─ SUM autopilot messages (WHERE is_autopilot = true)
  │  └─ SUM manual messages (WHERE is_autopilot = false)
  │
  ├─ 2.2. Deal Metrics
  │  ├─ COUNT deals created
  │  ├─ COUNT deals WON
  │  ├─ COUNT deals LOST
  │  └─ SUM revenue (WHERE status = 'WON')
  │
  ├─ 2.3. Calculate Metrics
  │  ├─ Conversion Rate = (deals WON / deals created) * 100
  │  ├─ Time Saved = (autopilot messages * 3 min/msg) / 60 / 4 weeks
  │  ├─ ROI = (revenue / subscription cost) * 100
  │  └─ Avg Response Time = weighted avg (AutoPilot 2min, Manual 30min)
  │
  ├─ 2.4. Get Baseline (if exists)
  │  └─ Query previous metrics from user_impact_metrics
  │
  ├─ 2.5. Calculate Improvements
  │  ├─ Response Time Improvement = ((baseline - current) / baseline) * 100
  │  └─ Conversion Rate Improvement = ((current - baseline) / baseline) * 100
  │
  ├─ 2.6. Flag as Potential Case Study
  │  └─ IF ROI >= 5x OR Conversion Improvement >= 20% → flag = true
  │
  └─ 2.7. Insert Snapshot
     ├─ INSERT INTO user_impact_metrics
     └─ Emit PostHog event: roi_calculated

STEP 3: Summary Report
├─ LOG: Total Users Processed
├─ LOG: Potential Case Studies Found
└─ LOG: Top 5 Success Stories (highest ROI)
```

### Example Output

```
═══════════════════════════════════════════════════════════
📊 USER ROI CALCULATION COMPLETE
═══════════════════════════════════════════════════════════
Total Users Processed: 156
Potential Case Studies: 12

🌟 TOP SUCCESS STORIES:
   - Juan García (Inmobiliaria Velasco): 15.0x ROI, 65% conversion
   - María López (Concesionario Premium): 12.5x ROI, 58% conversion
   - Pedro Sánchez (Clínica Dental): 11.2x ROI, 52% conversion
   - Ana Martínez (Despacho Legal): 9.8x ROI, 49% conversion
   - Carlos Ruiz (Agencia Seguros): 8.5x ROI, 44% conversion
═══════════════════════════════════════════════════════════
```

### Thresholds & Constants

```typescript
// Subscription costs (monthly, in cents)
STARTER: 2900 // 29€/month
PRO: 4900 // 49€/month
BUSINESS: 9900 // 99€/month

// Time to respond manually
AVG_MANUAL_RESPONSE_TIME_MINUTES: 3

// Case study thresholds
CASE_STUDY_ROI_THRESHOLD: 500 // 5x ROI
CASE_STUDY_CONVERSION_IMPROVEMENT_THRESHOLD: 20 // 20% increase
```

---

## 🎯 Próximos Pasos (To Do)

### 1. Admin Dashboard `/admin/case-studies`

**Features**:

- 📊 **Table View**: Lista de usuarios con métricas de impacto
  - Columns: Name, Business, ROI, Conversion Rate, Revenue, Is Potential
  - Sortable y filtrable
- 🌟 **Highlight Top Performers**: Badge para ROI > 10x
- ✍️ **Generate Draft**: Botón que auto-genera caso de estudio:

  ```
  "Cómo [Nombre] cerró [X]% más ventas con Wallie"

  Problema:
  - Perdía leads por responder tarde (promedio [baseline] horas)

  Solución:
  - Wallie responde en <2 min, 24/7
  - AutoPilot maneja el [%] de las conversaciones

  Resultado:
  - +[X]% de conversión ([baseline]% → [current]%)
  - -[X] horas/semana ahorradas
  - [X]€ en revenue generado este mes

  ROI: [X]x el costo de Wallie
  ```

- 📧 **Request Approval**: Email al usuario pidiendo permiso + testimonial
- ✅ **Approve & Publish**: Marca como `case_study_approved = true` y publica

**Tech Stack**:

- Page: `apps/web/src/app/(dashboard)/admin/case-studies/page.tsx`
- Router: `packages/api/src/routers/admin-case-studies.ts`
- Components:
  - `<CaseStudiesTable />`
  - `<CaseStudyDraftModal />`
  - `<RequestApprovalDialog />`

---

### 2. Landing Page `/casos-de-exito`

**Features**:

- 🏆 **Hero Section**: "Casos de Éxito Reales con Wallie"
- 🔍 **Filters**:
  - Por sector (Inmobiliarias, Concesionarios, Clínicas, etc.)
  - Por ROI mínimo (5x, 10x, 15x)
- 📊 **Case Study Cards**:
  - Nombre + Business (con foto)
  - Métrica destacada: "+65% conversión" o "10x ROI"
  - Testimonial quote
  - Link a caso completo
- 📈 **Stats Bar**: "156 negocios creciendo con Wallie"

**Tech Stack**:

- Page: `apps/web/src/app/(marketing)/casos-de-exito/page.tsx`
- Router: `packages/api/src/routers/public-case-studies.ts` (public endpoint)
- Query: `case_study_approved = true AND case_study_published_at IS NOT NULL`

---

### 3. Email Automation

**Monthly ROI Report Email**:

- Trigger: Después del worker calculate-user-roi
- Template: `packages/email/src/templates/monthly-roi-report.tsx`
- Content:
  - "Este mes con Wallie:"
  - Mensajes enviados (autopilot vs manual)
  - Tiempo ahorrado
  - Deals cerrados
  - ROI calculado
  - CTA: "Ver mi dashboard completo"

**Request Case Study Approval**:

- Trigger: Manual desde admin dashboard
- Template: `packages/email/src/templates/case-study-request.tsx`
- Content:
  - "¡Increíbles resultados con Wallie!"
  - Preview del caso de estudio
  - Botón: "Sí, publicar mi caso" (magic link a form)
  - Form: Ajustar texto + añadir testimonial

---

## 🛡️ Security & Privacy

### Row Level Security (RLS)

**Policies en `user_impact_metrics`**:

```sql
-- Users can only view their own metrics
CREATE POLICY "user_impact_metrics_select_own"
  ON "user_impact_metrics"
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only system/admin can insert/update (via workers)
CREATE POLICY "user_impact_metrics_insert_system"
  ON "user_impact_metrics"
  FOR INSERT
  WITH CHECK (false);  -- Only service role
```

### GDPR Compliance

- ✅ **No PII without consent**: Solo se muestran datos si `case_study_approved = true`
- ✅ **Right to be forgotten**: User puede revocar aprobación → `case_study_approved = false`
- ✅ **Data minimization**: Solo se guarda lo necesario para calcular ROI
- ✅ **Transparent metrics**: Usuario puede ver sus propias métricas en dashboard

---

## 📊 Analytics & Monitoring

### PostHog Funnels

**Funnel 1: Onboarding → First Case Study**

```
Step 1: user_onboarded
Step 2: deal_closed (first WON)
Step 3: roi_calculated (first time)
Step 4: is_potential_case_study = true
Step 5: case_study_approved = true
```

**Funnel 2: Case Study Approval Flow**

```
Step 1: case_study_request_sent (email)
Step 2: case_study_approval_form_viewed
Step 3: case_study_approval_submitted
Step 4: case_study_published
```

### Sentry Monitoring

**Critical Errors to Monitor**:

- Worker `calculate-user-roi` failures
- Database query timeouts en user_impact_metrics
- ROI calculation errors (division by zero, negative values)

**Alerts**:

- Worker failed 3+ times → Slack notification
- ROI anomaly detected (ROI > 100x) → Manual review
- Case study with negative metrics → Flag for admin review

---

## 🧪 Testing

### Unit Tests

**File**: `packages/workers/src/functions/__tests__/calculate-user-roi.test.ts`

```typescript
describe('calculate-user-roi', () => {
  it('should calculate ROI correctly', async () => {
    const metrics = await calculateROI({
      userId: 'test-user',
      periodStart: new Date('2025-01-01'),
      periodEnd: new Date('2025-02-01'),
    })

    expect(metrics.roi).toBe(1000) // 10x ROI
    expect(metrics.conversionRate).toBe(45)
    expect(metrics.isPotentialCaseStudy).toBe(true)
  })

  it('should flag as potential case study when ROI > 5x', () => {
    expect(isPotentialCaseStudy({ roi: 600 })).toBe(true) // 6x
    expect(isPotentialCaseStudy({ roi: 400 })).toBe(false) // 4x
  })

  it('should flag when conversion improvement > 20%', () => {
    expect(
      isPotentialCaseStudy({
        baselineConversionRate: 15,
        currentConversionRate: 20, // 33% improvement
      })
    ).toBe(true)
  })
})
```

### Integration Tests

**File**: `apps/web/tests/e2e/admin-case-studies.spec.ts`

```typescript
test('admin can generate and publish case study', async ({ page }) => {
  await page.goto('/admin/case-studies')

  // Find top performer
  await page.click('[data-testid="row-juan-garcia"] [data-action="generate-draft"]')

  // Verify draft content
  expect(page.locator('[data-testid="case-study-draft"]')).toContainText('cerró 65% más ventas')

  // Send approval request
  await page.click('[data-action="request-approval"]')

  // Verify email sent
  expect(page.locator('[data-testid="approval-sent-toast"]')).toBeVisible()
})
```

---

## 📚 Referencias

### Related Docs

- [CLAUDE.md](./CLAUDE.md) - Reglas de desarrollo
- [SYSTEM.md](./SYSTEM.md) - Arquitectura completa
- [PostHog Analytics](./POSTHOG_ANALYTICS.md) - Analytics setup

### External Resources

- [PostHog Funnels](https://posthog.com/docs/user-guides/funnels)
- [Inngest Cron Expressions](https://www.inngest.com/docs/guides/scheduled-functions)
- [Drizzle ORM Queries](https://orm.drizzle.team/docs/select)

---

**Última actualización**: 31 Dic 2025
**Versión**: 1.0.0
**Autor**: Claude Sonnet 4.5
