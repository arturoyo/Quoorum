# ❌ Prohibiciones Absolutas

> **NO hacer NUNCA estas cosas**

---

## 📋 Lista Rápida

| ❌ PROHIBIDO | ✅ HACER EN SU LUGAR |
|-------------|---------------------|
| `any` | Tipo explícito o `unknown` con type guard |
| `@ts-ignore` | Arreglar el tipo correctamente |
| `console.log` en prod | Logger estructurado |
| SQL raw sin parametrizar | Query builder (Drizzle) |
| Queries sin `userId` | SIEMPRE filtrar por `userId` |
| Secrets hardcodeados | Variables de entorno |
| `.env` en git | `.env.example` sin valores reales |
| Providers IA hardcodeados | Config centralizada (`config/agent-config.ts`) |
| Modelos IA hardcodeados | Sistema de fallback |
| `useEffect` para fetch | tRPC/React Query o Server Components |
| CSS inline | Tailwind classes |
| `!important` | Especificidad correcta |
| Comentarios obvios | Código autoexplicativo |
| Código comentado | Eliminar (está en git history) |
| `var` | `const` o `let` |
| `==` | `===` (comparación estricta) |
| `export default` (componentes) | Named exports |
| Archivos > 300 líneas | Dividir en módulos |
| Funciones > 50 líneas | Extraer helpers |
| Magic numbers | Constantes con nombre |
| Promise sin manejar | `void` explícito o `await` con try-catch |
| **Colores hardcodeados UI** | **Variables CSS de tema** |
| **Hooks después de early return** | **TODOS los hooks PRIMERO** |

---

## 🔴 CRÍTICAS - Causan Bugs

### 1. React Hooks Después de Early Returns

```typescript
// ❌ ROMPE LA APP - Hooks condicionales
function Component() {
  const params = useParams()
  if (!params.id) return <Error /> // ❌ Early return ANTES de hooks

  const { data } = api.users.get.useQuery() // ❌ Hook condicional
}

// ✅ CORRECTO - Hooks primero, early returns después
function Component() {
  const params = useParams()
  const { data } = api.users.get.useQuery(undefined, {
    enabled: !!params?.id, // ✅ Condicionar con `enabled`
  })

  if (!params?.id) return <Error /> // ✅ Early return DESPUÉS
}
```

**Consecuencia:** Viola Rules of Hooks → App crashea

---

### 2. Colores Hardcodeados en UI

```typescript
// ❌ FALLA en light mode - Texto invisible
<div className="bg-white/5 text-white border-white/10">

// ✅ Funciona en light Y dark mode
<div className="bg-[var(--theme-landing-card)] text-[var(--theme-text-primary)] border-[var(--theme-landing-border)]">
```

**Consecuencia:** UI ilegible en light mode

---

### 3. Queries Sin userId

```typescript
// ❌ INSEGURO - Cualquier usuario puede ver cualquier cliente
const client = await db.select().from(clients).where(eq(clients.id, id))

// ✅ SEGURO - Solo el propietario puede ver
const client = await db.select().from(clients).where(
  and(
    eq(clients.id, id),
    eq(clients.userId, ctx.userId) // ← OBLIGATORIO
  )
)
```

**Consecuencia:** Vulnerabilidad de seguridad crítica

---

### 4. any en Tipos

```typescript
// ❌ MAL - any desactiva type safety
function process(data: any) {
  return data.value
}

// ✅ BIEN - Tipo explícito con validación
function process(data: unknown) {
  if (isValidData(data)) {
    return data.value
  }
  throw new Error('Invalid data')
}
```

**Consecuencia:** Bugs en runtime que TypeScript debería detectar

---

## ⚠️ IMPORTANTES - Causan Problemas

### 5. console.log en Producción

```typescript
// ❌ MAL
console.log('User logged in', userId)

// ✅ BIEN
logger.info('User logged in', { userId, timestamp: new Date() })
```

### 6. Hardcodear Providers/Modelos IA

```typescript
// ❌ MAL - Provider hardcodeado
const agent = {
  provider: 'openai',  // ← Causa quota exceeded
  model: 'gpt-4o',     // ← No configurable
}

// ✅ BIEN - Config centralizada
import { getAgentConfig } from './config/agent-config'
const agent = getAgentConfig('optimizer')
```

### 7. Floating Promises

```typescript
// ❌ MAL - Promise ignorada (ESLint error)
const handleCopy = () => {
  navigator.clipboard.writeText(data) // ← Promise ignorada
}

// ✅ BIEN - void explícito
const handleCopy = () => {
  void navigator.clipboard.writeText(data)
}

// ✅ MEJOR - await con error handling
const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(data)
    toast.success('Copiado')
  } catch {
    toast.error('Error al copiar')
  }
}
```

---

## 📝 CONVENCIONES - Mantienen Consistencia

### 8. Object Injection (ESLint)

```typescript
// ❌ MAL - Acceso dinámico sin validar
function getConfig(key: string) {
  return CONFIG[key] // ← Vulnerable
}

// ✅ BIEN - Key es enum tipado + eslint-disable con razón
type PersonaType = 'analytical' | 'driver' | 'expressive' | 'amiable'

function getPersonaConfig(persona: PersonaType) {
  // eslint-disable-next-line security/detect-object-injection -- persona is strictly typed enum
  return PERSONA_CONFIG[persona] || PERSONA_CONFIG.analytical
}
```

### 9. Variables No Usadas

```typescript
// ❌ MAL - Variable no usada sin indicar
const { data, error, isLoading } = api.clients.list.useQuery()
// Si solo usas 'data', eslint marca error

// ✅ BIEN - Prefijo underscore
const { data, error: _error, isLoading: _isLoading } = api.clients.list.useQuery()

// ✅ MEJOR - Solo extraer lo necesario
const { data } = api.clients.list.useQuery()
```

---

## 🚨 ERRORES COMUNES

### 15. Imports Duplicados

```typescript
// ❌ MAL - Mismo nombre, dos imports
import { Link } from 'lucide-react'  // Icono
import Link from 'next/link'         // Componente
// Error: Identifier 'Link' has already been declared

// ✅ BIEN - Renombrar uno
import { Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'
```

### 16. Componentes No Importados

```typescript
// ❌ MAL - Usar sin importar
export default function Page() {
  return <QuoorumLogo size={48} />  // ← Error: Cannot find name
}

// ✅ BIEN - Importar primero
import { QuoorumLogo } from '@/components/ui/quoorum-logo'

export default function Page() {
  return <QuoorumLogo size={48} />
}
```

### 20. Cache Corrupto

```bash
# ❌ MAL - Intentar arreglar sin limpiar cache
# Error: Cannot find module './3787.js'

# ✅ BIEN - Limpiar cache PRIMERO
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules/.cache
pnpm next dev -p 3000
```

### 21. Puerto Ocupado

```bash
# ❌ MAL - Intentar iniciar sin verificar
pnpm next dev -p 3000
# Error: EADDRINUSE

# ✅ BIEN - Verificar y limpiar
Get-Process | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force
pnpm next dev -p 3000
```

---

## 📖 Ver Todas las Prohibiciones

Las 28 prohibiciones completas con ejemplos están en:
- **[CLAUDE.md](../../CLAUDE.md#prohibiciones-absolutas)** - Documentación completa

---

_Ver [INDEX.md](./INDEX.md) para más módulos de documentación_
