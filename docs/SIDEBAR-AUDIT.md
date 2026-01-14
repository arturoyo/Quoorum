# 🔍 AUDITORÍA COMPLETA DEL SIDEBAR - Módulos Faltantes

**Fecha:** 31 Dic 2025
**Estado:** ❌ **CRÍTICO** - Múltiples módulos funcionales no accesibles desde el sidebar

---

## 📊 RESUMEN EJECUTIVO

### Estado Actual del Sidebar

- **8 items planos** en navegación principal
- **Páginas accesibles:** Leads, Kanban, Deals, Conversaciones, Funnel, Calendar, Todos, Analytics
- **Páginas inaccesibles desde sidebar:** 13+ módulos funcionales

### Comparación con Estándar del Sistema

| Fuente                    | Items Esperados         | Items Actuales | Gap |
| ------------------------- | ----------------------- | -------------- | --- |
| `DEFAULT_NAVIGATION_TABS` | 9 items                 | 8 items        | -1  |
| Commit anterior (3d09629) | 25+ rutas organizadas   | 8 rutas planas | -17 |
| Páginas existentes        | 50+ páginas funcionales | 8 accesibles   | -42 |

---

## ✅ MÓDULOS QUE SÍ ESTÁN EN EL SIDEBAR

| Módulo         | Ruta             | Icono         | Shortcut | Estado     |
| -------------- | ---------------- | ------------- | -------- | ---------- |
| Leads          | `/leads`         | Users         | `G → L`  | ✅ Visible |
| Kanban         | `/kanban`        | Trello        | `G → K`  | ✅ Visible |
| Deals          | `/deals`         | Target        | `G → D`  | ✅ Visible |
| Conversaciones | `/conversations` | MessageSquare | `G → C`  | ✅ Visible |
| Funnel         | `/funnel`        | TrendingUp    | `G → F`  | ✅ Visible |
| Calendar       | `/calendar`      | Calendar      | `G → A`  | ✅ Visible |
| Todos          | `/todos`         | CheckSquare   | `G → T`  | ✅ Visible |
| Analytics      | `/insights`      | LineChart     | `G → I`  | ✅ Visible |

**Total: 8 módulos accesibles**

---

## ❌ MÓDULOS QUE DEBERÍAN ESTAR Y NO ESTÁN

### 🔴 CRÍTICOS - Según `DEFAULT_NAVIGATION_TABS`

| Módulo           | Ruta               | Icono Esperado | Shortcut Esperado | Estado Actual             | Prioridad |
| ---------------- | ------------------ | -------------- | ----------------- | ------------------------- | --------- |
| **Dashboard**    | `/dashboard`       | BarChart3      | `G → D`           | ⚠️ Solo logo click        | 🔴 Alta   |
| **Inbox**        | `/inbox`           | LayoutGrid     | `G → I`           | ❌ No accesible           | 🔴 Alta   |
| **Productivity** | `/productivity`    | Trophy         | `G → P`           | ⚠️ Solo dropup            | 🟡 Media  |
| **Store**        | `/dashboard/store` | Gift           | `G → S`           | ⚠️ Solo dropup            | 🟡 Media  |
| **Clients**      | `/clients`         | Users          | `G → C`           | ❌ No accesible           | 🔴 Alta   |
| **Stats**        | `/stats`           | BarChart3      | `G → E`           | ⚠️ Redirige a `/insights` | 🟢 Baja\* |

\* Stats redirige a Insights, que SÍ está en sidebar como "Analytics"

### 🟡 IMPORTANTES - Funcionalidades Existentes

| Módulo        | Ruta                   | Descripción                            | Estado Actual   | Prioridad |
| ------------- | ---------------------- | -------------------------------------- | --------------- | --------- |
| **Forum**     | `/forum`               | Sistema de debates estratégicos con IA | ❌ No accesible | 🟡 Media  |
| **Timeline**  | `/timeline`            | Línea de tiempo de eventos y actividad | ❌ No accesible | 🟡 Media  |
| **Profile**   | `/profile`             | Perfil de usuario                      | ❌ No accesible | 🟢 Baja   |
| **Help**      | `/help`                | Centro de ayuda                        | ⚠️ Solo dropup  | 🟢 Baja   |
| **Referrals** | `/dashboard/referrals` | Sistema de referidos                   | ⚠️ Solo dropup  | 🟢 Baja   |
| **Voice**     | `/voice`               | Configuración de voz (condicional)     | ❌ No accesible | 🟢 Baja\* |

\* Voice requiere feature flag `coldCallingEnabled`

---

## 📋 ANÁLISIS DETALLADO POR MÓDULO

