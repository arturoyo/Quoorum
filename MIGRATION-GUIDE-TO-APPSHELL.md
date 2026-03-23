# Guía de Migración a AppShell - Paso a Paso

## Estado Actual (Jan 30, 2026)

### ✅ Ya Migrados a AppShell
- `apps/web/src/app/debates/layout.tsx` - Usa AppShell

### ⏳ Parcialmente Migrados (usan AppHeader pero no AppShell)
- `apps/web/src/app/dashboard/page.tsx` - Importa de index.ts, pero aún render manual
- `apps/web/src/app/admin/layout.tsx` - Importa de index.ts, pero layout complejo
- `apps/web/src/app/debates/page.tsx` - Importa de index.ts

### ⚠️ Landing Pages (sin AppShell, pero OK)
- `page.tsx`, `about/page.tsx`, `pricing/page.tsx`, `privacy/page.tsx`, etc
- **Nota:** Estas SÍ podrían usar AppShell con `variant="landing"`

---

## Proceso de Migración Paso a Paso

### Paso 1: Identificar Candidatos

**Buscar archivos con:**
```
✓ Importan AppHeader
✓ Renderizan AppHeader + AppFooter
✓ Tienen `min-h-screen` o estructura de layout
✗ Que NO tengan lógica compleja (sidebars, modales, etc)
```

### Paso 2: Hacer Backup Mental

Antes de cambiar:
```tsx
// Anotar estos detalles:
- ¿Qué variant de AppHeader usa? (landing / app)
- ¿Tiene padding manual? (pt-20, pb-24, etc)
- ¿Tiene background gradient?
- ¿Tiene dependencias de props en AppHeader?
```

### Paso 3: Refactorizar

#### Antes
```tsx
import { AppHeader } from "@/components/layout"
import { AppFooter } from "@/components/layout"

export default function MyPage() {
  return (
    <div className="min-h-screen bg-[var(--theme-bg-primary)]">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        {/* ... */}
      </div>

      <AppHeader variant="app" />
      
      <main className="container mx-auto px-4 pt-20 pb-24">
        {/* contenido */}
      </main>

      <AppFooter />
    </div>
  )
}
```

#### Después
```tsx
import { AppShell } from "@/components/layout"

export default function MyPage() {
  return (
    <AppShell>
      <main className="container mx-auto px-4">
        {/* contenido */}
      </main>
    </AppShell>
  )
}
```

**Cambios específicos:**
1. ✂️ Remover imports de AppHeader y AppFooter
2. ✂️ Remover outer div con min-h-screen
3. ✂️ Remover background gradient div
4. ✂️ Remover AppHeader y AppFooter renders
5. ✂️ Remover padding manual (pt-20 pb-24)
6. ✂️ Cambiar main a usar AppShell como wrapper
7. ✂️ Cambiar import a AppShell

### Paso 4: Testing

Después de cambios:

**Visual:**
- [ ] Header visible en top
- [ ] Footer visible en bottom
- [ ] Contenido no superpuesto
- [ ] Responsive en móvil

**Funcional:**
- [ ] Links en header funcionan
- [ ] Settings modal en header abre
- [ ] Theme toggle en footer funciona
- [ ] Scroll dentro de área de contenido

**Browser:**
- [ ] Chrome
- [ ] Firefox
- [ ] Safari (si es posible)

---

## Migraciones Específicas Pendientes

### 1. Dashboard Page

**Archivo:** `apps/web/src/app/dashboard/page.tsx`

**Complejidad:** MEDIA (tiene settings modal)

**Pasos:**
```diff
- import { AppHeader } from "@/components/layout"
- import { AppFooter } from "@/components/layout"
+ import { AppShell } from "@/components/layout"

export default function DashboardPage() {
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  
  return (
-   <div className="min-h-screen relative bg-[var(--theme-bg-primary)]">
-     <div className="fixed inset-0 -z-10">
-       {/* gradient */}
-     </div>
-     <AppHeader 
-       variant="app"
+   <AppShell headerProps={{
+     variant: "app",
-       onSettingsOpen={() => setSettingsModalOpen(true)}
-       settingsInitialSection={settingsInitialSection}
-     />
-     <main className="container mx-auto px-4 pt-20 pb-24 sm:pb-28 md:pb-32 min-h-[calc(100vh-64px)] flex flex-col">
+     onSettingsOpen={() => setSettingsModalOpen(true)},
+     settingsInitialSection: settingsInitialSection
+   }}>
+     <main className="container mx-auto px-4 flex flex-col">
        {/* contenido sin cambios */}
-     </main>
-     <AppFooter />
-   </div>
+     </main>
+   </AppShell>
  )
}
```

