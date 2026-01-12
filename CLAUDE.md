# 🤖 CLAUDE.md — Sistema de Instrucciones para IA

> **Versión:** 1.10.0 | **Última actualización:** 31 Dic 2025
> **Para:** Cualquier IA (Claude, GPT, Copilot, etc.) que trabaje en este proyecto

---

## 🚨 PROTOCOLO DE INICIO OBLIGATORIO

**ANTES de escribir una sola línea de código, LEE estos archivos EN ORDEN:**

| Orden | Archivo            | Propósito                | Tiempo |
| ----- | ------------------ | ------------------------ | ------ |
| 1     | `CLAUDE.md` (este) | Reglas inviolables       | 5 min  |
| 2     | `SYSTEM.md`        | Arquitectura completa    | 10 min |
| 3     | `PHASES.md`        | Fase actual del proyecto | 3 min  |
| 4     | `STACK.md`         | Tecnologías permitidas   | 5 min  |
| 5     | `STANDARDS.md`     | Estándares de código     | 15 min |

**⚠️ Si no lees estos archivos primero, tu código será rechazado.**

---

## ⚡ REGLA #0: HERRAMIENTAS DEDICADAS > BASH

**ANTES de ejecutar CUALQUIER comando bash, DETENTE y pregunta:**

### ❓ ¿Existe una herramienta específica para esto?

```
❌ PROHIBIDO en bash:
   grep    → ✅ USA: Herramienta Grep
   sed     → ✅ USA: Herramienta Edit (con replace_all)
   awk     → ✅ USA: Herramienta Edit
   cat     → ✅ USA: Herramienta Read
   head    → ✅ USA: Herramienta Read (con limit)
   tail    → ✅ USA: Herramienta Read (con offset)
   find    → ✅ USA: Herramienta Glob
   echo    → ✅ USA: Texto directo en respuesta

✅ PERMITIDO en bash:
   git, npm, pnpm, docker, mv, rm, mkdir, ls, cd
   (comandos de sistema que no tienen herramienta dedicada)
```

### 🚨 Consecuencias de violar esta regla:

- ❌ El commit será RECHAZADO
- ❌ El código será revertido
- ❌ Pérdida de tiempo y credibilidad

### 💡 Ejemplo CORRECTO vs INCORRECTO:

```bash
# ❌ INCORRECTO - Usar sed para editar
sed -i 's/trpc\./api\./g' file.tsx

# ✅ CORRECTO - Usar herramienta Edit
<invoke name="Edit">
  <parameter name="file_path">file.tsx</parameter>
  <parameter name="old_string">trpc.</parameter>
  <parameter name="new_string">api.</parameter>
  <parameter name="replace_all">true</parameter>
</invoke>
```

```bash
# ❌ INCORRECTO - Usar grep en bash
grep -r "pattern" src/

# ✅ CORRECTO - Usar herramienta Grep
<invoke name="Grep">
  <parameter name="pattern">pattern</parameter>
  <parameter name="path">src/</parameter>
</invoke>
```

**🎯 REGLA DE ORO:** Si estás escribiendo `grep`, `sed`, `awk`, `cat`, `find` → PARA y usa la herramienta dedicada.

---

## 🛑 CHECKPOINT PROTOCOL

**ANTES de ejecutar cualquier acción importante, CONSULTA la sección relevante de CLAUDE.md.**

### 📋 Tabla de Checkpoints Obligatorios

