# 🔄 GUÍA DE MIGRACIÓN A ESTILOS CENTRALIZADOS

> **Última actualización:** 30 Enero 2026  
> **Para:** Migrar componentes a usar el Design System centralizado

---

## 📋 TABLA DE CONTENIDOS

1. [Introducción](#introducción)
2. [Import Statement](#import-statement)
3. [Tabla de Conversión](#tabla-de-conversión-rápida)
4. [Ejemplos Prácticos](#ejemplos-prácticos)
5. [Componentes Migrados](#componentes-migrados)
6. [Próximos Pasos](#próximos-pasos)

---

## 🎯 Introducción

Hemos centralizado todos los estilos en `apps/web/src/lib/styles.ts` para:

- ✅ **Eliminar hardcoded colors** (#111b21, #2a3942, etc.)
- ✅ **Usar variables CSS** (var(--theme-bg-primary))
- ✅ **Reutilizar patrones** (cards, inputs, modales)
- ✅ **Mantener consistencia** (todos los componentes iguales)
- ✅ **Facilitar cambios** (cambio en 1 lugar → afecta todo)

---

## 📦 Import Statement

```tsx
// ❌ ANTES
import { cn } from '@/lib/utils'

// ✅ AHORA
import { cn, styles } from '@/lib/utils'
```

---

## 🔄 Tabla de Conversión Rápida

### Colores de Fondo

| ❌ Hardcoded | ✅ Centralizado |
|---|---|
| `bg-[#0b141a]` | `styles.colors.bg.primary` |
| `bg-[#111b21]` | `styles.colors.bg.secondary` |
| `bg-[#202c33]` | `styles.colors.bg.tertiary` |
| `bg-[#2a3942]` | `styles.colors.bg.input` |

### Colores de Texto

| ❌ Hardcoded | ✅ Centralizado |
|---|---|
| `text-white` | `styles.colors.text.primary` |
| `text-[#ffffff]` | `styles.colors.text.primary` |
| `text-[#aebac1]` | `styles.colors.text.secondary` |
| `text-[#8696a0]` | `styles.colors.text.tertiary` |
| `text-[#64748b]` | `styles.colors.text.muted` |

### Bordes

| ❌ Hardcoded | ✅ Centralizado |
|---|---|
| `border-[#2a3942]` | `styles.colors.border.default` |
| `border-[var(--theme-border)]` | `styles.colors.border.default` |
| `border-purple-500/20` | `styles.colors.border.subtle` |
| `border-purple-500/40` | `styles.colors.border.active` |

### Cards

| ❌ Hardcoded | ✅ Centralizado |
|---|---|
| `bg-[#111b21] border-[#2a3942] border rounded-lg p-6` | `styles.card.base` |
| `bg-[#111b21] border-[#2a3942] border rounded-lg p-4` | `styles.card.compact` |
| `bg-[#202c33] border-b border-[#2a3942] p-4` | `styles.card.header` |

### Inputs

| ❌ Hardcoded | ✅ Centralizado |
|---|---|
| `bg-[#2a3942] border-[#2a3942] text-white h-10 px-4` | `styles.input.base` |
| `bg-[#2a3942] border-[#2a3942] min-h-[100px]` | `styles.input.textarea` |
| `bg-[#2a3942] border-[#2a3942] h-10 px-4` | `styles.input.select` |

### Layout

| ❌ Hardcoded | ✅ Centralizado |
|---|---|
| `flex items-center gap-3` | `styles.layout.flexRow` |
| `flex flex-col gap-4` | `styles.layout.flexCol` |
| `flex items-center justify-between` | `styles.layout.flexBetween` |
| `space-y-6` | `styles.layout.section` |

### Typography

| ❌ Hardcoded | ✅ Centralizado |
|---|---|
| `text-3xl font-bold text-[var(--theme-text-primary)]` | `styles.text.h1` |
| `text-2xl font-semibold text-[var(--theme-text-primary)]` | `styles.text.h2` |
| `text-sm text-[#aebac1]` | `styles.text.bodySecondary` |
| `text-xs text-[#8696a0]` | `styles.text.small` |

---

## 💡 Ejemplos Prácticos

### Ejemplo 1: Card Simple

```tsx
// ❌ ANTES
<Card className="bg-[#111b21] border-[#2a3942]">
  <CardHeader className="bg-[#202c33] border-b border-[#2a3942]">
    <CardTitle className="text-[var(--theme-text-primary)]">Título</CardTitle>
    <CardDescription className="text-[#aebac1]">Descripción</CardDescription>
  </CardHeader>
  <CardContent className="p-6">
    Contenido
  </CardContent>
</Card>

// ✅ AHORA
import { cn, styles } from '@/lib/utils'

<Card className={styles.card.base}>
  <CardHeader className={styles.card.header}>
    <CardTitle className={styles.colors.text.primary}>Título</CardTitle>
    <CardDescription className={styles.colors.text.secondary}>Descripción</CardDescription>
  </CardHeader>
  <CardContent>
    Contenido
  </CardContent>
</Card>
```

### Ejemplo 2: Input Field

```tsx
// ❌ ANTES
<Input 
  className="bg-[#2a3942] border-[#2a3942] text-white placeholder:text-[#8696a0] h-10 px-4"
  placeholder="Escribe algo..."
/>

// ✅ AHORA
<Input 
  className={styles.input.base}
  placeholder="Escribe algo..."
/>
```

### Ejemplo 3: Select / Dropdown

```tsx
// ❌ ANTES
<Select>
  <SelectTrigger className="bg-[#2a3942] border-[#2a3942] text-white">
    <SelectValue />
  </SelectTrigger>
  <SelectContent className="bg-[#111b21] border-[#2a3942]">
    <SelectItem value="1">Opción 1</SelectItem>
  </SelectContent>
</Select>

// ✅ AHORA
<Select>
  <SelectTrigger className={styles.input.select}>
    <SelectValue />
  </SelectTrigger>
  <SelectContent className={styles.selectContent()}>
    <SelectItem value="1">Opción 1</SelectItem>
  </SelectContent>
</Select>
```

### Ejemplo 4: Layout Flex

```tsx
// ❌ ANTES
<div className="flex items-center justify-between">
  <div className="flex items-center gap-3">
    <Icon />
    <span className="text-[var(--theme-text-primary)]">Título</span>
  </div>
  <Button>Acción</Button>
</div>

// ✅ AHORA
<div className={styles.layout.flexBetween}>
  <div className={styles.layout.flexRow}>
    <Icon />
    <span className={styles.colors.text.primary}>Título</span>
  </div>
  <Button>Acción</Button>
</div>
```

### Ejemplo 5: Modal/Dialog

```tsx
// ❌ ANTES
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="bg-[#111b21] border-[#2a3942] sm:max-w-[600px]">
    <DialogHeader className="bg-[#202c33] border-b border-[#2a3942]">
      <DialogTitle className="text-white">Título</DialogTitle>
      <DialogDescription className="text-[#aebac1]">Descripción</DialogDescription>
    </DialogHeader>
    <div className="p-6">Contenido</div>
  </DialogContent>
</Dialog>

// ✅ AHORA
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className={cn(styles.modal.content, styles.modal.sizes.md)}>
    <DialogHeader className={styles.modal.header}>
      <DialogTitle className={styles.colors.text.primary}>Título</DialogTitle>
      <DialogDescription className={styles.colors.text.secondary}>Descripción</DialogDescription>
    </DialogHeader>
    <div className={styles.modal.body}>Contenido</div>
  </DialogContent>
</Dialog>
```

### Ejemplo 6: Badge/Status

```tsx
// ❌ ANTES
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
  Activo
</span>

// ✅ AHORA
<span className={cn(styles.badge.base, styles.badge.primary)}>
  Activo
</span>
```

### Ejemplo 7: Hover State

```tsx
// ❌ ANTES
<Card className="bg-[#111b21] border-[#2a3942] hover:bg-[#202c33] hover:border-purple-500/40 transition-colors cursor-pointer">
  Clickeable Card
</Card>

// ✅ AHORA
<Card className={styles.card.hoverable}>
  Clickeable Card
</Card>

// O con función helper
<Card className={styles.hoverState(styles.card.base)}>
  Clickeable Card
</Card>
```

### Ejemplo 8: Focus Ring

```tsx
// ❌ ANTES
<Input 
  className="focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 bg-[#2a3942]"
/>

// ✅ AHORA
<Input 
  className={styles.focusRing(styles.input.base)}
/>
```

### Ejemplo 9: Custom Card con Opciones

```tsx
// ❌ ANTES
<div className="bg-[#111b21] border border-[#2a3942] rounded-lg p-4 hover:bg-[#202c33] cursor-pointer transition-colors">
  Card Compacta Hoverable
</div>

// ✅ AHORA - Usando helper function
<div className={styles.createCard({ padding: 'compact', hoverable: true })}>
  Card Compacta Hoverable
</div>
```

---

## ✅ Componentes Migrados

### UI Components

- ✅ `settings-card.tsx` - Migrado completamente
- ✅ `form-field-group.tsx` - Migrado completamente  
- ✅ `empty-state-card.tsx` - Migrado completamente

### Quoorum Components

- ✅ `ai-coaching.tsx` - Parcialmente migrado
- ✅ `consensus-timeline.tsx` - Parcialmente migrado
- ✅ `debate-export.tsx` - Parcialmente migrado

### Pendientes (50+ archivos)

Estos archivos **AÚN tienen hardcoded colors** y necesitan migración:

#### Settings Components
- ⚠️ `team-upgrade-modal.tsx` (26 instancias)
- ⚠️ Otros componentes en `/settings/*`

#### Quoorum Components  
- ⚠️ Muchos en `/quoorum/*`

#### Debate Components
- ⚠️ Varios en `/debates/*`

---

## 🚀 Próximos Pasos

### 1. Migración Manual Continua

Para cada archivo con hardcoded styles:

```bash
# Buscar archivos con colores hardcoded
grep -r "bg-\[#" apps/web/src/components/

# O específicamente
grep -r "text-\[#" apps/web/src/components/
grep -r "border-\[#" apps/web/src/components/
```

### 2. Patrón de Migración

Para cada componente:

1. **Import styles**
   ```tsx
   import { cn, styles } from '@/lib/utils'
   ```

2. **Buscar y reemplazar** usando la tabla de conversión

3. **Probar** que el componente sigue funcionando

4. **Commit** con mensaje descriptivo
   ```bash
   git commit -m "refactor(ui): migrate ComponentName to centralized styles"
   ```

### 3. Script de Migración Automática (Opcional)

Podríamos crear un script que automáticamente:

```bash
# Pseudo-código del script
find apps/web/src -name "*.tsx" | while read file; do
  sed -i 's/bg-\[#111b21\]/styles.colors.bg.secondary/g' "$file"
  sed -i 's/bg-\[#2a3942\]/styles.colors.bg.input/g' "$file"
  # ... más replacements
done
```

### 4. Validación

Después de migrar cada componente:

```bash
# Verificar que compile sin errores
pnpm tsc --noEmit

# Probar la app
pnpm dev
```

---

## 📊 Progreso de Migración

```
Total archivos con hardcoded styles: ~50+
Migrados completamente: 3 ✅
Migrados parcialmente: 3 ⚠️
Pendientes: ~44 ❌

Progreso: ████░░░░░░░░░░░░░░░░ 12%
```

---

## 🎯 Beneficios Inmediatos

Una vez completada la migración:

1. **Cambios globales instantáneos**
   ```tsx
   // Cambiar el color de todos los cards en 1 línea
   export const card = {
     base: cn(colors.bg.secondary, ...) // Cambiar aquí afecta TODO
   }
   ```

2. **Autocompletado mejorado**
   ```tsx
   styles.  // → VS Code sugiere: colors, card, input, modal, etc
   ```

3. **Type safety**
   ```tsx
   // TypeScript te avisará si usas mal
   styles.card.wrongProperty // ❌ Error
   ```

4. **Documentación viva**
   - Cada preset está en `lib/styles.ts`
   - Coincide con `DESIGN-SYSTEM.md`
   - Fácil de mantener actualizado

---

## 🔗 Referencias

- [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) - Guía visual completa
- [lib/styles.ts](./apps/web/src/lib/styles.ts) - Implementación de estilos
- [STANDARDS.md](./STANDARDS.md) - Estándares generales de código

---

**¿Dudas?** Consulta esta guía o el archivo `lib/styles.ts` directamente.

**Última actualización:** 30 Enero 2026  
**Mantenido por:** Equipo Quoorum