### 1. Dashboard (`/dashboard`)

- **Estado:** ⚠️ Solo accesible desde logo click
- **Problema:** No está en navegación principal
- **Impacto:** Usuarios no encuentran fácilmente el dashboard principal
- **Solución:** Añadir como primer item del sidebar o mantener logo click + añadir al sidebar

### 2. Inbox (`/inbox`)

- **Estado:** ❌ No accesible desde sidebar
- **Problema:** Módulo crítico de comunicación no visible
- **Impacto:** Alto - Inbox es una funcionalidad core
- **Solución:** Añadir al sidebar (estaba en commit anterior con 4 subrutas)

### 3. Clients (`/clients`)

- **Estado:** ❌ No accesible desde sidebar
- **Problema:** Gestión de clientes no visible
- **Impacto:** Alto - CRM es funcionalidad core
- **Solución:** Añadir al sidebar (estaba en commit anterior en sección CRM)

### 4. Forum (`/forum`)

- **Estado:** ❌ No accesible desde sidebar
- **Problema:** Sistema completo de debates estratégicos no visible
- **Impacto:** Medio - Feature premium que debería ser visible
- **Solución:** Añadir al sidebar (solo si usuario tiene acceso al addon)

### 5. Timeline (`/timeline`)

- **Estado:** ❌ No accesible desde sidebar
- **Problema:** Vista de actividad histórica no visible
- **Impacto:** Medio - Útil para auditoría y seguimiento
- **Solución:** Añadir al sidebar o incluir en sección Analytics

### 6. Productivity (`/productivity`)

- **Estado:** ⚠️ Solo accesible desde dropup menu
- **Problema:** No visible en navegación principal
- **Impacto:** Medio - Funcionalidad importante pero oculta
- **Solución:** Añadir al sidebar principal

### 7. Stats (`/stats`)

- **Estado:** ⚠️ Redirige a `/insights`
- **Problema:** Ruta legacy, pero funcionalidad está en Insights
- **Impacto:** Bajo - Ya cubierto por Analytics/Insights
- **Solución:** Mantener redirect o eliminar ruta

### 8. Profile (`/profile`)

- **Estado:** ❌ No accesible
- **Problema:** Perfil de usuario no visible
- **Impacto:** Bajo - Puede estar en settings
- **Solución:** Añadir a dropup menu o settings

---

## 🎯 RECOMENDACIONES PRIORIZADAS

### Prioridad 🔴 ALTA - Añadir Inmediatamente

1. **Dashboard** - Añadir como primer item del sidebar
2. **Inbox** - Añadir con submenús (Chat, Calendar, Tasks, Todos)
3. **Clients** - Añadir al sidebar principal

### Prioridad 🟡 MEDIA - Añadir Pronto

4. **Forum** - Añadir (con verificación de acceso al addon)
5. **Timeline** - Añadir o incluir en Analytics
6. **Productivity** - Mover de dropup a sidebar principal

### Prioridad 🟢 BAJA - Considerar

7. **Store** - Mantener en dropup o añadir al sidebar
8. **Referrals** - Mantener en dropup (relacionado con Store)
9. **Help** - Mantener en dropup (acceso secundario)
10. **Profile** - Añadir a dropup o settings

---

## 📐 ESTRUCTURA PROPUESTA DEL SIDEBAR

### Opción 1: Sidebar Expandido (Recomendado)

```typescript
const navigation: NavigationItem[] = [
  // Sección Principal
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3,
    shortcut: 'G → D',
  },
  {
    name: 'Inbox',
    icon: Inbox,
    showBadge: true,
    shortcut: 'G → I',
    children: [
      { name: 'Todos los mensajes', href: '/inbox' },
      { name: 'Chat', href: '/inbox/chat' },
      { name: 'Calendario', href: '/inbox/calendar' },
      { name: 'Tareas', href: '/inbox/tasks' },
    ],
  },
  {
    name: 'CRM',
    icon: Users,
    shortcut: 'G → C',
    children: [
      { name: 'Clientes', href: '/clients' },
      { name: 'Leads', href: '/leads' },
      { name: 'Conversaciones', href: '/conversations' },
      { name: 'Embudo', href: '/funnel' },
      { name: 'Deals', href: '/deals' },
      { name: 'Timeline', href: '/timeline' },
    ],
  },
  {
    name: 'Productividad',
    icon: Trophy,
    shortcut: 'G → P',
    children: [
      { name: 'Vista General', href: '/productivity' },
      { name: 'Calendario', href: '/calendar' },
      { name: 'Kanban', href: '/kanban' },
      { name: 'Tareas', href: '/todos' },
    ],
  },
  {
    name: 'Analytics',
    icon: LineChart,
    shortcut: 'G → A',
    children: [
      { name: 'Insights', href: '/insights' },
      { name: 'Estadísticas', href: '/stats' },
    ],
  },
  {
    name: 'Forum',
    href: "/quoorum",
    icon: MessageCircle,
    shortcut: 'G → F',
    // Solo mostrar si tiene acceso al addon
  },
  {
    name: 'Tienda',
    href: '/dashboard/store',
    icon: Gift,
    shortcut: 'G → S',
  },
]
```

