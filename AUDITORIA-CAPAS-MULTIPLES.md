# 🔍 Auditoría: Sistemas de Múltiples Capas

> **Fecha:** 27 Ene 2026
> **Propósito:** Identificar otros lugares donde existen múltiples capas que deben sincronizarse
> **Motivación:** Prevenir errores como Error #6 (dos capas de interceptación de errores desincronizadas)

---

## 📊 RESUMEN EJECUTIVO

**Total de problemas encontrados:** 2 críticos, 3 potenciales

### Problemas Críticos (Requieren Acción Inmediata)

| # | Problema | Gravedad | Archivos Afectados |
|---|----------|----------|-------------------|
| 1 | **DebateStatus enum desincronizado** | 🔴 Crítico | `packages/db` vs `apps/web` |
| 2 | **ReportType enum desincronizado** | 🔴 Crítico | `packages/db` vs `apps/web` |

### Problemas Potenciales (Monitorear)

| # | Área | Riesgo | Notas |
|---|------|--------|-------|
| 3 | Rate Limiting | 🟡 Medio | Múltiples implementaciones independientes |
| 4 | Validación Schemas | 🟢 Bajo | Centralizado en backend (correcto) |
| 5 | Error Parsing | 🟢 Bajo | Sistema independiente en workers |

---

## 🔴 PROBLEMA #1: DebateStatus Enum Desincronizado

### Síntoma

Frontend y backend tienen diferentes valores para el status de debates.

### Detalle

**Base de datos** (`packages/db/src/schema/quoorum-debates.ts:20-27`):
```typescript
export const debateStatusEnum = pgEnum('debate_status', [
  'draft',
  'pending',
  'in_progress',
  'completed',
  'failed',
  'cancelled',  // ← TIENE 'cancelled'
])
```

**Frontend** (`apps/web/src/app/debates/[id]/types.ts:32`):
```typescript
export type DebateStatus = 'draft' | 'pending' | 'in_progress' | 'completed' | 'failed'
// ← FALTA 'cancelled'
```

### Impacto

- ❌ Si backend marca debate como 'cancelled', frontend no lo reconoce
- ❌ TypeScript no detecta el problema (tipos están en archivos separados)
- ❌ Potencial error en runtime al renderizar status

### Solución Recomendada

**Opción 1: Inferir tipos desde DB (RECOMENDADO)**
```typescript
// apps/web/src/app/debates/[id]/types.ts
import type { debateStatusEnum } from '@quoorum/db/schema'

// Inferir tipo directamente desde el enum de DB
export type DebateStatus = typeof debateStatusEnum.enumValues[number]
// Resultado: 'draft' | 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
```

**Opción 2: Fuente única de verdad**
```typescript
// packages/db/src/schema/quoorum-debates.ts
export const DEBATE_STATUS_VALUES = [
  'draft',
  'pending',
  'in_progress',
  'completed',
  'failed',
  'cancelled',
] as const

export const debateStatusEnum = pgEnum('debate_status', DEBATE_STATUS_VALUES)

// Frontend importa la constante
import { DEBATE_STATUS_VALUES } from '@quoorum/db/schema'
export type DebateStatus = typeof DEBATE_STATUS_VALUES[number]
```

---

## 🔴 PROBLEMA #2: ReportType Enum Desincronizado

### Síntoma

Frontend y backend tienen diferentes valores para tipos de reportes.

### Detalle

**Base de datos** (`packages/db/src/schema/quoorum-reports.ts:16-21`):
```typescript
export const quoorumReportTypeEnum = pgEnum('quoorum_report_type', [
  'single_debate',
  'weekly_summary',
  'monthly_summary',
  'deal_analysis',     // ← TIENE 'deal_analysis'
  'expert_performance',
])
```

**Frontend** (`apps/web/src/components/quoorum/reports/types.ts:70-75`):
```typescript
export type ReportType =
  | 'single_debate'
  | 'weekly_summary'
  | 'monthly_summary'
  | 'expert_performance'
  | 'custom'           // ← TIENE 'custom' en lugar de 'deal_analysis'
```

### Impacto

- ❌ Frontend no puede manejar reportes de tipo 'deal_analysis' desde DB
- ❌ Backend no reconoce 'custom' si se intenta crear desde frontend
- ❌ Pérdida de funcionalidad o errores 400

### Solución Recomendada

Similar a Problema #1, inferir tipos desde DB:

```typescript
// apps/web/src/components/quoorum/reports/types.ts
import type { quoorumReportTypeEnum } from '@quoorum/db/schema'

export type ReportType = typeof quoorumReportTypeEnum.enumValues[number]
// Resultado: 'single_debate' | 'weekly_summary' | 'monthly_summary' | 'deal_analysis' | 'expert_performance'
```

---

## 🟡 PROBLEMA #3: Rate Limiting - Múltiples Implementaciones

### Estado

**No es un problema inmediato**, pero requiere monitoreo.

### Detalle

Existen múltiples implementaciones de rate limiting:

