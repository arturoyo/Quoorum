# 🎨 DESIGN SYSTEM — Guía Visual de Estilos Quoorum

> **Referencia completa de diseño visual del proyecto**  
> **Para:** Desarrolladores, diseñadores, y cualquiera trabajando en el UI

---

## 📑 ÍNDICE RÁPIDO

1. [🎨 Paleta de Colores](#-paleta-de-colores)
2. [📝 Tipografía](#-tipografía)
3. [📐 Espaciado y Padding](#-espaciado-y-padding)
4. [🔲 Bordes y Redondeo](#-bordes-y-redondeo)
5. [🪟 Modales y Diálogos](#-modales-y-diálogos)
6. [🎴 Cards y Paneles](#-cards-y-paneles)
7. [🔘 Botones](#-botones)
8. [✨ Efectos Visuales](#-efectos-visuales)
9. [🎭 Fondos y Texturas](#-fondos-y-texturas)
10. [📱 Responsive Breakpoints](#-responsive-breakpoints)

---

## 🎨 PALETA DE COLORES

### Tema Oscuro (Predeterminado - WhatsApp Style)

```css
/* 🌑 BACKGROUNDS - Fondos */
--theme-bg-primary: #0b141a      /* Fondo principal de la app */
--theme-bg-secondary: #111b21    /* Cards, paneles, secciones */
--theme-bg-tertiary: #202c33     /* Headers, subsecciones elevadas */
--theme-bg-input: #2a3942        /* Inputs, textareas, controles */

/* 🎨 ACCENT COLORS - Colores de marca */
--primary: #9333ea               /* Purple-600 - Acción principal */
--primary-hover: #7c3aed         /* Purple-700 - Hover sobre primary */
--primary-light: rgb(147 51 234 / 0.2)  /* Purple-600/20 - Sutiles */

--secondary: #0891b2             /* Cyan-600 - Acciones secundarias */
--success: #10b981               /* Green-500 - Confirmaciones */
--warning: #f59e0b               /* Orange-500 - Advertencias */
--error: #ef4444                 /* Red-500 - Errores, destructivas */

/* 🔤 TEXT COLORS - Texto */
--theme-text-primary: #ffffff    /* Texto principal (100% blanco) */
--theme-text-secondary: #aebac1  /* Texto secundario (descripcion) */
--theme-text-tertiary: #8696a0   /* Placeholders, hints */
--theme-text-muted: #64748b      /* Texto deshabilitado */

/* 🔲 BORDERS - Bordes */
--theme-border: #2a3942          /* Border estándar */
--theme-border-subtle: rgba(147, 51, 234, 0.2)  /* Border sutil con color */
--theme-border-active: rgba(147, 51, 234, 0.4)  /* Border activo/hover */
```

### Tema Claro

```css
/* ☀️ BACKGROUNDS - Fondos claros */
--theme-bg-primary: #ffffff      /* Fondo principal blanco puro */
--theme-bg-secondary: #f8fafc    /* Cards, paneles (slate-50) */
--theme-bg-tertiary: #f1f5f9     /* Headers, subsecciones (slate-100) */
--theme-bg-input: #e2e8f0        /* Inputs (slate-200) */

/* 🔤 TEXT COLORS - Texto claro */
--theme-text-primary: #0f172a    /* Texto principal (slate-900) */
--theme-text-secondary: #475569  /* Texto secundario (slate-600) */
--theme-text-tertiary: #94a3b8   /* Placeholders (slate-400) */

/* 🔲 BORDERS - Bordes claros */
--theme-border: #e2e8f0          /* Border estándar (slate-200) */
--theme-border-subtle: rgba(147, 51, 234, 0.15)
--theme-border-active: rgba(147, 51, 234, 0.3)
```

### 🎯 Cómo Usar los Colores

```tsx
// ✅ CORRECTO - Usando variables CSS
<div className="bg-[var(--theme-bg-secondary)] text-[var(--theme-text-primary)]">
  <p className="text-[var(--theme-text-secondary)]">Descripción</p>
</div>

// ✅ CORRECTO - Usando Tailwind personalizado
<div className="bg-quoorum-bg-secondary text-quoorum-text-primary">
  <p className="text-quoorum-text-secondary">Descripción</p>
</div>

// ❌ INCORRECTO - Hard-coding colores
<div className="bg-[#111b21] text-white">
  <p className="text-[#aebac1]">Descripción</p>
</div>
```

---

## 📝 TIPOGRAFÍA

### Fuente Principal

```css
font-family: Inter, system-ui, -apple-system, sans-serif;
```

### Jerarquía de Texto

```tsx
/* 🔤 HEADINGS - Títulos */
<h1 className="text-3xl font-bold text-[var(--theme-text-primary)]">
  Título Principal (3xl / 30px)
</h1>

<h2 className="text-2xl font-semibold text-[var(--theme-text-primary)]">
  Título Sección (2xl / 24px)
</h2>

<h3 className="text-xl font-semibold text-[var(--theme-text-primary)]">
  Título Subsección (xl / 20px)
</h3>

<h4 className="text-lg font-medium text-[var(--theme-text-primary)]">
  Título Card (lg / 18px)
</h4>

/* 📄 BODY - Cuerpo */
<p className="text-base text-[var(--theme-text-primary)]">
  Texto normal (base / 16px)
</p>

<p className="text-sm text-[var(--theme-text-secondary)]">
  Texto secundario (sm / 14px)
</p>

<span className="text-xs text-[var(--theme-text-tertiary)]">
  Labels, hints (xs / 12px)
</span>

/* 🎯 SPECIAL - Especiales */
<span className="text-sm font-medium text-purple-400">
  Accent text
</span>

<code className="text-sm font-mono bg-[var(--theme-bg-input)] px-2 py-1 rounded">
  Código inline
</code>
```

### Pesos de Fuente

```tsx
font-light    // 300 - Raramente usado
font-normal   // 400 - Texto body predeterminado
font-medium   // 500 - Labels, emphasis
font-semibold // 600 - Subtítulos
font-bold     // 700 - Títulos principales
```

---

## 📐 ESPACIADO Y PADDING

### Sistema de Espaciado (basado en 4px)

```tsx
/* 📏 SPACING SCALE */
gap-1  = 4px   // Espaciado muy pequeño
gap-2  = 8px   // Espaciado pequeño
gap-3  = 12px  // Espaciado medio-pequeño ⭐ MÁS USADO
gap-4  = 16px  // Espaciado estándar ⭐ MÁS USADO
gap-6  = 24px  // Espaciado grande
gap-8  = 32px  // Espaciado muy grande
gap-12 = 48px  // Espaciado extra grande
```

### Padding Standard

```tsx
/* 📦 PADDING DE COMPONENTES */

// Cards / Paneles
<Card className="p-6">         // 24px - STANDARD
<Card className="p-4">         // 16px - Compacto
<Card className="p-8">         // 32px - Espacioso

// Modales
<Dialog className="p-6">       // 24px - STANDARD

// Inputs
<Input className="px-4 py-2">  // Horizontal 16px, Vertical 8px

// Botones
<Button className="px-6 py-3"> // Horizontal 24px, Vertical 12px
<Button className="px-4 py-2"> // Horizontal 16px, Vertical 8px (small)

// Secciones de página
<section className="p-6 lg:p-8"> // Responsive padding
```

### Margins y Spacing Entre Elementos

```tsx
/* 📐 SPACING PATTERNS */

// Entre elementos de un grupo
<div className="flex flex-col gap-4">  // 16px - STANDARD
<div className="flex items-center gap-3">  // 12px - Items relacionados

// Entre secciones
<div className="space-y-6">  // 24px - Secciones relacionadas
<div className="space-y-8">  // 32px - Secciones independientes

// Márgenes verticales
className="mb-4"  // 16px - Separación standard
className="mb-6"  // 24px - Separación grande
className="mt-8"  // 32px - Nueva sección
```

---

## 🔲 BORDES Y REDONDEO

### Border Radius (Redondeo)

```tsx
/* 🔲 BORDER RADIUS */
rounded-none    // 0px - Sin redondear
rounded-sm      // 2px - Muy sutil
rounded         // 4px - Inputs, pequeños elementos
rounded-md      // 6px - Botones, cards pequeñas ⭐ STANDARD
rounded-lg      // 8px - Cards, modales ⭐ MÁS USADO
rounded-xl      // 12px - Paneles grandes
rounded-2xl     // 16px - Elementos destacados
rounded-full    // 9999px - Avatares, pills
```

### Ejemplo de Uso

```tsx
// ✅ Cards
<div className="rounded-lg border border-[var(--theme-border)]">

// ✅ Botones
<button className="rounded-md">

// ✅ Inputs
<input className="rounded-md">

// ✅ Avatares
<img className="rounded-full">

// ✅ Pills / Badges
<span className="rounded-full px-3 py-1">
```

### Grosor de Bordes

```tsx
border      // 1px - STANDARD ⭐
border-2    // 2px - Emphasis, focus states
border-0    // 0px - Sin borde
```

---

## 🪟 MODALES Y DIÁLOGOS

### Estructura Standard de Modal

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui'

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="sm:max-w-[600px]">
    {/* 📌 HEADER - Siempre presente */}
    <DialogHeader>
      <DialogTitle className="text-xl font-semibold">
        Título del Modal
      </DialogTitle>
      <DialogDescription className="text-sm text-[var(--theme-text-secondary)]">
        Descripción opcional
      </DialogDescription>
    </DialogHeader>

    {/* 📄 BODY - Contenido principal */}
    <div className="space-y-6">
      {/* Contenido aquí */}
    </div>

    {/* 🔘 FOOTER - Acciones */}
    <DialogFooter className="flex gap-3">
      <Button variant="outline" onClick={() => setOpen(false)}>
        Cancelar
      </Button>
      <Button onClick={handleSave}>
        Guardar
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Tamaños de Modales

```tsx
// Pequeño (formularios simples)
className="sm:max-w-[425px]"

// Mediano (standard) ⭐ MÁS USADO
className="sm:max-w-[600px]"

// Grande (contenido extenso)
className="sm:max-w-[800px]"

// Extra grande (tablas, grids)
className="sm:max-w-[1000px]"

// Full width (casos especiales)
className="sm:max-w-[95vw]"
```

### Estilos de Overlay

```tsx
// Overlay oscuro (default)
<DialogOverlay className="bg-black/80" />

// Blur backdrop
<DialogOverlay className="backdrop-blur-sm bg-black/60" />
```

---

## 🎴 CARDS Y PANELES

### Card Standard

```tsx
import { ThemedCard } from '@/components/ui'

<ThemedCard className="p-6">
  <ThemedCard.Header>
    <ThemedCard.Title>Título de la Card</ThemedCard.Title>
    <ThemedCard.Description>
      Descripción opcional
    </ThemedCard.Description>
  </ThemedCard.Header>

  <ThemedCard.Content>
    {/* Contenido principal */}
  </ThemedCard.Content>

  <ThemedCard.Footer className="flex justify-end gap-3">
    {/* Acciones opcionales */}
  </ThemedCard.Footer>
</ThemedCard>
```

### Variantes de Cards

```tsx
// Card standard
<ThemedCard>

// Card con hover
<ThemedCard className="hover:border-[var(--theme-border-active)] transition-colors cursor-pointer">

// Card clickeable
<ThemedCard className="hover:bg-[var(--theme-bg-tertiary)] cursor-pointer">

// Card de destaque
<ThemedCard className="border-2 border-purple-500/30">
```

### Padding de Cards

```tsx
// Compacto
<ThemedCard className="p-4">

// Standard ⭐ MÁS USADO
<ThemedCard className="p-6">

// Espacioso
<ThemedCard className="p-8">

// Sin padding (control manual)
<ThemedCard className="p-0">
  <div className="p-6">Contenido</div>
</ThemedCard>
```

---

## 🔘 BOTONES

### Variantes de Botones

```tsx
import { Button } from '@/components/ui'

{/* 🟣 PRIMARY - Acción principal */}
<Button>
  Acción Principal
</Button>

{/* ⚪ OUTLINE - Acción secundaria */}
<Button variant="outline">
  Acción Secundaria
</Button>

{/* 👻 GHOST - Acción terciaria */}
<Button variant="ghost">
  Acción Terciaria
</Button>

{/* 🔴 DESTRUCTIVE - Acciones peligrosas */}
<Button variant="destructive">
  Eliminar
</Button>

{/* 🔗 LINK - Como enlace */}
<Button variant="link">
  Ver más
</Button>
```

### Tamaños de Botones

```tsx
// Pequeño
<Button size="sm" className="h-8 px-3 text-xs">
  Pequeño
</Button>

// Standard ⭐ MÁS USADO
<Button size="default" className="h-10 px-6">
  Standard
</Button>

// Grande
<Button size="lg" className="h-12 px-8 text-base">
  Grande
</Button>

// Icono solamente
<Button size="icon" className="h-10 w-10">
  <Icon />
</Button>
```

### Botones con Iconos

```tsx
import { Plus, Check, X } from 'lucide-react'

// Icono izquierdo
<Button>
  <Plus className="w-4 h-4 mr-2" />
  Agregar
</Button>

// Icono derecho
<Button>
  Continuar
  <ArrowRight className="w-4 h-4 ml-2" />
</Button>

// Solo icono
<Button size="icon">
  <Plus className="w-4 h-4" />
</Button>
```

### Estados de Botones

```tsx
// Disabled
<Button disabled>
  Deshabilitado
</Button>

// Loading
<Button disabled>
  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
  Cargando...
</Button>

// Con badge
<Button className="relative">
  Notificaciones
  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs">
    3
  </span>
</Button>
```

---

## ✨ EFECTOS VISUALES

### Sombras (Shadows)

```tsx
/* 🌑 SHADOWS */

// Sombra sutil (cards)
className="shadow-sm"  
// box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)

// Sombra standard (modales, dropdowns) ⭐ MÁS USADO
className="shadow-md"
// box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1)

// Sombra grande (floating elements)
className="shadow-lg"
// box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1)

// Sombra extra grande (overlays)
className="shadow-2xl"
// box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25)

// Sin sombra
className="shadow-none"
```

### Blur y Backdrop

```tsx
// Blur standard
className="backdrop-blur-sm"  // 4px
className="backdrop-blur-md"  // 12px ⭐
className="backdrop-blur-lg"  // 16px

// Glass effect (frosted glass)
className="backdrop-blur-md bg-white/10 border border-white/20"
```

### Opacidad

```tsx
// Texto deshabilitado
className="opacity-50"

// Hover effects
className="hover:opacity-80"

// Overlay backgrounds
className="bg-black/80"  // 80% opacidad
className="bg-white/10"  // 10% opacidad
```

### Transiciones

```tsx
/* ⚡ TRANSITIONS */

// Transición standard (hover, focus) ⭐ MÁS USADO
className="transition-colors duration-200"

// Transición suave
className="transition-all duration-300 ease-in-out"

// Transform transitions
className="transition-transform duration-200 hover:scale-105"

// Multiple properties
className="transition-[background-color,border-color,color] duration-200"
```

### Animaciones

```tsx
// Spin (loading)
className="animate-spin"

// Pulse (notifications)
className="animate-pulse"

// Bounce (alerts)
className="animate-bounce"

// Fade in
className="animate-in fade-in duration-200"

// Slide in
className="animate-in slide-in-from-bottom duration-300"
```

---

## 🎭 FONDOS Y TEXTURAS

### Fondos Sólidos

```tsx
// Fondos principales (dark theme)
className="bg-[var(--theme-bg-primary)]"    // #0b141a
className="bg-[var(--theme-bg-secondary)]"  // #111b21
className="bg-[var(--theme-bg-tertiary)]"   // #202c33
```

### Gradientes

```tsx
/* 🌈 GRADIENTS */

// Gradient de marca (purple to cyan)
className="bg-gradient-to-r from-purple-600 to-cyan-500"

// Text gradient
className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent"

// Gradient overlay
<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

// Gradient button
className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600"
```

### Patrones y Texturas

```tsx
// Grid pattern (subtle)
<div className="bg-[url('/grid.svg')] opacity-5" />

// Dot pattern
className="bg-[radial-gradient(circle,rgba(147,51,234,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"

// Noise texture (add realness)
className="bg-[url('/noise.png')] opacity-[0.02]"
```

### Overlays

```tsx
// Dark overlay
className="absolute inset-0 bg-black/60"

// Blur overlay
className="absolute inset-0 backdrop-blur-sm bg-black/40"

// Gradient overlay (para heros)
className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black"
```

---

## 📱 RESPONSIVE BREAKPOINTS

### Breakpoints Standard

```tsx
/* 📱 BREAKPOINTS */
sm: 640px   // Tablets pequeñas
md: 768px   // Tablets
lg: 1024px  // Desktop pequeño ⭐ REFERENCIA PRINCIPAL
xl: 1280px  // Desktop
2xl: 1536px // Desktop grande
```

### Patrones Responsive

```tsx
/* 📱 MOBILE-FIRST APPROACH */

// Layout stacking
<div className="flex flex-col lg:flex-row gap-6">

// Grid responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Padding responsive
<section className="p-4 md:p-6 lg:p-8">

// Text sizing responsive
<h1 className="text-2xl md:text-3xl lg:text-4xl">

// Visibility responsive
<div className="hidden lg:block">  // Solo visible en desktop
<div className="lg:hidden">        // Solo visible en mobile

// Width responsive
<div className="w-full lg:w-1/2">
```

### Container Widths

```tsx
// Container standard
<div className="container mx-auto px-4 max-w-7xl">

// Container sizes
className="max-w-sm"   // 384px - Forms estrechos
className="max-w-md"   // 448px - Forms standard
className="max-w-lg"   // 512px - Cards anchas
className="max-w-xl"   // 576px - Content width
className="max-w-2xl"  // 672px - Article width
className="max-w-4xl"  // 896px - Dashboard
className="max-w-6xl"  // 1152px - Wide layouts
className="max-w-7xl"  // 1280px - Full app ⭐ MÁS USADO
```

---

## 🎯 COMPONENTES COMUNES

### Input Fields

```tsx
<Input 
  className="h-10 px-4 rounded-md bg-[var(--theme-bg-input)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-tertiary)] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
  placeholder="Escribe algo..."
/>
```

### Textarea

```tsx
<Textarea 
  className="min-h-[100px] px-4 py-3 rounded-md bg-[var(--theme-bg-input)] border border-[var(--theme-border)] resize-none"
  placeholder="Descripción..."
/>
```

### Select / Dropdown

```tsx
<Select>
  <SelectTrigger className="h-10 px-4 rounded-md bg-[var(--theme-bg-input)] border border-[var(--theme-border)]">
    <SelectValue placeholder="Selecciona..." />
  </SelectTrigger>
  <SelectContent className="bg-[var(--theme-bg-secondary)] border border-[var(--theme-border)]">
    <SelectItem value="1">Opción 1</SelectItem>
    <SelectItem value="2">Opción 2</SelectItem>
  </SelectContent>
</Select>
```

### Avatar

```tsx
<Avatar className="w-10 h-10 rounded-full border-2 border-[var(--theme-border)]">
  <AvatarImage src="/avatar.jpg" />
  <AvatarFallback className="bg-purple-600 text-white text-sm font-medium">
    JD
  </AvatarFallback>
</Avatar>
```

### Badge

```tsx
// Status badges
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
  Activo
</span>

<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
  Completado
</span>

<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30">
  Pendiente
</span>
```

### Skeleton Loading

```tsx
<div className="space-y-3">
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
</div>
```

---

## 📦 LAYOUT PATTERNS

### Page Layout

```tsx
<div className="min-h-screen bg-[var(--theme-bg-primary)]">
  {/* Header fijo */}
  <header className="sticky top-0 z-50 bg-[var(--theme-bg-secondary)] border-b border-[var(--theme-border)]">
    {/* ... */}
  </header>

  {/* Main content */}
  <main className="container mx-auto px-4 py-6 max-w-7xl">
    {/* ... */}
  </main>

  {/* Footer opcional */}
  <footer className="border-t border-[var(--theme-border)] bg-[var(--theme-bg-secondary)] py-8">
    {/* ... */}
  </footer>
</div>
```

### Two Column Layout

```tsx
<div className="grid lg:grid-cols-[300px_1fr] gap-6">
  {/* Sidebar */}
  <aside className="hidden lg:block">
    {/* Navigation */}
  </aside>

  {/* Main content */}
  <div>
    {/* Content */}
  </div>
</div>
```

### Three Column Layout

```tsx
<div className="grid lg:grid-cols-[250px_1fr_300px] gap-6">
  {/* Left sidebar */}
  <aside className="hidden lg:block">
    {/* Navigation */}
  </aside>

  {/* Main content */}
  <main>
    {/* Content */}
  </main>

  {/* Right sidebar */}
  <aside className="hidden xl:block">
    {/* Extra info */}
  </aside>
</div>
```

---

## 🎨 ORDEN DE CLASES TAILWIND

**SIEMPRE seguir este orden para mantener consistencia:**

```tsx
<div className={cn(
  // 1️⃣ Layout & Display
  'flex items-center justify-between',
  'relative',
  
  // 2️⃣ Sizing
  'h-12 w-full',
  'min-w-0 max-w-7xl',
  
  // 3️⃣ Spacing
  'p-6 px-4 py-3',
  'gap-4',
  'mt-4 mb-6',
  
  // 4️⃣ Typography
  'text-base font-medium',
  'text-[var(--theme-text-primary)]',
  
  // 5️⃣ Background & Border
  'bg-[var(--theme-bg-secondary)]',
  'border border-[var(--theme-border)]',
  'rounded-lg',
  
  // 6️⃣ Effects
  'shadow-md',
  'opacity-100',
  
  // 7️⃣ Transitions
  'transition-colors duration-200',
  
  // 8️⃣ States (hover, focus, active)
  'hover:bg-[var(--theme-bg-tertiary)]',
  'focus:ring-2 focus:ring-purple-500',
  'active:scale-95',
  
  // 9️⃣ Responsive
  'sm:flex-row',
  'lg:w-auto',
  'xl:max-w-4xl',
  
  // 🔟 Conditional classes
  isActive && 'ring-2 ring-purple-500',
  className
)} />
```

---

## 🔍 QUICK REFERENCE

### Componentes UI Disponibles

```typescript
// Import desde @/components/ui
import {
  Button,
  Input,
  Textarea,
  Select,
  Dialog,
  Card,
  Avatar,
  Badge,
  Skeleton,
  Alert,
  Toast,
  // ... y más
} from '@/components/ui'
```

### Variables CSS Principales

```css
/* Úsalas con var(--nombre) o [var(--nombre)] en Tailwind */
--theme-bg-primary
--theme-bg-secondary
--theme-bg-tertiary
--theme-bg-input
--theme-border
--theme-text-primary
--theme-text-secondary
--theme-text-tertiary
--primary
--secondary
```

### Documentos Relacionados

- [STANDARDS.md](./STANDARDS.md) - Estándares de código
- [tailwind.config.ts](./apps/web/tailwind.config.ts) - Configuración de Tailwind
- [globals.css](./apps/web/src/app/globals.css) - Variables CSS globales
- [components/ui/](./apps/web/src/components/ui/) - Componentes UI primitivos

---

**📌 REGLA DE ORO:**

> **"Si no está aquí, no lo uses. Si lo usas, agrégalo aquí."**

Mantén esta guía actualizada cuando crees nuevos patrones visuales. La consistencia es clave.

---

**Última actualización:** 30 Enero 2026  
**Mantenido por:** Equipo Quoorum  
**Versión:** 1.0.0
