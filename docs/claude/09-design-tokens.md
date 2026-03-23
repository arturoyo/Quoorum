# 🎨 Design Tokens System (Centralizado)

> **TODO ESTÁ EN CSS VARIABLES**
> Un único sistema centralizado en `apps/web/src/app/globals.css`
> Cambia de tema automáticamente (light/dark mode)

---

## 📦 SISTEMA CENTRALIZADO

Todos los valores visuales están definidos como **CSS Variables** en:
- **Archivo**: `apps/web/src/app/globals.css`
- **Temas**: Light (defecto) + Dark (clase `.dark`)
- **Reutilización**: Todas las variables se heredan automáticamente

---

## 🎨 TOKENS DISPONIBLES

### 1. TIPOGRAFÍA (Typography)

```css
/* Familias */
--font-family-base   /* -apple-system, BlinkMacSystemFont, "Segoe UI"... */
--font-family-mono   /* "Monaco", "Courier New" */

/* Tamaños */
--font-size-xs       /* 12px - Muy pequeño (helpers, labels) */
--font-size-sm       /* 14px - Pequeño (descripciones, subtítulos) */
--font-size-base     /* 16px - Base (párrafos, contenido) */
--font-size-lg       /* 18px - Grande (títulos secundarios) */
--font-size-xl       /* 20px - Muy grande */
--font-size-2xl      /* 24px - Títulos principales */
--font-size-3xl      /* 30px - Títulos grandes */
--font-size-4xl      /* 36px - Títulos muy grandes */
--font-size-5xl      /* 48px - Títulos gigantes (hero section) */

/* Pesos */
--font-weight-normal    /* 400 - Texto normal */
--font-weight-medium    /* 500 - Énfasis leve */
--font-weight-semibold  /* 600 - Títulos, resaltes */
--font-weight-bold      /* 700 - Títulos principales */

/* Alto de línea */
--line-height-tight     /* 1.2  - Títulos compactos */
--line-height-snug      /* 1.375 - Subtítulos */
--line-height-normal    /* 1.5  - Párrafos (recomendado) */
--line-height-relaxed   /* 1.625 - Párrafos largos */
--line-height-loose     /* 2    - Espaciado generoso */
```

#### Uso

```typescript
// ✅ Título primario
<h1 style={{
  fontSize: 'var(--font-size-4xl)',
  fontWeight: 'var(--font-weight-bold)',
  lineHeight: 'var(--line-height-tight)',
  fontFamily: 'var(--font-family-base)'
}}>
  Título
</h1>

// ✅ Párrafo
<p style={{
  fontSize: 'var(--font-size-base)',
  fontWeight: 'var(--font-weight-normal)',
  lineHeight: 'var(--line-height-normal)'
}}>
  Texto de párrafo
</p>

// ✅ Helper text
<span style={{
  fontSize: 'var(--font-size-xs)',
  color: 'var(--theme-text-tertiary)'
}}>
  Texto pequeño
</span>
```

---

### 2. ESPACIADO (Spacing)

```css
--spacing-xs    /* 4px   - Muy pequeño (inner padding de botones) */
--spacing-sm    /* 8px   - Pequeño (padding de items, gaps) */
--spacing-md    /* 16px  - Estándar (padding de cards, componentes) */
--spacing-lg    /* 24px  - Grande (margin entre secciones) */
--spacing-xl    /* 32px  - Muy grande (margin entre bloques principales) */
--spacing-2xl   /* 48px  - Enorme (distancia entre secciones principales) */
--spacing-3xl   /* 64px  - Gigante (hero sections) */
```

#### Tabla de Referencia

| Variable | Valor | Uso |
|----------|-------|-----|
| `--spacing-xs` | 4px | Padding interno botones pequeños |
| `--spacing-sm` | 8px | Gap en listas, padding items |
| `--spacing-md` | 16px | Padding cards, inputs, espacios estándar |
| `--spacing-lg` | 24px | Margin entre secciones, padding headers |
| `--spacing-xl` | 32px | Margin grandes, separación de bloques |
| `--spacing-2xl` | 48px | Distancia entre secciones grandes |
| `--spacing-3xl` | 64px | Hero sections, espacios muy grandes |

#### Uso

```typescript
// ✅ Padding de card
<div style={{ padding: 'var(--spacing-md)' }}>

// ✅ Gap en grid
<div style={{ gap: 'var(--spacing-lg)' }}>

// ✅ Margin entre secciones
<section style={{ marginBottom: 'var(--spacing-2xl)' }}>

// ✅ Con Tailwind (recomendado)
<div className="p-[var(--spacing-md)] gap-[var(--spacing-lg)]">
```

---

### 3. BORDER RADIUS

