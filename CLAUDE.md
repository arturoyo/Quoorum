# 🤖 CLAUDE.md — Índice Maestro de Documentación

> **Versión:** 2.0.0 | **Fecha:** 27 Ene 2026
> **Sistema de Documentación Modular**
> **Para:** Cualquier IA (Claude, GPT, Copilot, etc.) que trabaje en este proyecto

---

## 🚨 ANTES DE EMPEZAR - LECTURA OBLIGATORIA

**⚡ NUNCA empieces a codear sin leer esto primero:**

```
1. Lee CLAUDE-CORE.md COMPLETO (5 min)
   └─ Contiene las 10 reglas más críticas que DEBES conocer

2. Lee ERRORES-COMETIDOS.md (10 min)
   └─ Errores históricos que NO debes repetir

3. Según tu tarea, lee el módulo relevante (3-5 min)
   └─ Ver tabla de módulos abajo
```

**🚨 Si no lees CLAUDE-CORE.md primero, cometerás errores críticos que ya están documentados.**

**👉 EMPIEZA AQUÍ:** [CLAUDE-CORE.md](./CLAUDE-CORE.md) ← ⭐ **LEE ESTO PRIMERO** (5 min)

---

## 📚 MÓDULOS DISPONIBLES

Este proyecto usa **documentación modular** para facilitar la navegación. Cada módulo cubre un área específica.

| # | Módulo | Propósito | Tiempo | Link |
|---|--------|-----------|--------|------|
| 00 | **CLAUDE-CORE** | ⭐ **Top 10 reglas críticas (INICIO OBLIGATORIO)** | 5 min | [CLAUDE-CORE.md](./CLAUDE-CORE.md) |
| 01 | **Startup Protocol** | Protocolo de inicio obligatorio | 3 min | [01-startup-protocol.md](./docs/claude/01-startup-protocol.md) |
| 02 | **Checkpoint Protocol** | Qué verificar antes de cada acción | 5 min | [02-checkpoint-protocol.md](./docs/claude/02-checkpoint-protocol.md) |
| 03 | **Database** | PostgreSQL local, arquitectura híbrida | 10 min | [03-database.md](./docs/claude/03-database.md) |
| 04 | **Rules** | Reglas inviolables de desarrollo | 15 min | [04-rules.md](./docs/claude/04-rules.md) |
| 05 | **Patterns** | Patrones obligatorios (tRPC, Drizzle, etc.) | 20 min | [05-patterns.md](./docs/claude/05-patterns.md) |
| 06 | **Prohibitions** | Prohibiciones absolutas (28 cosas que NUNCA hacer) | 10 min | [06-prohibitions.md](./docs/claude/06-prohibitions.md) |
| 07 | **Stack** | Stack tecnológico y librerías aprobadas | 10 min | [07-stack.md](./docs/claude/07-stack.md) |
| 08 | **Design System** | Paleta de colores, componentes UI, UX | 15 min | [08-design-system.md](./docs/claude/08-design-system.md) |
| 09 | **Testing** | Estructura de tests, coverage mínimo | 10 min | [09-testing.md](./docs/claude/09-testing.md) |
| 10 | **Security** | Checklist de seguridad obligatorio | 10 min | [10-security.md](./docs/claude/10-security.md) |
| 11 | **FAQ** | Comandos útiles, troubleshooting, CI/CD | 5 min | [11-faq.md](./docs/claude/11-faq.md) |
| 12 | **AI Systems** | Rate limiting, fallback, cost tracking para IA | 15 min | [12-ai-systems.md](./docs/claude/12-ai-systems.md) |
| 13 | **Debate Flow** | Flujo completo de creación de debates (5 fases) | 20 min | [13-debate-flow.md](./docs/claude/13-debate-flow.md) |
| 14 | **AI Prompt Management** | Sistema de gestión centralizada de prompts IA | 15 min | [14-ai-prompt-management.md](./docs/claude/14-ai-prompt-management.md) |