| 🎯 Acción que vas a hacer      | 📖 Sección a consultar                                                    | 🔍 Qué verificar                                                 |
| ------------------------------ | ------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **Usar herramienta `Bash`**    | [Regla #0](#-regla-0-herramientas-dedicadas--bash)                        | ¿Contiene grep/sed/awk/cat/find? → Usar herramienta dedicada     |
| **Modificar landing page**     | [Regla #9: Landing Page](#9--landing-page-componentes-oficiales-únicos)   | ⚠️ Solo componentes oficiales - NO usar \_archived/              |
| **Modificar dashboard webapp** | [Regla #10: Dashboard](#10--dashboard-webapp-estructura-oficial-única)    | ⚠️ ÚNICO archivo - PointsWidget OBLIGATORIO                      |
| **Restaurar desde producción** | [Git: Restaurar Producción](#git-restaurar-desde-producción)              | ⚠️ SIEMPRE `git checkout main --` NO copiar de otras ubicaciones |
| **Crear nuevo archivo**        | [Estructura de Archivos](#-estructura-de-archivos)                        | ¿Está en la ubicación correcta? ¿Ya existe?                      |
| **Escribir componente**        | [Estructura de Componentes](#estructura-de-componentes)                   | Orden: hooks → state → handlers → effects → render               |
| **Editar archivo existente**   | [Reglas Inviolables #1](#1--siempre-leer-documentación-primero)           | ¿Lo leí con `Read` primero?                                      |
| **Crear tRPC router**          | [tRPC Router Pattern](#1-trpc-router-pattern)                             | Validación Zod + filtro userId + error handling                  |
| **Crear schema DB**            | [Schema Drizzle Pattern](#2-schema-drizzle-pattern)                       | Timestamps + relations + types inferidos                         |
| **Hacer query a DB**           | [Reglas Inviolables #5](#5--seguridad-validar-todo-confiar-en-nada)       | ¿Filtra por `userId`? ¿Validación Zod?                           |
| **Hacer commit**               | [Checklist Pre-Commit](#-checklist-pre-commit)                            | TypeCheck + Lint + Tests + No console.log                        |
| **Crear nueva feature**        | [Orden de Desarrollo](#7--orden-de-desarrollo-backend-first)              | Backend First: Schema → Router → Tests → UI                      |
| **Usar `any` o `@ts-ignore`**  | [Prohibiciones Absolutas](#-prohibiciones-absolutas)                      | ❌ NUNCA - Buscar alternativa correcta                           |
| **Añadir `console.log`**       | [Prohibiciones Absolutas](#-prohibiciones-absolutas)                      | ❌ NUNCA en prod - Usar logger estructurado                      |
| **Duplicar código**            | [Reglas Inviolables #3](#3--arquitectura-respetar-separación-de-concerns) | ¿Puedo extraer función/componente reutilizable?                  |
| **Cambiar imports**            | [Orden de Imports](#orden-de-imports-fijo)                                | React → Third-party → Internal → Local → Types                   |
| **Manejar errores**            | [Seguridad](#-seguridad)                                                  | Validación + Autorización + Sanitización                         |
| **Escribir tests**             | [Testing](#-testing)                                                      | Coverage mínimo 80% + Test cases críticos                        |
| **Usar `--no-verify`**         | [Cross-Platform Hooks](#️-compatibilidad-cross-platform-pre-commit-hooks)  | ⚠️ Solo si hook falla por entorno + verificar manualmente        |
| **Verificar CI/CD**            | [CI/CD - GitHub Actions](#-cicd---github-actions)                         | ¿Pipeline pasó? ¿Qué job falló?                                  |

### 🚨 PROCESO OBLIGATORIO:

```
1. Identifico qué acción voy a hacer
   ↓
2. Consulto tabla de checkpoints
   ↓
3. Leo la sección relevante de CLAUDE.md
   ↓
4. Verifico que mi acción cumple las reglas
   ↓
5. SOLO ENTONCES ejecuto la acción
```

### ⚡ Ejemplo de uso correcto:

```
Yo pienso: "Voy a crear un nuevo router tRPC para gestionar notificaciones"
         ↓
Consulto tabla: "Crear tRPC router → Ver [tRPC Router Pattern]"
         ↓
Leo sección tRPC Router Pattern (líneas ~750-900)
         ↓
Verifico mi plan:
  ✅ Schemas de validación Zod al inicio
  ✅ Filtrado por userId en queries
  ✅ Error handling con TRPCError
  ✅ Mutations con onSuccess callbacks
         ↓
Ejecuto: Creo el router siguiendo el patrón exacto
```

**💡 TIP:** Si tienes duda sobre tu acción, es señal de que DEBES consultar CLAUDE.md primero.

---

## 📋 ÍNDICE DE SECCIONES

0. [⚡ Regla #0: Herramientas Dedicadas](#-regla-0-herramientas-dedicadas--bash)
1. [🛑 Checkpoint Protocol](#-checkpoint-protocol)
2. [Reglas Inviolables](#-reglas-inviolables)
3. [Stack Tecnológico](#-stack-tecnológico)
4. [Estructura de Archivos](#-estructura-de-archivos)
5. [Convenciones de Código](#-convenciones-de-código)
6. [Patrones Obligatorios](#-patrones-obligatorios)
7. [Prohibiciones Absolutas](#-prohibiciones-absolutas)
8. [Seguridad](#-seguridad)
9. [Testing](#-testing)
10. [CI/CD - GitHub Actions](#-cicd---github-actions)
11. [Checklist Pre-Commit](#-checklist-pre-commit)
12. [FAQ](#-faq)
13. [Comandos Útiles](#-comandos-útiles)

---

## 🔴 REGLAS INVIOLABLES

### Estas reglas son NO NEGOCIABLES. Cualquier violación será RECHAZADA.

### 1. 📖 SIEMPRE LEER DOCUMENTACIÓN PRIMERO

```
✅ CORRECTO:
1. Leer CLAUDE.md → SYSTEM.md → PHASES.md
2. Entender la arquitectura actual
3. Verificar en qué fase estamos
4. LUEGO escribir código

❌ INCORRECTO:
- Empezar a codear directamente
- Asumir la arquitectura
- Inventar estructuras nuevas
- Ignorar documentación existente
```

### 2. 🚫 ZERO TOLERANCE: Datos Mock en Producción

```typescript
// ✅ CORRECTO: API real con error handling
const { data, error, isLoading } = api.clients.list.useQuery()
if (error) return <ErrorState message={error.message} />
if (isLoading) return <Skeleton />
return <ClientList data={data} />

// ❌ INCORRECTO: Fallback a mock data
const { data } = api.clients.list.useQuery()
const finalData = data || MOCK_CLIENTS // ❌ NUNCA
```

**Por qué:** La integridad del producto depende de datos reales.

### 3. 🏗️ ARQUITECTURA: Respetar Separación de Concerns

```
✅ CORRECTO:
- Componentes de UI → /components/
- Lógica de negocio → /services/ o /lib/
- Acceso a datos → /api/ o routers tRPC
- Tipos → /types/ o colocados con su módulo

❌ INCORRECTO:
- Lógica de negocio en componentes
- Queries SQL en componentes
- Fetch directo en UI
- Mezclar capas
```

### 4. 📝 TYPESCRIPT: Tipado Estricto Obligatorio

```typescript
// ✅ CORRECTO
function getClient(id: string): Promise<Client | null> {
  return db.query.clients.findFirst({ where: eq(clients.id, id) })
}

// ❌ INCORRECTO
function getClient(id: any): any {
  // NO usar any
  return db.query.clients.findFirst({ where: eq(clients.id, id) })
}
```

### 5. 🔐 SEGURIDAD: Validar Todo, Confiar en Nada

```typescript
// ✅ CORRECTO: Validación con Zod + filtro por userId
const schema = z.object({
  clientId: z.string().uuid(),
  name: z.string().min(1).max(100),
})

const [client] = await db
  .select()
  .from(clients)
  .where(
    and(
      eq(clients.id, input.clientId),
      eq(clients.userId, ctx.userId) // ⚠️ OBLIGATORIO
    )
  )

// ❌ INCORRECTO: Sin validación ni autorización
const client = await db.select().from(clients).where(eq(clients.id, id))
```

### 6. 🧪 TESTING: No Commit Sin Tests

```
✅ CORRECTO:
- Función nueva → Test nuevo
- Bug fix → Test que reproduce el bug
- Coverage mínimo: 80%

❌ INCORRECTO:
- Commit sin tests
- Tests que no verifican nada
- Coverage < 80%
```

### 7. 🔄 ORDEN DE DESARROLLO: Backend First

```
✅ CORRECTO (Orden):
1. Definir schema/tipos
2. Crear migraciones DB
3. Crear endpoint/router
4. Escribir tests del endpoint
5. Crear componente UI
6. Escribir tests del componente

❌ INCORRECTO:
1. Crear UI primero
2. Usar datos mock
3. "Backend después"
```

### 8. 📦 COMMITS: Atómicos y Descriptivos

```bash
# ✅ CORRECTO
git commit -m "feat(clients): add create client endpoint with validation"
git commit -m "fix(auth): resolve token expiration issue"
git commit -m "test(clients): add unit tests for client service"

# ❌ INCORRECTO
git commit -m "fix"
git commit -m "wip"
git commit -m "changes"
git commit -m "asdfasdf"
```

### 9. 🎨 LANDING PAGE: Componentes Oficiales ÚNICOS

```
⚠️ LA LANDING TIENE UNA ÚNICA VERSIÓN OFICIAL
Commit: 786d2d2 (16 Dic 2024, 23:11)
Versión FINAL Y DEFINITIVA - NO modificar sin autorización

✅ COMPONENTES OFICIALES (en orden):
1. FomoBanner
2. MarketingHeader
3. Hero - "Tu mejor vendedor ahora vive en WhatsApp"
4. TrustBar
5. ProblemSection
6. SolutionSection - Grid 2x4 (8 características):
   - Fila 1: 🧠 💬 ⏱️ 🤝
   - Fila 2: 🗣️ 🔥 📅 🛡️
7. CopilotSection
8. SafeZoneSection
9. TestimonialsSection - 🏠 Inmobiliarias, 🚗 Concesionarios, 🏥 Clínicas
10. PricingSection - Starter 29€ + Pro 49€
11. FAQ
12. FinalCTA
13. MarketingFooter

❌ NUNCA usar componentes de _archived/:
- PainPoints, Features, Differentiation
- TargetAudience, ProfessionalFilter
- AddonsSection, QROnboarding, CTASection
- WhatsAppMagicCTA

⚠️ Si necesitas modificar la landing:
1. CONSULTA primero
2. NUNCA restaures versiones antiguas
3. DOCUMENTA cambios en commit
```

### 10. 📊 DASHBOARD (WEBAPP): Estructura Oficial ÚNICA

```
⚠️ EL DASHBOARD TIENE UNA ÚNICA VERSIÓN OFICIAL
Archivo: apps/web/src/app/dashboard/page.tsx
Versión ACTUAL - NO crear duplicados ni versiones alternativas

✅ ESTRUCTURA OFICIAL DEL DASHBOARD:

HEADER:
- Título: "Bienvenido a Wallie"
- Fecha actual

SECCIÓN 1 - Quick Stats (4 cards):
1. Total Clientes → /clients
2. Conversaciones → /conversations
3. Mensajes este mes → /stats
4. Ingresos Cerrados → /stats

SECCIÓN 2 - AI Suggested Reminders:
- Componente: <SuggestedReminders />

SECCIÓN 3 - Main Grid (2 columnas):
COLUMNA IZQUIERDA (col-span-2):
  - Actividad Reciente (Unified Inbox: WhatsApp + Email)
  - Lista de mensajes recientes con indicadores de canal
  - Link a /inbox

COLUMNA DERECHA (col-span-1):
  1. **GAMIFICACIÓN** → <PointsWidget />
     - Puntos totales y nivel
     - Barra de progreso
     - Referidos y recompensas
     - Link a /dashboard/store

  2. Acciones Rápidas
     - Nuevo Cliente → /clients
     - Ver Estadísticas → /stats
     - Configurar IA → /settings

  3. AI Efficiency Card
     - % Pods vs Brains
     - Ahorro estimado

  4. Tip del día

✅ COMPONENTES CLAVE:
- apps/web/src/app/dashboard/page.tsx (PRINCIPAL)
- apps/web/src/components/dashboard/points-widget.tsx (GAMIFICACIÓN - OBLIGATORIO)
- apps/web/src/components/dashboard/suggested-reminders.tsx
- apps/web/src/app/stats/page.tsx (Estadísticas detalladas)

❌ NO EXISTE dashboard duplicado:
- NO hay versión en (dashboard) route group
- NO hay versión alternativa
- El ÚNICO dashboard es apps/web/src/app/dashboard/page.tsx

⚠️ Si necesitas modificar el dashboard:
1. SOLO edita apps/web/src/app/dashboard/page.tsx
2. NUNCA crees versiones duplicadas
3. El PointsWidget DEBE estar siempre visible (gamificación)
4. DOCUMENTA cambios en commit
```

### 11. 🏗️ REGLA DE ORO: No Tablas Sin Workers

````
⚠️ REGLA DE INTEGRIDAD DE DATOS CRÍTICA

"No se crea una tabla en Supabase/PostgreSQL si no viene acompañada
del Worker que la alimenta con datos reales."

✅ PROCESO CORRECTO:
1. Diseñar tabla en schema Drizzle
2. Crear worker que inserta/actualiza datos
3. Registrar worker en packages/workers/src/index.ts
4. Verificar que el worker se ejecuta en producción
5. SOLO ENTONCES hacer push del schema a Supabase

❌ PROHIBIDO:
- Crear tabla "para el futuro"
- Dejar tablas vacías esperando "implementación posterior"
- Usar valores hardcodeados (const = 50) en lugar de AI real
- Workers "rule-based" (regex) cuando se prometió AI/LLM

🔍 DETECTOR DE CASCARONES (Audit Checklist):
Antes de cada PR, verificar que NO existen:

1. **Valores Hardcodeados**:
   ❌ const intentScore = 30 // Default
   ❌ const sentimentScore = 50 // Hardcoded
   ❌ return 0.3 // Mock value
   ✅ const score = await analyzeWithAI(message)

2. **Workers Fantasma**:
   ❌ Tabla existe → 0 filas en producción
   ❌ Worker usa regex patterns en lugar de LLM
   ✅ Worker con llamadas a OpenAI/Anthropic/Gemini
   ✅ Tabla se llena automáticamente con datos reales

3. **Promesas Incumplidas de API**:
   ❌ return { mock: true, data: [] } // Placeholder
   ❌ // TODO: implement real logic
   ✅ Real DB queries con validación Zod

📊 EJEMPLO DE TABLA CORRECTA vs INCORRECTA:

❌ INCORRECTO (Cascarón Vacío):
```typescript
// Schema existe
export const messageEmotions = pgTable('message_emotions', { ... })

// Worker existe PERO usa regex en lugar de AI
function analyzeEmotionRuleBased(text: string) {
  if (/feliz|contento/.test(text)) return { emotion: 'happy', score: 0.8 }
  return { emotion: 'neutral', score: 0.5 } // Hardcoded
}
````

✅ CORRECTO (Con AI Real):

```typescript
// Schema existe
export const messageEmotions = pgTable('message_emotions', { ... })

// Worker usa AI REAL (OpenAI/Claude/Gemini)
async function analyzeEmotion(text: string) {
  const aiClient = getAIClient()
  const response = await aiClient.generateWithSystem(
    systemPrompt,
    `Analiza: "${text}"`,
    { modelId: 'gpt-4o-mini', responseFormat: 'json' }
  )
  return JSON.parse(response.text) // Datos reales de AI
}
```

🚨 CONSECUENCIAS DE VIOLAR ESTA REGLA:

- Sistema con "Ferrari en ralentí" (143 tablas pero motor inactivo)
- Promesas de AI que en realidad son regex hardcoded
- Inversión en infraestructura sin ROI
- Pérdida de confianza del usuario

💡 MANTRA DEL EQUIPO:
"Si el worker no llama a un LLM, no es Psychology Engine.
Si la tabla está vacía, no es funcionalidad."

````

### 12. 📊 TIMELINE: Registro Obligatorio de Todas las Acciones

```
⚠️ REGLA DE TRAZABILIDAD Y AUDITORÍA

"Toda acción debe quedar registrada en TIMELINE.md con timestamp,
archivos afectados y resultado para trazabilidad completa."

✅ PROCESO OBLIGATORIO PARA CADA ACCIÓN:
Después de CADA modificación de código, actualización, o tarea completada:

1. Abrir TIMELINE.md
2. Añadir nueva entrada con formato estándar:
   - Timestamp: [YYYY-MM-DD HH:MM]
   - Tipo de acción: FEATURE / BUGFIX / REFACTOR / CONFIG / etc.
   - Solicitado por: Usuario / Sistema
   - Descripción: Qué se pidió hacer
   - Acciones realizadas: Lista detallada
   - Archivos afectados: Rutas completas
   - Resultado: ✅ Éxito / ❌ Error / ⚠️ Parcial
   - Notas: Observaciones adicionales

❌ PROHIBIDO:
- Hacer cambios sin documentar en Timeline
- Documentar solo al final de la sesión (debe ser en tiempo real)
- Omitir archivos afectados
- No especificar resultado

🔍 FORMATO ESTÁNDAR (copiar y adaptar):
```markdown
### [HH:MM] - TÍTULO DE LA ACCIÓN
**Solicitado por:** Usuario / Sistema
**Descripción:** Breve descripción de qué se pidió
**Acciones realizadas:**
- Acción 1 realizada
- Acción 2 realizada
**Archivos afectados:**
- /ruta/completa/archivo1.tsx
- /ruta/completa/archivo2.ts
**Resultado:** ✅ Éxito / ❌ Error / ⚠️ Parcial
**Notas:** Observaciones importantes, problemas encontrados, decisiones tomadas
---
```

📋 CASOS DE USO:
- ✅ Debugging: "¿Qué cambió cuando dejó de funcionar X?"
- ✅ Onboarding: "¿Qué hemos hecho en las últimas 2 semanas?"
- ✅ Rollback: "¿Qué archivos debo revertir para deshacer Y?"
- ✅ Auditoría: "¿Quién modificó Z y por qué?"
- ✅ Aprendizaje: "¿Cómo se solucionó el error W la última vez?"

🚨 CONSECUENCIAS DE NO DOCUMENTAR:
- Pérdida de trazabilidad de cambios
- Imposibilidad de debugging efectivo
- Repetición de errores ya resueltos
- Tiempo perdido buscando "¿qué hicimos?"
- Desorganización del equipo

💡 TIPS:
- Documentar MIENTRAS haces el cambio, no después
- Ser específico con nombres de archivos (rutas completas)
- Incluir números de línea si es relevante
- Si algo falló, documentar QUÉ se intentó y POR QUÉ falló
- Relacionar acciones con issues/PRs si aplica
```

---

## 🛠️ STACK TECNOLÓGICO

### Stack Aprobado (NO cambiar sin autorización)

| Categoría           | Tecnología                            | Alternativas Prohibidas                 |
| ------------------- | ------------------------------------- | --------------------------------------- |
| **Framework**       | Next.js 14+ (App Router)              | Pages Router, Remix, Gatsby             |
| **Lenguaje**        | TypeScript 5+ (strict)                | JavaScript puro                         |
| **Estilos**         | Tailwind CSS + shadcn/ui              | CSS Modules, styled-components, Emotion |
| **API**             | tRPC v11+                             | REST directo, GraphQL                   |
| **ORM**             | Drizzle ORM                           | Prisma, TypeORM, Sequelize              |
| **Database**        | PostgreSQL (Supabase)                 | MongoDB, MySQL, Firebase                |
| **Auth**            | Supabase Auth                         | NextAuth, Clerk, Auth0                  |
| **Validación**      | Zod                                   | Yup, Joi, class-validator               |
| **State**           | Zustand / TanStack Query              | Redux, MobX, Recoil                     |
| **Testing**         | Vitest + Playwright                   | Jest (excepto legacy)                   |
| **IA**              | OpenAI / Anthropic / Google AI / Groq | Modelos no aprobados explícitamente     |
| **Monorepo**        | Turborepo + pnpm                      | npm, yarn workspaces                    |
| **Monitoring**      | Sentry                                | Alternativas sin aprobar                |
| **Analytics**       | PostHog                               | Mixpanel, Amplitude                     |
| **Background Jobs** | Inngest                               | BullMQ, Agenda                          |
| **GPU Computing**   | RunPod                                | AWS SageMaker, Google Cloud AI          |

### Librerías Aprobadas

```json
{
  "ui": ["@radix-ui/*", "lucide-react", "framer-motion", "sonner"],
  "forms": ["react-hook-form", "@hookform/resolvers"],
  "dates": ["date-fns"],
  "utils": ["clsx", "tailwind-merge", "superjson"],
  "charts": ["recharts"],
  "tables": ["@tanstack/react-table"],
  "emails": ["@react-email/*", "resend"],
  "files": ["uploadthing", "@vercel/blob"],
  "ai": [
    "openai",
    "@anthropic-ai/sdk",
    "@google/generative-ai",
    "groq-sdk",
    "langchain",
    "@langchain/openai",
    "@langchain/anthropic"
  ],
  "monitoring": ["@sentry/nextjs", "@sentry/node"],
  "analytics": ["posthog-js", "posthog-node"],
  "jobs": ["inngest"],
  "messaging": ["@emoji-mart/*"],
  "pdf": ["@react-pdf/renderer", "jspdf"],
  "whatsapp": ["@whiskeysockets/baileys"],
  "rate-limiting": ["@upstash/ratelimit", "@upstash/redis"],
  "linkedin": ["linkedin-api-client"],
  "voice": ["elevenlabs"],
  "gpu-computing": ["@runpod/mcp-server"]
}
````

---

## 📁 ESTRUCTURA DE ARCHIVOS

### Monorepo Structure

```
proyecto/
├── apps/
│   ├── web/                    # Aplicación principal Next.js
│   │   ├── src/
│   │   │   ├── app/           # App Router pages
│   │   │   │   ├── (auth)/    # Grupo: páginas de auth
│   │   │   │   ├── (dashboard)/ # Grupo: dashboard
│   │   │   │   ├── (marketing)/ # Grupo: landing, pricing
│   │   │   │   ├── api/       # Route handlers
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── components/    # Componentes específicos de app
│   │   │   │   ├── ui/        # Componentes UI base (shadcn)
│   │   │   │   ├── forms/     # Componentes de formularios
│   │   │   │   ├── layouts/   # Layouts reutilizables
│   │   │   │   └── [feature]/ # Por feature
│   │   │   ├── hooks/         # Custom hooks
│   │   │   ├── lib/           # Utilidades
│   │   │   │   ├── utils.ts
│   │   │   │   ├── trpc.ts
│   │   │   │   └── auth.ts
│   │   │   ├── styles/        # Estilos globales
│   │   │   └── types/         # Tipos locales
│   │   ├── public/            # Assets estáticos
│   │   └── tests/             # Tests E2E
│   │
│   └── docs/                   # Documentación (opcional)
│
├── packages/
│   ├── agents/                 # Agentes IA especializados
│   │   ├── src/
│   │   │   ├── agents/        # Email handler, calendar, prospecting, etc
│   │   │   │   ├── email-handler.ts    # Gestión emails con IA
│   │   │   │   ├── calendar.ts         # Integración Google Calendar
│   │   │   │   └── prospecting.ts      # Lead generation
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── ai/                     # Lógica de IA core
│   │   ├── src/
│   │   │   ├── providers/     # OpenAI, Anthropic, Google, Groq
│   │   │   │   ├── openai.ts
│   │   │   │   ├── anthropic.ts
│   │   │   │   ├── google.ts
│   │   │   │   └── groq.ts
│   │   │   ├── prompts/       # Templates de prompts
│   │   │   ├── utils/         # Utilidades IA (token counting, etc)
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── api/                    # tRPC routers
│   │   ├── src/
│   │   │   ├── routers/       # Routers por dominio
│   │   │   │   ├── auth.ts
│   │   │   │   ├── clients.ts
│   │   │   │   ├── conversations.ts
│   │   │   │   ├── messages.ts
│   │   │   │   ├── gmail.ts
│   │   │   │   ├── rewards.ts
│   │   │   │   ├── ai.ts
│   │   │   │   ├── voice.ts
│   │   │   │   ├── wallie.ts
│   │   │   │   ├── whatsapp.ts
│   │   │   │   ├── whatsapp-connections.ts
│   │   │   │   ├── admin-growth.ts
│   │   │   │   ├── integrations.ts
│   │   │   │   ├── support.ts
│   │   │   │   ├── sessions.ts
│   │   │   │   ├── referrals.ts
│   │   │   │   ├── addons.ts
│   │   │   │   ├── phone-auth.ts
│   │   │   │   ├── magic-link.ts
│   │   │   │   ├── whatsapp-magic-login.ts
│   │   │   │   ├── onboarding-analysis.ts
│   │   │   │   └── index.ts
│   │   │   ├── lib/           # Utilidades del API
│   │   │   │   ├── logger.ts       # Logger estructurado (Sentry)
│   │   │   │   ├── google-gmail.ts # Cliente Gmail
│   │   │   │   ├── voice.ts        # ElevenLabs integration
│   │   │   │   ├── tier-limits.ts  # Rate limiting por plan
│   │   │   │   └── rule-evaluator.ts # Sistema de reglas
│   │   │   ├── trpc.ts        # Config tRPC
│   │   │   └── root.ts        # Root router
│   │   └── package.json
│   │
│   ├── auth/                   # Autenticación y autorización
│   │   ├── src/
│   │   │   ├── middleware.ts  # Auth middleware
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── baileys-worker/         # Worker para WhatsApp Baileys (QR code)
│   │   ├── src/
│   │   │   ├── server.ts      # Express server
│   │   │   ├── sessions.ts    # Session management
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── db/                     # Database layer
│   │   ├── src/
│   │   │   ├── schema/        # Schemas Drizzle
│   │   │   │   ├── users.ts
│   │   │   │   ├── clients.ts
│   │   │   │   ├── conversations.ts
│   │   │   │   ├── messages.ts
│   │   │   │   ├── rewards.ts
│   │   │   │   ├── subscriptions.ts
│   │   │   │   ├── dynamic-plans.ts
│   │   │   │   ├── email.ts
│   │   │   │   ├── integrations.ts
│   │   │   │   ├── support-tickets.ts
│   │   │   │   ├── feedback.ts
│   │   │   │   ├── growth.ts
│   │   │   │   └── index.ts
│   │   │   ├── migrations/    # SQL migrations
│   │   │   ├── seed/          # Seed data
│   │   │   ├── scripts/       # DB scripts
│   │   │   ├── client.ts      # DB client
│   │   │   └── index.ts
│   │   ├── drizzle.config.ts
│   │   └── package.json
│   │
│   ├── email/                  # Emails transaccionales
│   │   ├── src/
│   │   │   ├── templates/     # Plantillas React Email
│   │   │   ├── client.ts      # Resend client
│   │   │   ├── send.ts        # Funciones de envío
│   │   │   ├── logger.ts      # Logger local
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── growth-worker/          # Worker para growth/outbound (FastAPI)
│   │   ├── src/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── stripe/                 # Integración Stripe
│   │   ├── src/
│   │   │   ├── client.ts      # Stripe client
│   │   │   ├── webhooks.ts    # Webhook handlers
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── types/                  # Tipos compartidos
│   │   ├── src/
│   │   │   ├── index.ts       # Re-exports
│   │   │   └── shared.ts      # Tipos comunes
│   │   └── package.json
│   │
│   ├── ui/                     # Componentes compartidos
│   │   ├── src/
│   │   │   ├── components/    # shadcn/ui components
│   │   │   ├── hooks/         # Custom hooks
│   │   │   ├── utils.ts       # cn() y utilidades
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── whatsapp/               # Integración WhatsApp (Cloud API + Baileys)
│   │   ├── src/
│   │   │   ├── client.ts      # WhatsApp Cloud API client
│   │   │   ├── chakra-client.ts # Chakra BSP client
│   │   │   ├── service.ts     # Servicio híbrido
│   │   │   ├── webhook.ts     # Webhook handler
│   │   │   ├── logger.ts      # Logger local
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── workers/                # Background workers (Inngest)
│       ├── src/
│       │   ├── functions/     # Funciones worker
│       │   │   ├── audio-received.ts
│       │   │   ├── campaign-scheduler.ts
│       │   │   ├── client-churn-detection.ts
│       │   │   ├── conversation-analysis.ts
│       │   │   ├── data-backup.ts
│       │   │   ├── gmail-sync.ts
│       │   │   ├── knowledge-ingestion.ts
│       │   │   ├── linkedin-sync.ts
│       │   │   ├── outlook-sync.ts
│       │   │   ├── referral-invites.ts
│       │   │   ├── sequence-runner.ts
│       │   │   └── weekly-report.ts
│       │   └── index.ts
│       └── package.json
│
├── docs/                       # Documentación del proyecto
│   ├── CLAUDE.md              # ⭐ Este archivo
│   ├── SYSTEM.md
│   ├── PHASES.md
│   ├── STACK.md
│   ├── STANDARDS.md
│   ├── API.md
│   └── DEPLOYMENT.md
│
├── scripts/                    # Scripts de utilidad
│   ├── setup.sh
│   ├── verify.sh
│   ├── pre-commit-validation.ps1
│   └── deploy.sh
│
├── .env.example
├── .gitignore
├── .eslintrc.cjs              # ESLint config (enforces no-console, no-explicit-any)
├── .husky/                    # Git hooks
│   └── pre-commit            # Pre-commit validation
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

### 📦 Paquetes Actuales vs Arquitectura Ideal

**Nota Importante:** La estructura actual difiere ligeramente de la arquitectura ideal documentada en versiones anteriores. Los paquetes actuales reflejan la evolución orgánica del proyecto y están **todos en uso activo en producción**.

#### Paquetes Implementados (Estado Actual)

| Paquete           | Estado     | Propósito                                                                                                | Dependencias Clave                 |
| ----------------- | ---------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `agents/`         | ✅ Activo  | Agentes IA especializados (email, calendar)                                                              | Langchain, OpenAI                  |
| `ai/`             | ✅ Activo  | Core de IA (providers, prompts, utils)                                                                   | OpenAI, Anthropic, Google AI, Groq |
| `api/`            | ✅ Activo  | tRPC routers (35+ endpoints)                                                                             | tRPC, Zod, Sentry                  |
| `auth/`           | ✅ Activo  | Autenticación Supabase                                                                                   | Supabase Auth                      |
| `baileys-worker/` | ✅ Activo  | WhatsApp Baileys (QR code flow)                                                                          | @whiskeysockets/baileys            |
| `db/`             | ✅ Activo  | Database layer (13 schemas)                                                                              | Drizzle ORM, PostgreSQL            |
| `email/`          | ✅ Activo  | Emails transaccionales                                                                                   | Resend, React Email                |
| `forum/` ⭐       | ✅ Activo  | Sistema de foros dinámico con IA (orquestador de debates, consenso, exportación PDF, búsqueda vectorial) | OpenAI, Pinecone, Puppeteer, Redis |
| `growth-worker/`  | ⚠️ Externo | Growth/outbound automation (servicio externo Python/FastAPI, no incluido en workspace)                   | Python/FastAPI (servicio externo)  |
| `realtime/` ⭐    | ✅ Activo  | Integración Pusher para comunicación en tiempo real (hooks React + cliente/servidor)                     | Pusher, pusher-js                  |
| `stripe/`         | ✅ Activo  | Pagos y suscripciones                                                                                    | Stripe SDK                         |
| `types/`          | ✅ Activo  | Tipos compartidos                                                                                        | TypeScript                         |
| `ui/`             | ✅ Activo  | Componentes UI (shadcn/ui)                                                                               | Radix UI, Tailwind                 |
| `whatsapp/`       | ✅ Activo  | WhatsApp Cloud API + Chakra BSP                                                                          | WhatsApp Cloud API                 |
| `workers/`        | ✅ Activo  | Background jobs (12 workers)                                                                             | Inngest                            |

#### Paquetes No Implementados (Futuro)

| Paquete         | Estado       | Razón                                             | Prioridad |
| --------------- | ------------ | ------------------------------------------------- | --------- |
| `integrations/` | 📋 Pendiente | Integraciones (LinkedIn, Outlook) están en `api/` | Media     |
| `config/`       | 📋 Pendiente | Configuraciones están en root y packages          | Baja      |

**Decisión Arquitectónica:** Mantener la estructura actual porque:

1. ✅ **Funciona en producción** - No hay bugs relacionados con estructura
2. ✅ **Cohesión lógica** - Los routers de integración (gmail, linkedin) viven naturalmente en `api/`
3. ✅ **Menos overhead** - Evita capa adicional de abstracción
4. ⚠️ **Deuda técnica controlada** - Documentada y justificada

#### 🎯 Paquetes Destacados: Forum y Realtime

##### 📊 @wallie/forum - Sistema de Debates AI Multi-Agente

**Propósito:** Simula debates entre múltiples agentes AI para validar decisiones complejas antes de tomar acciones. Utiliza un sistema de consenso inteligente y búsqueda vectorial con Pinecone para encontrar debates similares.

**Arquitectura Técnica:**

```typescript
packages/forum/
├── src/
│   ├── index.ts              // Export principal
│   ├── runner.ts             // Orquestación de debates (máx. 20 rondas)
│   ├── consensus.ts          // Algoritmo de consenso (score 0-1, threshold 70%)
│   ├── pdf-export.ts         // Exportar debates a PDF (Puppeteer)
│   ├── ai-assistant.ts       // Agentes AI especializados (optimizer, critic, analyst, synthesizer)
│   ├── websocket-server.ts   // Server WebSocket para debates en vivo
│   ├── integrations/
│   │   ├── pinecone.ts       // Búsqueda vectorial de debates similares
│   │   ├── redis.ts          // Cache de debates y resultados
│   │   └── serper.ts         // Búsqueda web para contexto adicional
│   └── types.ts              // Tipos TypeScript (DebateResult, ConsensusResult, etc.)
```

**Algoritmo de Consenso:**

1. **Extracción de Opciones:** Analiza mensajes de todos los agentes para identificar opciones propuestas
2. **Ranking por Success Rate:** Calcula probabilidad de éxito para cada opción (0-100%)
3. **Criterios de Consenso:**
   - Consenso fuerte: Top option ≥ 70% success rate
   - Gap significativo: Diferencia ≥ 30% con segunda opción
   - Mínimo 3 rondas completadas
4. **Decisión:** Continúa hasta consenso o máximo 20 rondas

**Búsqueda Vectorial con Pinecone:**

- Embeddings generados con `text-embedding-3-small` (1536 dimensiones)
- Índice Pinecone: `forum-debates` (configurable via `PINECONE_INDEX`)
- Búsqueda por similitud semántica de preguntas
- Filtros: `userId`, `minConsensus`, `topK` (default: 5)

**Exports principales:**

```typescript
import { runDebate } from '@wallie/forum'
import { exportDebateToPDF } from '@wallie/forum/pdf-export'
import { createAIAssistant } from '@wallie/forum/ai-assistant'
import { searchSimilarDebates } from '@wallie/forum/integrations/pinecone'
```

**Casos de uso:**

- Validación de decisiones estratégicas (inversiones, contratos, estrategias)
- Análisis de deals complejos desde múltiples perspectivas
- Generación de reportes de consenso con ranking de opciones
- Debates en vivo visibles para el usuario (WebSocket)
- Reutilización de debates similares (Pinecone)

**Dependencias clave:**

- `openai`: Agentes AI (GPT-4o, GPT-4o-mini)
- `@pinecone-database/pinecone`: Vector DB para búsqueda semántica
- `puppeteer`: Generación de PDFs desde HTML
- `redis`: Cache de debates (TTL: 1h debates, 5min listas)
- `ws`: WebSockets para debates en tiempo real
- `zod`: Validación de schemas

**Configuración requerida:**

```env
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...
PINECONE_INDEX=forum-debates
REDIS_URL=redis://localhost:6379
```

##### 🔴 @wallie/realtime - Comunicación Real-Time

**Propósito:** Gestiona comunicación bidireccional en tiempo real mediante WebSockets usando Pusher (compatible con Pusher Cloud y Soketi self-hosted).

**Arquitectura Técnica:**

```typescript
packages/realtime/
├── src/
│   ├── index.ts                    // Re-exports
│   ├── pusher-server.ts            // Server-side Pusher client (singleton)
│   ├── pusher-client.ts            // Client-side Pusher client (singleton)
│   ├── types.ts                    // Tipos TypeScript (MessageEvent, etc.)
│   └── hooks/
│       ├── use-realtime-messages.ts    // Hook para mensajes en tiempo real
│       └── use-realtime-notifications.ts // Hook para notificaciones
```

**Canales y Eventos:**

- **Canales de Usuario:** `user-${userId}` - Notificaciones personales
- **Canales de Conversación:** `conversation-${conversationId}` - Mensajes y typing
- **Canales de Presencia:** `presence-${roomId}` - Estado online/offline
- **Eventos:** `new-message`, `typing`, `notification`, `conversation-update`

**Exports principales:**

```typescript
// Server-side (API routes, tRPC)
import {
  getPusherServer,
  broadcastNewMessage,
  broadcastNotification,
  broadcastTyping,
  broadcastConversationUpdate,
} from '@wallie/realtime'

// Client-side (React components)
import {
  useRealtimeMessages,
  useRealtimeNotifications,
} from '@wallie/realtime/hooks'
```

**Hooks React:**

1. **`useRealtimeMessages(conversationId, options)`**
   - Suscripción automática a mensajes de conversación
   - Estado de typing en tiempo real
   - Auto-reconexión en caso de desconexión
   - Cleanup automático al desmontar

2. **`useRealtimeNotifications(userId, options)`**
   - Notificaciones personales del usuario
   - Contador de no leídas
   - Filtrado por tipo de notificación

**Casos de uso:**

- Notificaciones en tiempo real (nuevos mensajes, deals cerrados, menciones)
- Debates de forum en vivo (actualizaciones de rondas)
- Presencia de usuarios (quién está online en una conversación)
- Indicadores de typing (usuario está escribiendo)
- Sincronización de estados entre tabs del navegador
- Actualizaciones de conversaciones (nuevos participantes, cambios de estado)

**Dependencias clave:**

- `pusher`: Server-side SDK (Node.js)
- `pusher-js`: Client-side SDK (Browser)

**Configuración requerida:**

```env
PUSHER_APP_ID=...
PUSHER_KEY=...
PUSHER_SECRET=...
PUSHER_CLUSTER=eu  # o us-east-1, etc.
PUSHER_USE_TLS=true
```

**Compatibilidad:**

- ✅ Pusher Cloud (hosted)
- ✅ Soketi (self-hosted, compatible con Pusher protocol)
- ✅ Auto-detección de disponibilidad (graceful degradation)

### Dónde Poner Cada Cosa

| Tipo de Archivo       | Ubicación                            | Ejemplo                        |
| --------------------- | ------------------------------------ | ------------------------------ |
| Página nueva          | `apps/web/src/app/`                  | `(dashboard)/clients/page.tsx` |
| Componente de página  | `apps/web/src/components/`           | `clients/client-card.tsx`      |
| Componente compartido | `packages/ui/`                       | `button.tsx`, `dialog.tsx`     |
| Hook custom           | `apps/web/src/hooks/`                | `use-debounce.ts`              |
| API endpoint          | `packages/api/src/routers/`          | `clients.ts`                   |
| Schema DB             | `packages/db/src/schema/`            | `clients.ts`                   |
| Utilidad              | `apps/web/src/lib/`                  | `format-currency.ts`           |
| Tipo global           | `packages/db/src/schema/` (inferido) | —                              |
| Tipo local            | `apps/web/src/types/`                | `client.types.ts`              |
| Test unitario         | `[module]/__tests__/`                | `client.test.ts`               |
| Test E2E              | `apps/web/tests/`                    | `clients.spec.ts`              |
| Prompt IA             | `packages/ai/src/prompts/`           | `sales-assistant.ts`           |
| Email template        | `packages/email/src/templates/`      | `welcome.tsx`                  |

---

## 📝 CONVENCIONES DE CÓDIGO

### Naming Conventions

```typescript
// ═══════════════════════════════════════════════════════════
// COMPONENTES: PascalCase
// ═══════════════════════════════════════════════════════════
export function ClientCard() {} // ✅
export function clientCard() {} // ❌
export function Client_Card() {} // ❌

// Archivos de componentes: kebab-case
// client-card.tsx ✅
// ClientCard.tsx ❌
// client_card.tsx ❌

// ═══════════════════════════════════════════════════════════
// HOOKS: camelCase con prefijo "use"
// ═══════════════════════════════════════════════════════════
export function useClientData() {} // ✅
export function useClient() {} // ✅
export function clientHook() {} // ❌
export function UseClient() {} // ❌

// Archivos de hooks: use-[nombre].ts
// use-client-data.ts ✅

// ═══════════════════════════════════════════════════════════
// FUNCIONES/UTILS: camelCase
// ═══════════════════════════════════════════════════════════
export function formatCurrency() {} // ✅
export function FormatCurrency() {} // ❌
export function format_currency() {} // ❌

// ═══════════════════════════════════════════════════════════
// CONSTANTES: SCREAMING_SNAKE_CASE
// ═══════════════════════════════════════════════════════════
export const MAX_RETRY_COUNT = 3 // ✅
export const API_BASE_URL = '...' // ✅
export const maxRetryCount = 3 // ❌

// ═══════════════════════════════════════════════════════════
// TIPOS E INTERFACES
// ═══════════════════════════════════════════════════════════
// Tipos: PascalCase (sin prefijo)
type Client = {} // ✅
type TClient = {} // ⚠️ Aceptable
type client = {} // ❌

// Interfaces: PascalCase (sin prefijo I)
interface ClientProps {} // ✅
interface IClientProps {} // ⚠️ Evitar

// Props de componentes: [Componente]Props
interface ClientCardProps {} // ✅

// ═══════════════════════════════════════════════════════════
// ENUMS: PascalCase con valores SCREAMING_SNAKE
// ═══════════════════════════════════════════════════════════
enum ClientStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
}

// ═══════════════════════════════════════════════════════════
// ARCHIVOS Y CARPETAS: kebab-case
// ═══════════════════════════════════════════════════════════
// client-card.tsx ✅
// ClientCard.tsx ❌
// client_card.tsx ❌
// client-data/ ✅
// clientData/ ❌
```

### Orden de Imports (Fijo)

```typescript
// ═══════════════════════════════════════════════════════════
// 1. React y Next.js (siempre primero)
// ═══════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

// ═══════════════════════════════════════════════════════════
// 2. Librerías de terceros
// ═══════════════════════════════════════════════════════════
import { format, formatDistance } from 'date-fns'
import { es } from 'date-fns/locale'
import { z } from 'zod'
import { toast } from 'sonner'

// ═══════════════════════════════════════════════════════════
// 3. Packages internos del monorepo (@proyecto/*)
// ═══════════════════════════════════════════════════════════
import { db } from '@proyecto/db'
import { api } from '@proyecto/api'
import { Button, Card } from '@proyecto/ui'
import { generateMessage } from '@proyecto/ai'

// ═══════════════════════════════════════════════════════════
// 4. Imports locales (relativos) - por categoría
// ═══════════════════════════════════════════════════════════
// 4a. Componentes
import { ClientCard } from '@/components/clients/client-card'
import { Skeleton } from '@/components/ui/skeleton'

// 4b. Hooks
import { useDebounce } from '@/hooks/use-debounce'

// 4c. Utils/Lib
import { formatCurrency, cn } from '@/lib/utils'

// 4d. Constantes/Config
import { ROUTES } from '@/config/routes'

// ═══════════════════════════════════════════════════════════
// 5. Types (SIEMPRE al final, con "import type")
// ═══════════════════════════════════════════════════════════
import type { Client, Message } from '@proyecto/db/schema'
import type { RouterOutputs } from '@proyecto/api'
```

### Estructura de Componentes

```typescript
// ═══════════════════════════════════════════════════════════
// TEMPLATE DE COMPONENTE ESTÁNDAR
// ═══════════════════════════════════════════════════════════

'use client' // Solo si es necesario (hooks de cliente)

// --- Imports (en orden) ---
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

import { toast } from 'sonner'

import { api } from '@proyecto/api'
import { Button } from '@proyecto/ui'

import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'

import type { Client } from '@proyecto/db/schema'

// --- Tipos/Interfaces del componente ---
interface ClientDetailProps {
  clientId: string
  onUpdate?: (client: Client) => void
}

// --- Componente ---
export function ClientDetail({ clientId, onUpdate }: ClientDetailProps) {
  // ═══════════════════════════════════════════════════════
  // 1. HOOKS (siempre al inicio)
  // ═══════════════════════════════════════════════════════
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)

  // Queries
  const { data: client, isLoading, error } = api.clients.getById.useQuery(
    { id: clientId },
    { enabled: !!clientId }
  )

  // Mutations
  const updateClient = api.clients.update.useMutation({
    onSuccess: (data) => {
      toast.success('Cliente actualizado')
      onUpdate?.(data)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  // ═══════════════════════════════════════════════════════
  // 2. ESTADO DERIVADO / COMPUTADO
  // ═══════════════════════════════════════════════════════
  const fullName = client ? `${client.name} ${client.lastName}` : ''
  const isActive = client?.status === 'ACTIVE'

  // ═══════════════════════════════════════════════════════
  // 3. HANDLERS / CALLBACKS
  // ═══════════════════════════════════════════════════════
  const handleSubmit = useCallback(async (formData: FormData) => {
    const name = formData.get('name') as string
    await updateClient.mutateAsync({ id: clientId, name })
  }, [clientId, updateClient])

  const handleCancel = useCallback(() => {
    setIsEditing(false)
  }, [])

  // ═══════════════════════════════════════════════════════
  // 4. EFFECTS (minimizar, preferir react-query)
  // ═══════════════════════════════════════════════════════
  // useEffect solo cuando sea absolutamente necesario

  // ═══════════════════════════════════════════════════════
  // 5. EARLY RETURNS (loading, error, empty states)
  // ═══════════════════════════════════════════════════════
  if (isLoading) {
    return <ClientDetailSkeleton />
  }

  if (error) {
    return <ErrorState message={error.message} onRetry={() => router.refresh()} />
  }

  if (!client) {
    return <EmptyState message="Cliente no encontrado" />
  }

  // ═══════════════════════════════════════════════════════
  // 6. RENDER PRINCIPAL
  // ═══════════════════════════════════════════════════════
  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{fullName}</h1>
        <Button onClick={() => setIsEditing(true)}>Editar</Button>
      </header>

      <div className="grid gap-4">
        {/* Contenido */}
      </div>
    </div>
  )
}

// --- Subcomponentes privados (si son pequeños) ---
function ClientDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}
```

---

## 🎯 PATRONES OBLIGATORIOS

### 1. tRPC Router Pattern

```typescript
// packages/api/src/routers/clients.ts
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure, publicProcedure } from '../trpc'
import { db } from '@proyecto/db'
import { clients } from '@proyecto/db/schema'
import { eq, and, desc, like } from 'drizzle-orm'

// ═══════════════════════════════════════════════════════════
// SCHEMAS DE VALIDACIÓN (colocar al inicio)
// ═══════════════════════════════════════════════════════════
const createClientSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100),
  email: z.string().email('Email inválido').optional(),
  phone: z
    .string()
    .regex(/^\+?[0-9]{9,15}$/, 'Teléfono inválido')
    .optional(),
  notes: z.string().max(500).optional(),
})

const updateClientSchema = createClientSchema.partial().extend({
  id: z.string().uuid(),
})

const listClientsSchema = z.object({
  limit: z.number().min(1).max(100).default(50),
  cursor: z.string().uuid().optional(),
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ALL']).default('ALL'),
})

// ═══════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════
export const clientsRouter = router({
  // -----------------------------------------------------------
  // LIST: Obtener lista paginada
  // -----------------------------------------------------------
  list: protectedProcedure.input(listClientsSchema).query(async ({ ctx, input }) => {
    const { limit, cursor, search, status } = input

    // Construir condiciones
    const conditions = [eq(clients.userId, ctx.userId)]

    if (status !== 'ALL') {
      conditions.push(eq(clients.status, status))
    }

    if (search) {
      conditions.push(like(clients.name, `%${search}%`))
    }

    if (cursor) {
      conditions.push(gt(clients.createdAt, cursor))
    }

    const results = await db
      .select()
      .from(clients)
      .where(and(...conditions))
      .orderBy(desc(clients.createdAt))
      .limit(limit + 1) // +1 para saber si hay más

    let nextCursor: string | undefined
    if (results.length > limit) {
      const nextItem = results.pop()
      nextCursor = nextItem?.id
    }

    return {
      items: results,
      nextCursor,
    }
  }),

  // -----------------------------------------------------------
  // GET BY ID: Obtener uno por ID
  // -----------------------------------------------------------
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [client] = await db
        .select()
        .from(clients)
        .where(
          and(
            eq(clients.id, input.id),
            eq(clients.userId, ctx.userId) // ⚠️ SIEMPRE filtrar
          )
        )

      if (!client) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Cliente no encontrado',
        })
      }

      return client
    }),

  // -----------------------------------------------------------
  // CREATE: Crear nuevo
  // -----------------------------------------------------------
  create: protectedProcedure.input(createClientSchema).mutation(async ({ ctx, input }) => {
    const [client] = await db
      .insert(clients)
      .values({
        ...input,
        userId: ctx.userId, // ⚠️ SIEMPRE asignar
        status: 'ACTIVE',
      })
      .returning()

    return client
  }),

  // -----------------------------------------------------------
  // UPDATE: Actualizar existente
  // -----------------------------------------------------------
  update: protectedProcedure.input(updateClientSchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input

    // Verificar propiedad
    const [existing] = await db
      .select({ id: clients.id })
      .from(clients)
      .where(and(eq(clients.id, id), eq(clients.userId, ctx.userId)))

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Cliente no encontrado',
      })
    }

    const [updated] = await db
      .update(clients)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(clients.id, id))
      .returning()

    return updated
  }),

  // -----------------------------------------------------------
  // DELETE: Eliminar (soft delete preferido)
  // -----------------------------------------------------------
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verificar propiedad
      const [existing] = await db
        .select({ id: clients.id })
        .from(clients)
        .where(and(eq(clients.id, input.id), eq(clients.userId, ctx.userId)))

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Cliente no encontrado',
        })
      }

      // Soft delete
      await db
        .update(clients)
        .set({
          deletedAt: new Date(),
          status: 'DELETED',
        })
        .where(eq(clients.id, input.id))

      return { success: true }
    }),
})
```

### 2. Schema Drizzle Pattern

```typescript
// packages/db/src/schema/clients.ts
import { pgTable, uuid, varchar, text, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'
import { messages } from './messages'

// ═══════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════
export const clientStatusEnum = pgEnum('client_status', [
  'ACTIVE',
  'INACTIVE',
  'PENDING',
  'DELETED',
])

// ═══════════════════════════════════════════════════════════
// TABLE
// ═══════════════════════════════════════════════════════════
export const clients = pgTable('clients', {
  // Primary key
  id: uuid('id').defaultRandom().primaryKey(),

  // Foreign keys
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Data fields
  name: varchar('name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  notes: text('notes'),

  // Status
  status: clientStatusEnum('status').notNull().default('ACTIVE'),

  // Metadata
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),

  // Timestamps (SIEMPRE incluir)
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

// ═══════════════════════════════════════════════════════════
// RELATIONS
// ═══════════════════════════════════════════════════════════
export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, {
    fields: [clients.userId],
    references: [users.id],
  }),
  messages: many(messages),
}))

// ═══════════════════════════════════════════════════════════
// TYPES (inferidos automáticamente)
// ═══════════════════════════════════════════════════════════
export type Client = typeof clients.$inferSelect
export type NewClient = typeof clients.$inferInsert
```

### 3. Server Action Pattern

```typescript
// apps/web/src/server/actions/clients.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { db } from '@proyecto/db'
import { clients } from '@proyecto/db/schema'
import { getCurrentUser } from '@/lib/auth'

// ═══════════════════════════════════════════════════════════
// SCHEMAS
// ═══════════════════════════════════════════════════════════
const createClientSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().optional(),
})

// ═══════════════════════════════════════════════════════════
// TYPE PARA RESPUESTA
// ═══════════════════════════════════════════════════════════
type ActionResult<T = void> = { success: true; data: T } | { success: false; error: string }

// ═══════════════════════════════════════════════════════════
// ACTIONS
// ═══════════════════════════════════════════════════════════
export async function createClient(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    // 1. Verificar autenticación
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'No autenticado' }
    }

    // 2. Parsear y validar input
    const rawData = {
      name: formData.get('name'),
      email: formData.get('email') || undefined,
      phone: formData.get('phone') || undefined,
    }

    const validatedData = createClientSchema.safeParse(rawData)
    if (!validatedData.success) {
      return {
        success: false,
        error: validatedData.error.errors[0]?.message || 'Datos inválidos',
      }
    }

    // 3. Crear en DB
    const [client] = await db
      .insert(clients)
      .values({
        ...validatedData.data,
        userId: user.id,
      })
      .returning({ id: clients.id })

    // 4. Revalidar caché
    revalidatePath('/clients')

    return { success: true, data: { id: client.id } }
  } catch (error) {
    console.error('Error creating client:', error)
    return { success: false, error: 'Error al crear cliente' }
  }
}

export async function deleteClient(id: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'No autenticado' }
    }

    // Soft delete con verificación de propiedad
    const result = await db
      .update(clients)
      .set({ deletedAt: new Date(), status: 'DELETED' })
      .where(and(eq(clients.id, id), eq(clients.userId, user.id)))
      .returning({ id: clients.id })

    if (result.length === 0) {
      return { success: false, error: 'Cliente no encontrado' }
    }

    revalidatePath('/clients')
    return { success: true, data: undefined }
  } catch (error) {
    console.error('Error deleting client:', error)
    return { success: false, error: 'Error al eliminar cliente' }
  }
}
```

---

## 🤖 AI RATE LIMITING & FALLBACK SYSTEM

### Arquitectura Multi-Proveedor

Wallie utiliza un sistema robusto de gestión de APIs de IA con:

- ✅ **5 proveedores** configurados (OpenAI, Anthropic, Gemini, Groq, DeepSeek)
- ✅ **Rate limiting local** (evita hit de límites de API)
- ✅ **Circuit breaker pattern** (detecta providers caídos)
- ✅ **Fallback automático** (cambia de proveedor en caso de error)
- ✅ **Quota monitoring** (alertas al 80% y 95%)
- ✅ **Cost tracking** (PostHog telemetry)

### 1. Rate Limiting Local (Token Bucket)

**Previene** hitting de rate limits ANTES de llamar a la API.

```typescript
import { getRateLimiterManager } from '@wallie/ai/lib/rate-limiter'

// En tu router/función
const rateLimiterManager = getRateLimiterManager()
const limiter = rateLimiterManager.getOrCreate('openai', 500, 800_000) // 500 RPM, 800k TPM

// ANTES de llamar a la API
await limiter.waitForCapacity(estimatedTokens)

// Ahora sí, llamar a la API
const response = await openai.chat.completions.create(...)
```

**Límites pre-configurados** (Free tier conservador):

| Provider  | RPM | TPM       | RPD    |
| --------- | --- | --------- | ------ |
| OpenAI    | 3   | 150,000   | 200    |
| Gemini    | 15  | 1,000,000 | 1,500  |
| Anthropic | 5   | 20,000    | 50     |
| Groq      | 30  | 14,400    | 14,400 |
| DeepSeek  | 60  | 100,000   | 10,000 |

### 2. Quota Monitoring (Alertas Automáticas)

**Monitorea** uso en tiempo real y alerta cuando se acerca al límite.

```typescript
import { getQuotaMonitor } from '@wallie/ai/lib/quota-monitor'

const quotaMonitor = getQuotaMonitor()

// Después de cada request
quotaMonitor.updateUsage('openai', 1, tokensUsed)

// Check si debemos cambiar de proveedor
if (quotaMonitor.shouldSwitchProvider('openai')) {
  // Switch to fallback
  logger.warn('[AI] Switching from OpenAI due to quota limits')
}

// Registrar callback para alertas
quotaMonitor.onAlert((alert) => {
  if (alert.type === 'critical') {
    // Notificar a admins
    void trackQuotaAlert(alert.provider, alert.metric, alert.percent, 'critical')
  }
})
```

**Alertas automáticas**:

- ⚠️ **Warning** al 80% de RPM/TPM/RPD
- 🚨 **Critical** al 95% de RPM/TPM/RPD
- ❌ **Exceeded** cuando se alcanza el 100%

### 3. Circuit Breaker Pattern

**Detecta** providers caídos y evita seguir intentando (fail fast).

```typescript
import { getFallbackManager } from '@wallie/ai/lib/fallback'

const fallbackManager = getFallbackManager()

// Check si el provider está disponible
if (!fallbackManager.isProviderAvailable('openai')) {
  logger.warn('[AI] OpenAI circuit open, using fallback')
  // Use fallback provider
}

// Registrar éxito/fallo
try {
  const response = await callOpenAI()
  fallbackManager.recordSuccess('openai')
} catch (error) {
  fallbackManager.recordFailure('openai', error)
  // Circuit se abre después de 5 errores en 1 minuto
  // Permanece abierto por 5 minutos
  // Auto-recovery cuando el proveedor se recupera
}
```

**Configuración Circuit Breaker**:

- **Failure Threshold**: 5 errores
- **Failure Window**: 60 segundos
- **Open Duration**: 5 minutos (luego half-open)
- **Half-Open Requests**: 1 (test de recuperación)

### 4. Fallback Chains (Provider Equivalents)

**Cambia automáticamente** a un proveedor equivalente si el primario falla.

```typescript
import { getFallbackManager } from '@wallie/ai/lib/fallback'

const fallbackManager = getFallbackManager()

// Get fallback chain for a model
const chain = fallbackManager.getFallbackChain('gpt-4o')
// Returns: claude-3-5-sonnet → gemini-1.5-pro → llama-3.3-70b

// Get next available fallback
const fallback = fallbackManager.getNextFallback('gpt-4o', ['openai'])
// Returns: { provider: 'anthropic', modelId: 'claude-3-5-sonnet-20241022', ... }
```

**Cadenas de Fallback Predefinidas**:

| Modelo Original   | Fallback 1    | Fallback 2    | Fallback 3 |
| ----------------- | ------------- | ------------- | ---------- |
| gpt-4o            | Claude Sonnet | Gemini Pro    | Groq Llama |
| gpt-4o-mini       | Claude Haiku  | Gemini Flash  | Groq Llama |
| claude-3-5-sonnet | GPT-4o        | Gemini Pro    | Groq Llama |
| claude-3-5-haiku  | GPT-4o-mini   | Gemini Flash  | Groq Llama |
| gemini-1.5-pro    | GPT-4o        | Claude Sonnet | Groq Llama |
| gemini-2.0-flash  | GPT-4o-mini   | Claude Haiku  | Groq Llama |

### 5. Retry con Exponential Backoff

**Reintentos inteligentes** con delay creciente y jitter.

```typescript
import { retryWithBackoff } from '@wallie/ai/lib/retry'

const response = await retryWithBackoff(
  async () => {
    return await openai.chat.completions.create(...)
  },
  {
    maxRetries: 5,
    initialDelay: 1000, // 1s
    maxDelay: 64000, // 64s
    backoffMultiplier: 2,
    jitter: true, // ±25% random variation
  }
)
```

**Delay progression** (con backoff multiplier 2x):

- Attempt 1: 1s ± 0.25s
- Attempt 2: 2s ± 0.5s
- Attempt 3: 4s ± 1s
- Attempt 4: 8s ± 2s
- Attempt 5: 16s ± 4s

**Respeta `Retry-After` header** de la API si existe.

### 6. Telemetry & Cost Tracking

**Envía métricas** a PostHog para análisis y alerting.

```typescript
import { trackAIRequest, calculateCost } from '@wallie/ai/lib/telemetry'

// Después de cada request
const cost = calculateCost(model, promptTokens, completionTokens)

await trackAIRequest({
  provider: 'openai',
  model: 'gpt-4o',
  promptTokens,
  completionTokens,
  totalTokens,
  latencyMs: Date.now() - startTime,
  success: true,
  costUsd: cost,
  userId: ctx.userId,
  feature: 'chat', // o 'analysis', 'voice', etc.
})
```

**Métricas rastreadas**:

- Total requests (success/failed)
- Avg latency por provider
- Total tokens consumidos
- Total cost USD
- Error rate
- Provider health status

### 7. Admin Dashboard

**Monitorea** todo desde `/admin/ai-usage`:

✅ **Provider Health** - Status de cada proveedor (healthy/degraded/down)
✅ **Quota Status** - Progress bars de RPM/TPM/RPD
✅ **Recent Alerts** - Últimas 20 alertas de cuota
✅ **Cost Estimate** - Costo actual + proyección mensual
✅ **Performance Metrics** - Latencia, success rate, tokens
✅ **Export Data** - CSV/JSON de métricas
✅ **Manual Controls** - Reset quotas, force close circuit

### 8. Patrón de Uso en Routers

**Ejemplo completo** de cómo usar el sistema en un router tRPC:

```typescript
import { getRateLimiterManager } from '@wallie/ai/lib/rate-limiter'
import { getQuotaMonitor } from '@wallie/ai/lib/quota-monitor'
import { getFallbackManager } from '@wallie/ai/lib/fallback'
import { retryWithBackoff } from '@wallie/ai/lib/retry'
import { trackAIRequest, calculateCost } from '@wallie/ai/lib/telemetry'

export const wallieRouter = router({
  chat: protectedProcedure
    .input(z.object({ message: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const startTime = Date.now()
      let provider = 'openai'
      let model = 'gpt-4o-mini'

      try {
        // 1. Check rate limits
        const limiter = getRateLimiterManager().get(provider)
        await limiter?.waitForCapacity(1000) // Estimate 1k tokens

        // 2. Check circuit breaker
        const fallbackManager = getFallbackManager()
        if (!fallbackManager.isProviderAvailable(provider)) {
          // Use fallback
          const fallback = fallbackManager.getNextFallback(model)
          if (fallback) {
            provider = fallback.provider
            model = fallback.modelId
          }
        }

        // 3. Make request with retry
        const response = await retryWithBackoff(async () => {
          return await openai.chat.completions.create({
            model,
            messages: [{ role: 'user', content: input.message }],
          })
        })

        // 4. Update metrics
        const quotaMonitor = getQuotaMonitor()
        quotaMonitor.updateUsage(provider, 1, response.usage?.total_tokens || 0)

        // 5. Track telemetry
        const cost = calculateCost(
          model,
          response.usage?.prompt_tokens || 0,
          response.usage?.completion_tokens || 0
        )

        void trackAIRequest({
          provider,
          model,
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
          latencyMs: Date.now() - startTime,
          success: true,
          costUsd: cost,
          userId: ctx.userId,
          feature: 'chat',
        })

        // 6. Record success
        fallbackManager.recordSuccess(provider)

        return response.choices[0]?.message.content
      } catch (error) {
        // Record failure
        fallbackManager.recordFailure(provider, error as Error)

        // Track failed request
        void trackAIRequest({
          provider,
          model,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          latencyMs: Date.now() - startTime,
          success: false,
          errorType: (error as Error).message,
          userId: ctx.userId,
          feature: 'chat',
        })

        throw error
      }
    }),
})
```

### 9. Actualizar Límites (Tier Upgrade)

**Cuando un proveedor cambia de tier**, actualizar límites:

```typescript
import { updateProviderQuotaLimits } from '@wallie/ai/lib/quota-monitor'
import { updateProviderLimits } from '@wallie/ai/lib/rate-limiter'

// Ejemplo: Upgrade a OpenAI Tier 2
updateProviderQuotaLimits('openai', {
  rpm: 5000,
  tpm: 2_000_000,
  rpd: 10_000,
  tier: 'Tier 2',
})

updateProviderLimits('openai', 5000, 2_000_000)
```

### 10. Testing & Debugging

**Helpers para testing**:

```typescript
// Reset all metrics (for tests)
import { resetAllMetrics } from '@wallie/ai/lib/telemetry'
resetAllMetrics()

// Reset all quotas
const quotaMonitor = getQuotaMonitor()
quotaMonitor.resetAllUsage()

// Force close circuit (manual recovery)
const fallbackManager = getFallbackManager()
fallbackManager.forceCloseCircuit('openai')

// Reset all provider health
fallbackManager.resetAllHealth()
```

### ⚠️ Reglas Importantes

1. ✅ **SIEMPRE** usar `waitForCapacity()` antes de llamar a una API de IA
2. ✅ **SIEMPRE** actualizar quota con `updateUsage()` después del request
3. ✅ **SIEMPRE** registrar success/failure con `recordSuccess()`/`recordFailure()`
4. ✅ **SIEMPRE** trackear telemetría con `trackAIRequest()`
5. ❌ **NUNCA** hacer requests directos sin pasar por el sistema de rate limiting
6. ❌ **NUNCA** ignorar circuit breaker status
7. ❌ **NUNCA** hardcodear límites de API (usar configuración centralizada)

### 📊 Monitoreo Continuo

**Acciones recomendadas**:

- 🔍 Revisar `/admin/ai-usage` diariamente
- 📧 Configurar alertas PostHog para quota > 80%
- 💰 Monitorear proyección de costos mensual
- 🚨 Investigar circuit breakers abiertos
- 📈 Analizar success rate por provider
- 🔄 Optimizar fallback chains según latencia

---

## ❌ PROHIBICIONES ABSOLUTAS

### NO hacer NUNCA

| ❌ Prohibido                   | ✅ Hacer en su lugar                        |
| ------------------------------ | ------------------------------------------- |
| `any`                          | Tipo explícito o `unknown` con type guard   |
| `as` type assertion            | Type guards o validación Zod                |
| `// @ts-ignore`                | Arreglar el tipo correctamente              |
| `// @ts-expect-error`          | Solo con comentario explicando por qué      |
| `console.log` en prod          | Logger estructurado (`pino`, etc.)          |
| `console.error` en prod        | Logger con contexto                         |
| SQL raw sin parametrizar       | Query builder (Drizzle)                     |
| Queries sin `userId`           | SIEMPRE filtrar por `userId`                |
| Secrets hardcodeados           | Variables de entorno                        |
| `.env` en git                  | `.env.example` sin valores reales           |
| `useEffect` para fetch         | tRPC/React Query o Server Components        |
| CSS inline                     | Tailwind classes                            |
| `!important`                   | Especificidad correcta                      |
| Comentarios obvios             | Código autoexplicativo                      |
| Código comentado               | Eliminar (está en git history)              |
| `var`                          | `const` o `let`                             |
| `==`                           | `===` (comparación estricta)                |
| Mutación de state directo      | `setState` o `immer`                        |
| `export default` (componentes) | Named exports                               |
| Archivos > 300 líneas          | Dividir en módulos                          |
| Funciones > 50 líneas          | Extraer helpers                             |
| Más de 3 niveles de nesting    | Early returns                               |
| Magic numbers                  | Constantes con nombre                       |
| Strings hardcodeados (UI)      | i18n o constantes                           |
| Promise sin manejar            | `void` explícito o `await` con try-catch    |
| `object[dynamicKey]` sin tipo  | Validar key es enum tipado + eslint-disable |
| Variable no usada sin `_`      | Prefijo `_` o eliminar si no es necesaria   |

### Ejemplos Específicos

```typescript
// ═══════════════════════════════════════════════════════════
// ANY
// ═══════════════════════════════════════════════════════════
// ❌ MAL
function process(data: any) {
  return data.value
}

// ✅ BIEN
function process(data: unknown) {
  if (isValidData(data)) {
    return data.value
  }
  throw new Error('Invalid data')
}

// ═══════════════════════════════════════════════════════════
// TYPE ASSERTION
// ═══════════════════════════════════════════════════════════
// ❌ MAL
const user = data as User

// ✅ BIEN
const userSchema = z.object({ id: z.string(), name: z.string() })
const user = userSchema.parse(data)

// ═══════════════════════════════════════════════════════════
// QUERIES SIN FILTRAR
// ═══════════════════════════════════════════════════════════
// ❌ MAL - Cualquier usuario puede ver cualquier cliente
const client = await db.select().from(clients).where(eq(clients.id, id))

// ✅ BIEN - Solo el propietario puede ver
const client = await db
  .select()
  .from(clients)
  .where(and(eq(clients.id, id), eq(clients.userId, ctx.userId)))

// ═══════════════════════════════════════════════════════════
// CONSOLE.LOG
// ═══════════════════════════════════════════════════════════
// ❌ MAL
console.log('User logged in', userId)

// ✅ BIEN
logger.info('User logged in', { userId, timestamp: new Date() })

// ═══════════════════════════════════════════════════════════
// SECRETS
// ═══════════════════════════════════════════════════════════
// ❌ MAL
const apiKey = 'sk-ant-api03-xxxxx'

// ✅ BIEN
const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

// ═══════════════════════════════════════════════════════════
// FLOATING PROMISES (ESLint: @typescript-eslint/no-floating-promises)
// ═══════════════════════════════════════════════════════════
// ❌ MAL - Promise ignorada (ESLint error)
const handleCopy = () => {
  navigator.clipboard.writeText(data) // Error: Promise returned is ignored
}

// ✅ BIEN - void explícito (fire-and-forget intencional)
const handleCopy = () => {
  void navigator.clipboard.writeText(data) // Explícitamente ignoramos el resultado
}

// ✅ BIEN - await con error handling
const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(data)
    toast.success('Copiado')
  } catch {
    toast.error('Error al copiar')
  }
}

// ═══════════════════════════════════════════════════════════
// OBJECT INJECTION (ESLint: security/detect-object-injection)
// ═══════════════════════════════════════════════════════════
// ❌ MAL - Acceso dinámico sin validar
function getConfig(key: string) {
  return CONFIG[key] // Vulnerable a prototype pollution
}

// ✅ BIEN - Key es enum tipado + eslint-disable con razón
type PersonaType = 'analytical' | 'driver' | 'expressive' | 'amiable'
const PERSONA_CONFIG: Record<PersonaType, Config> = { ... }

function getPersonaConfig(persona: PersonaType) {
  // eslint-disable-next-line security/detect-object-injection -- persona is strictly typed enum
  return PERSONA_CONFIG[persona] || PERSONA_CONFIG.analytical
}

// ✅ BIEN - Validación previa con Object.hasOwn
function getConfig(key: string) {
  if (Object.hasOwn(CONFIG, key)) {
    return CONFIG[key as keyof typeof CONFIG]
  }
  return undefined
}

// ═══════════════════════════════════════════════════════════
// UNUSED VARIABLES (ESLint: @typescript-eslint/no-unused-vars)
// ═══════════════════════════════════════════════════════════
// ❌ MAL - Variable no usada sin indicar
const { data, error, isLoading } = api.clients.list.useQuery()
// Si solo usas 'data', eslint marca error en error e isLoading

// ✅ BIEN - Prefijo underscore para variables ignoradas
const { data, error: _error, isLoading: _isLoading } = api.clients.list.useQuery()

// ✅ BIEN - Solo extraer lo necesario
const { data } = api.clients.list.useQuery()

// ✅ MEJOR - Usar la propiedad directamente si solo necesitas data
const clientsQuery = api.clients.list.useQuery()
return <List data={clientsQuery.data} />

// ═══════════════════════════════════════════════════════════
// tRPC TYPE INFERENCE (Nuevos routers)
// ═══════════════════════════════════════════════════════════
// ❌ MAL - Nuevo router causa "unsafe" en cliente
// Si añades router sin regenerar tipos, TypeScript no infiere

// ✅ BIEN - Patrón para routers con datos complejos
// Añadir eslint-disable a nivel de archivo si TypeScript no infiere
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */

// ✅ MEJOR - Casting explícito con tipos conocidos
const trend = emotionalData?.trend as
  | 'improving'
  | 'stable'
  | 'declining'
  | 'insufficient_data'
  | undefined

// ✅ IDEAL - Definir tipos en packages/types y reusar
import type { EmotionalTrend } from '@wallie/types'
const trend: EmotionalTrend = emotionalData?.trend
```

---

## 🔐 SEGURIDAD

### Checklist de Seguridad (Obligatorio)

```typescript
// ═══════════════════════════════════════════════════════════
// 1. VALIDACIÓN DE INPUT (Zod en TODOS los endpoints)
// ═══════════════════════════════════════════════════════════
const schema = z
  .object({
    id: z.string().uuid(),
    email: z.string().email().max(255),
    phone: z.string().regex(/^\+?[0-9]{9,15}$/),
    amount: z.number().positive().max(1000000),
  })

  // ═══════════════════════════════════════════════════════════
  // 2. AUTORIZACIÓN (verificar propiedad SIEMPRE)
  // ═══════════════════════════════════════════════════════════
  // En CADA query/mutation que accede a datos de usuario:
  .where(
    and(
      eq(table.id, input.id),
      eq(table.userId, ctx.userId) // ← NUNCA OLVIDAR
    )
  )

// ═══════════════════════════════════════════════════════════
// 3. SANITIZACIÓN DE OUTPUT (no exponer datos sensibles)
// ═══════════════════════════════════════════════════════════
// ❌ MAL - Expone todo
return user

// ✅ BIEN - Solo campos necesarios
return {
  id: user.id,
  name: user.name,
  email: user.email,
  // NO incluir: password, tokens, internal IDs, etc.
}

// ═══════════════════════════════════════════════════════════
// 4. RATE LIMITING (en endpoints públicos y sensibles)
// ═══════════════════════════════════════════════════════════
import { ratelimit } from '@/lib/ratelimit'

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return Response.json({ error: 'Too many requests' }, { status: 429 })
  }
  // ... continuar
}

// ═══════════════════════════════════════════════════════════
// 5. VERIFICACIÓN DE WEBHOOKS
// ═══════════════════════════════════════════════════════════
import { createHmac, timingSafeEqual } from 'crypto'

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(payload).digest('hex')

  return timingSafeEqual(Buffer.from(signature), Buffer.from(`sha256=${expected}`))
}

export async function POST(req: Request) {
  const signature = req.headers.get('x-hub-signature-256')
  const body = await req.text()

  if (!signature || !verifyWebhookSignature(body, signature, WEBHOOK_SECRET)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }
  // ... procesar
}

// ═══════════════════════════════════════════════════════════
// 6. HEADERS DE SEGURIDAD (en next.config.js)
// ═══════════════════════════════════════════════════════════
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

// ═══════════════════════════════════════════════════════════
// 7. VARIABLES DE ENTORNO
// ═══════════════════════════════════════════════════════════
// Usar @t3-oss/env-nextjs para validar en build time
import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    ANTHROPIC_API_KEY: z.string().min(1),
    WEBHOOK_SECRET: z.string().min(32),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
})
```

### Git Secrets (Obligatorio)

```bash
# Instalar git-secrets (PRIMER DÍA)
brew install git-secrets  # macOS
# o
sudo apt-get install git-secrets  # Linux

# Configurar en el repo
cd proyecto
git secrets --install
git secrets --register-aws  # Detecta AWS keys

# Añadir patrones custom
git secrets --add 'sk-ant-[a-zA-Z0-9]+'  # Anthropic
git secrets --add 'sk_live_[a-zA-Z0-9]+'  # Stripe live
git secrets --add 'password\s*=\s*.+'     # Passwords
git secrets --add 'secret\s*=\s*.+'       # Secrets

# Verificar antes de commit
git secrets --scan
```

### Git: Restaurar desde Producción

**⚠️ REGLA CRÍTICA:** Cuando necesites restaurar código de producción a develop, **SIEMPRE** usa `git checkout main --`

```bash
# ✅ CORRECTO - Restaurar desde main (producción)
git checkout main -- apps/web/src/app/page.tsx
git checkout main -- apps/web/src/app/(marketing)/layout.tsx

# Verificar que coincide con producción
git diff main develop -- apps/web/src/app/page.tsx

# ❌ INCORRECTO - Copiar de otra ubicación
# NO copies desde /marketing/, /backup/, o cualquier otra carpeta
# SIEMPRE restaura desde la rama main
```

**Checklist obligatorio:**

1. ✅ **Verificar diferencias primero:**

   ```bash
   git diff main develop -- archivo.tsx
   ```

2. ✅ **Restaurar desde main:**

   ```bash
   git checkout main -- archivo.tsx
   ```

3. ✅ **Verificar que el contenido es idéntico:**

   ```bash
   git diff main -- archivo.tsx  # Debe mostrar "no differences"
   ```

4. ✅ **Build local para verificar:**

   ```bash
   pnpm build
   ```

5. ✅ **Commit con mensaje claro:**
   ```bash
   git commit -m "fix: restore [archivo] from production (main)"
   ```

**Por qué esto es crítico:**

- ❌ **Error del 16 Dic 2025:** Landing page machacada porque se copió desde `/marketing/page.tsx` en lugar de restaurar desde `main`
- ✅ **Solución:** Siempre verificar que el archivo en main es el correcto ANTES de restaurar
- ⚠️ **Consecuencia:** Mezclar versiones diferentes puede romper producción

**Caso de uso real - Landing page:**

```bash
# Usuario reporta: "Landing rota en develop, no es la misma que producción"

# ❌ MAL - Asumir que otra ubicación tiene la versión correcta
git show develop:apps/web/src/app/marketing/page.tsx > apps/web/src/app/page.tsx

# ✅ BIEN - Verificar y restaurar desde main
git diff main develop -- apps/web/src/app/page.tsx  # Ver diferencias
git checkout main -- apps/web/src/app/page.tsx       # Restaurar
pnpm build                                            # Verificar build
git add apps/web/src/app/page.tsx
git commit -m "fix(landing): restore production landing from main"
```

---

## 🧪 TESTING

### Estructura de Tests

```
packages/
  api/
    src/
      routers/
        clients.ts
        __tests__/
          clients.test.ts      # Unit tests del router
  db/
    src/
      __tests__/
        client.test.ts         # Tests de schema/queries

apps/
  web/
    src/
      components/
        clients/
          __tests__/
            client-card.test.tsx  # Tests de componentes
    tests/
      e2e/
        clients.spec.ts        # Tests E2E
```

### Ejemplo: Test de Router tRPC

```typescript
// packages/api/src/routers/__tests__/clients.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createCaller } from '../../root'
import { db } from '@proyecto/db'
import { clients, users } from '@proyecto/db/schema'
import { eq } from 'drizzle-orm'

// ═══════════════════════════════════════════════════════════
// SETUP
// ═══════════════════════════════════════════════════════════
const TEST_USER_ID = 'test-user-123'

async function createTestUser() {
  await db.insert(users).values({
    id: TEST_USER_ID,
    email: 'test@example.com',
    name: 'Test User',
  })
}

async function cleanupTestData() {
  await db.delete(clients).where(eq(clients.userId, TEST_USER_ID))
  await db.delete(users).where(eq(users.id, TEST_USER_ID))
}

// ═══════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════
describe('clients router', () => {
  beforeEach(async () => {
    await createTestUser()
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  describe('create', () => {
    it('should create a client with valid data', async () => {
      const caller = createCaller({ userId: TEST_USER_ID })

      const client = await caller.clients.create({
        name: 'Juan García',
        email: 'juan@example.com',
        phone: '+34612345678',
      })

      expect(client).toMatchObject({
        name: 'Juan García',
        email: 'juan@example.com',
        phone: '+34612345678',
        userId: TEST_USER_ID,
        status: 'ACTIVE',
      })
      expect(client.id).toBeDefined()
    })

    it('should reject invalid email', async () => {
      const caller = createCaller({ userId: TEST_USER_ID })

      await expect(
        caller.clients.create({
          name: 'Juan García',
          email: 'invalid-email',
        })
      ).rejects.toThrow('Email inválido')
    })

    it('should reject empty name', async () => {
      const caller = createCaller({ userId: TEST_USER_ID })

      await expect(caller.clients.create({ name: '' })).rejects.toThrow('Nombre requerido')
    })
  })

  describe('getById', () => {
    it('should return client for owner', async () => {
      const caller = createCaller({ userId: TEST_USER_ID })

      // Crear cliente
      const created = await caller.clients.create({ name: 'Test Client' })

      // Obtener
      const client = await caller.clients.getById({ id: created.id })

      expect(client.id).toBe(created.id)
      expect(client.name).toBe('Test Client')
    })

    it('should NOT return client for non-owner', async () => {
      const ownerCaller = createCaller({ userId: TEST_USER_ID })
      const otherCaller = createCaller({ userId: 'other-user' })

      // Crear como owner
      const created = await ownerCaller.clients.create({ name: 'Test Client' })

      // Intentar acceder como otro usuario
      await expect(otherCaller.clients.getById({ id: created.id })).rejects.toThrow('NOT_FOUND')
    })
  })

  describe('list', () => {
    it("should only return user's own clients", async () => {
      const caller = createCaller({ userId: TEST_USER_ID })

      // Crear 3 clientes
      await caller.clients.create({ name: 'Client 1' })
      await caller.clients.create({ name: 'Client 2' })
      await caller.clients.create({ name: 'Client 3' })

      const result = await caller.clients.list({ limit: 10 })

      expect(result.items).toHaveLength(3)
      expect(result.items.every((c) => c.userId === TEST_USER_ID)).toBe(true)
    })

    it('should paginate correctly', async () => {
      const caller = createCaller({ userId: TEST_USER_ID })

      // Crear 5 clientes
      for (let i = 0; i < 5; i++) {
        await caller.clients.create({ name: `Client ${i}` })
      }

      // Primera página
      const page1 = await caller.clients.list({ limit: 2 })
      expect(page1.items).toHaveLength(2)
      expect(page1.nextCursor).toBeDefined()

      // Segunda página
      const page2 = await caller.clients.list({
        limit: 2,
        cursor: page1.nextCursor,
      })
      expect(page2.items).toHaveLength(2)
    })
  })
})
```

### Ejemplo: Test de Componente

```typescript
// apps/web/src/components/clients/__tests__/client-card.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ClientCard } from '../client-card'
import { api } from '@/lib/trpc'

// Mock tRPC
vi.mock('@/lib/trpc', () => ({
  api: {
    clients: {
      delete: {
        useMutation: vi.fn(() => ({
          mutateAsync: vi.fn(),
          isLoading: false,
        })),
      },
    },
  },
}))

// ═══════════════════════════════════════════════════════════
// TEST DATA
// ═══════════════════════════════════════════════════════════
const mockClient = {
  id: '123',
  name: 'Juan García',
  email: 'juan@example.com',
  phone: '+34612345678',
  status: 'ACTIVE' as const,
  createdAt: new Date('2024-01-01'),
}

// ═══════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════
describe('ClientCard', () => {
  it('renders client information correctly', () => {
    render(<ClientCard client={mockClient} />)

    expect(screen.getByText('Juan García')).toBeInTheDocument()
    expect(screen.getByText('juan@example.com')).toBeInTheDocument()
    expect(screen.getByText('+34612345678')).toBeInTheDocument()
  })

  it('shows active status badge', () => {
    render(<ClientCard client={mockClient} />)

    expect(screen.getByText('Activo')).toBeInTheDocument()
    expect(screen.getByText('Activo')).toHaveClass('bg-green-100')
  })

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn()
    render(<ClientCard client={mockClient} onEdit={onEdit} />)

    fireEvent.click(screen.getByRole('button', { name: /editar/i }))

    expect(onEdit).toHaveBeenCalledWith(mockClient)
  })

  it('shows confirmation dialog before delete', async () => {
    render(<ClientCard client={mockClient} />)

    fireEvent.click(screen.getByRole('button', { name: /eliminar/i }))

    await waitFor(() => {
      expect(screen.getByText('¿Eliminar cliente?')).toBeInTheDocument()
    })
  })
})
```

### Ejemplo: Test E2E

```typescript
// apps/web/tests/e2e/clients.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Clients', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('should create a new client', async ({ page }) => {
    await page.goto('/clients')

    // Click "Nuevo Cliente"
    await page.click('button:has-text("Nuevo Cliente")')

    // Fill form
    await page.fill('[name="name"]', 'Nuevo Cliente Test')
    await page.fill('[name="email"]', 'nuevo@example.com')
    await page.fill('[name="phone"]', '+34600000000')

    // Submit
    await page.click('button[type="submit"]')

    // Verify created
    await expect(page.locator('text=Nuevo Cliente Test')).toBeVisible()
    await expect(page.locator('text=Cliente creado')).toBeVisible()
  })

  test('should show validation errors', async ({ page }) => {
    await page.goto('/clients/new')

    // Submit empty form
    await page.click('button[type="submit"]')

    // Verify errors
    await expect(page.locator('text=Nombre requerido')).toBeVisible()
  })

  test('should filter clients by search', async ({ page }) => {
    await page.goto('/clients')

    // Search
    await page.fill('[placeholder="Buscar..."]', 'Juan')

    // Verify filter works
    await expect(page.locator('.client-card')).toHaveCount(1)
    await expect(page.locator('text=Juan García')).toBeVisible()
  })
})
```

### Coverage Mínimo

| Área                 | Coverage Mínimo      | Ideal |
| -------------------- | -------------------- | ----- |
| Backend (routers)    | 90%                  | 95%   |
| Services/Lib         | 85%                  | 90%   |
| Componentes críticos | 80%                  | 90%   |
| Utils/Helpers        | 90%                  | 95%   |
| E2E (happy paths)    | 100% flujos críticos | —     |

---

## 🚀 CI/CD - GITHUB ACTIONS

### Pipeline Automatizado

Wallie utiliza GitHub Actions para CI/CD automático en cada push y pull request.

**Ubicación:** `.github/workflows/ci.yml`

### Jobs Configurados

| Job         | Descripción                          | Bloqueante | Trigger                 |
| ----------- | ------------------------------------ | ---------- | ----------------------- |
| ✅ Validate | TypeScript check en todo el monorepo | ✅ Sí      | push, PR a main/develop |
| 🧪 Test     | Tests unitarios (API + Web UI)       | ✅ Sí      | Después de validate     |
| 🎭 E2E      | Tests E2E con Playwright             | ✅ Sí      | Después de validate     |
| 🔒 Security | Audit de dependencias (npm audit)    | ⚠️ Warning | push, PR a main/develop |

### Detalles de Jobs

#### ✅ Validate (TypeScript Check)

```yaml
- name: 📘 TypeScript check
  run: pnpm typecheck
```

**Verifica:**

- Tipos en todos los packages del monorepo
- Errores de compilación TypeScript
- Configuración strict mode

**Si falla:** El merge está bloqueado

#### 🧪 Test (Tests Unitarios)

```yaml
- name: 🧪 Run API validation tests
  run: pnpm --filter @wallie/api test

- name: 🧪 Run Web UI tests
  run: pnpm --filter @wallie/web test
```

**Verifica:**

- Tests de validación de schemas (Zod)
- Tests unitarios de routers tRPC
- Tests de componentes React (691 tests)

**Coverage esperado:** 80% mínimo

**Si falla:** El merge está bloqueado

#### 🎭 E2E (Playwright)

```yaml
- name: 🎭 Install Playwright browsers
  run: pnpm --filter @wallie/web exec playwright install --with-deps chromium

- name: 🎭 Run E2E tests
  run: pnpm --filter @wallie/web test:e2e
```

**Verifica:**

- Flujos críticos de usuario (login, dashboard, etc.)
- Interacciones UI end-to-end
- Rutas y navegación

**Timeout:** 10 minutos

**Si falla:**

- El merge está bloqueado
- Se sube un artifact con el reporte de Playwright

#### 🔒 Security (Audit)

```yaml
- name: 🔒 Audit dependencies
  run: pnpm audit --audit-level=critical
  continue-on-error: true
```

**Verifica:**

- Vulnerabilidades críticas en dependencias
- Packages desactualizados con CVEs

**Si falla:**

- ⚠️ Warning, no bloquea el merge
- Se debe revisar y actualizar dependencias

### Concurrency Control

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

- Cancela runs anteriores del mismo PR automáticamente
- Ahorra minutos de GitHub Actions
- Evita jobs redundantes

### Variables de Entorno

```yaml
env:
  NODE_VERSION: '20'
  PNPM_VERSION: '8'
```

Los tests usan **mocks** para servicios externos:

- `DATABASE_URL`: Mock PostgreSQL
- `SUPABASE_URL` / `SUPABASE_ANON_KEY`: Mock Supabase
- No requieren servicios reales en CI

### Artefactos Generados

Si los tests E2E fallan, se sube automáticamente:

```yaml
- name: 📊 Upload E2E report
  uses: actions/upload-artifact@v4
  if: failure()
  with:
    name: playwright-report
    path: apps/web/playwright-report/
    retention-days: 7
```

**Acceso:** GitHub Actions → Run fallido → Artifacts

### Estado Actual (29 Dic 2025)

```
⚠️ GitHub Actions temporalmente deshabilitado por billing
✅ Validación local con Husky funciona perfectamente
✅ Vercel CI/CD operativo y ejecutando builds
```

**Sistema de validación local equivalente:**

- `.husky/pre-commit` → Ejecuta lint-staged + validaciones
- `scripts/pre-commit-validation.ps1` → TypeCheck, Lint, Tests
- `scripts/full-audit.js` → Auditoría completa pre-deployment

### Verificar Estado del Pipeline

```bash
# Ver últimos runs de GitHub Actions
gh run list --limit 10

# Ver detalles de un run específico
gh run view [run-id]

# Ver logs de un job
gh run view [run-id] --log

# Re-ejecutar un workflow fallido
gh run rerun [run-id]
```

### Solución de Problemas Comunes

| Problema                            | Solución                                    |
| ----------------------------------- | ------------------------------------------- |
| TypeCheck falla en CI pero no local | Limpiar cache: `pnpm clean && pnpm install` |
| Tests E2E timeout                   | Aumentar timeout en playwright.config.ts    |
| Security audit falla                | `pnpm audit --fix` o revisar manualmente    |
| Concurrency cancel deshabilitado    | Revisar configuración del workflow          |

### Relación con Vercel

```
GitHub Actions (CI)         Vercel (CD)
      ↓                          ↓
  Validate                    Build
  Test                        Deploy Preview
  E2E                         Deploy Production
  Security
      ↓                          ↓
  ✅ Merge                   ✅ Live
```

**Importante:**

- GitHub Actions valida el código
- Vercel hace el build y deployment
- Ambos son independientes (Vercel puede deployar aunque GitHub falle por billing)

---

## ✅ CHECKLIST PRE-COMMIT

### Ejecutar SIEMPRE antes de commit

```bash
#!/bin/bash
# scripts/pre-commit.sh

echo "🔍 Ejecutando verificaciones pre-commit..."

# 1. TypeScript
echo "→ Verificando TypeScript..."
pnpm typecheck
if [ $? -ne 0 ]; then
  echo "❌ TypeScript tiene errores"
  exit 1
fi

# 2. Lint
echo "→ Ejecutando linter..."
pnpm lint
if [ $? -ne 0 ]; then
  echo "❌ Linter encontró problemas"
  exit 1
fi

# 3. Tests
echo "→ Ejecutando tests..."
pnpm test --run
if [ $? -ne 0 ]; then
  echo "❌ Tests fallaron"
  exit 1
fi

# 4. No console.log
echo "→ Buscando console.log..."
if grep -r "console\." apps/web/src packages/*/src --include="*.ts" --include="*.tsx" | grep -v "node_modules" | grep -v ".test."; then
  echo "❌ Encontrado console.log en código de producción"
  exit 1
fi

# 5. Git secrets
echo "→ Verificando secrets..."
git secrets --scan
if [ $? -ne 0 ]; then
  echo "❌ Posibles secrets detectados"
  exit 1
fi

# 6. Verificar imports
echo "→ Verificando imports..."
pnpm check-imports
if [ $? -ne 0 ]; then
  echo "❌ Imports incorrectos"
  exit 1
fi

echo "✅ Todas las verificaciones pasaron"
```

### ⚠️ Compatibilidad Cross-Platform (Pre-commit Hooks)

**IMPORTANTE:** Los hooks de `.husky/` pueden usar shells específicos de plataforma.

```bash
# ❌ PROBLEMA COMÚN - Hook usa PowerShell (no disponible en Linux/macOS)
# .husky/pre-commit contiene:
pwsh -NoProfile -File scripts/pre-commit-validation.ps1
# Error: "pwsh: command not found"

# ✅ SOLUCIÓN 1 - Bypass temporal (cuando el error no es del código)
git commit --no-verify -m "feat: mi cambio"
# NOTA: Solo usar cuando el hook falla por problemas de entorno, NO de código

# ✅ SOLUCIÓN 2 - Corregir el hook para ser cross-platform
# Usar bash en lugar de pwsh, o detectar la plataforma:
#!/bin/sh
if command -v pwsh &> /dev/null; then
  pwsh -NoProfile -File scripts/pre-commit-validation.ps1
else
  sh scripts/pre-commit.sh
fi

# ✅ SOLUCIÓN 3 - Ejecutar verificaciones manualmente
pnpm typecheck && pnpm lint
# Si pasa, entonces el --no-verify es seguro
```

**Regla:** Si usas `--no-verify`, SIEMPRE ejecuta las verificaciones manualmente primero.

### Checklist Manual

- [ ] Leí/revisé la documentación relevante
- [ ] TypeScript sin errores (`pnpm typecheck`)
- [ ] Lint sin warnings (`pnpm lint`)
- [ ] Tests pasan (`pnpm test`)
- [ ] Tests añadidos para código nuevo
- [ ] No hay `console.log` en producción
- [ ] No hay `any` en tipos
- [ ] No hay secrets en código
- [ ] Queries filtran por `userId`
- [ ] Input validado con Zod
- [ ] Commit message sigue convención
- [ ] PR description completa

---

## ❓ FAQ

### ¿Dónde pongo un nuevo componente?

```
Específico de una página → apps/web/src/components/[feature]/
Reutilizado en varias páginas → apps/web/src/components/shared/
Reutilizado entre packages → packages/ui/src/components/
```

### ¿Cómo añado una nueva tabla a la DB?

```bash
# 1. Crear schema
packages/db/src/schema/nueva-tabla.ts

# 2. Exportar en index
packages/db/src/schema/index.ts

# 3. Generar migración
pnpm db:generate

# 4. Aplicar migración
pnpm db:push

# 5. Verificar en studio
pnpm db:studio
```

### ¿Cómo añado un nuevo endpoint API?

```bash
# 1. Crear/editar router
packages/api/src/routers/mi-router.ts

# 2. Añadir al root
packages/api/src/root.ts → export const appRouter = router({ miRouter })

# 3. Escribir tests
packages/api/src/routers/__tests__/mi-router.test.ts

# 4. Usar en frontend
api.miRouter.miProcedure.useQuery()
```

### ¿Cómo uso IA en el proyecto?

```typescript
import { generateMessage } from '@proyecto/ai'

const response = await generateMessage({
  prompt: 'Genera un mensaje de seguimiento',
  context: {
    clientName: client.name,
    lastInteraction: client.lastMessage,
  },
  style: user.communicationStyle,
})
```

### ¿Qué hacer si TypeScript da error?

```typescript
// 1. NO usar @ts-ignore
// 2. NO usar any
// 3. SÍ: Investigar el tipo correcto

// Si es un tipo de librería externa:
import type { ExternalType } from 'libreria'

// Si necesitas crear un tipo:
interface MiTipo {
  campo: string
}

// Si es un tipo inferido de Zod:
type MiTipo = z.infer<typeof miSchema>

// Si es un tipo inferido de Drizzle:
type MiTabla = typeof miTabla.$inferSelect
```

---

## 🛠️ COMANDOS ÚTILES

### Desarrollo

```bash
# Iniciar todo
pnpm dev

# Iniciar solo web
pnpm dev --filter web

# Iniciar solo un package
pnpm dev --filter @proyecto/api
```

### Base de Datos

```bash
# Generar migraciones
pnpm db:generate

# Aplicar migraciones
pnpm db:push

# Reset DB (dev only)
pnpm db:reset

# Abrir studio
pnpm db:studio

# Seed data
pnpm db:seed
```

### Calidad

```bash
# TypeScript check
pnpm typecheck

# Lint
pnpm lint

# Lint + fix
pnpm lint:fix

# Format
pnpm format

# Tests
pnpm test

# Tests con coverage
pnpm test:coverage

# Tests E2E
pnpm test:e2e
```

### Build & Deploy

```bash
# Build producción
pnpm build

# Preview build
pnpm preview

# Deploy (según config)
pnpm deploy
```

### Git

```bash
# Verificar secrets
git secrets --scan

# Commit convencional
git commit -m "feat(clients): add client creation"
git commit -m "fix(auth): resolve token issue"
git commit -m "docs: update CLAUDE.md"
git commit -m "test(api): add client router tests"
git commit -m "refactor(ui): simplify button component"
```

---

## 📞 CONTACTO Y ESCALACIÓN

### Si algo no está claro:

1. **Revisar documentación** en `/docs/`
2. **Buscar en código** existente ejemplos similares
3. **Preguntar** antes de asumir
4. **No inventar** estructuras nuevas sin aprobar

### Prioridades de decisión:

1. **Seguridad** > Todo lo demás
2. **Correctitud** > Velocidad
3. **Mantenibilidad** > Cleverness
4. **Consistencia** > Preferencia personal

---

## 🔍 PUNTOS CIEGOS CONOCIDOS (25 Dic 2025)

### Estado Actual del Proyecto

| Área                | Estado         | Detalles                       |
| ------------------- | -------------- | ------------------------------ |
| Psychology Engine   | ✅ Completo    | 6 routers, 13 tables, workers  |
| Rate Limiting AI    | ✅ Completo    | wallie.ts endpoints protegidos |
| Deuda técnica (any) | ✅ 0 any types | Eliminados en 50+ archivos     |
| console.logs prod   | ✅ Eliminados  | Código limpio                  |
| UI Tests            | ✅ 691 tests   | 41 archivos, 32/32 carpetas    |
| E2E Tests           | ✅ En CI       | Playwright integrado           |
| Type errors         | ✅ Resueltos   | Build limpio                   |

### Historial de Completados (25 Dic 2025)

```
✅ COMPLETADO: UI Testing Coverage (25 Dic 2025)
   - 691 tests en 41 archivos de test
   - 32/32 carpetas de componentes cubiertas (100%)
   - Mocks para: framer-motion, tRPC, @react-pdf, lucide-react
   - Infraestructura de testing con Vitest + Testing Library

✅ COMPLETADO: E2E Tests con Playwright (25 Dic 2025)
   - Integrado en CI pipeline
   - Tests de flujos críticos

✅ COMPLETADO: Eliminación Deuda Técnica (25 Dic 2025)
   - 0 `any` types en todo el proyecto
   - console.logs eliminados de producción
   - Type errors resueltos en web y workers

✅ COMPLETADO: Workers de Psychology (24 Dic 2025)
   - psychology-analysis.ts: Analiza emociones, persona, fase
   - Triggered by: psychology/message.received

✅ COMPLETADO: Rate Limiting en AI Endpoints (24 Dic 2025)
   - wallie.ts: chat, suggestMessage, analyzeMessage, chatInConversation
   - Usa aiRateLimitGuard(ctx.userId)
```

### Checklist de Integración para Nuevas Features

Antes de marcar una feature como "completa", verificar:

- [ ] **Backend → Frontend:** ¿Los routers tRPC se llaman desde el UI?
- [ ] **Workers:** ¿Se necesita procesamiento automático? ¿Worker creado?
- [ ] **UI Components:** ¿Los componentes creados están importados y usados?
- [ ] **Tests:** ¿Hay al menos tests de validación de schema?
- [ ] **Security:** ¿Delete/update incluyen userId en where clause?
- [ ] **Rate limiting:** ¿Endpoints con AI tienen rate limiting?

### Patrón de Delete/Update Correcto

```typescript
// ✅ CORRECTO - Defense in depth
await db.delete(table).where(
  and(
    eq(table.id, input.id),
    eq(table.userId, ctx.userId) // ← SIEMPRE incluir aunque se verificó arriba
  )
)

// ❌ INCORRECTO - Solo ID después de verificar ownership
await db.delete(table).where(eq(table.id, input.id))
```

---

_Última actualización: 31 Dic 2025_
_Versión: 1.10.0_
