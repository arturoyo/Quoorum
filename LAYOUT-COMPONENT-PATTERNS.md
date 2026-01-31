# Patrón de Componentes de Layout - AppShell

## Principio Fundamental

**Única Fuente de Verdad para Header/Footer**

El header (`AppHeader`) y footer (`AppFooter`) deben existir en **UN SOLO LUGAR** en la jerarquía de componentes. Esto previene duplicación, inconsistencias y errores de z-index/padding.

---

## Patrón Recomendado: Usar `AppShell`

### ¿Qué es AppShell?

`AppShell` es un componente wrapper que encapsula:
- `AppHeader` (fixed, z-50, h-16)
- `AppFooter` (fixed, z-40)
- Padding automático (pt-16 pb-16)
- Fondo animado opcional

### Uso Básico

```tsx
import { AppShell } from '@/components/layout'

export default function MyPage() {
  return (
    <AppShell>
      <div className="container mx-auto px-4">
        {/* Tu contenido va aquí */}
      </div>
    </AppShell>
  )
}
```

### Con Props Avanzadas

```tsx
<AppShell
  showGradient={true}                    // Mostrar fondo animado (default: true)
  className="custom-class"                // Clases CSS adicionales
  headerProps={{                          // Props para pasar a AppHeader
    variant: "app",
    onSettingsOpen: () => { ... }
  }}
>
  {/* contenido */}
</AppShell>
```

---

## Estructura Interna de AppShell

```
AppShell (flex, min-h-screen, pt-0 pb-0)
├── Fondo animado (fixed, -z-10)
├── AppHeader (fixed, top-0, z-50, h-16)
├── <main> (flex-1, pt-16, pb-16, overflow-hidden)
│   └── {children} ← Tu contenido va aquí
└── AppFooter (fixed, bottom-0, z-40)
```

**Notas:**
- `main` tiene `pt-16 pb-16` para reservar espacio para header/footer
- Header/footer son `fixed`, así que no ocupan espacio en el flujo
- El padding evita que contenido scroll por debajo de ellos

---

## Layouts Complejos (Cuando NO usar AppShell)

### Situación: Layouts con Sidebar, Múltiples Columnas, etc.

Si necesitas un layout especial (como admin con sidebar), puedes:

**Opción A: Usar AppShell + tu layout interno**
```tsx
<AppShell>
  <div className="flex flex-1">
    <Sidebar />
    <MainContent />
  </div>
</AppShell>
```

**Opción B: Mantener estructura manual (si es muy complejo)**
```tsx
<div className="min-h-screen">
  <AppHeader variant="app" />
  <div className="flex pt-16 pb-16">
    <Sidebar />
    <MainContent />
  </div>
  <AppFooter />
</div>
```

**Importante:** Si usas Opción B, DEBES:
- ✅ Incluir `pt-16 pb-16` en el contenedor principal
- ✅ Usar `AppHeader` + `AppFooter` directamente
- ✅ Asegurar z-index coherente (header z-50, footer z-40)

---

## Checklist de Implementación

### Para Nuevas Páginas/Layouts

- [ ] Importar `AppShell` de `@/components/layout`
- [ ] Envolver contenido en `<AppShell>`
- [ ] Remover importes manuales de `AppHeader`/`AppFooter`
- [ ] Remover padding manual (pt-16 pb-16 está en AppShell)
- [ ] Remover `min-h-screen` del contenedor principal (AppShell lo tiene)

### Ejemplo Antes/Después

**ANTES (❌ No hacer así):**
```tsx
import { AppHeader } from '@/components/layout/app-header'
import { AppFooter } from '@/components/layout/app-footer'

export default function Page() {
  return (
    <div className="min-h-screen bg-[var(--theme-bg-primary)]">
      <AppHeader variant="app" />
      <main className="container pt-20 pb-24">
        {/* contenido */}
      </main>
      <AppFooter />
    </div>
  )
}
```

**DESPUÉS (✅ Hacer así):**
```tsx
import { AppShell } from '@/components/layout'

export default function Page() {
  return (
    <AppShell>
      <main className="container px-4">
        {/* contenido */}
      </main>
    </AppShell>
  )
}
```

---

## Espacios de Interés (No Tocables)

### Header (AppHeader, fixed, h-16)
- ✅ Personalizar: Ícono, título, botones auth
- ❌ Cambiar: Altura, z-index, positioning
- ❌ Mover: No debería estar en múltiples layouts

### Footer (AppFooter, fixed, z-40)
- ✅ Personalizar: Links, temas, información
- ❌ Cambiar: Altura, z-index, positioning
- ❌ Mover: Siempre en AppShell o layout root

### Padding (pt-16 pb-16)
- ✅ Personalizar: Padding interno de contenido (pt-4, pb-8, etc.)
- ❌ Cambiar: pt-16 pb-16 son fijos para el layout
- ❌ Usar: pt-20, pt-24, etc. en el contenedor principal

---

## Troubleshooting

### Problema: Contenido se superpone con header/footer

**Causa:** Falta padding `pt-16 pb-16`

**Solución:**
```tsx
// ❌ Mal
<div className="container">
  Content
</div>

// ✅ Bien
<AppShell>
  <div className="container">
    Content
  </div>
</AppShell>
```

### Problema: Sidebar no alinea con header cuando scrollea

**Causa:** Sidebar usa `sticky` en vez de `fixed`

**Solución:**
```tsx
// ❌ Mal
<aside className="sticky top-16">

// ✅ Bien
<aside className="fixed top-16 left-0">
```

### Problema: Footer aparece sobre contenido

**Causa:** Padding `pb` muy pequeño o falta

**Solución:** Asegurar `pb-16` (64px) en contenedor principal

---

## Migración de Layouts Existentes

### Paso 1: Identificar
- Buscar `AppHeader` importado en páginas/layouts
- Buscar dónde se renderiza junto con `AppFooter`

### Paso 2: Refactorizar
```diff
- import { AppHeader } from '@/components/layout/app-header'
- import { AppFooter } from '@/components/layout/app-footer'
+ import { AppShell } from '@/components/layout'

export default function Layout() {
  return (
-   <div className="min-h-screen">
-     <AppHeader variant="app" />
-     <main className="pt-20 pb-16">
+   <AppShell>
+     <main>
        ...
      </main>
-     <AppFooter />
-   </div>
+   </AppShell>
  )
}
```

### Paso 3: Testing
- ✅ Header visible en top
- ✅ Footer visible en bottom
- ✅ Contenido no superpuesto
- ✅ Scroll dentro del área de content
- ✅ Responsivo en mobile

---

## Referencias

- **AppShell:** `apps/web/src/components/layout/app-shell.tsx`
- **Exports:** `apps/web/src/components/layout/index.ts`
- **Header:** `apps/web/src/components/layout/app-header.tsx`
- **Footer:** `apps/web/src/components/layout/app-footer.tsx`

---

**Status:** ✅ Patrón Activo  
**Última Actualización:** Jan 30, 2026  
**Mantenedor:** Sistema de Layout Centralizado
