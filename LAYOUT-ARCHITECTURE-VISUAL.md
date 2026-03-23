# Arquitectura de Layout - Diagrama Visual

## Jerarquía de Componentes

```
RootLayout (apps/web/src/app/layout.tsx)
│
├── Providers (auth, theme, trpc, etc)
│
└── Page/Section Layouts
    │
    ├── [Option A] AppShell (RECOMENDADO)
    │   ├── AppHeader (fixed, z-50)
    │   ├── main (pt-16 pb-16)
    │   │   └── PageContent
    │   └── AppFooter (fixed, z-40)
    │
    ├── [Option B] Manual Layout (para casos complejos)
    │   ├── AppHeader (fixed, z-50)
    │   ├── Content Area (pt-16 pb-16)
    │   │   ├── Sidebar (fixed, z-40, optional)
    │   │   └── MainContent
    │   └── AppFooter (fixed, z-40)
    │
    └── [Legacy] Standalone Page + AppHeader
        └── (debe migrar a AppShell)
```

---

## Estructura Visual del Viewport

```
╔════════════════════════════════════════════════════════════╗
║ AppHeader (fixed top-0, z-50, h-16)                        ║
║ ┌──────────────────────────────────────────────────────┐   ║
║ │ Logo    |    Navigation    |    User Menu    Settings│   ║
║ └──────────────────────────────────────────────────────┘   ║
╠════════════════════════════════════════════════════════════╣
║                                                             ║
║  pt-16 (64px top padding - espacio para header)            ║
║                                                             ║
║  ┌─────────────────────────────────────────────────────┐   ║
║  │                                                      │   ║
║  │     main (flex-1, overflow-hidden)                  │   ║
║  │                                                      │   ║
║  │     {children} - Tu contenido aquí                  │   ║
║  │                                                      │   ║
║  │     (este área scrollea)                            │   ║
║  │                                                      │   ║
║  └─────────────────────────────────────────────────────┘   ║
║                                                             ║
║  pb-16 (64px bottom padding - espacio para footer)         ║
║                                                             ║
╠════════════════════════════════════════════════════════════╣
║ AppFooter (fixed bottom-0, z-40, ~h-16)                    ║
║ ┌──────────────────────────────────────────────────────┐   ║
║ │     Theme Toggle  |  Links  |  Copyright             │   ║
║ └──────────────────────────────────────────────────────┘   ║
╚════════════════════════════════════════════════════════════╝
```

---

## Z-Index Stacking Order (de arriba para abajo)

```
z-50: AppHeader
      ├── Dropdown menus (auth, settings)
      └── Mobile menu overlay

z-40: AppFooter
      └── Sidebar (en layouts complejos)

z-0:  Content area
      ├── Cards
      ├── Dialogs (con z-50 propio)
      └── Modals (con z-50 propio)

-z-10: Background animado (en AppShell)
```

---

## Comparación: Con vs Sin AppShell

### ❌ SIN AppShell (OLD - Evitar)

```tsx
// Muchas líneas boilerplate, fácil de cometer errores

export default function MyPage() {
  return (
    <div className="min-h-screen bg-[var(--theme-bg-primary)]">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div>Gradients...</div>
      </div>

      {/* Header - ¿DÓNDE DEBERÍA ESTAR? */}
      <AppHeader variant="app" />

      {/* Content */}
      <main className="container mx-auto px-4 pt-20 pb-24">
        {/* ¿Padding consistente? No siempre */}
        Content here
      </main>

      {/* Footer - ¿SIEMPRE SE INCLUYE? No siempre */}
      {/* <AppFooter /> */}
    </div>
  )
}
```

**Problemas:**
- ❌ Inconsistencia en padding
- ❌ Header/Footer no siempre incluidos
- ❌ Duplicación de background gradient
- ❌ Fácil olvidar el z-index correcto
- ❌ Boilerplate repetido

### ✅ CON AppShell (NEW - Usar siempre)

