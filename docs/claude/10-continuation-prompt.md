# PROMPT PARA CONTINUAR DESARROLLO QUOORUM - SISTEMA DE DISEÑO

## 📋 CONTEXTO DEL PROYECTO

**Proyecto**: Quoorum - Plataforma de debates con IA  
**Framework**: Next.js 15.5.10 + TypeScript + tRPC + Supabase + PostgreSQL  
**Ubicación**: `c:\Quoorum` (Windows)  
**Branch**: `feat/claude-ai-work`  
**Estado**: En desarrollo activo - Sistema de diseño centralizado en progreso

## 🎯 OBJETIVO ACTUAL

Crear un **sistema de diseño centralizado** usando CSS variables para garantizar coherencia visual y reutilización de componentes en toda la aplicación.

### ✅ COMPLETADO (Última sesión):

1. **Expandido `apps/web/src/app/globals.css`** con 100+ CSS variables:
   - Typography: `--font-size-xs` hasta `--font-size-5xl`, weights, line-heights
   - Spacing: `--spacing-xs` (4px) hasta `--spacing-3xl` (64px)
   - Border Radius: `--radius-none` hasta `--radius-full`
   - Shadows: `--shadow-xs` hasta `--shadow-2xl` (con variantes dark theme)
   - Transitions: `--transition-fast/normal/slow`
   - Theme colors: backgrounds, borders, text (primary/secondary/tertiary/muted)

2. **Creado `docs/claude/09-design-tokens.md`** (350+ líneas):
   - Documentación completa de todos los tokens
   - Ejemplos de componentes (buttons, inputs, badges)
   - Checklist para crear nuevos componentes
   - Guía de uso de tokens

3. **Actualizado `docs/claude/08-design-system.md`**:
   - Añadida sección de sizing para logo Quoorum
   - 5 tamaños estándar: 24px (icons), 32px (sidebar), 40px (navbar), 48px (cards), 56px (footer)

4. **Optimizaciones técnicas**:
   - tRPC timeout aumentado de 60s a 120s (`apps/web/src/lib/trpc/provider.tsx`)
   - Query `getCostAnalytics` optimizada (2 queries → 1 + agregación en memoria)
   - Layout de debates con two-panel design implementado

5. **Fixes parciales de CSS inline styles**:
   - `advanced-charts.tsx` - Removido `minWidth` innecesario
   - `tooltips.tsx` - Corregido className `styles.colors.text.primary` → `text-white`
   - `DebateChat.tsx` - Limpiado indicadores de texto
   - `context-section.tsx` - Añadidos `aria-label` a inputs

## ⚠️ PROBLEMAS PENDIENTES

### 1. **Errores de Linting (CSS Inline Styles)**

Los siguientes archivos tienen warnings de "CSS inline styles should not be used":

```
c:\Quoorum\apps\web\src\components\ui\quoorum-logo.tsx (línea 57)
  → NECESARIO: maskImage/WebkitMaskImage no tienen equivalente en Tailwind

c:\Quoorum\apps\web\src\components\quoorum\advanced-charts.tsx (líneas 318, 336, 357)
  → NECESARIO: backgroundColor dinámico basado en valores calculados

c:\Quoorum\apps\web\src\components\quoorum\analytics-dashboard.tsx (línea 307)
  → NECESARIO: width dinámico para progress bars (porcentajes)

c:\Quoorum\apps\web\src\app\admin\page.tsx (línea 354)
  → NECESARIO: width dinámico para progress bars

c:\Quoorum\apps\web\src\components\quoorum\context-readiness.tsx (línea 221)
  → NECESARIO: width dinámico para progress bars

c:\Quoorum\apps\web\src\components\quoorum\tooltips.tsx (líneas 102, 110)
  → NECESARIO: Posicionamiento dinámico de tooltips

c:\Quoorum\packages\quoorum\visualization\DebateChat.tsx (líneas 65, 80, 141)
  → NECESARIO: width dinámico + color dinámico

c:\Quoorum\docs\claude\09-design-tokens.md (línea 388)
  → NO CRÍTICO: Error en ejemplo de documentación
```

**SOLUCIÓN**: Estos inline styles son necesarios porque son **valores dinámicos**. Debes:
- Ignorar estos warnings (son falsos positivos)
- O crear CSS modules para los casos de positioning
- O añadir `/* eslint-disable-next-line */` antes de cada uso

### 2. **Dev Server no Inicia**

```bash
# PROBLEMA: turbo dev no acepta parámetros directos
pnpm dev -p 3005  # ❌ NO FUNCIONA

# SOLUCIONES:
cd c:\Quoorum
pnpm dev  # ✅ Inicia en puerto 3000 (default)

# O desde apps/web:
cd c:\Quoorum\apps\web
pnpm dev  # ✅ Ejecuta auto-fix y luego inicia
```

## 🚀 PRÓXIMOS PASOS (Opción C - 60 min)

### **FASE 1: Resolver Errores y Iniciar Dev Server (15 min)**

1. Ir a `c:\Quoorum\apps\web` y ejecutar `pnpm dev`
2. Esperar a que compile (usa auto-fix script automáticamente)
3. Verificar que http://localhost:3000 funciona
4. Abrir navegador y confirmar que la app carga sin errores

### **FASE 2: Auditoría de Componentes (15 min)**

**Buscar componentes con hardcoded styles**:

```bash
# Desde c:\Quoorum
grep -r "className.*text-white" apps/web/src/components
grep -r "className.*bg-\[#" apps/web/src/components
grep -r "className.*border-\[#" apps/web/src/components
```

**Crear archivo de reporte**: `STYLE-AUDIT-2026-01-31.md` con:
- Lista de componentes con hardcoded colors
- Lista de componentes que NO usan CSS variables
- Priorización: Críticos (usados en 10+ lugares) vs Nice-to-have

### **FASE 3: Migración a CSS Variables (20 min)**

**Componentes prioritarios a migrar**:

1. **Button** (`apps/web/src/components/ui/button.tsx`)
   - Reemplazar `bg-purple-500` → `bg-[var(--theme-bg-primary)]`
   - Reemplazar `text-white` → `text-[var(--theme-text-inverted)]`

2. **Card** (`apps/web/src/components/ui/card.tsx`)
   - Reemplazar backgrounds hardcoded
   - Usar `var(--theme-bg-secondary)`, `var(--theme-border)`

3. **Input** (`apps/web/src/components/ui/input.tsx`)
   - Migrar a `var(--theme-bg-input)`, `var(--theme-border)`

**Patrón de migración**:

```tsx
// ❌ ANTES
<div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">

// ✅ DESPUÉS  
<div className="bg-[var(--theme-bg-primary)] border border-[var(--theme-border)]">
```

### **FASE 4: Crear Componentes Reutilizables (10 min)**

**Archivo**: `apps/web/src/components/design-system/index.tsx`

```tsx
// Progress Bar usando tokens
export function ProgressBar({ value, max = 100, variant = 'primary' }: ProgressBarProps) {
  const percentage = (value / max) * 100
  const colors = {
    primary: 'bg-purple-500',
    success: 'bg-green-500', 
    warning: 'bg-yellow-500',
  }
  
  return (
    <div className="w-full h-2 rounded-full overflow-hidden bg-[var(--theme-bg-input)]">
      <div 
        className={`h-full rounded-full transition-all ${colors[variant]}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

// Badge usando tokens
export function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span className="inline-flex items-center px-[var(--spacing-sm)] py-[var(--spacing-xs)] rounded-[var(--radius-full)] bg-[var(--theme-bg-tertiary)] text-[var(--theme-text-secondary)] text-[var(--font-size-xs)]">
      {children}
    </span>
  )
}
```

## 📁 ARCHIVOS CLAVE

### **Sistema de Diseño**:
```
c:\Quoorum\apps\web\src\app\globals.css          # CSS variables centralizadas
c:\Quoorum\docs\claude\09-design-tokens.md       # Documentación completa
c:\Quoorum\docs\claude\08-design-system.md       # Guía de diseño
c:\Quoorum\docs\claude\04-rules.md               # Regla #13 (UX/Design)
```

### **Componentes a Migrar**:
```
c:\Quoorum\apps\web\src\components\ui\button.tsx
c:\Quoorum\apps\web\src\components\ui\card.tsx
c:\Quoorum\apps\web\src\components\ui\input.tsx
c:\Quoorum\apps\web\src\components\ui\badge.tsx
```

### **Configuración**:
```
c:\Quoorum\tailwind.config.ts                     # Configuración Tailwind
c:\Quoorum\apps\web\src\lib\trpc\provider.tsx    # tRPC (timeout 120s)
c:\Quoorum\packages\api\src\routers\admin.ts     # Query optimizada
```

## 🛠️ COMANDOS ÚTILES

```bash
# Iniciar dev server
cd c:\Quoorum\apps\web
pnpm dev

# Ver errores de TypeScript
pnpm tsc --noEmit

# Ver errores de ESLint
pnpm lint

# Buscar usos de colores hardcoded
grep -r "text-white\|bg-white" apps/web/src/components --include="*.tsx"

# Verificar que CSS variables existen
grep -r "var(--" apps/web/src/components --include="*.tsx" | wc -l
```

## 📝 CHECKLIST DE COMPLETITUD

- [ ] Dev server corriendo sin errores
- [ ] Auditoría de componentes completada
- [ ] Al menos 5 componentes migrados a CSS variables
- [ ] Componentes reutilizables creados (ProgressBar, Badge, etc.)
- [ ] Documentación actualizada en `09-design-tokens.md`
- [ ] Tests visuales en light + dark mode
- [ ] Commit con mensaje: `feat: Migrate components to centralized design tokens`

## 💡 TIPS IMPORTANTES

1. **NO CAMBIES** los inline styles que usan valores dinámicos (width%, backgroundColor calculado, etc.)
2. **USA** `var(--token-name)` dentro de clases Tailwind: `bg-[var(--theme-bg-primary)]`
3. **VERIFICA** que funcione en light Y dark mode antes de confirmar cambios
4. **LEE** `docs/claude/09-design-tokens.md` para ver todos los tokens disponibles
5. **PRIORIZA** componentes más usados primero (Button, Card, Input)

## 🎨 TOKENS DISPONIBLES

**Ver lista completa**: `docs/claude/09-design-tokens.md`

**Más usados**:
```css
/* Backgrounds */
--theme-bg-primary
--theme-bg-secondary  
--theme-bg-tertiary
--theme-bg-input

/* Borders */
--theme-border
--theme-border-subtle

/* Text */
--theme-text-primary
--theme-text-secondary
--theme-text-muted
--theme-text-inverted

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

**INICIO**: Ejecuta `cd c:\Quoorum\apps\web && pnpm dev` y espera a que compile. Luego procede con la auditoría.