```css
--radius-none   /* 0px    - Sin redondeo */
--radius-sm     /* 4px    - Ligeramente redondeado */
--radius-md     /* 8px    - Estándar (inputs, botones) */
--radius-lg     /* 12px   - Cards, modales */
--radius-xl     /* 16px   - Componentes grandes */
--radius-2xl    /* 24px   - Elementos prominentes */
--radius-full   /* 9999px - Completamente redondo (badges, avatares) */
```

#### Tabla de Referencia

| Variable | Valor | Uso |
|----------|-------|-----|
| `--radius-none` | 0px | Elementos cuadrados |
| `--radius-sm` | 4px | Inputs pequeños, chips |
| `--radius-md` | 8px | Inputs estándar, botones |
| `--radius-lg` | 12px | Cards, popovers |
| `--radius-xl` | 16px | Modales, componentes grandes |
| `--radius-2xl` | 24px | Elementos muy prominentes |
| `--radius-full` | 9999px | Avatares, badges redondos |

#### Uso

```typescript
// ✅ Input estándar
<input className="rounded-[var(--radius-md)]" />

// ✅ Card
<div className="rounded-[var(--radius-lg)]">

// ✅ Avatar redondo
<img className="rounded-[var(--radius-full)] w-10 h-10" />
```

---

### 4. SOMBRAS (Shadows)

```css
/* Light Theme */
--shadow-xs     /* Muy sutil (hover states) */
--shadow-sm     /* Sutil (cards básicas) */
--shadow-md     /* Normal (elevated elements) */
--shadow-lg     /* Grande (popovers, tooltips) */
--shadow-xl     /* Muy grande (modales) */
--shadow-2xl    /* Enorme (full-screen modales) */
--shadow-inner  /* Sombra interna (pressed states) */

/* Dark Theme - automáticamente más oscuras */
```

#### Tabla de Referencia

| Variable | Caso de Uso |
|----------|------------|
| `--shadow-xs` | Botones en hover, estados iniciales |
| `--shadow-sm` | Cards simples, elementos básicos |
| `--shadow-md` | Elementos elevados, cards interactivas |
| `--shadow-lg` | Popovers, tooltips, dropdowns |
| `--shadow-xl` | Modales, diálogos |
| `--shadow-2xl` | Full-screen modales, overlays |
| `--shadow-inner` | Estados presionados, inputs activos |

#### Uso

```typescript
// ✅ Card con sombra estándar
<div className="shadow-[var(--shadow-md)]">

// ✅ Modal con sombra grande
<dialog className="shadow-[var(--shadow-xl)]">

// ✅ Efecto inpresionado
<button className="active:shadow-[var(--shadow-inner)]">
```

---

### 5. TRANSICIONES (Animations)

```css
--transition-fast    /* 150ms - Interacciones rápidas (hover, focus) */
--transition-normal  /* 300ms - Estándar (cambios de estado) */
--transition-slow    /* 500ms - Animaciones lentas (modales) */
```

#### Uso

```typescript
// ✅ Hover rápido
<div style={{
  transition: `background-color var(--transition-fast) ease`
}}>

// ✅ Cambio de estado
<button className="transition-all duration-300">

// ✅ Modal que entra lentamente
<dialog className="transition-opacity duration-500">
```

---

### 6. COLORES - TEMAS (Theme Colors)

#### Fondos

```css
/* Hierarchy de colores de fondo */
--theme-bg-primary    /* Principal (body background) */
--theme-bg-secondary  /* Cards, paneles */
--theme-bg-tertiary   /* Headers, subsecciones */
--theme-bg-input      /* Inputs, textareas, controles */
```

#### Bordes

```css
--theme-border        /* Bordes estándar (SIEMPRE usar esto) */
--theme-border-subtle /* Bordes muy tenues (backgrounds leves) */
--theme-border-active /* Bordes al interactuar */
```

#### Texto

```css
--theme-text-primary    /* Texto principal (títulos, párrafos) */
--theme-text-secondary  /* Descripciones, subtítulos */
--theme-text-tertiary   /* Placeholders, textos menores */
--theme-text-muted      /* Texto muy tenue */
--theme-text-inverted   /* Texto invertido (en botones oscuros) */
```

#### Landing Page

```css
--theme-landing-bg              /* Fondo landing */
--theme-landing-bg-alt          /* Fondo alternativo */
--theme-landing-card            /* Cards en landing */
--theme-landing-card-hover      /* Cards en hover */
--theme-landing-border          /* Bordes landing */
--theme-landing-border-hover    /* Bordes al hover */
--theme-landing-glow            /* Efecto glow */
--theme-landing-glass           /* Glassmorphism background */
--theme-landing-glass-border    /* Glassmorphism border */
--theme-landing-grid            /* Patrón grid */
--theme-gradient-text-from      /* Gradiente texto (desde) */
--theme-gradient-text-to        /* Gradiente texto (hasta) */
```

