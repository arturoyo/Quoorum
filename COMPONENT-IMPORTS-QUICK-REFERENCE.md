# 📚 COMPONENT IMPORTS QUICK REFERENCE

**Guía rápida para importar componentes - Patrón Estándar del Proyecto**

---

## ✅ PATRÓN CORRECTO (CENTRALIZED)

```typescript
// ✅ BIEN - Importar desde el índice centralizado
import { Button, Input, Dialog } from '@/components/ui'
import { ThemeProvider, ThemeToggle } from '@/components/theme'
import { AppShell, AppHeader, AppFooter } from '@/components/layout'
import { AdminModal, AdminContent } from '@/components/admin'
import { AdminDashboard, AiCoaching } from '@/components/quoorum'
import { DebateProgressCascade } from '@/components/debates'
import { TestModeToggle } from '@/components/dashboard'
```

---

## ❌ PATRÓN INCORRECTO (DISPERSED)

```typescript
// ❌ MAL - Importar del archivo específico
import { Button } from '@/components/ui/button'
import { AdminModal } from '@/components/admin/admin-modal'
import { AdminDashboard } from '@/components/quoorum/admin-dashboard'
import { DebateProgressCascade } from '@/components/debates/debate-progress-cascade'
```

---

## 📋 Tabla de Rutas de Importación

