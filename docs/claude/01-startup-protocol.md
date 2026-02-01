# 🚨 Protocolo de Inicio Obligatorio

> **ANTES de escribir una sola línea de código, LEE estos archivos EN ORDEN**

---

## 📋 ORDEN DE LECTURA OBLIGATORIO

| Orden | Archivo | Propósito | Tiempo |
|-------|---------|-----------|--------|
| 0 | 🚨 **[ERRORES-COMETIDOS.md](../../ERRORES-COMETIDOS.md)** | **ERRORES HISTÓRICOS - NO REPETIR** | 10 min |
| 1 | **[CLAUDE-CORE.md](../../CLAUDE-CORE.md)** | Reglas esenciales | 5 min |
| 2 | **[SYSTEM.md](../../SYSTEM.md)** | Arquitectura completa | 10 min |
| 3 | **[PHASES.md](../../PHASES.md)** | Fase actual del proyecto | 3 min |
| 4 | **[STACK.md](../../STACK.md)** | Tecnologías permitidas | 5 min |
| 5 | **[STANDARDS.md](../../STANDARDS.md)** | Estándares de código | 15 min |

**⚠️ CRÍTICO:** El archivo `ERRORES-COMETIDOS.md` documenta TODOS los errores que se han cometido y cómo prevenirlos. **DEBES leerlo ANTES de hacer cualquier cambio** para NO repetir los mismos errores.

**⚠️ Si no lees estos archivos primero, tu código será rechazado.**

---

## ⚡ FLUJO RÁPIDO PARA TRABAJO DIARIO

Si ya leíste los archivos anteriores y estás trabajando en el proyecto:

### 1. ANTES de empezar el día (2 min)

```bash
pnpm preflight
```

### 2. ANTES de cualquier cambio de código (30 seg)

```bash
# Consulta ERRORES-COMETIDOS.md
# Busca si ya cometimos este error antes
```

### 3. Para cada acción específica (1-3 min)

Consulta el [Checkpoint Protocol](./02-checkpoint-protocol.md) para ver qué verificar.

---

## 🎯 PROCESO OBLIGATORIO

```
1. Leer archivos de inicio (si es primera vez) [48 min]
   ↓
2. Pre-flight checks (si es inicio del día) [2 min]
   ↓
3. Identificar la acción a realizar
   ↓
4. Consultar Checkpoint Protocol [1 min]
   ↓
5. Leer sección relevante [2-5 min]
   ↓
6. Implementar siguiendo el patrón
   ↓
7. Pre-commit checklist [2 min]
   ↓
8. Commit
```

---

## 📚 DOCUMENTACIÓN COMPLEMENTARIA

Una vez leídos los archivos de inicio, consulta según tu tarea:

| Tarea | Módulo |
|-------|--------|
| **Implementar feature backend** | [05-patterns.md](./05-patterns.md) + [10-security.md](./10-security.md) |
| **Implementar feature frontend** | [04-rules.md](./04-rules.md) + [08-design-system.md](./08-design-system.md) |
| **Modificar UI** | [08-design-system.md](./08-design-system.md) |
| **Escribir tests** | [09-testing.md](./09-testing.md) |
| **Troubleshooting** | [11-faq.md](./11-faq.md) |

---

## ⚠️ RECORDATORIOS IMPORTANTES

### NO EMPEZAR A CODEAR SIN:

- [ ] Leer ERRORES-COMETIDOS.md
- [ ] Leer CLAUDE-CORE.md
- [ ] Ejecutar `pnpm preflight` (si inicio del día)
- [ ] Consultar Checkpoint Protocol para la acción
- [ ] Verificar en qué fase estamos (PHASES.md)

### NO HACER CAMBIOS SIN:

- [ ] Leer la documentación relevante
- [ ] Verificar que no repetimos errores históricos
- [ ] Consultar patrones existentes en el código
- [ ] Preguntar si hay dudas

---

