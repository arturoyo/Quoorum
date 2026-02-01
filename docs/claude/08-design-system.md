# 🎨 Design System 2026-27

> **REGLA CRÍTICA:** SIEMPRE usar variables CSS de tema. NUNCA hardcodear colores.

---

## 🚨 PROBLEMA COMÚN

```typescript
// ❌ FALLA en light mode - Texto invisible
<div className="bg-white/5 text-white border-white/10">
  <p className="text-gray-400">Texto</p>
</div>

// ✅ Funciona en light Y dark mode
<div className="bg-[var(--theme-landing-card)] text-[var(--theme-text-primary)] border-[var(--theme-landing-border)]">
  <p className="text-[var(--theme-text-secondary)]">Texto</p>
</div>
```

---

## 📐 VARIABLES CSS OFICIALES

### Texto

```css
--theme-text-primary       /* Títulos, texto principal */
--theme-text-secondary     /* Descripciones, subtítulos */
--theme-text-tertiary      /* Placeholders, texto menor */
```

### Fondos

```css
--theme-bg-primary         /* Body, contenedores principales */
--theme-bg-secondary       /* Cards grandes */
--theme-bg-tertiary        /* Headers, subsecciones */
--theme-bg-input           /* Inputs, textareas, controles */
```

### Landing Page

```css
--theme-landing-bg         /* Fondo principal landing */
--theme-landing-card       /* Cards en landing */
--theme-landing-border     /* Bordes en landing */
```

### Bordes

```css
--theme-border             /* TODOS los bordes */
```

---

## 🧩 SNIPPETS DE COPIAR-PEGAR

### Input / Textarea

```typescript
<Input
  className="bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-tertiary)]"
/>

<Textarea
  className="bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-tertiary)] min-h-[100px]"
/>
```

### Buttons

```typescript
// Primario (acción principal)
<Button className="bg-purple-600 hover:bg-purple-700 text-white">
  Acción Principal
</Button>

// Secundario (opciones)
<Button
  variant="outline"
  className="border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)] hover:bg-purple-600"
>
  Opción
</Button>
```

### Cards

```typescript
<Card className="bg-[var(--theme-bg-secondary)] border-[var(--theme-border)]">
  <CardHeader className="bg-[var(--theme-bg-tertiary)]">
    <CardTitle className="text-[var(--theme-text-primary)]">Título</CardTitle>
    <CardDescription className="text-[var(--theme-text-secondary)]">
      Descripción
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* Contenido */}
  </CardContent>
</Card>
```

### Labels

```typescript
<Label className="text-[var(--theme-text-secondary)]">
  Etiqueta del campo
</Label>
```

### Radio Group

```typescript
<RadioGroupItem value="option" id="option" className="peer sr-only" />
<Label
  htmlFor="option"
  className="flex items-center p-3 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-secondary)] cursor-pointer peer-data-[state=checked]:border-purple-500 peer-data-[state=checked]:bg-purple-500/20 text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-tertiary)] transition-colors"
>
  Opción
</Label>
```

### File Upload / Drag & Drop

```typescript
<div
  className={cn(
    "cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-colors",
    isDragging
      ? "border-purple-500 bg-purple-900/20"
      : "border-[var(--theme-border)] hover:border-purple-500/50"
  )}
>
  <Upload className="mx-auto mb-2 h-6 w-6 text-[var(--theme-text-secondary)]" />
  <p className="text-sm text-[var(--theme-text-secondary)]">
    Arrastra documentos aquí
  </p>
  <p className="text-xs text-[var(--theme-text-tertiary)] mt-1">
    PDF, DOC, TXT (opcional)
  </p>
</div>
```

---

## ❌ COLORES PROHIBIDOS

**NUNCA uses estos en código:**

```typescript
// ❌ PROHIBIDO
text-white
text-gray-400
text-gray-300
text-gray-500
text-gray-600
bg-white/5
bg-white/10
border-white/10
border-white/20

// ✅ USA EN SU LUGAR
text-[var(--theme-text-primary)]
text-[var(--theme-text-secondary)]
text-[var(--theme-text-tertiary)]
bg-[var(--theme-landing-card)]
border-[var(--theme-border)]
```

---

## 🎨 COLORES DE ACENTO (Purple Theme)

**Estos SÍ se pueden usar directamente:**

```typescript
// ✅ Botones primarios
bg-purple-600 hover:bg-purple-700 text-white

// ✅ Iconos destacados
text-purple-400

// ✅ Fondos de acento
bg-purple-600

// ✅ Focus ring
focus-visible:ring-purple-500 focus-visible:border-purple-500

// ✅ Bordes activos
border-purple-500
```

---

## ✅ CHECKLIST ANTES DE COMMIT

Antes de hacer commit de cualquier cambio de UI:

