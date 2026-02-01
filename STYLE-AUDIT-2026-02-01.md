# Auditoría de Estilos - Sistema de Diseño Centralizado

**Fecha:** 2026-02-01
**Objetivo:** Identificar componentes con hardcoded styles para migrar a CSS variables

---

## 📊 Resumen Ejecutivo

### Archivos Analizados:
- **38 archivos** con `text-white` hardcoded
- **6 archivos** con `bg-[#...]` hex colors
- **3 archivos** con `border-[#...]` hex colors

### Prioridad de Migración:
1. **CRÍTICOS (10+ usos)**: Componentes base del UI system
2. **IMPORTANTES (5-9 usos)**: Componentes de features principales
3. **NICE-TO-HAVE (1-4 usos)**: Componentes específicos

---

## 🔴 CRÍTICOS - Migración Inmediata Requerida

### 1. Componentes UI Base

**Archivos:**
```
apps/web/src/components/ui/button.tsx
apps/web/src/components/ui/card.tsx
apps/web/src/components/ui/input.tsx
apps/web/src/components/ui/badge.tsx
apps/web/src/components/ui/settings-card.tsx
apps/web/src/components/ui/empty-state-card.tsx
```

**Problema:** Son componentes base usados en toda la aplicación. Hardcoded colors rompen consistencia del theme.

**Acción:**
- Reemplazar `text-white` → `text-[var(--theme-text-inverted)]`
- Reemplazar `bg-white` → `bg-[var(--theme-bg-primary)]`
- Reemplazar `bg-gray-900` → `bg-[var(--theme-bg-secondary)]`
- Reemplazar `border-gray-200` → `border-[var(--theme-border)]`

**Impacto:** Alto - Afecta toda la UI

---

## 🟠 IMPORTANTES - Migración en Segunda Fase

### 2. Componentes de Quoorum Core

**Archivos con `text-white` (15 archivos):**
```
apps/web/src/components/quoorum/expert-selector.tsx
apps/web/src/components/quoorum/framework-selector.tsx
apps/web/src/components/quoorum/strategy-selector.tsx
apps/web/src/components/quoorum/worker-selector.tsx
apps/web/src/components/quoorum/multi-question-form.tsx
apps/web/src/components/quoorum/ai-coaching.tsx
apps/web/src/components/quoorum/smart-templates.tsx
apps/web/src/components/quoorum/research-results.tsx
apps/web/src/components/quoorum/context-snapshots.tsx
apps/web/src/components/quoorum/debate-export.tsx
apps/web/src/components/quoorum/tooltips.tsx
apps/web/src/components/debates/live-canvas.tsx
apps/web/src/components/debates/debate-progress-cascade.tsx
apps/web/src/components/dashboard/test-mode-toggle.tsx
apps/web/src/components/error-boundary.tsx
```

**Archivos con Hex Colors (6 archivos):**
```
apps/web/src/components/quoorum/context-readiness.tsx
  └─ bg-[#...] en líneas de progress bars (NECESARIO - valores dinámicos)

apps/web/src/components/quoorum/analytics-dashboard.tsx
  └─ bg-[#...] en línea 307 (NECESARIO - valores dinámicos)

apps/web/src/components/quoorum/expert-feedback-panel.tsx
  └─ bg-[#4ade80], border-[#22c55e] (MIGRAR a variables)

apps/web/src/components/quoorum/debate-viewer.tsx
  └─ bg-[#...], border-[#...] (MIGRAR a variables)

apps/web/src/components/quoorum/reports/components/share-dialog.tsx
  └─ bg-[#...] (MIGRAR a variables)

apps/web/src/components/quoorum/reports/components/generate-report-dialog.tsx
  └─ bg-[#...] (MIGRAR a variables)
```

**Acción:**
- Componentes sin valores dinámicos: Migrar a variables
- Componentes con valores dinámicos (progress bars): Añadir `/* eslint-disable-next-line */` y documentar

**Impacto:** Medio - Afecta features principales de debates

---

## 🟡 NICE-TO-HAVE - Migración en Tercera Fase

### 3. Componentes de Settings

**Archivos (14 archivos):**
```
apps/web/src/components/settings/sections/context-section.tsx
apps/web/src/components/settings/sections/experts-section.tsx
apps/web/src/components/settings/sections/personalization/personalization-section.tsx
apps/web/src/components/settings/sections/workers-section.tsx
apps/web/src/components/settings/settings-content.tsx
apps/web/src/components/settings/sections/personalization/components/company-tab.tsx
apps/web/src/components/settings/sections/personalization/components/context-file-card.tsx
apps/web/src/components/settings/sections/team-section.tsx
apps/web/src/components/settings/sections/departments-library-section.tsx
apps/web/src/components/settings/subscription-management-modal.tsx
apps/web/src/components/settings/sections/security-section.tsx
apps/web/src/components/settings/sections/experts-library-section.tsx
apps/web/src/components/settings/sections/personalization/components/personalization-states.tsx
```

