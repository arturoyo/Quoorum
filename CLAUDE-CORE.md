# 🤖 CLAUDE-CORE.md — Reglas Esenciales

> **Versión:** 1.1.0 | **Fecha:** 29 Ene 2026
> **Propósito:** Guía rápida con las 10 reglas más críticas
> **Tiempo de lectura:** 3-5 minutos
> **Documentación completa:** Ver [CLAUDE.md](./CLAUDE.md) o módulos en [docs/claude/](./docs/claude/)

---

## 💻 CONFIGURACIÓN ACTUAL DEL PROYECTO

**✅ ENTORNO DE DESARROLLO: Windows (PowerShell)**

### Estado Actual (30 Ene 2026)
```text
- Sistema: Windows
- Terminal: PowerShell
- Node.js: 20.x
- pnpm: 9.15.0
- Ubicación proyecto: C:\Quoorum
```

### Comandos para Desarrollar
```powershell
# 1. Abrir PowerShell en VS Code
# 2. Navegar al proyecto
cd C:\Quoorum\apps\web

# 3. Iniciar servidor (bloquea emojis antes de levantar)
pnpm dev:no-fix

# 4. Servidor escucha en:
#    http://localhost:3005
```

### ⚠️ Configuraciones Críticas

**apps/web/package.json:**
```json
"dev:no-fix": "next dev -p 3005 --hostname 0.0.0.0"
```

**Reglas del entorno:**
- WSL2 NO es entorno recomendado (generó inestabilidad en este proyecto)
- Emojis en código bloquean el dev server en Windows → pre-checks obligatorios
- Preferir `dev:no-fix` para evitar hooks pesados

### 👤 Usuario de Prueba en PostgreSQL Local

**Creado en Docker (quoorum-postgres):**
- Email: `admin@test.com`
- Role: `admin`
- Autenticación: OAuth Google (no tiene password)

### Ventajas de Windows (estado actual)
✅ Compatible con scripts PowerShell existentes
✅ Flujo validado con herramientas locales
✅ Bloqueo preventivo de emojis antes de dev/build

---

## 🚨 ANTES DE EMPEZAR

**Lee estos archivos EN ORDEN (15 min total):**

1. **ERRORES-COMETIDOS.md** (10 min) ← ⚠️ CRÍTICO: NO repetir errores
2. **CLAUDE-CORE.md** (este archivo - 5 min)
3. Consulta módulos específicos según tu tarea

---

## ⚡ TOP 11 REGLAS CRÍTICAS

### -1. 🎯 SÉ PROACTIVO: IDENTIFICA PATRONES, SUGIERE SOLUCIONES ROOT

**⚠️ REGLA META: Si algo falla 2-3 veces, NO apliques el mismo parche de nuevo**

**"Patrón de 3 strikes":**
```
Problema ocurre 1 vez → Aplico solución documentada
Problema ocurre 2 vez → Menciono: "Esto pasó antes en [contexto], ¿es patrón?"
Problema ocurre 3 vez → STOP: "Esto es estructural, sugiero [solución raíz]"
```

**Antes de aplicar un parche, pregúntate:**
1. ¿Estoy curando o parchando?
2. ¿Hay una solución que elimine este problema para siempre?
3. ¿El usuario está perdiendo tiempo por algo con mejor solución?

**Ejemplos reales:**

| Problema repetitivo | ❌ Parche (malo) | ✅ Solución raíz (sugerir) |
|---------------------|------------------|---------------------------|
| Cache corrupto 3+ veces | "limpia .next cada vez" | "Automatiza limpieza + checklist predev" |
| Errores UTF-8 scripts | "reemplaza emojis" | "Bloqueo preventivo de emojis antes de dev/build" |
| PowerShell falla | "arregla encoding" | "Estandariza scripts PowerShell + prechecks" |
| Build lento | "espera" | "Reducir trabajo previo y usar dev:no-fix" |
| Import errors 5+ veces | "arregla imports" | "Hay problema en structure?" |

