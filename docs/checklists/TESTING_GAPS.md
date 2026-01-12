# ⚠️ TESTING_GAPS.md — Gaps de Testing Identificados

> **Versión:** 1.0.0 | **Última actualización:** 25 Dic 2025
> **Propósito:** Documentar gaps de testing y priorizar su resolución

---

## 📊 Resumen Ejecutivo

| Categoría | Total | Con Test | Sin Test | Coverage |
|-----------|-------|----------|----------|----------|
| tRPC Routers | 85 | 59 | **26** | 69% |
| Workers Inngest | 24 | 1 | **23** | 4% |
| E2E Specs | 10 | 8 | 2 | 80% |
| Components UI | ~100 | 0 | **~100** | 0% |

---

## 🔴 CRÍTICO — Routers Sin Tests (26)

Estos routers están en producción sin cobertura de tests de validación:

### Psychology Engine (6 routers)
| Router | Archivo | Líneas | Prioridad |
|--------|---------|--------|-----------|
| `behavior-dna` | `behavior-dna.ts` | ~200 | 🔴 Crítico |
| `classifiers` | `classifiers.ts` | ~150 | 🔴 Crítico |
| `conversation-psychology` | `conversation-psychology.ts` | ~180 | 🔴 Crítico |
| `emotional-intelligence` | `emotional-intelligence.ts` | ~160 | 🔴 Crítico |
| `persona-detection` | `persona-detection.ts` | ~140 | 🔴 Crítico |
| `reciprocity` | `reciprocity.ts` | ~120 | 🔴 Crítico |

### Communication Core (5 routers)
| Router | Archivo | Prioridad |
|--------|---------|-----------|
| `inbox` | `inbox.ts` | 🔴 Crítico |
| `deals` | `deals.ts` | 🔴 Crítico |
| `whatsapp-connections` | `whatsapp-connections.ts` | 🟠 Alto |
| `whatsapp-magic-login` | `whatsapp-magic-login.ts` | 🟠 Alto |
| `whatsapp-templates` | `whatsapp-templates.ts` | 🟡 Medio |

### AI & Config (5 routers)
| Router | Archivo | Prioridad |
|--------|---------|-----------|
| `ai-config` | `ai-config.ts` | 🟠 Alto |
| `ai-models` | `ai-models.ts` | 🟡 Medio |
| `agent-config` | `agent-config.ts` | 🟡 Medio |
| `wallie-annotations` | `wallie-annotations.ts` | 🟡 Medio |
| `onboarding-analysis` | `onboarding-analysis.ts` | 🟡 Medio |

### Business Features (6 routers)
| Router | Archivo | Prioridad |
|--------|---------|-----------|
| `client-activity` | `client-activity.ts` | 🟠 Alto |
| `client-enrichment` | `client-enrichment.ts` | 🟡 Medio |
| `sales-insights` | `sales-insights.ts` | 🟡 Medio |
| `saved-replies` | `saved-replies.ts` | 🟡 Medio |
| `coaching` | `coaching.ts` | 🟡 Medio |
| `rewards` | `rewards.ts` | 🟡 Medio |

### Admin & Other (4 routers)
| Router | Archivo | Prioridad |
|--------|---------|-----------|
| `admin-wallie-config` | `admin-wallie-config.ts` | 🟡 Medio |
| `admin-rewards` | `admin-rewards.ts` | 🟡 Medio |
| `navigation` | `navigation.ts` | ⚪ Bajo |
| `email-onboarding` | `email-onboarding.ts` | ⚪ Bajo |
| `linkedin` | `linkedin.ts` | ⚪ Bajo |
| `support` | `support.ts` | ⚪ Bajo |

---

## 🟠 ALTO — Workers Sin Tests (23/24)

Solo `smoke.test.ts` cubre workers básicamente. Faltan tests para:

### Comunicación
| Worker | Archivo | Función |
|--------|---------|---------|
| `gmail-sync` | `gmail-sync.ts` | Sincroniza emails de Gmail |
| `outlook-sync` | `outlook-sync.ts` | Sincroniza emails de Outlook |
| `linkedin-sync` | `linkedin-sync.ts` | Sincroniza LinkedIn |
| `whatsapp-broadcast` | `whatsapp-broadcast.ts` | Broadcast masivo WhatsApp |

### AI & Analysis
| Worker | Archivo | Función |
|--------|---------|---------|
| `conversation-analysis` | `conversation-analysis.ts` | Analiza conversaciones |
| `message-classification` | `message-classification.ts` | Clasifica mensajes |
| `psychology-analysis` | `psychology-analysis.ts` | Análisis psicológico |
| `client-classification` | `client-classification.ts` | Clasifica clientes |
| `scoring-analysis` | `scoring-analysis.ts` | Calcula scores |

### Automation
| Worker | Archivo | Función |
|--------|---------|---------|
| `campaign-scheduler` | `campaign-scheduler.ts` | Programa campañas |
| `sequence-runner` | `sequence-runner.ts` | Ejecuta secuencias |
| `pipeline-automation` | `pipeline-automation.ts` | Automatiza pipeline |
| `reminder-check` | `reminder-check.ts` | Verifica reminders |