### Opción 2: Sidebar Simplificado (Actual + Faltantes)

```typescript
const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3, shortcut: 'G → D' },
  { name: 'Inbox', href: '/inbox', icon: Inbox, showBadge: true, shortcut: 'G → I' },
  { name: 'Clients', href: '/clients', icon: Users, shortcut: 'G → C' },
  { name: 'Leads', href: '/leads', icon: Target, shortcut: 'G → L' },
  { name: 'Kanban', href: '/kanban', icon: Trello, shortcut: 'G → K' },
  { name: 'Deals', href: '/deals', icon: DollarSign, shortcut: 'G → D' },
  {
    name: 'Conversaciones',
    href: '/conversations',
    icon: MessageSquare,
    showBadge: true,
    shortcut: 'G → C',
  },
  { name: 'Funnel', href: '/funnel', icon: TrendingUp, shortcut: 'G → F' },
  { name: 'Calendar', href: '/calendar', icon: Calendar, shortcut: 'G → A' },
  { name: 'Todos', href: '/todos', icon: CheckSquare, shortcut: 'G → T' },
  { name: 'Analytics', href: '/insights', icon: LineChart, shortcut: 'G → I' },
  { name: 'Timeline', href: '/timeline', icon: Clock, shortcut: 'G → T' },
  { name: 'Forum', href: "/quoorum", icon: MessageCircle, shortcut: 'G → F' },
  { name: 'Productivity', href: '/productivity', icon: Trophy, shortcut: 'G → P' },
]
```

---

## 🔗 ACCESOS ALTERNATIVOS ACTUALES

### Command Menu (⌘K)

- ✅ Dashboard
- ✅ Inbox
- ✅ Clients
- ✅ Conversations
- ✅ Calendar
- ✅ Stats
- ❌ Forum
- ❌ Timeline
- ❌ Productivity

### Dropup Menu (User Menu)

- ✅ Productivity
- ✅ Store
- ✅ Referrals
- ✅ Help
- ✅ Settings (varios)
- ❌ Forum
- ❌ Timeline
- ❌ Dashboard

### Logo Click

- ✅ Dashboard (solo cuando sidebar expandido)

---

## 📝 NOTAS TÉCNICAS

### Archivos Relevantes

- **Sidebar actual:** `apps/web/src/components/layout/sidebar/constants.ts`
- **Navegación estándar:** `packages/db/src/schema/navigation.ts` (DEFAULT_NAVIGATION_TABS)
- **Command menu:** `apps/web/src/components/command-menu/use-command-items.tsx`
- **User menu:** `apps/web/src/components/layout/sidebar/user-menu.tsx`

### Commits Relevantes

- **Commit anterior (3d09629):** Sidebar con 6 secciones y 25+ rutas
- **Commit simplificación (d9a46f4):** Reducción a 8 items planos

### Consideraciones

1. **Forum:** Requiere verificación de acceso al addon `quoorum_estrategico`
2. **Voice:** Requiere feature flag `coldCallingEnabled`
3. **Stats:** Redirige a `/insights` (funcionalidad consolidada)
4. **Shortcuts:** Algunos conflictos (G→D para Dashboard y Deals)

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Críticos (Alta Prioridad)

- [ ] Añadir Dashboard al sidebar
- [ ] Añadir Inbox al sidebar (con submenús)
- [ ] Añadir Clients al sidebar
- [ ] Verificar shortcuts no duplicados

### Fase 2: Importantes (Media Prioridad)

- [ ] Añadir Forum al sidebar (con verificación de acceso)
- [ ] Añadir Timeline al sidebar
- [ ] Mover Productivity de dropup a sidebar

### Fase 3: Opcionales (Baja Prioridad)

- [ ] Añadir Profile a dropup o settings
- [ ] Revisar Store/Referrals (mantener en dropup o mover)
- [ ] Actualizar command menu con módulos faltantes

---

**Última actualización:** 31 Dic 2025
**Próxima revisión:** Después de implementar Fase 1