**Tu trabajo NO es solo ejecutar, es MEJORAR el sistema.**

**Si el usuario tiene que preguntarte "¿por qué pasa esto 1000 veces?", ya fallaste.**

---

### 0. 🚫 EMOJIS EN CÓDIGO - PROHIBIDO ABSOLUTAMENTE (BAJO PENA DE MUERTE)

**⚠️ ESTA ES LA REGLA MÁS CRÍTICA - BLOQUEA COMPLETAMENTE EL DESARROLLO**

```typescript
// ❌ PROHIBIDO ABSOLUTAMENTE - Causa error UTF-8 en Windows
console.log('✅ Success')
console.error('❌ Error')
Write-Host "🔧 Fixing..."
logger.info('🎯 Target')

// ✅ SIEMPRE usar etiquetas de texto
console.log('[OK] Success')
console.error('[ERROR] Error')
Write-Host "[INFO] Fixing..."
logger.info('[INFO] Target')
```

**Causa:** Error `Windows stdio in console mode does not support writing non-UTF-8 byte sequences`
**Impacto:** El servidor NO inicia, desarrollo completamente bloqueado
**Frecuencia:** Ha ocurrido múltiples veces, causando pérdida de horas de trabajo

**El auto-fix detectará y reemplazará automáticamente, pero es mejor prevenir.**

