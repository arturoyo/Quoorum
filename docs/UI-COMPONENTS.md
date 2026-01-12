# 🎨 UI Components Catalog

> **Versión:** 1.0.0 | **Última actualización:** 10 Dic 2025
> **Stack:** shadcn/ui + Tailwind CSS + Radix UI

---

## 📋 ÍNDICE

1. [Componentes Base (shadcn/ui)](#componentes-base-shadcnui)
2. [Componentes Personalizados](#componentes-personalizados)
3. [Patrones de Uso](#patrones-de-uso)
4. [Errores Comunes](#errores-comunes)

---

## 🧱 COMPONENTES BASE (shadcn/ui)

> **Ubicación:** `apps/web/src/components/ui/`

### Formularios

| Componente | Uso | Import |
|------------|-----|--------|
| `Button` | Acciones y CTAs | `@/components/ui/button` |
| `Input` | Campos de texto | `@/components/ui/input` |
| `Textarea` | Texto multilínea | `@/components/ui/textarea` |
| `Select` | Selección de opciones | `@/components/ui/select` |
| `Checkbox` | Opciones booleanas | `@/components/ui/checkbox` |
| `Switch` | Toggle on/off | `@/components/ui/switch` |
| `Label` | Etiquetas de campos | `@/components/ui/label` |

### Layout

| Componente | Uso | Import |
|------------|-----|--------|
| `Card` | Contenedores | `@/components/ui/card` |
| `Separator` | Líneas divisoras | `@/components/ui/separator` |
| `Tabs` | Navegación en tabs | `@/components/ui/tabs` |
| `ScrollArea` | Scroll personalizado | `@/components/ui/scroll-area` |

### Feedback

| Componente | Uso | Import |
|------------|-----|--------|
| `Dialog` | Modales | `@/components/ui/dialog` |
| `AlertDialog` | Confirmaciones | `@/components/ui/alert-dialog` |
| `Toast` | Notificaciones | `sonner` (via `toast()`) |
| `Skeleton` | Loading states | `@/components/ui/skeleton` |
| `Badge` | Etiquetas de estado | `@/components/ui/badge` |

### Navegación

| Componente | Uso | Import |
|------------|-----|--------|
| `DropdownMenu` | Menús desplegables | `@/components/ui/dropdown-menu` |
| `Command` | Command palette | `@/components/ui/command` |
| `Popover` | Popovers | `@/components/ui/popover` |

---

## ⚠️ SELECT: shadcn vs HTML Nativo

**PROBLEMA COMÚN:** Confundir shadcn Select con HTML `<select>`.

### shadcn Select (Radix UI)

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ✅ CORRECTO - Usa onValueChange (NO onChange)
<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Selecciona..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Opción 1</SelectItem>
    <SelectItem value="option2">Opción 2</SelectItem>
  </SelectContent>
</Select>
```

### HTML Select Nativo (Más Simple)

```tsx
// ✅ CORRECTO - Usa onChange con event
<select
  value={value}
  onChange={(e) => setValue(e.target.value)}
  className="flex h-10 w-full rounded-md border border-[#2a3942] bg-[#202c33] px-3 py-2 text-sm text-[#e9edef] focus:outline-none focus:ring-2 focus:ring-ring"
>
  <option value="">Selecciona...</option>
  <option value="option1">Opción 1</option>
  <option value="option2">Opción 2</option>
</select>
```

### Cuándo Usar Cada Uno

| Caso | Usar | Razón |
|------|------|-------|
| Formularios simples | HTML nativo | Más simple, menos código |
| Diseño personalizado | shadcn Select | Más control visual |
| Grupos de opciones | shadcn Select | Soporta grupos |
| Mobile-first | HTML nativo | Mejor UX nativa |

---

## 🔧 COMPONENTES PERSONALIZADOS

> **Ubicación:** `apps/web/src/components/`

### Clientes

| Componente | Ubicación | Descripción |
|------------|-----------|-------------|
| `ClientCard` | `clients/client-card.tsx` | Tarjeta de cliente |
| `ClientFormDialog` | `clients/client-form-dialog.tsx` | Modal crear/editar cliente |
| `ClientList` | `clients/client-list.tsx` | Lista de clientes |

### Conversaciones

| Componente | Ubicación | Descripción |
|------------|-----------|-------------|
| `MessageBubble` | `chat/message-bubble.tsx` | Burbuja de mensaje |
| `ChatInput` | `chat/chat-input.tsx` | Input de chat |
| `ConversationList` | `conversations/conversation-list.tsx` | Lista de conversaciones |

### Dashboard

| Componente | Ubicación | Descripción |
|------------|-----------|-------------|
| `StatsCard` | `dashboard/stats-card.tsx` | Tarjeta de estadísticas |
| `ActivityFeed` | `dashboard/activity-feed.tsx` | Feed de actividad |
| `QuickActions` | `dashboard/quick-actions.tsx` | Acciones rápidas |

### Layouts

| Componente | Ubicación | Descripción |
|------------|-----------|-------------|
| `Sidebar` | `layouts/sidebar.tsx` | Barra lateral |
| `Header` | `layouts/header.tsx` | Encabezado |
| `PageHeader` | `layouts/page-header.tsx` | Título de página |

---

## 📐 PATRONES DE USO

### 1. Loading States

```tsx
// ✅ CORRECTO - Siempre mostrar loading
const { data, isLoading, error } = api.clients.list.useQuery()

if (isLoading) {
  return <ClientListSkeleton />
}

if (error) {
  return <ErrorState message={error.message} />
}

return <ClientList clients={data} />
```

### 2. Toast Notifications

```tsx
import { toast } from 'sonner'

// Success
toast.success('Cliente creado correctamente')

// Error
toast.error('Error al crear el cliente')

// Promise (loading → success/error)
toast.promise(createClient(data), {
  loading: 'Creando cliente...',
  success: 'Cliente creado',
  error: 'Error al crear cliente',
})
```

### 3. Confirmaciones

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Eliminar</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
      <AlertDialogDescription>
        Esta acción no se puede deshacer.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>
        Eliminar
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### 4. Formularios con React Hook Form

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  email: z.string().email('Email inválido').optional(),
})

type FormData = z.infer<typeof schema>

function ClientForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = (data: FormData) => {
    // ...
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Input {...form.register('name')} />
      {form.formState.errors.name && (
        <p className="text-red-500">{form.formState.errors.name.message}</p>
      )}
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Guardando...' : 'Guardar'}
      </Button>
    </form>
  )
}
```

---

## ❌ ERRORES COMUNES

### 1. Select onChange vs onValueChange

```tsx
// ❌ MAL - shadcn Select NO tiene onChange
<Select onChange={(e) => setValue(e.target.value)}>

// ✅ BIEN - Usar onValueChange
<Select onValueChange={setValue}>
```

### 2. Missing Loading State

```tsx
// ❌ MAL - Sin loading state
const { data } = api.clients.list.useQuery()
return <ClientList clients={data} />

// ✅ BIEN - Con loading state
const { data, isLoading } = api.clients.list.useQuery()
if (isLoading) return <Skeleton />
return <ClientList clients={data ?? []} />
```

### 3. Nullish Coalescing

```tsx
// ❌ MAL - Puede ser undefined
<ClientList clients={data} />

// ✅ BIEN - Fallback a array vacío
<ClientList clients={data ?? []} />
```

### 4. Button Loading State

```tsx
// ❌ MAL - No feedback de loading
<Button onClick={handleSave}>Guardar</Button>

// ✅ BIEN - Disabled + texto de loading
<Button onClick={handleSave} disabled={mutation.isPending}>
  {mutation.isPending ? 'Guardando...' : 'Guardar'}
</Button>
```

---

## 🎨 COLORES (Dark Theme)

```css
/* Backgrounds */
--bg-primary: #111b21     /* Fondo principal */
--bg-secondary: #202c33   /* Fondo secundario */
--bg-tertiary: #2a3942    /* Fondo terciario */

/* Text */
--text-primary: #e9edef   /* Texto principal */
--text-secondary: #8696a0 /* Texto secundario */

/* Borders */
--border: #2a3942         /* Bordes */

/* Accents */
--accent: #00a884         /* Verde WhatsApp */
--accent-hover: #06cf9c   /* Verde hover */
```

---

_Última actualización: 10 Dic 2025_
