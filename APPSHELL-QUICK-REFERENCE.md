# AppShell Quick Reference - "Cheat Sheet"

## TL;DR - La Versión Corta

### ✅ SIEMPRE Hacer Esto

```tsx
// Importar
import { AppShell } from '@/components/layout'

// Usar
export default function MyPage() {
  return (
    <AppShell>
      <main className="container px-4">
        {/* Tu contenido */}
      </main>
    </AppShell>
  )
}
```

### ❌ NUNCA Hacer Esto

```tsx
// ❌ No importes directamente del archivo
import { AppHeader } from '@/components/layout/app-header'

// ❌ No duplices header/footer
return (
  <div>
    <AppHeader />
    <main>Content</main>
    <AppFooter />
  </div>
)

// ❌ No agregues padding manual
<main className="pt-20 pb-16"> {/* Ya está en AppShell */}

// ❌ No uses min-h-screen
<div className="min-h-screen"> {/* AppShell ya lo tiene */}
```

---

## Casos de Uso Comunes

### 1. Página Simple

```tsx
import { AppShell } from '@/components/layout'

export default function ContactPage() {
  return (
    <AppShell>
      <main className="container mx-auto px-4 py-8">
        <h1>Contacto</h1>
        {/* Contenido */}
      </main>
    </AppShell>
  )
}
```

### 2. Página con Header Personalizado

```tsx
import { AppShell } from '@/components/layout'

export default function SettingsPage() {
  return (
    <AppShell headerProps={{
      onSettingsOpen: () => console.log('opened')
    }}>
      <main className="container mx-auto px-4">
        {/* Contenido */}
      </main>
    </AppShell>
  )
}
```

### 3. Página con Sidebar

```tsx
import { AppShell } from '@/components/layout'

export default function AdminPage() {
  return (
    <AppShell>
      <div className="flex flex-1">
        <aside className="w-64 border-r">
          {/* Sidebar */}
        </aside>
        <main className="flex-1 px-4">
          {/* Contenido */}
        </main>
      </div>
    </AppShell>
  )
}
```

### 4. Landing Page

```tsx
import { AppShell } from '@/components/layout'

export default function LandingPage() {
  return (
    <AppShell headerProps={{ variant: "landing" }}>
      <Hero />
      <Features />
      <Pricing />
      <CTA />
    </AppShell>
  )
}
```

---

## Propiedades Disponibles

```tsx
<AppShell
  showGradient={true}              // default: true, mostrar fondo
  className="custom-class"          // clases CSS adicionales
  headerProps={{                    // props para AppHeader
    variant: "app" | "landing",
    onSettingsOpen: () => {},
    settingsInitialSection: "billing"
  }}
>
  {children}
</AppShell>
```

---

## Estructura Garantizada

```
AppShell renderiza:
┌─────────────────────────────────┐
│ AppHeader (fixed, z-50, h-16)   │
├─────────────────────────────────┤
│ <main> pt-16 pb-16              │
│  └─ {children}                  │
├─────────────────────────────────┤
│ AppFooter (fixed, z-40)         │
└─────────────────────────────────┘

NO NECESITAS:
❌ Agregar header manualmente
❌ Agregar footer manualmente
❌ Agregar padding pt-16 pb-16
❌ Agregar min-h-screen
❌ Agregar background gradient
```

---

## Debugging Rápido

### "Content se superpone con header"
```
✓ Asegúrate que content está DENTRO de <AppShell>
✓ No agregues AppHeader separado
✓ Check: console.log de estructura
```

### "Footer no se ve"
```
✓ Asegúrate que content es <main> dentro de AppShell
✓ No cierres AppShell antes del content
✓ Check: pt-16 pb-16 está ahí
```

### "Sidebar no alinea"
```
✓ Usa: className="fixed top-16 left-0"
✗ Evita: className="sticky top-16"
```

---

## Imports

```tsx
// ✅ CORRECTO
import { AppShell } from '@/components/layout'

// ✅ Si necesitas AppHeader solo
import { AppHeader } from '@/components/layout'

// ❌ INCORRECTO
import { AppShell } from '@/components/layout/app-shell'
import { AppHeader } from '@/components/layout/app-header'
```

---

## Checklist Antes de Commit

- [ ] Usé `import { AppShell } from '@/components/layout'`
- [ ] El contenido está dentro de `<AppShell>`
- [ ] No agregué padding manual (pt-20, pb-24)
- [ ] No agregué min-h-screen
- [ ] No renderé AppHeader + AppFooter separados
- [ ] Probé en mobile view
- [ ] Header y footer visibles

---

## Performance Tips

```tsx
// ✅ BUENO - No re-renderiza header/footer
export default function MyPage() {
  return (
    <AppShell>
      <DynamicComponent />
    </AppShell>
  )
}

// ❌ MALO - Re-renderiza AppShell
export default function MyPage() {
  const [state, setState] = useState()
  return (
    <div className="flex">
      <AppShell> {/* se re-renderiza con estado */}
        <DynamicComponent state={state} />
      </AppShell>
    </div>
  )
}
```

---

## Migración desde OLD Layout

```diff
- import { AppHeader } from '@/components/layout/app-header'
- import { AppFooter } from '@/components/layout/app-footer'
+ import { AppShell } from '@/components/layout'

export default function MyPage() {
  return (
-   <div className="min-h-screen">
-     <div className="fixed inset-0 -z-10">Gradient</div>
-     <AppHeader variant="app" />
-     <main className="pt-20 pb-24">
+   <AppShell>
+     <main>
        {/* contenido igual */}
-     </main>
-     <AppFooter />
-   </div>
+     </main>
+   </AppShell>
  )
}
```

---

## Links Útiles

- **Full Docs:** `LAYOUT-COMPONENT-PATTERNS.md`
- **Visual Guide:** `LAYOUT-ARCHITECTURE-VISUAL.md`
- **Migration Steps:** `MIGRATION-GUIDE-TO-APPSHELL.md`
- **Code:** `apps/web/src/components/layout/`

---

## FAQ Rápido

**P: ¿Siempre debo usar AppShell?**
R: Sí, en prácticamente todos los casos.

**P: ¿Y si tengo un layout muy especial?**
R: Ve a "LAYOUT-COMPONENT-PATTERNS.md" - Sección "Layouts Complejos"

**P: ¿Se puede cambiar el padding?**
R: No. El pt-16 pb-16 es fijo. Usa padding interno si necesitas más.

**P: ¿Y el background gradient?**
R: Viene incluido. Puedes remover con `showGradient={false}`

**P: ¿Cómo paso props al header?**
R: Via `headerProps` - Ver ejemplos arriba.

---

**Imprime este doc y tenlo cerca! 🚀**

*Última Actualización: Jan 30, 2026*