| Componente | ✅ CORRECTO | Ubicación del Archivo |
|---|---|---|
| **UI Primitives** | `from '@/components/ui'` | components/ui/button.tsx, etc |
| **Theme** | `from '@/components/theme'` | components/theme/theme-toggle.tsx |
| **Layout/Shell** | `from '@/components/layout'` | components/layout/app-shell.tsx |
| **Admin** | `from '@/components/admin'` | components/admin/admin-modal.tsx |
| **Admin Sections** | `from '@/components/admin'` | components/admin/sections/*.tsx |
| **Quoorum** | `from '@/components/quoorum'` | components/quoorum/admin-dashboard.tsx |
| **Quoorum Reports** | `from '@/components/quoorum'` | components/quoorum/reports/index.ts |
| **Debates** | `from '@/components/debates'` | components/debates/debate-progress-cascade.tsx |
| **Dashboard** | `from '@/components/dashboard'` | components/dashboard/test-mode-toggle.tsx |
| **Settings** | `from '@/components/settings/...'` | components/settings/settings-modal.tsx |
| **Settings Personalization** | `from '@/components/settings/sections/personalization'` | components/settings/sections/personalization/* |

---

## 🎯 Ejemplos por Ubicación

### Importar desde UI (45+ primitivos)
```typescript
import { 
  Button, 
  Input, 
  Dialog, 
  Badge, 
  Card, 
  Avatar,
  // ... y 40+ más
} from '@/components/ui'
```

### Importar desde Theme
```typescript
import { 
  ThemeProvider, 
  useTheme, 
  ThemeToggle,
  ThemeDropdown 
} from '@/components/theme'
```

### Importar desde Layout (AppShell)
```typescript
import { 
  AppShell,          // Main container component
  AppHeader,         // Header component
  AppFooter,         // Footer component
  LandingFooter      // Landing page footer
} from '@/components/layout'
```

### Importar desde Admin
```typescript
import { 
  AdminModal,              // Main modal
  AdminContent,            // Modal content
  AdminSectionRenderer,    // Section renderer
  // También puedes importar sections directamente:
  AdminSettingsSection,
  AuditSection,
  CostsSection,
  CreditsSection,
  LogsSection,
  RolesSection,
  ScenariosSection,
  UsersSection
} from '@/components/admin'
```

### Importar desde Quoorum (40+ componentes)
```typescript
import { 
  AdminDashboard,
  AiCoaching,
  AdvancedCharts,
  AnalyticsDashboard,
  ArgumentGraph,
  ArgumentTree,
  CommandPalette,
  ConsensusTimeline,
  ContextDimensionsPanel,
  CreditCounter,
  DebateComments,
  DebateExport,
  DebatePreview,
  DebateViewer,
  DepartmentSelector,
  ExpertSelector,
  FrameworkSelector,
  InteractiveControls,
  KeyboardShortcuts,
  LoadingStates,
  MultiQuestionForm,
  NotificationsCenter,
  NotificationsSidebar,
  Onboarding,
  ProcessTimelineCard,
  QualityBenchmark,
  QuooorumUpgradePrompt,
  ReportsViewer,
  ResearchResults,
  SmartTemplates,
  StrategySelector,
  TeamCollaboration,
  ThemeSelector,
  Tooltips,
  WebsocketProvider,
  WorkerSelector,
  // ... y 40+ más
} from '@/components/quoorum'
```

### Importar desde Debates
```typescript
import { 
  DebateProgressCascade,
  LiveCanvas
} from '@/components/debates'
```

### Importar desde Dashboard
```typescript
import { 
  TestModeToggle
} from '@/components/dashboard'
```

### Importar desde Settings
```typescript
import { 
  SettingsModal,
  SettingsContent,
  // O específicamente sections:
} from '@/components/settings'

// Para secciones específicas:
import { 
  PersonalizationSection,
  // ... otras sections
} from '@/components/settings/sections/personalization'
```

---

## 🔍 ¿Dónde Está Cada Componente?

### En `@/components/ui/`
- Todos los primitivos base (Button, Input, Dialog, etc)
- Más de 45 componentes UI reutilizables

### En `@/components/theme/`
- ThemeProvider
- useTheme hook
- ThemeToggle
- ThemeDropdown

### En `@/components/layout/`
- AppShell (wrapper principal)
- AppHeader
- AppFooter
- LandingFooter

### En `@/components/admin/`
- AdminModal
- AdminContent
- AdminSectionRenderer
- 8 Sections (en `admin/sections/`)

### En `@/components/quoorum/`
- 40+ componentes de dominio específico
- reports/ submodule
- Cada componente está en su propio archivo

### En `@/components/debates/`
- DebateProgressCascade
- LiveCanvas

### En `@/components/dashboard/`
- TestModeToggle

### En `@/components/settings/`
- SettingsModal
- SettingsContent
- sections/ submodule

---

## 📝 Checklist al Crear un Nuevo Componente

### Si creas un NUEVO archivo en `components/quoorum/`:

```typescript
// 1. Crea el archivo: new-component.tsx
export function NewComponent() {
  return <div>...</div>
}

// 2. Actualiza: quoorum/index.ts
export { NewComponent } from './new-component'

// 3. Importa en tu código:
import { NewComponent } from '@/components/quoorum'
```

### Si creas un NUEVO archivo en `components/admin/sections/`:

```typescript
// 1. Crea el archivo: new-section.tsx
export function NewSection() {
  return <div>...</div>
}

// 2. Actualiza: admin/sections/index.ts
export { NewSection } from './new-section'

// 3. El padre (admin/index.ts) ya exporta:
export * from './sections'

// 4. Importa en tu código:
import { NewSection } from '@/components/admin'
```

---

## ⚡ Quick Copy-Paste Imports

### Importe más común (Admin)
```typescript
import { AdminModal } from '@/components/admin'
```

### Importar múltiples de Quoorum
```typescript
import { AdminDashboard, AiCoaching, DebateComments } from '@/components/quoorum'
```

### Importar UI + Layout + Admin
```typescript
import { Button, Input } from '@/components/ui'
import { AppShell } from '@/components/layout'
import { AdminModal } from '@/components/admin'
```

---

## 🚫 Errores Comunes a EVITAR

```typescript
// ❌ NUNCA: Importar del archivo directo
import { AdminModal } from '@/components/admin/admin-modal'

// ✅ SIEMPRE: Importar del index
import { AdminModal } from '@/components/admin'

// ❌ NUNCA: Importar de rutas inconsistentes
import { Component1 } from '@/components/quoorum/component1'
import { Component2 } from '@/components/quoorum/components/component2'

// ✅ SIEMPRE: Usar el mismo patrón
import { Component1, Component2 } from '@/components/quoorum'
```

---

## 📞 Si no encuentras un componente...

1. **Busca en `@/components/quoorum/`**
   - Aquí están la mayoría de componentes de dominio

2. **Busca en `@/components/admin/`**
   - Aquí están los componentes de administración

3. **Busca en `@/components/ui/`**
   - Aquí están los componentes base reutilizables

4. **Mira el index.ts**
   ```bash
   cat apps/web/src/components/quoorum/index.ts
   ```
   Ahí puedes ver TODOS los componentes disponibles

---

## 🎓 Regla de Oro

> **Si un folder tiene 3+ archivos de componentes, importa desde el index del folder**

```
@/components/[feature]/index.ts existe
    ↓
import { Component } from '@/components/[feature]'
```

---

**Versión:** 1.0  
**Última Actualización:** Jan 30, 2026  
**Estado:** VIGENTE ✅
