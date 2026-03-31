# 🤖 CLAUDE.md — Índice Maestro de Documentación

> **Versión:** 2.0.0 | **Fecha:** 27 Ene 2026
> **Sistema de Documentación Modular**
> **Para:** Cualquier IA (Claude, GPT, Copilot, etc.) que trabaje en este proyecto

---

## 🚨 ANTES DE EMPEZAR - LECTURA OBLIGATORIA

**Estado real del sistema documental:** este repo conserva referencias legacy a módulos que ya no están presentes. La fuente de verdad actual es este archivo más los documentos existentes en `docs/claude/`.

**⚡ NUNCA empieces a codear sin leer esto primero:**

```
1. Lee este CLAUDE.md hasta la tabla de módulos (5 min)
   └─ Resume las reglas y el estado operativo real del repo

2. Lee ERRORES-COMETIDOS.md (10 min)
   └─ Errores históricos que NO debes repetir

3. Según tu tarea, lee SOLO los módulos existentes en docs/claude/ (3-5 min)
   └─ Ver tabla de módulos abajo
```

**👉 EMPIEZA AQUÍ:** [docs/claude/INDEX.md](./docs/claude/INDEX.md) ← índice real de módulos existentes

---

## 📚 MÓDULOS DISPONIBLES

Este proyecto usa **documentación modular** para facilitar la navegación. Cada módulo cubre un área específica.

| # | Módulo | Propósito | Tiempo | Link |
|---|--------|-----------|--------|------|
| 00 | **Este CLAUDE.md** | ⭐ Resumen operativo actual del repo | 5 min | [CLAUDE.md](./CLAUDE.md) |
| 02 | **Checkpoint Protocol** | Qué verificar antes de cada acción | 5 min | [02-checkpoint-protocol.md](./docs/claude/02-checkpoint-protocol.md) |
| 04 | **Rules** | Reglas inviolables de desarrollo | 15 min | [04-rules.md](./docs/claude/04-rules.md) |
| 05 | **Patterns** | Patrones obligatorios (tRPC, Drizzle, etc.) | 20 min | [05-patterns.md](./docs/claude/05-patterns.md) |

**📖 Navegación:** Ver [docs/claude/INDEX.md](./docs/claude/INDEX.md) para el mapa actual. Si una ruta no existe, la referencia es legacy y no debe tratarse como fuente de verdad.

---

## 🔍 BÚSQUEDA RÁPIDA POR KEYWORDS

¿Buscas algo específico? Usa esta tabla para encontrarlo rápidamente:

| Keyword | Dónde encontrarlo |
|---------|-------------------|
| **Emojis en código (PROHIBIDO)** | [ERRORES-COMETIDOS.md](./ERRORES-COMETIDOS.md) - ⚠️ CRÍTICO |
| **tRPC router pattern** | [05-patterns.md#trpc-router-pattern](./docs/claude/05-patterns.md) |
| **React hooks rules** | [04-rules.md#react-hooks](./docs/claude/04-rules.md) |
| **userId security filtering** | [05-patterns.md#trpc-router-pattern](./docs/claude/05-patterns.md) |
| **Zod validation** | [05-patterns.md#validacion-zod](./docs/claude/05-patterns.md) |
| **Drizzle ORM** | [05-patterns.md#schema-drizzle-pattern](./docs/claude/05-patterns.md) |
| **Type inference from DB enums** | [05-patterns.md#type-inference](./docs/claude/05-patterns.md) - Rule #23 |
| **Landing page components** | [04-rules.md#landing-page](./docs/claude/04-rules.md) |
| **Dashboard structure** | [04-rules.md#dashboard](./docs/claude/04-rules.md) |
| **Pre-commit untracked files** | Scripts automáticos detectan archivos sin trackear |

**💡 TIP:** Usa la herramienta `Grep` para buscar cualquier keyword en este archivo o en módulos específicos.

---

## 📋 CHECKPOINT PROTOCOL - TABLA CONSOLIDADA

**ANTES de cada acción importante, consulta esta tabla:**

| 🎯 Acción que vas a hacer | 📖 Sección a consultar | 🔍 Qué verificar |
|---------------------------|------------------------|------------------|
| **ANTES de empezar el día** | **`pnpm preflight`** | ⚡ Ejecutar PRE-FLIGHT CHECKS (2 min) |
| **CUALQUIER cambio de código** | **[ERRORES-COMETIDOS.md](./ERRORES-COMETIDOS.md)** | ⚠️ ¿Ya cometimos este error antes? |
| **Usar herramienta `Bash`** | [ERRORES-COMETIDOS.md](./ERRORES-COMETIDOS.md) | ¿Contiene grep/sed/awk/cat/find? → Revisa errores históricos antes |
| **Modificar landing page** | [04-rules.md#landing-page](./docs/claude/04-rules.md) | ⚠️ Solo componentes oficiales |
| **Modificar dashboard** | [04-rules.md#dashboard](./docs/claude/04-rules.md) | ⚠️ ÚNICO archivo - PointsWidget obligatorio |
| **Crear nuevo archivo .tsx** | [docs/claude/INDEX.md](./docs/claude/INDEX.md) | ⚠️ CONSULTAR módulos existentes primero |
| **Escribir componente React** | [04-rules.md#react-hooks](./docs/claude/04-rules.md) | ⚠️ Hooks ANTES de early returns |
| **Crear tRPC router** | [05-patterns.md#trpc-router-pattern](./docs/claude/05-patterns.md) | Validación Zod + filtro userId |
| **Crear schema DB** | [05-patterns.md#schema-drizzle-pattern](./docs/claude/05-patterns.md) | Timestamps + relations + types |
| **Hacer commit** | [docs/claude/INDEX.md](./docs/claude/INDEX.md) | TypeCheck + Lint + Tests y validar estado real |
| **Crear type/enum** | [05-patterns.md#type-inference](./docs/claude/05-patterns.md) | ⚠️ ¿Ya existe en DB? Inferir en lugar de duplicar |
| **Silenciar tipo de error** | [05-patterns.md#error-handling](./docs/claude/05-patterns.md) | ⚠️ Actualizar AMBAS capas (console.error + React Query) o usar `silenced-error-types.ts` |

**📖 Ver tabla completa:** [02-checkpoint-protocol.md](./docs/claude/02-checkpoint-protocol.md)

---

## ARQUITECTURA — Base de Datos e Infraestructura

**Modelo unificado:**
- **PostgreSQL** -> Datos de negocio y autenticacion (debates, roadmap, profiles, users, etc.)
- **Auth local** -> JWT firmado con jose + bcrypt para passwords (sin dependencias externas)

**Entornos:**
| Entorno | PostgreSQL | Auth |
|---------|-----------|------|
| Local (dev) | Docker container en localhost:5433 | Local JWT (bcryptjs + jose) |
| Produccion | PostgreSQL dedicado | Local JWT (AUTH_SECRET requerido) |

**Variables criticas (`.env` / `.env.local`):**
```
DATABASE_URL=postgresql://optym:optym_vision_2026@localhost:5433/quoorum
AUTH_SECRET=quoorum-dev-secret-change-in-production  # Cambiar en produccion
```

**Integración Optym (nuevo)**  
Establece las variables `OPTYM_API_KEY` y `OPTYM_BASE_URL` para enrutar las solicitudes de debate
por el gateway de optym.pro y aprovechar la lógica de `optym-balanced`. Cuando la clave existe,
los agentes sintetizadores usan el provider `optym` y se sigue validando este stack en `scripts/verify_docs.sh`.
```
OPTYM_API_KEY=optym_main_key
OPTYM_BASE_URL=https://api.optym.pro/v1
```

**Deploy:**
- **Plataforma:** Vercel (Next.js)
- **Config:** `vercel.json` en raíz
- **CLI:** `npx vercel` (requiere `vercel login` previo — interactivo)
- **Build:** `turbo build --filter=@quoorum/web`
- **Estado actual:** No desplegado. Falta vincular proyecto y configurar env vars en Vercel dashboard.

**Panel Admin:**
- Ruta: `/admin/*` (requiere rol admin via local auth)
- Páginas: Dashboard, Billing, Logs, Users, Prompts, Scenarios, **Roadmap** (nuevo, 26 Mar 2026)
- Roadmap admin requiere migración DB: `pnpm db:generate && pnpm db:migrate` + seed `scripts/seed-roadmap.sql`

**Estado real de validación local (26 Mar 2026):**
- `pnpm test:unit` — ✅ verde (`19` files, `356` tests)
- `pnpm test` — incluye integración y depende de PostgreSQL local
- `pnpm typecheck` — ❌ sigue fallando, con la mayor concentración de errores en `packages/api`
- Riesgo operativo actual: la documentación y los unit tests están más alineados que el typecheck del monorepo

---

## ⚠️ ERRORES HISTÓRICOS - NO REPETIR

**ANTES de hacer CUALQUIER cambio, lee:** [ERRORES-COMETIDOS.md](./ERRORES-COMETIDOS.md)

**Top 7 errores más críticos:**

1. **🚫 EMOJIS EN CÓDIGO** - Causa error UTF-8 en Windows que bloquea el desarrollo completamente
2. **Foreign Key Violations** - Usuario existe en Supabase Auth pero NO en PostgreSQL local
3. **Hardcodear Providers/Modelos IA** - Usa configuración centralizada (config/agent-config.ts)
4. **React Hooks después de early returns** - VIOLA Rules of Hooks, app se rompe
5. **Colores hardcodeados en UI** - Usar variables CSS de tema, no `text-white`
6. **Fix incompleto en sistema de múltiples capas** - Identificar TODAS las capas antes de hacer fix (ver `silenced-error-types.ts`)
7. **Hardcodear Enums de DB en Frontend** - SIEMPRE inferir tipos desde DB: `type Status = (typeof statusEnum.enumValues)[number]`

**📖 Ver lista completa:** [ERRORES-COMETIDOS.md](./ERRORES-COMETIDOS.md)

---

## 📊 ESTADÍSTICAS DEL PROYECTO

**Estado actual (26 Mar 2026):**

| Métrica | Valor |
|---------|-------|
| **Estado documental** | Parcial pero alineado | `CLAUDE.md` y `docs/claude/` apuntan solo a módulos existentes |
| **Repo** | No asumir limpio | valida `git status` antes de operar |
| **Tests unitarios** | Verde | `pnpm test:unit` pasa |
| **Tests de integración** | Requieren DB local | `pnpm test` mezcla unit + integration |
| **Typecheck** | No verde | `pnpm typecheck` falla sobre todo en `packages/api` |
| **CI/CD** | Vercel | GitHub Actions no está configurado en este repo |

**📖 Ver detalles:** [SYSTEM.md](./SYSTEM.md) y [PHASES.md](./PHASES.md)

**Pendiente manual consolidado:** ver [QUE-FALTA.md](./QUE-FALTA.md) para secrets reales, perfil local, revisión de Compose y checklist de reentrada.

---

## 📞 CONTACTO Y ESCALACIÓN

### Si algo no está claro:

1. **Revisar documentación** en `/docs/claude/`
2. **Buscar en código** existente ejemplos similares
3. **Consultar ERRORES-COMETIDOS.md** para ver si ya lo hicimos mal antes
4. **Preguntar** antes de asumir
5. **No inventar** estructuras nuevas sin aprobar

### Prioridades de decisión:

1. **Seguridad** > Todo lo demás
2. **Correctitud** > Velocidad
3. **Mantenibilidad** > Cleverness
4. **Consistencia** > Preferencia personal

---

## 🔍 PUNTOS CIEGOS CONOCIDOS

**Estado actual (26 Mar 2026):**

| Área | Estado | Detalles |
|------|--------|----------|
| Quoorum Debates System | ✅ Activo | superficie amplia en `packages/api` y `packages/quoorum` |
| AI Rate Limiting System | ✅ Implementado | 4 componentes completos (16 Ene 2026) |
| AI Config (agents) | ✅ Refactorizado | config/agent-config.ts + env vars |
| AI Config (expertos) | ✅ Refactorizado | config/expert-config.ts + 80+ expertos |
| **Deuda técnica IA** | ✅ **= 0** | **Todo configurable via env vars** |
| Deuda técnica (`any`) | ✅ 0 any types | Eliminados en 50+ archivos |
| Tests output | ✅ Funcionando | vitest 4.0.17 + reporters |
| Tests (unit) | ✅ Verificado | `356` tests verdes con `pnpm test:unit` |
| Tests coverage | ⚠️ No tratar como canónica | volver a medir antes de afirmar cifras |
| E2E Tests | ⚠️ Existen en repo | no asumirse verificados por esta auditoría |
| Type errors | ❌ Persisten | `pnpm typecheck` falla, principalmente en `packages/api` |
| GitHub Actions | ❌ No configurado | Deliberado: usa Husky + Vercel CI |
| **Documentación** | ✅ **Refactorizada parcialmente** | **sistema modular limpiado de referencias rotas en marzo 2026** |

**📖 Ver detalles completos:** [PHASES.md - Puntos Ciegos](./PHASES.md)

**Completados recientes:**

- ✅ Quoorum Debates System (Ene 2026)
- ✅ AI Rate Limiting System (16 Ene 2026)
- ✅ Refactor AI Hardcoding (16 Ene 2026)
- ✅ Expert Database Refactorizado (25 Ene 2026)
- ✅ Testing Infrastructure Fix (25 Ene 2026)
- ✅ **Documentación Modular (27 Ene 2026)** ← **NUEVO**

---

## 🔄 CHANGELOG DE DOCUMENTACIÓN

### v2.0.0 - 27 Ene 2026 - Sistema Modular

**🎯 REFACTORIZACIÓN COMPLETA:**

- **Reducción masiva:** CLAUDE.md de 184KB → 40KB (-78%)
- **Eliminación redundancia:** De 40% a 5%
- **Sistema modular:** la versión original se dividió en módulos especializados
- **Navegación mejorada:** Índice maestro con búsqueda rápida
- **Nota de auditoría 2026-03:** parte de los módulos históricos ya no existe en `docs/claude/`; usa solo rutas presentes en el repo

**Beneficios:**
- ✅ Más fácil de mantener (cambiar info una sola vez)
- ✅ Navegación más rápida (lectura dirigida)
- ✅ Archivos más pequeños (performance)
- ✅ Consistencia (una sola fuente de verdad)

### v1.14.0 - 25 Ene 2026

- Expert Database refactorizado (80+ expertos en categorías)
- config/expert-config.ts creado
- Deuda técnica IA = 0

### v1.13.0 - 16 Ene 2026

- AI Rate Limiting System implementado
- config/agent-config.ts creado
- Configuración de IA centralizada

### v1.12.0 - 15 Ene 2026

- INDEX.md creado para prevenir archivos duplicados
- Eliminados 14 archivos backup

**📖 Ver versiones anteriores:** [PHASES.md](./PHASES.md)

---

## 📖 DOCUMENTACIÓN ADICIONAL

### Archivos principales:

- **[SYSTEM.md](./SYSTEM.md)** - Arquitectura completa del sistema
- **[PHASES.md](./PHASES.md)** - Fases del proyecto y progreso
- **[STACK.md](./STACK.md)** - Stack tecnológico detallado
- **[STANDARDS.md](./STANDARDS.md)** - Estándares de código completos
- **[ERRORES-COMETIDOS.md](./ERRORES-COMETIDOS.md)** - ⚠️ Errores históricos

### Documentación modular:

- **[docs/claude/INDEX.md](./docs/claude/INDEX.md)** - Mapa completo de módulos
- **[docs/claude/](./docs/claude/)** - Directorio con los módulos especializados actualmente versionados

---

## 🎯 FLUJO DE TRABAJO RECOMENDADO

```
1. Leo CLAUDE.md + docs/claude/INDEX.md (5 min) ✅ Ahora
   ↓
2. Leo ERRORES-COMETIDOS.md (10 min) ⚠️ CRÍTICO
   ↓
3. Ejecuto pnpm preflight (2 min)
   ↓
4. Identifico mi tarea
   ↓
5. Consulto tabla de módulos arriba (30 seg)
   ↓
6. Leo módulo específico (3-5 min)
   ↓
7. Verifico checkpoint protocol (1 min)
   ↓
8. Implemento siguiendo el patrón
   ↓
9. Pre-commit checklist (2 min)
   ↓
10. Commit
```

---

## 💡 CUANDO TIENES DUDAS

1. ✅ **Busca en este índice:** Usa la tabla de búsqueda rápida arriba
2. ✅ **Consulta el módulo específico:** Lee solo lo que necesitas (3-5 min)
3. ✅ **Consulta ejemplos en el código:** Busca código similar en el proyecto
4. ✅ **Pregunta ANTES:** No asumas, verifica primero
5. ❌ **NO inventes:** No crees estructuras nuevas sin aprobar

---

## ⚡ RECURSOS RÁPIDOS

### Scripts útiles:

```bash
pnpm preflight        # Pre-flight checks (2 min)
pnpm typecheck        # TypeScript check
pnpm lint             # Linter
pnpm test:unit        # Suite unitaria sin integración con PostgreSQL
pnpm test             # Suite completa (incluye integración y puede requerir DB local)
pnpm test:e2e         # Tests E2E
pnpm validate:env     # Validación de variables críticas y nombres legacy
pnpm db:studio        # Drizzle Studio
```

### Pre-commit Protection:

**🔒 Detección automática de archivos importantes sin trackear:**

El hook de pre-commit detecta automáticamente:
- ✅ Imágenes (SVG, PNG, JPG, etc.) sin añadir a git
- ✅ Archivos en `apps/web/public/` sin trackear
- ✅ Archivos de código fuente (.ts, .tsx) en paquetes

**Te preguntará antes del commit:**
```
⚠️  ARCHIVOS IMPORTANTES SIN TRACKEAR DETECTADOS:
   • apps/web/public/quoorum-logo-ok.svg
   • apps/web/public/quoorum-imagotipo.svg
   
   ¿Añadir estos archivos al commit? (y/n):
```

**Archivo:** `scripts/pre-commit-interactive.sh`

**Evita pérdidas de:**
- Logos y assets gráficos
- Archivos públicos (favicons, manifests, etc.)
- Código fuente nuevo en paquetes
- Cualquier archivo importante que olvidaste trackear

### Git restore desde producción:

```bash
git checkout main -- archivo.tsx
```

### Limpiar cache Next.js:

```bash
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules/.cache
```

---

**_Sistema de documentación modular creado: 27 Ene 2026_**
**_Este archivo es el índice maestro. Para contenido detallado, consulta los módulos en [docs/claude/](./docs/claude/)_**