### 2. Admin Layout

**Archivo:** `apps/web/src/app/admin/layout.tsx`

**Complejidad:** ALTA (tiene sidebar fijo)

**Pasos:**
```diff
- import { AppHeader } from "@/components/layout"

+ import { AppShell } from "@/components/layout"

export default function AdminLayout({ children }) {
  return (
-   <div className="min-h-screen bg-slate-900">
-     <AppHeader variant="app" />
-     <div className="flex">
+   <AppShell>
+     <div className="flex flex-1">
        <aside className="fixed top-16 left-0 h-[calc(100vh-4rem)] ...">
          {/* sidebar sin cambios */}
        </aside>
        
-       <main className="flex-1 pt-16 pb-32">
+       <main className="flex-1">
          {children}
        </main>
      </div>
-   </div>
+   </AppShell>
  )
}
```

### 3. Debates Page

**Archivo:** `apps/web/src/app/debates/page.tsx`

**Complejidad:** BAJA (simple page con header)

**Estado:** El layout ya está migrado, solo la page necesita review

```diff
- import { AppHeader } from "@/components/layout"

export default function DebatesPage() {
  return (
-   <div className="min-h-screen bg-[var(--theme-bg-primary)]">
-     <AppHeader variant="app" />
-     <main className="container mx-auto px-4 pt-20 pb-24 sm:pb-28 md:pb-32">
+   /* Nota: debates/layout.tsx ya tiene AppShell */
+   /* Esta page solo renderiza en debates/layout.tsx */
+   <main className="container mx-auto px-4">
      {/* contenido sin cambios */}
    </main>
-   </div>
  )
}
```

---

## Checklist de Migración Completa

- [ ] Debatesayout.tsx → AppShell ✅
- [ ] Dashboard page → AppShell (pendiente)
- [ ] Admin layout → AppShell (pendiente)
- [ ] Todos los imports centralizados → @/components/layout ✅
- [ ] Documentación actualizada → layouts/ ✅
- [ ] Tests pasando → Verificar post-migración
- [ ] Reviewed por equipo → Pendiente

---

## Problemas Comunes y Soluciones

### "Content se superpone con header"
```
❌ CAUSA: Falta padding pt-16
✅ SOLUCIÓN: Asegurarse que content está dentro de AppShell <main>
```

### "Header/Footer no visible"
```
❌ CAUSA: Aún render manual de AppHeader/AppFooter
✅ SOLUCIÓN: Remover renders manuales si usas AppShell
```

### "Footer en posición incorrecta"
```
❌ CAUSA: pb padding muy pequeño
✅ SOLUCIÓN: AppShell maneja pb-16 automáticamente
```

### "Sidebar no alinea con header"
```
❌ CAUSA: Sidebar usa sticky en lugar de fixed
✅ SOLUCIÓN: Cambiar a fixed top-16 left-0
```

---

## FAQ

**P: ¿Debo usar AppShell para TODO?**
R: Sí, siempre que sea posible. Excepto layouts extremadamente complejos.

**P: ¿Y si mi página tiene layout super especial?**
R: Usa `Option B` del documento LAYOUT-COMPONENT-PATTERNS.md - pero con AppHeader/AppFooter del index.ts

**P: ¿Se rompería si migro dashboard?**
R: No. La lógica de settings modal funciona igual, solo cambia estructura.

**P: ¿Qué pasa con el SEO?**
R: No afecta. Son cambios estructurales de React, no de HTML semántico.

**P: ¿Y el performance?**
R: Mejor. AppShell centraliza lógica, menos re-renders.

---

## Timeline

**Prioridad ALTA:**
- Dashboard (muchos usuarios lo ven)
- Admin (crítico para sistema)

**Prioridad MEDIA:**
- Landing pages individuales

**Prioridad BAJA:**
- Páginas de contenido estático

---

**Última Actualización:** Jan 30, 2026  
**Versión:** 1.0 - Guía Inicial  
**Estado:** Listo para ejecutar