### Enrichment & Prospecting
| Worker | Archivo | Función |
|--------|---------|---------|
| `prospect-enrichment` | `prospect-enrichment.ts` | Enriquece prospectos |
| `client-churn-detection` | `client-churn-detection.ts` | Detecta churn |
| `knowledge-ingestion` | `knowledge-ingestion.ts` | Ingesta conocimiento |

### Reports & Maintenance
| Worker | Archivo | Función |
|--------|---------|---------|
| `daily-summary` | `daily-summary.ts` | Resumen diario |
| `weekly-report` | `weekly-report.ts` | Reporte semanal |
| `data-backup` | `data-backup.ts` | Backup de datos |
| `health-monitor` | `health-monitor.ts` | Monitor de salud |
| `safety-limiter` | `safety-limiter.ts` | Limita uso |

### Other
| Worker | Archivo | Función |
|--------|---------|---------|
| `audio-received` | `audio-received.ts` | Procesa audio |
| `invoice-reminder` | `invoice-reminder.ts` | Recordatorio facturas |
| `referral-invites` | `referral-invites.ts` | Invitaciones referidos |

---

## 🟡 MEDIO — E2E Specs Faltantes

### Specs Existentes (8)
- ✅ `auth.spec.ts`
- ✅ `dashboard.spec.ts`
- ✅ `clients.spec.ts`
- ✅ `conversations.spec.ts`
- ✅ `payment.spec.ts`
- ✅ `integrations.spec.ts`
- ✅ `navigation.spec.ts`
- ✅ `ui-components.spec.ts`

### Specs Faltantes (2)
- ❌ `onboarding.spec.ts` - Flujo de onboarding completo
- ❌ `referrals.spec.ts` - Sistema de referidos

---

## ⚪ BAJO — Componentes UI Sin Tests

Se estima ~100 componentes en `apps/web/src/components/` sin tests unitarios.

### Componentes Críticos que deberían testearse:
```
apps/web/src/components/
├── dashboard/
│   ├── points-widget.tsx        # Gamificación
│   ├── suggested-reminders.tsx  # IA suggestions
│   └── stats-cards.tsx          # Stats del dashboard
├── chat/
│   ├── message-bubble.tsx       # Mensajes
│   ├── chat-input.tsx           # Input de chat
│   └── suggested-replies.tsx    # Sugerencias IA
├── clients/
│   ├── client-card.tsx          # Card de cliente
│   ├── pipeline-column.tsx      # Columna pipeline
│   └── client-form.tsx          # Formulario
└── ui/
    └── (componentes shadcn ya testeados upstream)
```

---

## 📈 Plan de Acción por Prioridad

### Semana 1: Routers Críticos
1. ✅ Crear `inbox-validation.test.ts`
2. ✅ Crear `deals-validation.test.ts`
3. ✅ Crear `behavior-dna-validation.test.ts`
4. ✅ Crear `classifiers-validation.test.ts`

### Semana 2: Psychology Engine
5. Crear `conversation-psychology-validation.test.ts`
6. Crear `emotional-intelligence-validation.test.ts`
7. Crear `persona-detection-validation.test.ts`
8. Crear `reciprocity-validation.test.ts`

### Semana 3: Communication & Config
9. Crear `whatsapp-connections-validation.test.ts`
10. Crear `ai-config-validation.test.ts`
11. Crear `client-activity-validation.test.ts`

### Semana 4: Workers (Top 5)
12. Crear `workers/__tests__/conversation-analysis.test.ts`
13. Crear `workers/__tests__/message-classification.test.ts`
14. Crear `workers/__tests__/scoring-analysis.test.ts`
15. Crear `workers/__tests__/reminder-check.test.ts`
16. Crear `workers/__tests__/daily-summary.test.ts`

### Futuro: E2E y UI
- Crear `onboarding.spec.ts`
- Crear tests de componentes críticos

---

## 🎯 Métricas Objetivo

| Métrica | Actual | Objetivo Q1 | Objetivo Q2 |
|---------|--------|-------------|-------------|
| Router Coverage | 69% | 90% | 100% |
| Worker Coverage | 4% | 40% | 80% |
| E2E Coverage | 80% | 100% | 100% |
| UI Coverage | 0% | 20% | 50% |

---

## 📝 Notas

### Cómo añadir un test de validación
```typescript
// packages/api/src/__tests__/[router]-validation.test.ts
import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Copiar schemas del router
const createSchema = z.object({
  name: z.string().min(1),
  // ...
})

describe('[router] validation schemas', () => {
  describe('createSchema', () => {
    it('should accept valid data', () => {
      const result = createSchema.safeParse({ name: 'Test' })
      expect(result.success).toBe(true)
    })

    it('should reject invalid data', () => {
      const result = createSchema.safeParse({ name: '' })
      expect(result.success).toBe(false)
    })
  })
})
```

### Cómo añadir un test E2E
```typescript
// apps/web/e2e/[feature].spec.ts
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/path')
    await expect(page.locator('h1')).toContainText('Expected')
  })
})
```

---

*Última actualización: 25 Dic 2025*