#### Colores de Acento (SIEMPRE directos, no variables)

```typescript
// ✅ Estos SÍ se usan directamente
bg-purple-600         /* Botones primarios */
bg-purple-500         /* Hover buttons */
text-purple-400       /* Iconos destacados */
border-purple-500     /* Bordes activos */

// ❌ NUNCA hardcodear otros colores
text-white            /* ❌ MAL */
bg-white/5            /* ❌ MAL */
border-white/10       /* ❌ MAL */
```

#### Uso

```typescript
// ✅ CORRECTO - Usar variables de tema
<Card className="bg-[var(--theme-bg-secondary)] border-[var(--theme-border)]">
  <p className="text-[var(--theme-text-primary)]">Contenido</p>
  <p className="text-[var(--theme-text-secondary)]">Descripción</p>
</Card>

// ❌ INCORRECTO - Hardcodear colores
<Card className="bg-white/5 border-white/10 text-white">
  <p className="text-gray-400">Contenido</p>
</Card>
```

---

## 🧩 CÓMO CREAR COMPONENTES REUTILIZABLES

### Paso 1: Define el componente con variables CSS

```typescript
// ✅ BIEN - Usa variables de tema
export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-lg)] bg-[var(--theme-bg-secondary)] border border-[var(--theme-border)] p-[var(--spacing-md)] shadow-[var(--shadow-sm)]">
      {children}
    </div>
  )
}
```

### Paso 2: Usa el componente en cualquier lugar

```typescript
// Automáticamente se adapta al tema (light/dark)
<Card>
  <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)' }}>
    Título
  </h2>
  <p style={{ color: 'var(--theme-text-secondary)' }}>
    Descripción
  </p>
</Card>
```

### Paso 3: El componente funciona en ambos temas

- **Light mode**: Automáticamente colores claros
- **Dark mode**: Automáticamente colores oscuros

---

## 📋 COMPONENTES REUTILIZABLES RECOMENDADOS

### Botones

```typescript
// ✅ Primario
<button className="bg-purple-600 hover:bg-purple-700 text-white px-[var(--spacing-md)] py-[var(--spacing-sm)] rounded-[var(--radius-md)] transition-colors duration-[var(--transition-fast)]">
  Acción Principal
</button>

// ✅ Secundario
<button className="bg-[var(--theme-bg-secondary)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] px-[var(--spacing-md)] py-[var(--spacing-sm)] rounded-[var(--radius-md)] hover:bg-[var(--theme-bg-tertiary)] transition-colors duration-[var(--transition-fast)]">
  Opción Secundaria
</button>

// ✅ Peligroso
<button className="bg-red-500 hover:bg-red-600 text-white px-[var(--spacing-md)] py-[var(--spacing-sm)] rounded-[var(--radius-md)]">
  Eliminar
</button>
```

### Inputs

```typescript
// ✅ Input estándar
<input 
  className="bg-[var(--theme-bg-input)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-tertiary)] px-[var(--spacing-md)] py-[var(--spacing-sm)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-[var(--transition-fast)]"
  placeholder="Escribe algo..."
/>
```

### Badges

```typescript
// ✅ Estado activo
<span className="inline-flex items-center px-[var(--spacing-sm)] py-[var(--spacing-xs)] rounded-[var(--radius-full)] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[var(--font-size-xs)] font-[var(--font-weight-medium)]">
  Activo
</span>

// ✅ Estado inactivo
<span className="inline-flex items-center px-[var(--spacing-sm)] py-[var(--spacing-xs)] rounded-[var(--radius-full)] bg-[var(--theme-bg-tertiary)] text-[var(--theme-text-secondary)] text-[var(--font-size-xs)] font-[var(--font-weight-medium)]">
  Inactivo
</span>
```

---

## 🎯 CHECKLIST PARA NUEVOS COMPONENTES

- [ ] ¿Usa `--font-size-*` en lugar de hardcodear tamaños?
- [ ] ¿Usa `--spacing-*` para padding/margin?
- [ ] ¿Usa `--radius-*` para border-radius?
- [ ] ¿Usa `--theme-*` para colores (excepto purple)?
- [ ] ¿Usa `--transition-*` para animaciones?
- [ ] ¿Usa `--shadow-*` para sombras?
- [ ] ¿Se ve bien en light AND dark mode?
- [ ] ¿Es reutilizable en otros lugares?
- [ ] ¿Está documentado en algún lado?

---

## 📁 REFERENCIA

- **Variables CSS**: `apps/web/src/app/globals.css`
- **Documentación anterior**: [08-design-system.md](./08-design-system.md)
- **Componentes UI**: `packages/ui/src/components/`
- **Ejemplos de uso**: `apps/web/src/app/page.tsx`

---

_Próximos pasos: Crear biblioteca de componentes reutilizables que usen TODAS estas variables._