**Impacto:** Bajo - Solo afecta páginas de settings

---

### 4. Componentes de Admin

**Archivos (9 archivos):**
```
apps/web/src/components/admin/sections/users-section.tsx
apps/web/src/components/admin/sections/scenarios-section.tsx
apps/web/src/components/admin/sections/admin-settings-section.tsx
apps/web/src/components/admin/sections/audit-section.tsx
apps/web/src/components/admin/sections/logs-section.tsx
apps/web/src/components/admin/sections/roles-section.tsx
apps/web/src/components/admin/sections/credits-section.tsx
apps/web/src/components/admin/sections/costs-section.tsx
```

**Impacto:** Bajo - Solo afecta panel de admin

---

## 🛠️ PLAN DE ACCIÓN

### Fase 1: Componentes Base UI (30 min)
- [ ] `button.tsx` - Migrar a variables
- [ ] `card.tsx` - Migrar a variables
- [ ] `input.tsx` - Migrar a variables
- [ ] `badge.tsx` - Migrar a variables
- [ ] `settings-card.tsx` - Migrar a variables
- [ ] `empty-state-card.tsx` - Migrar a variables

### Fase 2: Componentes Quoorum (45 min)
- [ ] `expert-selector.tsx` - Migrar `text-white`
- [ ] `framework-selector.tsx` - Migrar `text-white`
- [ ] `strategy-selector.tsx` - Migrar `text-white`
- [ ] `worker-selector.tsx` - Migrar `text-white`
- [ ] `multi-question-form.tsx` - Migrar `text-white`
- [ ] `expert-feedback-panel.tsx` - Migrar hex colors a variables
- [ ] `debate-viewer.tsx` - Migrar hex colors a variables
- [ ] `tooltips.tsx` - Revisar (tiene inline styles NECESARIOS para positioning)

### Fase 3: Settings y Admin (30 min)
- [ ] Batch migración de todos los archivos de settings
- [ ] Batch migración de todos los archivos de admin

---

## 📝 NOTAS TÉCNICAS

### Estilos Inline NECESARIOS (No Migrar)

Los siguientes archivos tienen `style={}` inline que SON NECESARIOS:

```
apps/web/src/components/ui/quoorum-logo.tsx (línea 57)
  → maskImage/WebkitMaskImage no soportado en Tailwind

apps/web/src/components/quoorum/advanced-charts.tsx (líneas 318, 336, 357)
  → backgroundColor dinámico calculado en runtime

apps/web/src/components/quoorum/analytics-dashboard.tsx (línea 307)
  → width dinámico para progress bars (%)

apps/web/src/app/admin/page.tsx (línea 354)
  → width dinámico para progress bars (%)

apps/web/src/components/quoorum/context-readiness.tsx (línea 221)
  → width dinámico para progress bars (%)

apps/web/src/components/quoorum/tooltips.tsx (líneas 102, 110)
  → Posicionamiento dinámico de tooltips (top, left calculados)

packages/quoorum/visualization/DebateChat.tsx (líneas 65, 80, 141)
  → width dinámico + color dinámico
```

**Solución:** Añadir `/* eslint-disable-next-line react/forbid-dom-props */` antes de cada línea.

---

## 🎨 VARIABLES CSS DISPONIBLES

**Ver lista completa:** `docs/claude/09-design-tokens.md`

**Más usadas para migración:**

```css
/* Backgrounds */
--theme-bg-primary         /* bg-white / bg-gray-900 */
--theme-bg-secondary       /* bg-gray-100 / bg-gray-800 */
--theme-bg-tertiary        /* bg-gray-50 / bg-gray-700 */
--theme-bg-input           /* bg-white / bg-gray-800 */

/* Text */
--theme-text-primary       /* text-gray-900 / text-white */
--theme-text-secondary     /* text-gray-700 / text-gray-300 */
--theme-text-muted         /* text-gray-500 / text-gray-400 */
--theme-text-inverted      /* text-white / text-gray-900 */

/* Borders */
--theme-border             /* border-gray-200 / border-gray-700 */
--theme-border-subtle      /* border-gray-100 / border-gray-800 */

/* Spacing */
--spacing-xs (4px)
--spacing-sm (8px)
--spacing-md (16px)
--spacing-lg (24px)

/* Shadows */
--shadow-sm
--shadow-md
--shadow-lg
```

---

## 📈 MÉTRICAS DE ÉXITO

### Antes:
- 38 archivos con `text-white` hardcoded
- 6 archivos con hex colors en backgrounds
- 3 archivos con hex colors en borders
- **Total:** 47 archivos con estilos hardcoded

### Meta (Después):
- ✅ 0 archivos con colores hardcoded (excepto inline styles dinámicos)
- ✅ 100% uso de CSS variables en componentes UI base
- ✅ Dark mode consistente en toda la app

---

**Última actualización:** 2026-02-01
**Responsable:** Sistema de diseño centralizado