## 📁 ESTRUCTURA DE ARCHIVOS DEL PROYECTO

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
│   ├── ai/                     # Lógica de IA core
│   │   ├── src/
│   │   │   ├── lib/           # Utilidades IA (fallback config, etc)
│   │   │   ├── providers/     # OpenAI, Anthropic, Google, Groq
│   │   │   │   ├── openai.ts
│   │   │   │   ├── anthropic.ts
│   │   │   │   ├── google.ts
│   │   │   │   └── groq.ts
│   │   │   ├── prompts/       # Templates de prompts
│   │   │   ├── utils/         # Token counting, etc
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
│   │   │   │   ├── quoorum.ts
│   │   │   │   └── ... (20+ routers)
│   │   │   ├── lib/           # Utilidades del API
│   │   │   ├── trpc.ts        # Config tRPC
│   │   │   └── root.ts        # Root router
│   │   └── package.json
│   │
│   ├── core/                   # Core business logic & utilities
│   │   ├── src/
│   │   │   ├── deliberation/  # Deliberation engine
│   │   │   ├── experts/       # Expert system
│   │   │   ├── quality/       # Quality assessment
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   └── package.json
│   │
│   ├── db/                     # Database layer
│   │   ├── src/
│   │   │   ├── schema/        # Schemas Drizzle (27 schemas)
│   │   │   ├── migrations/    # SQL migrations
│   │   │   ├── seed/          # Seed data
│   │   │   ├── client.ts      # DB client
│   │   │   └── index.ts
│   │   ├── drizzle.config.ts
│   │   └── package.json
│   │
│   ├── quoorum/                # Sistema de debates multi-agente IA
│   │   ├── src/
│   │   │   ├── __tests__/     # Tests unitarios
│   │   │   ├── analytics/     # Analytics del sistema
│   │   │   ├── integrations/  # Pinecone, Redis, Serper
│   │   │   ├── orchestration/ # Orquestación de debates
│   │   │   ├── config/        # Configuración centralizada
│   │   │   │   ├── agent-config.ts    # Config de agentes
│   │   │   │   └── expert-config.ts   # Config de expertos
│   │   │   ├── expert-database/       # Base de datos de 80+ expertos
│   │   │   ├── agents.ts      # Configuración de agentes
│   │   │   ├── consensus.ts   # Algoritmo de consenso
│   │   │   ├── runner.ts      # Orquestador principal
│   │   │   └── index.ts
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
│   └── workers/                # Background workers (Inngest)
│       ├── src/
│       │   ├── functions/     # Funciones worker
│       │   └── index.ts
│       └── package.json
│
├── docs/                       # Documentación del proyecto
│   ├── claude/                # Documentación modular
│   ├── CLAUDE.md              # Índice maestro
│   ├── CLAUDE-CORE.md         # Reglas esenciales
│   ├── SYSTEM.md
│   ├── PHASES.md
│   └── ...
│
├── scripts/                    # Scripts de utilidad
├── .env.example
├── .gitignore
├── .eslintrc.cjs
├── .husky/                    # Git hooks
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

### 📦 Paquetes Actuales vs Arquitectura Ideal

**Nota Importante:** La estructura actual difiere ligeramente de la arquitectura ideal documentada en versiones anteriores. Los paquetes actuales reflejan la evolución orgánica del proyecto y están **todos en uso activo en producción**.

#### Paquetes Implementados (Estado Actual)

| Paquete       | Estado    | Propósito |
| ------------- | --------- | --------- |
| `ai/`         | ✅ Activo | Core de IA (providers, prompts, utils, fallback config) |
| `api/`        | ✅ Activo | tRPC routers (20+ endpoints) |
| `core/`       | ✅ Activo | Core business logic (deliberation, experts, quality) |
| `db/`         | ✅ Activo | Database layer (27 schemas) |
| `quoorum/` ⭐ | ✅ Activo | Sistema de debates multi-agente IA |
| `ui/`         | ✅ Activo | Componentes UI (shadcn/ui) |
| `workers/`    | ✅ Activo | Background workers (Inngest) |

#### Paquetes Planificados/No Implementados

| Paquete         | Estado    | Razón | Prioridad |
| --------------- | --------- | ----- | --------- |
| `agents/`       | 📋 Futuro | Agentes IA especializados | Media |
| `auth/`         | 📋 Futuro | Auth centralizado | Baja |
| `email/`        | 📋 Futuro | Emails transaccionales | Media |
| `integrations/` | 📋 Futuro | Integraciones centralizadas | Baja |
| `realtime/`     | 📋 Futuro | WebSockets/Pusher | Media |

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
| Test unitario         | `[module]/__tests__/`                | `client.test.ts`               |
| Test E2E              | `apps/web/tests/`                    | `clients.spec.ts`              |
| Prompt IA             | `packages/ai/src/prompts/`           | `sales-assistant.ts`           |

### ⚠️ ANTES DE CREAR ARCHIVOS .TSX - CONSULTAR INDEX.MD

**📍 Ubicación:** `apps/web/src/app/INDEX.md`

**REGLA CRÍTICA:** Antes de crear CUALQUIER archivo `.tsx` en la aplicación web, **DEBES** consultar el INDEX.md primero.

#### Por qué existe INDEX.md

- 📋 **Inventario completo** de todos los archivos principales .tsx de la app
- 🚫 **Previene duplicaciones** (eliminamos 14 archivos backup duplicados el 15 Ene 2026)
- ✅ **Una sola versión** de cada funcionalidad
- 📖 **Documentación** de propósito y estado de cada archivo

#### Proceso Obligatorio ANTES de crear archivo .tsx:

```bash
# 1. Consultar INDEX.md
cat apps/web/src/app/INDEX.md | grep "nombre-funcionalidad"

# 2. Verificar si ya existe
find apps/web/src/app -name "*nombre*.tsx"

# 3. Si NO existe y es necesario crearlo:
#    - Crear el archivo
#    - Añadirlo a INDEX.md con su propósito
#    - Marcar como ✅ Activo

# 4. Si YA existe:
#    - Editar el existente
#    - NO crear page-backup.tsx, page-v2.tsx, etc.
#    - Git ya tiene el historial completo
```

#### Archivos PROHIBIDOS (❌ NUNCA CREAR):

- `page-backup.tsx` - Git ya tiene el historial
- `page-old.tsx` - Git ya tiene el historial
- `page-v2.tsx` - Usa ramas de git
- `ComponentName-backup.tsx` - Git ya tiene el historial
- Cualquier variante de backup manual

#### Mantra:

> **"Un archivo, una funcionalidad, una ubicación."**
> **"Git guarda el historial, no yo."**

---

_Ver [INDEX.md](./INDEX.md) para más módulos de documentación_