- [ ] ¿Todos los colores usan variables de tema?
- [ ] ¿NO hay `text-white`, `text-gray-*` hardcodeados?
- [ ] ¿NO hay `bg-white/*` hardcodeados?
- [ ] ¿NO hay `border-white/*` hardcodeados?
- [ ] ¿Los inputs usan variables de tema?
- [ ] ¿Los botones primarios son `bg-purple-600`?
- [ ] ¿Los botones secundarios usan variables de tema?
- [ ] ¿Verificado visualmente en light Y dark mode?

---

## 🚨 ERRORES COMUNES

### Error 1: Usar clases genéricas de Tailwind

```typescript
// ❌ MAL
className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"

// ✅ BIEN
className="bg-[var(--theme-bg-secondary)] text-[var(--theme-text-primary)]"
```

### Error 2: No especificar color de texto en inputs

```typescript
// ❌ MAL - Texto negro por defecto (ilegible)
<Input className="bg-[var(--theme-bg-input)]" />

// ✅ BIEN
<Input className="bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)]" />
```

### Error 3: Botones sin colores explícitos

```typescript
// ❌ MAL - Fondo blanco por defecto
<Button>Acción</Button>

// ✅ BIEN
<Button className="bg-purple-600 hover:bg-purple-700 text-white">Acción</Button>
```

---

## 📋 STATUS BADGES - Dark Theme

```typescript
const statusColors = {
  active: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  paused: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  completed: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
  error: "bg-red-500/20 text-red-300 border border-red-500/30",
}
```

---

## 🎬 PATRONES DE ANIMACIÓN

```typescript
// Cards con hover
<div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-secondary)] p-4 transition-all duration-300 hover:border-purple-500/40">

// Botones con glow
<Button className="relative group overflow-hidden bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500">
  <span className="relative z-10">Acción</span>
</Button>

// Links y acciones
<button className="text-purple-400 hover:text-purple-300 transition-colors">

// Durations estándar
transition-all duration-200  // Rápido
transition-all duration-300  // Normal
transition-all duration-500  // Lento
```

---

## 🔮 GLASSMORPHISM

```typescript
// Card con glassmorphism
<div className="rounded-lg border border-purple-500/20 bg-slate-900/60 backdrop-blur-sm p-4">

// Panel lateral
<aside className="bg-[var(--theme-bg-secondary)]/80 backdrop-blur-xl border-l border-[var(--theme-border)]">

// Modal/Dialog
<div className="bg-[var(--theme-bg-secondary)] border border-purple-500/20 backdrop-blur-xl rounded-2xl">
```

---

## 📐 RESPONSIVE GRID PATTERNS

```typescript
// Bento grid para features
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

// Layout con sidebar
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <main className="lg:col-span-2">...</main>
  <aside className="lg:col-span-1">...</aside>
</div>

// Cards de stats
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
```

---

## 📁 ARCHIVOS DE REFERENCIA

| Archivo | Propósito |
|---------|-----------|
| `apps/web/tailwind.config.ts` | Config Tailwind + paleta quoorum |
| `apps/web/src/app/globals.css` | CSS global, variables de tema |
| `apps/web/src/app/page.tsx` | Landing (777 líneas) - patrones completos |
| `apps/web/src/app/dashboard/page.tsx` | Dashboard - stats grid |
| `packages/ui/src/components/` | Componentes UI compartidos |

---

## 🏷️ LOGO - TAMAÑOS ESTÁNDAR

**Componente:** `QuoorumLogo` (en `apps/web/src/components/ui/quoorum-logo.tsx`)

### Tamaños Oficiales

| Contexto | Tamaño | Uso |
|----------|--------|-----|
| **Navbar/Header** | 40px | Logo principal en navegación |
| **Sidebar/Menu** | 32px | Logo en paneles laterales |
| **Cards/Modales** | 48px | Logo destacado en contenido |
| **Iconografía** | 24px | Logo en contextos pequeños (settings, botones) |
| **Footer** | 56px | Logo en pie de página |

### Uso

```typescript
// ✅ Navbar
<QuoorumLogo size={40} showGradient={true} />

// ✅ Sidebar
<QuoorumLogo size={32} showGradient={true} />

// ✅ Cards prominentes
<QuoorumLogo size={48} showGradient={true} className="mx-auto mb-4" />

// ✅ Contextos pequeños
<QuoorumLogo size={24} showGradient={true} />

// ✅ Sin gradiente (fondo claro o necesidad de contraste)
<QuoorumLogo size={40} showGradient={false} />
```

### Props

```typescript
interface QuoorumLogoProps {
  className?: string;        // Clases Tailwind adicionales
  size?: number;             // Tamaño en pixels (default: 40)
  showGradient?: boolean;    // Mostrar logo con gradiente (default: true)
}
```

---

## 💡 MANTRA DEL EQUIPO

```
"Si no está en la paleta oficial, no lo uses.
Si el texto no es visible, está mal.
Si los botones son blancos, está mal.
Verificar SIEMPRE en modo oscuro."
```

---

_Ver documentación completa en [CLAUDE.md](../../CLAUDE.md#13--uxdesign-paleta-de-colores-y-estilos-oficiales)_
