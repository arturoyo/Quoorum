# PROMPT_MAESTRO.md — Instrucciones para IA de Desarrollo

> **COPIA ESTE PROMPT EN CURSOR/WINDSURF PARA INICIAR EL PROYECTO**

---

## 🚨 INSTRUCCIÓN INICIAL (PEGAR PRIMERO)

```
Eres un ingeniero senior trabajando en Wallie, un asistente de ventas por WhatsApp para autónomos españoles.

ANTES DE ESCRIBIR UNA SOLA LÍNEA DE CÓDIGO:

1. LEE estos archivos en orden:
   - SYSTEM.md (arquitectura y stack)
   - CLAUDE.md (convenciones de código)
   - RULES.md (reglas obligatorias)
   - GITFLOW.md (estrategia de Git)

2. CONFIRMA que entiendes:
   - Stack: Next.js 14 (App Router) + tRPC + Drizzle + Supabase
   - Estructura: Monorepo con Turborepo
   - Estilo: TypeScript strict, Zod validation, RLS obligatorio

3. NUNCA hagas esto:
   - Push directo a main/develop
   - Usar 'any' o '@ts-ignore'
   - Queries sin filtrar por userId
   - Crear archivos fuera de la estructura definida
   - Cambios de schema sin migración

4. SIEMPRE haz esto:
   - Commits pequeños con conventional commits
   - Validar input con Zod
   - Filtrar por userId en todas las queries
   - Correr lint/typecheck antes de commit

¿Confirmas que has leído y entendido las reglas?
```

---

## 📋 FASE 0: SETUP INICIAL

Una vez la IA confirme, pega esto:

```
Perfecto. Vamos a inicializar el proyecto Wallie.

TAREA: Crear la estructura base del monorepo.

Sigue estos pasos EN ORDEN:

### Paso 1: Inicializar Git y estructura

1. Inicializa git: `git init`
2. Crea branch develop: `git checkout -b develop`
3. Crea la estructura de carpetas:

```

wallie/
├── apps/
│ └── web/ # Next.js 14 app
├── packages/
│ ├── db/ # Drizzle schema + migrations
│ ├── api/ # tRPC routers
│ ├── ui/ # Componentes compartidos
│ └── config/ # Configs compartidas (eslint, ts, tailwind)
├── scripts/ # Scripts de utilidad
├── docs/ # Documentación adicional
└── [archivos raíz] # Los que ya existen

````

### Paso 2: Configurar packages/config

Crea estos archivos de configuración compartida:

1. `packages/config/tsconfig/base.json` - Extiende de tsconfig.base.json del root
2. `packages/config/tsconfig/nextjs.json` - Config específica para Next.js
3. `packages/config/eslint/base.js` - Config ESLint base
4. `packages/config/tailwind/preset.js` - Preset de Tailwind compartido

### Paso 3: Configurar packages/db

1. Crea `packages/db/package.json` con drizzle-orm y drizzle-kit
2. Crea `packages/db/src/index.ts` - Export del cliente
3. Crea `packages/db/src/schema/index.ts` - Re-export de schemas
4. Crea `packages/db/drizzle.config.ts` - Config de Drizzle

IMPORTANTE: El schema SQL ya existe en `database/schema.sql`.
Tradúcelo a schema de Drizzle manteniendo TODOS los campos,
tipos, defaults, y constraints.

### Paso 4: Configurar apps/web

1. Crea Next.js 14 app con App Router
2. Configura para usar packages locales
3. Setup básico de Tailwind
4. Página de landing placeholder

### Paso 5: Verificar

1. `pnpm install` debe funcionar
2. `pnpm build` debe compilar sin errores
3. `pnpm dev` debe arrancar el servidor
4. `pnpm lint` debe pasar
5. `pnpm typecheck` debe pasar

### Paso 6: Commit inicial

```bash
git add .
git commit -m "chore: initial monorepo setup with Next.js 14 + Drizzle"
````

---

MUÉSTRAME el plan de archivos que vas a crear ANTES de crearlos.
Espera mi confirmación antes de proceder.

```

---

## 🔄 PROMPT DE CONTINUACIÓN (Para siguientes tareas)

```

Continuamos con Wallie.

Antes de cada tarea:

1. Confirma en qué branch estamos
2. Confirma qué archivos vas a modificar
3. Espera mi OK antes de hacer cambios

Tarea actual: [DESCRIBE LA TAREA]

Muéstrame el plan primero.

```

---

## 🛡️ PROMPT DE VERIFICACIÓN (Usar periódicamente)

```

CHECKPOINT DE SEGURIDAD:

1. ¿En qué branch estamos? (debe ser feature/\* o develop, NUNCA main)
2. ¿Hay cambios sin commitear? (git status)
3. ¿Pasa el lint? (pnpm lint)
4. ¿Pasa typecheck? (pnpm typecheck)
5. ¿Hay algún 'any' o '@ts-ignore' en el código?
6. ¿Todas las queries de DB filtran por userId?

Reporta el estado.

```

---

## 🚨 PROMPT DE EMERGENCIA (Si algo sale mal)

```

STOP. Algo ha salido mal.

1. NO hagas más cambios
2. Ejecuta: git status
3. Ejecuta: git diff
4. Muéstrame el output

Vamos a evaluar si necesitamos:

- git checkout -- . (descartar cambios locales)
- git stash (guardar cambios temporalmente)
- git reset --soft HEAD~1 (deshacer último commit)

Espera mis instrucciones.

````

---

## 📝 NOTAS IMPORTANTES

### Stack exacto (no cambiar)
- Next.js 14.x (App Router)
- tRPC 11.x
- Drizzle ORM (NO Prisma)
- Supabase (PostgreSQL + Auth)
- Tailwind CSS
- shadcn/ui
- Zod
- TypeScript 5.x (strict mode)

### Estructura de imports
```typescript
// 1. Externos
import { z } from 'zod'

// 2. Internos (@wallie/*)
import { db } from '@wallie/db'

// 3. Relativos
import { Button } from './button'
````

### Naming conventions

- Archivos: kebab-case (user-profile.tsx)
- Componentes: PascalCase (UserProfile)
- Funciones: camelCase (getUserProfile)
- Constantes: SCREAMING_SNAKE_CASE (MAX_RETRIES)
- Types/Interfaces: PascalCase (UserProfile)
- Enums: PascalCase con valores SCREAMING_SNAKE (Status.ACTIVE)

### Commits

```
feat(scope): add new feature
fix(scope): fix bug
docs(scope): update documentation
style(scope): formatting, no code change
refactor(scope): restructure code
test(scope): add tests
chore(scope): maintenance
```

---

## ✅ CHECKLIST ANTES DE CADA PR

- [ ] Branch desde develop (no desde main)
- [ ] Commits siguen conventional commits
- [ ] pnpm lint pasa
- [ ] pnpm typecheck pasa
- [ ] pnpm test pasa (si hay tests)
- [ ] pnpm build pasa
- [ ] No hay console.log
- [ ] No hay any ni @ts-ignore
- [ ] Queries filtran por userId
- [ ] Input validado con Zod

---

_Usa este documento como referencia constante durante el desarrollo_