```tsx
// Limpio, simple, garantiza consistencia

export default function MyPage() {
  return (
    <AppShell>
      <main className="container mx-auto px-4">
        Content here
      </main>
    </AppShell>
  )
}
```

**Ventajas:**
- ✅ Una sola línea de wrapper
- ✅ Header/Footer garantizados
- ✅ Padding automático correcto
- ✅ Background incluido
- ✅ Z-index manejado
- ✅ Fácil de entender

---

## Casos de Uso Específicos

### 1. Landing Page (Variante "landing")

```tsx
import { AppShell } from '@/components/layout'

export default function LandingPage() {
  return (
    <AppShell headerProps={{ variant: "landing" }}>
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <CTASection />
    </AppShell>
  )
}
```

### 2. Dashboard (Variante "app")

```tsx
import { AppShell } from '@/components/layout'

export default function Dashboard() {
  return (
    <AppShell>
      <div className="container mx-auto px-4">
        <WelcomeSection />
        <MetricsCards />
        <ChartsSection />
      </div>
    </AppShell>
  )
}
```

### 3. Debates Layout (con Sidebar complejo)

```tsx
import { AppShell } from '@/components/layout'

export default function DebatesLayout({ children }) {
  return (
    <AppShell>
      <div className="flex flex-1">
        <DebatesSidebar />
        <DebatesContent>
          {children}
        </DebatesContent>
      </div>
    </AppShell>
  )
}
```

### 4. Admin Layout (con Sidebar fijo)

```tsx
import { AppShell } from '@/components/layout'

export default function AdminLayout({ children }) {
  return (
    <AppShell>
      <div className="flex flex-1">
        <AdminSidebar className="fixed top-16 left-0 h-[calc(100vh-4rem)]" />
        <AdminContent className="ml-64">
          {children}
        </AdminContent>
      </div>
    </AppShell>
  )
}
```

---

## Propiedades de AppShell

```tsx
interface AppShellProps {
  children: ReactNode          // Contenido principal
  className?: string           // Clases CSS adicionales en container
  showGradient?: boolean       // Mostrar fondo animado (default: true)
  headerProps?: AppHeaderProps // Props para pasar a AppHeader
}
```

### Ejemplos de uso de props

```tsx
// Con header custom
<AppShell headerProps={{ variant: "app", onSettingsOpen: () => {} }}>
  {children}
</AppShell>

// Sin gradient background
<AppShell showGradient={false}>
  {children}
</AppShell>

// Con clase CSS custom
<AppShell className="bg-slate-950">
  {children}
</AppShell>
```

---

## Puntos Críticos a Recordar

1. **AppShell SIEMPRE incluye header + footer**
   - No duplicar AppHeader/AppFooter cuando usas AppShell

2. **Padding (pt-16 pb-16) está en AppShell**
   - No agregar padding adicional en contenedor principal
   - Solo agregar padding interno (pt-4, pb-8, etc.)

3. **Imports centralizados**
   - Usar: `import { AppShell } from '@/components/layout'`
   - Evitar: `import { AppShell } from '@/components/layout/app-shell'`

4. **Z-index es manejado automáticamente**
   - Header z-50, Footer z-40
   - No cambiar estos valores

5. **Responsive design funciona automáticamente**
   - AppShell maneja pt-16 pb-16 en todos los breakpoints

---

## Checklist antes de hacer commit

- [ ] ¿Estoy usando AppShell para nuevas páginas?
- [ ] ¿He removido AppHeader + AppFooter duplicados?
- [ ] ¿No estoy agregando padding manual en el contenedor principal?
- [ ] ¿Los imports son de @/components/layout (index)?
- [ ] ¿El contenido no se superpone con header/footer?
- [ ] ¿Probé en mobile view?

---

**Última Actualización:** Jan 30, 2026  
**Versión:** 1.0 - AppShell Centralizado  
**Mantenedor:** Sistema de Layout Global