**📖 Ver detalles:** [ERRORES-COMETIDOS.md - Error #5](./ERRORES-COMETIDOS.md#error-5-emojis-en-consolelog-causan-error-utf-8-en-windows)

---

### 1. 🔧 HERRAMIENTAS DEDICADAS > BASH

```bash
❌ PROHIBIDO en bash:
   grep, sed, awk, cat, head, tail, find, echo

✅ USA HERRAMIENTAS:
   Grep, Edit, Read, Glob (+ texto directo en respuesta)

✅ PERMITIDO en bash:
   git, npm, pnpm, docker, mv, rm, mkdir, ls, cd
```

**Consecuencia:** Commit rechazado + código revertido

---

### 2. 📋 CHECKPOINT PROTOCOL

**ANTES de cada acción, consulta la tabla:**

| Acción | Consultar | Verificar |
|--------|-----------|-----------|
| **Modificar UI** | Regla #13 (UX/Design) | ¿Paleta oficial? ¿Variables CSS? |
| **Crear tRPC router** | Patrón tRPC | Validación Zod + userId filter |
| **Query a DB** | Regla #5 (Seguridad) | ¿Filtra por userId? |
| **Crear archivo .tsx** | INDEX.md | ¿Ya existe? ¿Duplicado? |
| **React component** | React Hooks Rules | Hooks ANTES de early returns |

**📖 Ver tabla completa:** [docs/claude/02-checkpoint-protocol.md](./docs/claude/02-checkpoint-protocol.md)

---

### 3. 🗄️ BASE DE DATOS: PostgreSQL Local ÚNICAMENTE

```typescript
// ❌ NUNCA
const { data } = await ctx.supabase.from('clients').select('*')

// ✅ SIEMPRE
const data = await db.select().from(clients)
```

**Regla:** Supabase = Solo Auth | PostgreSQL local = Todos los datos

**Error común:** `violates foreign key constraint` → Perfil NO existe en PostgreSQL local

**Solución:** Ver [docs/claude/03-database.md](./docs/claude/03-database.md)

---

### 4. 🔐 SEGURIDAD: userId EN TODAS LAS QUERIES

```typescript
// ❌ INSEGURO
await db.select().from(clients).where(eq(clients.id, id))

// ✅ SEGURO
await db.select().from(clients).where(
  and(
    eq(clients.id, id),
    eq(clients.userId, ctx.userId) // ← OBLIGATORIO
  )
)
```

---

### 5. ⚛️ REACT HOOKS: SIEMPRE ANTES DE EARLY RETURNS

```typescript
// ❌ ROMPE LA APP
function Component() {
  const params = useParams()
  if (!params.id) return <Error /> // ❌ Early return ANTES de hooks

  const { data } = api.users.get.useQuery() // ❌ Hook condicional
}

// ✅ CORRECTO
function Component() {
  const params = useParams()
  const { data } = api.users.get.useQuery(undefined, {
    enabled: !!params?.id, // ✅ Condicionar con `enabled`
  })

  if (!params?.id) return <Error /> // ✅ Early return DESPUÉS de hooks
}
```

---

### 6. 🎨 UX: VARIABLES CSS, NO COLORES HARDCODEADOS

```typescript
// ❌ FALLA en light mode
<div className="bg-white/5 text-white border-white/10">

// ✅ Funciona en light Y dark mode
<div className="bg-[var(--theme-landing-card)] text-[var(--theme-text-primary)] border-[var(--theme-landing-border)]">
```

**Regla:** Si el color cambia entre light/dark, usa variables CSS

**Variables:** Ver [docs/claude/08-design-system.md](./docs/claude/08-design-system.md)

---

### 7. 🚫 PROHIBICIONES ABSOLUTAS

| ❌ NUNCA | ✅ USA |
|---------|--------|
| **🚫 EMOJIS en código** | **Etiquetas de texto: `[OK]`, `[ERROR]`, `[WARN]`, `[INFO]`** |
| `any` | Tipo explícito o `unknown` + type guard |
| `console.log` en prod | Logger estructurado |
| `@ts-ignore` | Arreglar el tipo correctamente |
| Queries sin `userId` | SIEMPRE filtrar por `userId` |
| Hardcodear provider/modelo IA | Config centralizada (`config/agent-config.ts`) |
| Colores hardcodeados UI | Variables CSS de tema |

**Lista completa:** [docs/claude/06-prohibitions.md](./docs/claude/06-prohibitions.md)

---

### 8. 📝 CONVENCIONES DE NAMING

```typescript
// Componentes: PascalCase
export function ClientCard() {}

// Hooks: camelCase + prefijo "use"
export function useClientData() {}

// Constantes: SCREAMING_SNAKE_CASE
export const MAX_RETRY_COUNT = 3

// Archivos: kebab-case
// client-card.tsx ✅
// ClientCard.tsx ❌
```

---

### 9. 🔄 ORDEN DE DESARROLLO: BACKEND FIRST

```
✅ CORRECTO (Orden):
1. Schema/tipos
2. Migraciones DB
3. Router tRPC + Tests
4. Componente UI + Tests

❌ INCORRECTO:
1. UI con mock data
2. "Backend después"
```

---

### 10. ✅ CHECKLIST PRE-COMMIT

```bash
# Ejecutar SIEMPRE antes de commit:
pnpm typecheck  # TypeScript sin errores
pnpm lint       # ESLint sin warnings
pnpm test       # Tests pasan

# Verificar manualmente:
- [ ] No hay console.log en producción
- [ ] No hay `any` en tipos
- [ ] Queries filtran por userId
- [ ] Input validado con Zod
```

---

## 🎯 REGLAS DE EJECUCIÓN ESTRICTA

### 🔇 Respuesta Atómica (No-Chatter)
Si pides una función, la respuesta es **SOLO la función**. Sin "Aquí tienes el código", sin "Espero que esto te sirva" y sin explicaciones no solicitadas.

```typescript
// ✅ Si solicitas: "Crear función para validar email"
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// ❌ NO responder: "Aquí te dejo una función para validar... Espero que te sirva..."
```

---

### 🛠️ Cero Refactorización Silenciosa
No cambies el estilo de nombres o la arquitectura circundante si no se te ha pedido. Si el código usa `snake_case`, la IA mantiene `snake_case`.

```typescript
// ❌ PROHIBIDO cambiar nombres sin pedir
- const user_name = "John"  →  const userName = "John"

// ✅ CORRECTO: Mantener estilo consistente
- const user_name = "John"  →  const user_name = getUserName()
```

---

### 📍 Alcance Quirúrgico
Si solicitas un parche para la línea 45, **NO reescribas el archivo completo**. Solo entrega el bloque afectado para evitar conflictos de merge.

```typescript
// ❌ NO: Reescribir 200 líneas
// ✅ SÍ: Solo el bloque que cambió
// Líneas 42-48 (cambio quirúrgico):
if (isValid) {
  return processData(input) // ← Cambio aquí
}
```

---

### 🚫 Prohibido el "Placeholdering"
Nunca entregues código con comentarios tipo `// ... resto de la lógica aquí`. O se entrega el código funcional **completo** o se falla con un error explícito.

```typescript
// ❌ PROHIBIDO
export async function createUser(data) {
  validateInput(data)
  // ... resto de la lógica aquí
  return user
}

// ✅ CORRECTO: Código completo O error explícito
export async function createUser(data: UserInput): Promise<User> {
  const validated = userSchema.parse(data)
  const user = await db.insert(users).values(validated)
  await sendWelcomeEmail(user.email)
  return user
}
```

---

### 🔍 Validación de Dependencias
Antes de sugerir una librería nueva, verifica el `package.json` o el entorno existente. **No añadas Lodash si se puede resolver con JavaScript moderno nativo**.

```typescript
// ❌ NO: Sugerir Lodash si tenemos JavaScript moderno
import { flatten } from 'lodash'
const flat = flatten(nestedArray)

// ✅ SÍ: Usar métodos nativos
const flat = nestedArray.flat(Infinity)
```

---

### 📉 Verbosidad Cero en Errores
Si el código falla, devuelve el **stack trace analizado y la solución**, no una disculpa de tres párrafos.

```
❌ "Disculpa, parece que hubo un problema con el tipo de dato..."

✅ "Error: TypeError: Cannot read property 'email' of undefined
   Línea: services/user.ts:45
   Causa: userProfile es null
   Solución: Validar userProfile antes de acceder a .email"
```

---

## 🏗️ ARQUITECTURA Y ESTABILIDAD

### 🧩 Principio de Responsabilidad Única (SRP)
Una función, una tarea. Si una función supera las **20 líneas**, sugiere su descomposición.

```typescript
// ❌ Demasiadas responsabilidades
async function processOrder(orderId) {
  const order = await db.getOrder(orderId)
  validateOrder(order)
  calculateTax(order)
  applyDiscount(order)
  processPayment(order)
  sendConfirmation(order)
  updateInventory(order)
  // 30+ líneas
}

// ✅ Descompuesto
async function processOrder(orderId: string): Promise<void> {
  const order = await db.getOrder(orderId)
  await validateAndPrepare(order)
  await processPaymentAndNotify(order)
}
```

---

### 🛡️ Programación Defensiva
Todo input externo (API, formularios, params) debe ser validado con esquemas como **Zod o Joi** antes de tocar la lógica de negocio.

```typescript
// ❌ Sin validación
function createUser(data) {
  const user = db.insert(users).values(data)
}

// ✅ Con validación
const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  age: z.number().int().positive(),
})

function createUser(data: unknown): Promise<User> {
  const validated = userSchema.parse(data)
  return db.insert(users).values(validated)
}
```

---

### 📦 Inyección de Dependencias
Evitar acoplamiento fuerte. Los servicios deben pasarse como argumentos o mediante contenedores para facilitar los Unit Tests.

```typescript
// ❌ Acoplamiento fuerte
class UserService {
  constructor() {
    this.db = new Database()
    this.email = new EmailService()
  }
}

// ✅ Inyección de dependencias
class UserService {
  constructor(
    private db: Database,
    private email: EmailService
  ) {}
}
```

---

### 🌑 Idempotencia en APIs
Cualquier operación POST, PUT o DELETE debe diseñarse para que, si se ejecuta dos veces por error de red, el resultado sea el mismo **sin duplicar datos**.

```typescript
// ❌ No idempotente (duplica si falla la red)
async function createSubscription(userId: string) {
  return db.insert(subscriptions).values({ userId })
}

// ✅ Idempotente (usa upsert)
async function createSubscription(userId: string) {
  return db.insert(subscriptions).values({ userId })
    .onConflictDoUpdate({ userId })
}
```

---

## ⚡ RENDIMIENTO Y RECURSOS

### 🧵 Evitar Bloqueos del Event Loop
En Node.js, **nunca** realizar operaciones síncronas (`fs.readFileSync`) en rutas críticas. Todo debe ser asíncrono.

```typescript
// ❌ Bloquea el event loop
const data = fs.readFileSync('file.txt', 'utf8')

// ✅ Asíncrono
const data = await fs.readFile('file.txt', 'utf8')
```

---

### 📉 Optimización de Consultas
**Prohibido `SELECT *`**. Solo se piden los campos necesarios. Si hay un bucle que hace consultas, refactoriza a un JOIN o IN clause (evitar el problema **N+1**).

```typescript
// ❌ N+1 problem
const users = await db.select().from(users)
for (const user of users) {
  const posts = await db.select().from(posts).where(eq(posts.userId, user.id))
}

// ✅ Una sola consulta
const data = await db.select({
  user: users,
  posts: posts,
}).from(users).leftJoin(posts, eq(users.id, posts.userId))
```

---

### 🖼️ Lazy Loading por Defecto
En Frontend, componentes pesados o rutas deben cargarse mediante **Code Splitting** para mantener un Lighthouse Score alto.

```typescript
// ✅ Cargar componente bajo demanda
const HeavyComponent = lazy(() => import('./HeavyComponent'))

<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>
```

---

## 🧹 LIMPIEZA Y MANTENIBILIDAD

### Naming Semántico
**Prohibidas** variables tipo `data`, `res` o `item`. Deben ser descriptivas: `userProfileResponse`, `filteredProductList`.

```typescript
// ❌ Nombres genéricos
const data = await api.fetch()
const res = processData(data)
const items = res.items

// ✅ Nombres semánticos
const userProfiles = await api.fetchUserProfiles()
const validatedProfiles = validateProfiles(userProfiles)
const filteredUsers = validatedProfiles.activeUsers
```

---

### Estado Inmutable
**Nunca** mutar objetos o arrays directamente. Usar spread operators o métodos que retornen nuevas instancias para evitar **side-effects** impredecibles.

```typescript
// ❌ Mutación directa
user.email = 'new@email.com'
orders.push(newOrder)

// ✅ Inmutable
const updatedUser = { ...user, email: 'new@email.com' }
const updatedOrders = [...orders, newOrder]
```

---

### Errores Tipificados
**No usar `throw new Error("error")`**. Definir clases de error personalizadas para un manejo profesional.

```typescript
// ❌ Genérico
throw new Error("Authentication failed")

// ✅ Tipificado
class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

throw new AuthError("Invalid credentials")
```

---

## 🔗 INTEGRACIÓN Y SEGURIDAD

### 🔑 Secretos en Entorno
**Nunca hardcodear credenciales**. Uso obligatorio de `.env` y verificación de que estas variables existen en el arranque del sistema (fail-fast).

```typescript
// ❌ NUNCA
const apiKey = "sk_live_1234567890"

// ✅ SIEMPRE
const apiKey = process.env.STRIPE_API_KEY
if (!apiKey) {
  throw new Error('STRIPE_API_KEY is not defined')
}
```

---

### 📝 Logs Estructurados
**No usar `console.log`**. Implementar logs con niveles (info, warn, error) y formato JSON para herramientas como Datadog o ELK Stack.

```typescript
// ❌ console.log
console.log('User created', user)

// ✅ Logger estructurado
logger.info('User created', {
  userId: user.id,
  email: user.email,
  timestamp: new Date().toISOString(),
  level: 'INFO'
})
```

---

## 📚 DOCUMENTACIÓN COMPLETA

### Para tareas específicas, consulta:

| Tarea | Módulo |
|-------|--------|
| **Reglas completas** | [docs/claude/04-rules.md](./docs/claude/04-rules.md) |
| **Patrones tRPC/Drizzle** | [docs/claude/05-patterns.md](./docs/claude/05-patterns.md) |
| **Stack tecnológico** | [docs/claude/07-stack.md](./docs/claude/07-stack.md) |
| **Testing** | [docs/claude/09-testing.md](./docs/claude/09-testing.md) |
| **Seguridad** | [docs/claude/10-security.md](./docs/claude/10-security.md) |
| **FAQ + Comandos** | [docs/claude/11-faq.md](./docs/claude/11-faq.md) |

### Referencia completa (56K tokens):

- **CLAUDE.md** - Documentación completa y detallada
- **Buscar keyword:** Usa herramienta Grep sobre CLAUDE.md

---

## 🎯 FLUJO DE TRABAJO RECOMENDADO

```
1. Leo CLAUDE-CORE.md (5 min) ✅ Ahora
   ↓
2. Identifico mi tarea
   ↓
3. Consulto módulo específico (3-5 min)
   ↓
4. Verifico checkpoint protocol
   ↓
5. Implemento siguiendo el patrón
   ↓
6. Pre-commit checklist
   ↓
7. Commit
```

---

## ⚡ RECURSOS RÁPIDOS

**Scripts útiles:**
```bash
pnpm preflight        # Pre-flight checks (2 min)
pnpm typecheck        # TypeScript check
pnpm lint             # Linter
pnpm test             # Tests unitarios
pnpm test:e2e         # Tests E2E
pnpm db:studio        # Drizzle Studio
```

**Git restore desde producción:**
```bash
git checkout main -- archivo.tsx
```

**Limpiar cache Next.js:**
```bash
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules/.cache
```

---

## 🪟 PARA DEVELOPERS EN WINDOWS: USA WINDOWS NATIVO

**⚠️ IMPORTANTE:** WSL2 no es recomendado para este repo por inestabilidad observada. El entorno soportado es Windows con PowerShell.

### Por qué Windows nativo es la opción estable aquí

| Aspecto | Windows nativo |
|---------|----------------|
| **Emojis en código** | ✅ Bloqueo preventivo antes de dev/build |
| **Cache Next.js** | 🟡 Controlable con limpieza guiada |
| **Scripts PowerShell** | ✅ Integrados y probados |
| **Tooling del repo** | ✅ Alineado con scripts existentes |

### Setup Windows (5 minutos)

```powershell
# 1. Verificar Node.js 20+ instalado
node -v

# 2. Instalar pnpm (si falta)
npm install -g pnpm

# 3. Instalar dependencias
cd C:\Quoorum
pnpm install

# 4. Iniciar servidor (bloquea emojis antes de levantar)
pnpm dev:no-fix
```

**Guía completa:** [docs/claude/11-faq.md#windows-setup](./docs/claude/11-faq.md)

### Reglas prácticas

- ✅ Ejecuta `pnpm check:emoji` si sospechas de errores UTF-8
- ✅ Usa `pnpm dev:no-fix` para evitar hooks pesados
- ✅ Limpia cache con `Remove-Item -Recurse -Force .next` cuando HMR falle

---

## 💡 CUANDO TIENES DUDAS

1. ✅ **Busca en CLAUDE.md:** Usa Grep con keyword
2. ✅ **Consulta ejemplos:** Busca código similar en el proyecto
3. ✅ **Pregunta ANTES:** No asumas, verifica primero
4. ❌ **NO inventes:** No crees estructuras nuevas sin aprobar

---

_Este archivo resume las reglas esenciales. Para detalles completos, ver [CLAUDE.md](./CLAUDE.md)_