| Archivo | Propósito | Status |
|---------|-----------|--------|
| `packages/ai/src/lib/rate-limiter.ts` | Rate limiting para APIs de IA | ✅ Independiente (correcto) |
| `apps/web/src/lib/rate-limit/webhook-limiter.ts` | Rate limiting para webhooks | ✅ Independiente (correcto) |
| `packages/quoorum/src/rate-limiting.ts` | Rate limiting para debates | ✅ Independiente (correcto) |
| `packages/quoorum/src/rate-limiting-advanced.ts` | Advanced rate limiting | ⚠️ Verificar si duplica funcionalidad |

### Recomendación

✅ **No requiere acción inmediata** - Los sistemas son independientes con propósitos diferentes.

⚠️ **Monitorear:** Verificar que `rate-limiting-advanced.ts` no duplique `rate-limiting.ts`.

---

## 🟢 PROBLEMA #4: Validación Schemas (Estado Correcto)

### Hallazgo

**No se encontraron schemas Zod duplicados entre frontend y backend.**

### Detalle

- ✅ Toda la validación está centralizada en `packages/api/src/routers/*.ts`
- ✅ Frontend NO tiene schemas Zod propios
- ✅ Validación ocurre solo en backend (patrón correcto)

### Estado

✅ **Sin problemas** - Sistema implementado correctamente.

---

## 🟢 PROBLEMA #5: Error Parsing (Estado Correcto)

### Hallazgo

El sistema de error parsing en `packages/workers/src/lib/error-parsers.ts` es independiente.

### Detalle

- ✅ Sistema de clasificación de errores de build/lint/typescript
- ✅ NO relacionado con error handling de tRPC
- ✅ No tiene múltiples capas que sincronizar

### Estado

✅ **Sin problemas** - Sistema independiente y bien diseñado.

---

## 📋 PLAN DE ACCIÓN

### Prioridad 1 - Inmediato (Esta Sesión)

- [ ] **Problema #1:** Sincronizar DebateStatus enum
  - Inferir tipo desde DB o crear fuente única de verdad
  - Actualizar frontend para incluir 'cancelled'
  - Añadir test que verifique sincronización

- [ ] **Problema #2:** Sincronizar ReportType enum
  - Inferir tipo desde DB
  - Actualizar frontend para incluir 'deal_analysis'
  - Añadir test que verifique sincronización

### Prioridad 2 - Corto Plazo (Esta Semana)

- [ ] **Auditar otros enums:** Verificar todos los enums en `packages/db/src/schema/*.ts`
  - departmentTypeEnum
  - teamMemberRoleEnum
  - scenarioStatusEnum
  - subscriptionStatusEnum
  - (17 enums total)

- [ ] **Crear pattern de inferencia:** Documentar en 05-patterns.md
  - Cómo inferir tipos desde DB correctamente
  - Prohibir definir enums manualmente en frontend

### Prioridad 3 - Mediano Plazo (Este Mes)

- [ ] **Test automatizado:** Script que verifica sincronización
  ```typescript
  // scripts/verify-type-sync.ts
  // Compara enums de DB con types de frontend
  // Falla si encuentra desincronizaciones
  ```

- [ ] **ESLint rule:** Detectar definiciones de enum duplicadas
  ```json
  // .eslintrc.cjs
  "no-duplicate-enum-definitions": "error"
  ```

---

## 🎯 PREVENCIÓN FUTURA

### Regla Nueva para CLAUDE.md

```markdown
### REGLA #23: Enums y Types - Inferir desde DB

**NUNCA definir manualmente enums/types que ya existen en el schema de DB.**

✅ CORRECTO:
\`\`\`typescript
import type { debateStatusEnum } from '@quoorum/db/schema'
export type DebateStatus = typeof debateStatusEnum.enumValues[number]
\`\`\`

❌ INCORRECTO:
\`\`\`typescript
export type DebateStatus = 'draft' | 'pending' | 'in_progress'
\`\`\`

**Por qué:** Evita desincronización entre frontend y backend.
```

### Añadir a Checkpoint Protocol

```markdown
| **Crear type/enum** | [05-patterns.md#type-inference](./docs/claude/05-patterns.md) | ⚠️ ¿Ya existe en DB? Inferir en lugar de duplicar |
```

### Documentar en 05-patterns.md

Nueva sección: **7. Type Inference from DB Enums**

---

## 📊 MÉTRICAS

| Métrica | Valor |
|---------|-------|
| Sistemas auditados | 5 |
| Problemas críticos | 2 |
| Problemas potenciales | 3 |
| Sistemas correctos | 2 |
| Enums totales en DB | 17+ |
| Enums verificados | 4 |
| Enums por verificar | 13+ |

---

## 🔗 REFERENCIAS

- **Error #6:** [ERRORES-COMETIDOS.md#error-6](./ERRORES-COMETIDOS.md#error-6)
- **silenced-error-types.ts:** [apps/web/src/lib/trpc/silenced-error-types.ts](./apps/web/src/lib/trpc/silenced-error-types.ts)
- **05-patterns.md:** [docs/claude/05-patterns.md](./docs/claude/05-patterns.md)

---

_Última actualización: 27 Ene 2026_
_Próxima auditoría recomendada: Después de corregir Problemas #1 y #2_