**📖 Navegación:** Ver [docs/claude/INDEX.md](./docs/claude/INDEX.md) para mapa completo del sistema de documentación.

---

## 🔍 BÚSQUEDA RÁPIDA POR KEYWORDS

¿Buscas algo específico? Usa esta tabla para encontrarlo rápidamente:

| Keyword | Dónde encontrarlo |
|---------|-------------------|
| **Emojis en código (PROHIBIDO)** | [CLAUDE-CORE.md#regla-0](./CLAUDE-CORE.md) - ⚠️ CRÍTICO |
| **tRPC router pattern** | [05-patterns.md#trpc-router-pattern](./docs/claude/05-patterns.md) |
| **React hooks rules** | [04-rules.md#react-hooks](./docs/claude/04-rules.md) |
| **userId security filtering** | [10-security.md#userid-filtering](./docs/claude/10-security.md) |
| **Database queries** | [03-database.md](./docs/claude/03-database.md) |
| **Supabase vs PostgreSQL** | [03-database.md#arquitectura-hibrida](./docs/claude/03-database.md) |
| **Zod validation** | [05-patterns.md#validacion-zod](./docs/claude/05-patterns.md) |
| **Drizzle ORM** | [05-patterns.md#schema-drizzle-pattern](./docs/claude/05-patterns.md) |
| **Type inference from DB enums** | [05-patterns.md#type-inference](./docs/claude/05-patterns.md) - Rule #23 |
| **Tests unitarios** | [09-testing.md](./docs/claude/09-testing.md) |
| **Tests E2E (Playwright)** | [09-testing.md#tests-e2e](./docs/claude/09-testing.md) |
| **Paleta de colores** | [08-design-system.md](./docs/claude/08-design-system.md) |
| **Variables CSS de tema** | [08-design-system.md#variables-css](./docs/claude/08-design-system.md) |
| **Prohibiciones absolutas** | [06-prohibitions.md](./docs/claude/06-prohibitions.md) |
| **Estructura de archivos** | [01-startup-protocol.md#estructura-archivos](./docs/claude/01-startup-protocol.md) |
| **Pre-commit checklist** | [11-faq.md#checklist-pre-commit](./docs/claude/11-faq.md) |
| **Git restore from production** | [10-security.md#git-restore](./docs/claude/10-security.md) |
| **AI rate limiting** | [12-ai-systems.md](./docs/claude/12-ai-systems.md) |
| **AI fallback chains** | [12-ai-systems.md#fallback-chains](./docs/claude/12-ai-systems.md) |
| **Landing page components** | [04-rules.md#landing-page](./docs/claude/04-rules.md) |
| **Dashboard structure** | [04-rules.md#dashboard](./docs/claude/04-rules.md) |
| **Imports duplicados** | [06-prohibitions.md#imports-duplicados](./docs/claude/06-prohibitions.md) |
| **Foreign key violations** | [03-database.md#foreign-key-violations](./docs/claude/03-database.md) |
| **ENV variables** | [10-security.md#env-variables](./docs/claude/10-security.md) |
| **Monorepo structure** | [01-startup-protocol.md#monorepo-structure](./docs/claude/01-startup-protocol.md) |
| **CI/CD (Vercel)** | [11-faq.md#cicd](./docs/claude/11-faq.md) |
| **pnpm commands** | [11-faq.md#comandos-utiles](./docs/claude/11-faq.md) |
| **Next.js cache issues** | [11-faq.md#nextjs-cache-issues](./docs/claude/11-faq.md) - ⚠️ LEER |
| **Windows setup (PowerShell)** | [11-faq.md#windows-setup](./docs/claude/11-faq.md) - ✅ Recomendado |
| **Pre-commit untracked files** | Scripts automáticos detectan archivos sin trackear |
| **AI Prompt Management** | [14-ai-prompt-management.md](./docs/claude/14-ai-prompt-management.md) - Sistema centralizado |
| **getPromptTemplate()** | [14-ai-prompt-management.md#uso-del-sistema](./docs/claude/14-ai-prompt-management.md) |
| **Performance levels (AI)** | [14-ai-prompt-management.md#performance-levels](./docs/claude/14-ai-prompt-management.md) |
| **Prompt versioning** | [14-ai-prompt-management.md#database-schema](./docs/claude/14-ai-prompt-management.md) |
| **Dynamic prompts** | [14-ai-prompt-management.md](./docs/claude/14-ai-prompt-management.md) - 60+ prompts |

**💡 TIP:** Usa la herramienta `Grep` para buscar cualquier keyword en este archivo o en módulos específicos.

---

## 📋 CHECKPOINT PROTOCOL - TABLA CONSOLIDADA

**ANTES de cada acción importante, consulta esta tabla:**

| 🎯 Acción que vas a hacer | 📖 Sección a consultar | 🔍 Qué verificar |
|---------------------------|------------------------|------------------|
| **ANTES de empezar el día** | **`pnpm preflight`** | ⚡ Ejecutar PRE-FLIGHT CHECKS (2 min) |
| **CUALQUIER cambio de código** | **[ERRORES-COMETIDOS.md](./ERRORES-COMETIDOS.md)** | ⚠️ ¿Ya cometimos este error antes? |
| **Usar herramienta `Bash`** | [CLAUDE-CORE.md#regla-0](./CLAUDE-CORE.md) | ¿Contiene grep/sed/awk/cat/find? → Usar herramienta dedicada |
| **Modificar landing page** | [04-rules.md#landing-page](./docs/claude/04-rules.md) | ⚠️ Solo componentes oficiales |
| **Modificar dashboard** | [04-rules.md#dashboard](./docs/claude/04-rules.md) | ⚠️ ÚNICO archivo - PointsWidget obligatorio |
| **Restaurar desde producción** | [10-security.md#git-restore](./docs/claude/10-security.md) | ⚠️ `git checkout main --` |
| **Crear nuevo archivo .tsx** | [01-startup-protocol.md#index-md](./docs/claude/01-startup-protocol.md) | ⚠️ CONSULTAR INDEX.md primero |
| **Escribir componente React** | [04-rules.md#react-hooks](./docs/claude/04-rules.md) | ⚠️ Hooks ANTES de early returns |
| **Crear tRPC router** | [05-patterns.md#trpc-router-pattern](./docs/claude/05-patterns.md) | Validación Zod + filtro userId |
| **Crear schema DB** | [05-patterns.md#schema-drizzle-pattern](./docs/claude/05-patterns.md) | Timestamps + relations + types |
| **Hacer query a DB** | [10-security.md#userid-filtering](./docs/claude/10-security.md) | ¿Filtra por `userId`? |
| **Modificar cualquier UI** | [08-design-system.md](./docs/claude/08-design-system.md) | ⚠️ Paleta oficial? Variables CSS? Verificar dark mode |
| **Hacer commit** | [11-faq.md#checklist-pre-commit](./docs/claude/11-faq.md) | TypeCheck + Lint + Tests |
| **Usar procedimiento tRPC** | [06-prohibitions.md#procedimientos-trpc](./docs/claude/06-prohibitions.md) | ⚠️ ¿El procedimiento existe en el router? |
| **Importar componente/icono** | [06-prohibitions.md#imports-duplicados](./docs/claude/06-prohibitions.md) | ⚠️ ¿Ya existe import con este nombre? |
| **Crear type/enum** | [05-patterns.md#type-inference](./docs/claude/05-patterns.md) | ⚠️ ¿Ya existe en DB? Inferir en lugar de duplicar |
| **Silenciar tipo de error** | [05-patterns.md#error-handling](./docs/claude/05-patterns.md) | ⚠️ Actualizar AMBAS capas (console.error + React Query) o usar `silenced-error-types.ts` |

**📖 Ver tabla completa:** [02-checkpoint-protocol.md](./docs/claude/02-checkpoint-protocol.md)

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

**Estado actual (31 Ene 2026):**

| Métrica | Valor |
|---------|-------|
| **LOC Total** | 266,202 líneas |
| **Packages** | 14 packages en monorepo |
| **tRPC Procedures** | 85 routers, 836 procedures |
| **DB Schemas** | 69 schemas (27 activos, 42 históricos) |
| **React Components** | 304 componentes |
| **AI Agents** | 22 agentes (4 debate + 18 expertos) |
| **AI Prompts** | 60+ prompts dinámicos (3 performance tiers) |
| **Expert Database** | 80+ expertos en 5 categorías |
| **Tests Unitarios** | 328 passing (369 total) |
| **Tests E2E** | 29 archivos Playwright |
| **Test Coverage** | 80-100% en módulos core |
| **Deuda Técnica** | ⚠️ 22 enums hardcodeados (frontend) |
| **Build Status** | ✅ Clean (0 type errors en código nuevo) |
| **CI/CD** | Vercel (GitHub Actions NO usado por costos) |

**📖 Ver detalles:** [SYSTEM.md](./SYSTEM.md) y [PHASES.md](./PHASES.md)

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

**Estado actual (27 Ene 2026):**

| Área | Estado | Detalles |
|------|--------|----------|
| Quoorum Debates System | ✅ Activo | 20+ routers, 27 schemas, 369 test cases |
| AI Rate Limiting System | ✅ Implementado | 4 componentes completos (16 Ene 2026) |
| AI Config (agents) | ✅ Refactorizado | config/agent-config.ts + env vars |
| AI Config (expertos) | ✅ Refactorizado | config/expert-config.ts + 80+ expertos |
| **Deuda técnica IA** | ✅ **= 0** | **Todo configurable via env vars** |
| Deuda técnica (`any`) | ✅ 0 any types | Eliminados en 50+ archivos |
| Tests output | ✅ Funcionando | vitest 4.0.17 + reporters |
| Tests (unit) | ✅ 328 passing | 369 total (41 integration need DB) |
| Tests coverage | ✅ Medido | prompt-builder 100%, meta-moderator 94% |
| E2E Tests | ✅ Verificado | 29 archivos Playwright |
| Type errors | ✅ Resueltos | Build limpio |
| GitHub Actions | ❌ No configurado | Deliberado: usa Husky + Vercel CI |
| **Documentación** | ✅ **Refactorizada** | **Sistema modular (27 Ene 2026)** |

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
- **Sistema modular:** 12 módulos especializados
- **Navegación mejorada:** Índice maestro con búsqueda rápida
- **Nuevos módulos:**
  - 12-ai-systems.md (AI Rate Limiting & Fallback)
  - Estructura de archivos añadida a 01-startup-protocol.md
  - CI/CD y Checklist Pre-Commit añadidos a 11-faq.md

**Beneficios:**
- ✅ Más fácil de mantener (cambiar info una sola vez)
- ✅ Navegación más rápida (lectura dirigida)
- ✅ Archivos más pequeños (performance)
- ✅ Consistencia (una sola fuente de verdad)

### v1.15.0 - 31 Ene 2026

- **AI Prompt Management System** implementado
- 60+ prompts refactorizados a sistema dinámico
- 3 niveles de rendimiento (economic/balanced/performance)
- User settings UI para seleccionar nivel
- Admin UI placeholder para gestión de prompts
- Módulo 14 creado: [14-ai-prompt-management.md](./docs/claude/14-ai-prompt-management.md)
- TypeScript errors resueltos en código refactorizado
- Commits: `e52cd62`, `a6e71b6`

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
- **[docs/claude/](./docs/claude/)** - Directorio con 12 módulos especializados

---

## 🎯 FLUJO DE TRABAJO RECOMENDADO

```
1. Leo CLAUDE-CORE.md (5 min) ✅ Ahora
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
pnpm test             # Tests unitarios
pnpm test:e2e         # Tests E2E
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
