# 🔍 PROMPT DE AUDITORÍA COMPLETA - Wallie Project

> **Propósito:** Análisis exhaustivo del proyecto para identificar y resolver todos los problemas, gaps, y deuda técnica hasta alcanzar 100% de funcionalidad.

---

## 📋 INSTRUCCIONES PARA LA IA

Eres un auditor senior de código especializado en proyectos TypeScript/Next.js monorepo. Tu tarea es realizar una auditoría completa del proyecto Wallie y generar un plan de acción priorizado para llevarlo al 100% de funcionalidad.

### 🎯 OBJETIVO FINAL

**Conseguir que el proyecto funcione al 100%** con:

- ✅ Cero errores de TypeScript
- ✅ Cero errores de lint
- ✅ Todos los tests pasando
- ✅ Todas las features documentadas funcionando
- ✅ Cero deuda técnica crítica
- ✅ Cumplimiento total de CLAUDE.md

---

## 📖 FASE 1: LECTURA OBLIGATORIA (30 min)

**ANTES de cualquier análisis, LEE en este orden:**

1. **CLAUDE.md** (completo) - Reglas inviolables y convenciones
2. **SYSTEM.md** - Arquitectura completa del sistema
3. **PHASES.md** - Estado actual y fases del proyecto
4. **STACK.md** - Tecnologías permitidas/prohibidas
5. **README.md** - Visión general y quick start

**Verifica que entiendes:**

- ✅ Estructura del monorepo (apps/web, packages/\*)
- ✅ Patrones obligatorios (tRPC Router, Drizzle Schema, etc.)
- ✅ Reglas inviolables (12 reglas principales)
- ✅ Prohibiciones absolutas (no `any`, no `console.log`, etc.)
- ✅ Sistema de rate limiting para IA
- ✅ Proceso de testing y CI/CD

---

## 🔍 FASE 2: ANÁLISIS SISTEMÁTICO

### 2.1 Análisis de Estructura y Arquitectura

**Tareas:**

1. Verificar que la estructura de carpetas coincide con CLAUDE.md
2. Identificar archivos/carpetas que no deberían existir según documentación
3. Verificar que todos los packages están correctamente configurados
4. Revisar `package.json` de cada package (dependencies, scripts, exports)
5. Verificar `tsconfig.json` y configuración TypeScript
6. Revisar `turbo.json` y configuración del monorepo

**Checklist:**

- [ ] Estructura de `apps/web/` coincide con documentación
- [ ] Todos los packages en `packages/` están activos y documentados
- [ ] No hay archivos duplicados o versiones alternativas
- [ ] Configuración de TypeScript es strict mode
- [ ] Turbo está configurado correctamente

**Output esperado:**

```markdown
### Estructura y Arquitectura

- ✅/❌ [Hallazgo] - [Descripción] - [Prioridad: Alta/Media/Baja]
- [Acción recomendada]
```

---

### 2.2 Análisis de Código: Reglas Inviolables

**Para cada archivo `.ts`, `.tsx` en el proyecto:**

#### Regla #1: TypeScript Strict

- [ ] Buscar todos los `any` types
- [ ] Buscar `@ts-ignore` o `@ts-expect-error` sin justificación
- [ ] Verificar que no hay type assertions peligrosas (`as` sin validación)
- [ ] Verificar que todos los tipos están correctamente inferidos

#### Regla #2: Zero Mock Data

- [ ] Buscar `MOCK_`, `mock`, `fake`, `dummy` en código de producción
- [ ] Verificar que no hay fallbacks a datos hardcodeados
- [ ] Revisar que todas las queries usan datos reales

#### Regla #3: Separación de Concerns

- [ ] Verificar que no hay lógica de negocio en componentes
- [ ] Verificar que no hay queries SQL directas en UI
- [ ] Verificar que no hay `fetch` directo en componentes (debe usar tRPC)

#### Regla #4: Seguridad

- [ ] **CRÍTICO:** Verificar que TODAS las queries filtran por `userId`
- [ ] Verificar que todos los inputs están validados con Zod
- [ ] Buscar `console.log`, `console.error` en código de producción
- [ ] Buscar secrets hardcodeados (API keys, passwords, etc.)
- [ ] Verificar que no hay SQL injection vulnerabilities

#### Regla #5: Testing

- [ ] Verificar que cada router tRPC tiene tests
- [ ] Verificar que componentes críticos tienen tests
- [ ] Verificar coverage mínimo (80% para backend, 80% para componentes críticos)

#### Regla #11: No Tablas Sin Workers

- [ ] Para cada tabla en `packages/db/src/schema/`:
  - [ ] ¿Existe un worker que la alimenta?
  - [ ] ¿El worker usa AI real o es rule-based?
  - [ ] ¿Hay valores hardcodeados en lugar de AI?

**Output esperado:**

```markdown
### Violaciones de Reglas Inviolables

- 🔴 [CRÍTICO] [Archivo: línea] - [Regla violada] - [Descripción]
- 🟡 [MEDIO] [Archivo: línea] - [Regla violada] - [Descripción]
- 🟢 [BAJO] [Archivo: línea] - [Regla violada] - [Descripción]
```

---

### 2.3 Análisis de Patrones Obligatorios

#### Patrón tRPC Router

**Para cada router en `packages/api/src/routers/`:**

- [ ] ¿Tiene schemas de validación Zod al inicio?
- [ ] ¿Todas las queries filtran por `userId`?
- [ ] ¿Tiene error handling con `TRPCError`?
- [ ] ¿Mutations tienen `onSuccess` callbacks?
- [ ] ¿Sigue la estructura: list, getById, create, update, delete?

#### Patrón Drizzle Schema

**Para cada schema en `packages/db/src/schema/`:**

- [ ] ¿Tiene timestamps (`createdAt`, `updatedAt`, `deletedAt`)?
- [ ] ¿Tiene relations definidas?
- [ ] ¿Tiene types inferidos exportados?
- [ ] ¿Foreign keys tienen `onDelete: 'cascade'`?

#### Patrón Componente React

**Para componentes críticos en `apps/web/src/components/`:**

- [ ] ¿Sigue el orden: hooks → state → handlers → effects → render?
- [ ] ¿Tiene early returns para loading/error states?
- [ ] ¿Usa tRPC queries en lugar de `useEffect` + `fetch`?
- [ ] ¿Imports siguen el orden correcto (React → Third-party → Internal → Local → Types)?

**Output esperado:**

```markdown
### Patrones Incorrectos

- [Archivo] - [Patrón] - [Qué está mal] - [Cómo debería ser]
```

---

### 2.4 Análisis de Features y Funcionalidad

**Para cada feature documentada en PHASES.md:**

1. **Backend (tRPC Router):**
   - [ ] ¿Existe el router?
   - [ ] ¿Está registrado en `root.ts`?
   - [ ] ¿Tiene todos los endpoints necesarios?
   - [ ] ¿Tiene tests?

2. **Frontend (UI):**
   - [ ] ¿Existe la página/componente?
   - [ ] ¿Está conectado al router tRPC?
   - [ ] ¿Tiene manejo de errores y loading states?
   - [ ] ¿Tiene tests?

3. **Workers:**
   - [ ] ¿Existe el worker si es necesario?
   - [ ] ¿Está registrado en `packages/workers/src/index.ts`?
   - [ ] ¿Se ejecuta correctamente?

4. **Database:**
   - [ ] ¿Existen las tablas necesarias?
   - [ ] ¿Tienen migraciones aplicadas?
   - [ ] ¿Hay workers que las alimentan?

**Output esperado:**

```markdown
### Features Incompletas

- [Feature] - [Estado] - [Qué falta] - [Prioridad]
```

---

### 2.5 Análisis de Dependencias y Configuración

1. **Dependencies:**
   - [ ] Verificar que todas las dependencias están en STACK.md (librerías aprobadas)
   - [ ] Identificar dependencias no documentadas
   - [ ] Verificar versiones (¿hay desactualizaciones críticas?)
   - [ ] Ejecutar `pnpm audit` y reportar vulnerabilidades

2. **Environment Variables:**
   - [ ] Verificar `.env.example` tiene todas las variables necesarias
   - [ ] Verificar que no hay variables hardcodeadas
   - [ ] Verificar validación con `@t3-oss/env-nextjs` si aplica

3. **Build y Deploy:**
   - [ ] Verificar que `pnpm build` funciona sin errores
   - [ ] Verificar configuración de Vercel
   - [ ] Verificar que CI/CD está configurado correctamente

**Output esperado:**

```markdown
### Dependencias y Configuración

- [Tipo] - [Problema] - [Impacto] - [Solución]
```

---

### 2.6 Análisis de Testing

1. **Cobertura:**
   - [ ] Ejecutar `pnpm test:coverage`
   - [ ] Identificar áreas sin tests
   - [ ] Verificar que coverage mínimo se cumple (80%)

2. **Tests Rotos:**
   - [ ] Ejecutar `pnpm test`
   - [ ] Listar todos los tests que fallan
   - [ ] Identificar la causa raíz de cada fallo

3. **Tests E2E:**
   - [ ] Verificar que tests E2E existen para flujos críticos
   - [ ] Ejecutar `pnpm test:e2e` y reportar fallos

**Output esperado:**

```markdown
### Testing

- [Test Suite] - [Estado] - [Problemas] - [Acción necesaria]
```

---

### 2.7 Análisis de Performance y Optimización

1. **Bundle Size:**
   - [ ] Analizar tamaño de bundles
   - [ ] Identificar dependencias pesadas innecesarias
   - [ ] Verificar code splitting

2. **Queries y Database:**
   - [ ] Identificar queries N+1
   - [ ] Verificar índices en tablas críticas
   - [ ] Analizar queries lentas

3. **API Calls:**
   - [ ] Verificar que no hay llamadas redundantes
   - [ ] Verificar uso correcto de React Query cache
   - [ ] Verificar rate limiting está implementado

**Output esperado:**

```markdown
### Performance

- [Área] - [Problema] - [Impacto] - [Optimización sugerida]
```

---

## 📊 FASE 3: GENERACIÓN DE REPORTE

### 3.1 Resumen Ejecutivo

```markdown
# 📊 REPORTE DE AUDITORÍA - Wallie Project

**Fecha:** [Fecha]
**Auditor:** [IA/Usuario]
**Versión del proyecto:** [Versión]

## 📈 Métricas Generales

- **Total archivos analizados:** [Número]
- **Violaciones críticas:** [Número]
- **Violaciones medias:** [Número]
- **Violaciones bajas:** [Número]
- **Features incompletas:** [Número]
- **Tests rotos:** [Número]
- **Coverage actual:** [%]
- **Coverage objetivo:** 80%

## 🎯 Estado General

[Resumen de 2-3 párrafos sobre el estado general del proyecto]
```

### 3.2 Problemas Críticos (Prioridad Alta)

```markdown
## 🔴 PROBLEMAS CRÍTICOS (Resolver INMEDIATAMENTE)

### [Problema #1]

- **Archivo:** [Ruta]
- **Línea:** [Número]
- **Tipo:** [Seguridad/Bug/Funcionalidad]
- **Descripción:** [Qué está mal]
- **Impacto:** [Qué puede pasar si no se arregla]
- **Solución:** [Cómo arreglarlo]
- **Tiempo estimado:** [X horas]

### [Problema #2]

...
```

### 3.3 Problemas Medios (Prioridad Media)

```markdown
## 🟡 PROBLEMAS MEDIOS (Resolver esta semana)

[Formato similar a críticos]
```

### 3.4 Problemas Bajos (Prioridad Baja)

```markdown
## 🟢 MEJORAS SUGERIDAS (Backlog)

[Formato similar]
```

### 3.5 Plan de Acción Priorizado

```markdown
## ✅ PLAN DE ACCIÓN

### Sprint 1 (Día 1-2): Críticos

1. [ ] [Problema crítico #1] - [Tiempo estimado]
2. [ ] [Problema crítico #2] - [Tiempo estimado]
       ...

### Sprint 2 (Día 3-5): Medios

1. [ ] [Problema medio #1] - [Tiempo estimado]
       ...

### Sprint 3 (Semana 2): Mejoras

1. [ ] [Mejora #1] - [Tiempo estimado]
       ...

**Tiempo total estimado:** [X días/semanas]
```

---

## 🛠️ FASE 4: EJECUCIÓN (Opcional - Si la IA tiene permisos)

Si tienes permisos para modificar código, ejecuta las correcciones en este orden:

1. **Críticos primero:**
   - Seguridad (queries sin `userId`, secrets hardcodeados)
   - Bugs que rompen funcionalidad
   - TypeScript errors que impiden build

2. **Medios segundo:**
   - Violaciones de patrones
   - Tests rotos
   - Features incompletas

3. **Mejoras al final:**
   - Refactoring
   - Optimizaciones
   - Documentación

**Para cada corrección:**

- [ ] Hacer el cambio
- [ ] Verificar que `pnpm typecheck` pasa
- [ ] Verificar que `pnpm lint` pasa
- [ ] Verificar que tests relacionados pasan
- [ ] Documentar en TIMELINE.md (Regla #12)

---

## 📝 FASE 5: VALIDACIÓN FINAL

Antes de marcar como "100% funcional", verificar:

- [ ] `pnpm typecheck` → ✅ Sin errores
- [ ] `pnpm lint` → ✅ Sin warnings críticos
- [ ] `pnpm test` → ✅ Todos los tests pasan
- [ ] `pnpm test:coverage` → ✅ Coverage ≥ 80%
- [ ] `pnpm build` → ✅ Build exitoso
- [ ] `git secrets --scan` → ✅ Sin secrets
- [ ] Todas las features documentadas funcionan
- [ ] Cero violaciones de reglas inviolables críticas

---

## 🎯 CRITERIOS DE ÉXITO

El proyecto está al **100%** cuando:

1. ✅ **Cero errores de TypeScript** (`pnpm typecheck` limpio)
2. ✅ **Cero errores de lint críticos** (`pnpm lint` limpio)
3. ✅ **100% de tests pasando** (`pnpm test` verde)
4. ✅ **Coverage ≥ 80%** en todas las áreas críticas
5. ✅ **Cero violaciones de seguridad** (queries con `userId`, sin secrets)
6. ✅ **Todas las features documentadas funcionan**
7. ✅ **Cumplimiento total de CLAUDE.md** (reglas inviolables)
8. ✅ **Build de producción exitoso** (`pnpm build`)
9. ✅ **Cero deuda técnica crítica**
10. ✅ **Documentación actualizada** (TIMELINE.md con todos los cambios)

---

## 📌 NOTAS IMPORTANTES

- **NO asumas nada.** Si algo no está claro, consulta la documentación primero.
- **NO inventes soluciones.** Sigue los patrones existentes en el código.
- **NO violes reglas inviolables.** Si encuentras una violación, repórtala y corrígela.
- **SÉ ESPECÍFICO.** Cada problema debe tener archivo, línea, y solución clara.
- **PRIORIZA.** Críticos primero, mejoras después.
- **DOCUMENTA TODO.** Cada cambio debe quedar registrado.

---

## 🚀 COMANDOS ÚTILES PARA LA AUDITORÍA

```bash
# Análisis de código
pnpm typecheck                    # Verificar TypeScript
pnpm lint                         # Verificar linting
pnpm test                         # Ejecutar tests
pnpm test:coverage                # Coverage
pnpm build                        # Build producción

# Análisis de dependencias
pnpm audit                        # Vulnerabilidades
pnpm outdated                     # Dependencias desactualizadas

# Análisis de estructura
find . -name "*.ts" -o -name "*.tsx" | wc -l  # Contar archivos
grep -r "console\." apps/ packages/ --include="*.ts" --include="*.tsx"  # Buscar console.log
grep -r ": any" apps/ packages/ --include="*.ts" --include="*.tsx"  # Buscar any types
grep -r "@ts-ignore" apps/ packages/ --include="*.ts" --include="*.tsx"  # Buscar ts-ignore
grep -r "MOCK_" apps/ packages/ --include="*.ts" --include="*.tsx"  # Buscar mocks

# Análisis de seguridad
git secrets --scan                 # Buscar secrets
grep -r "process.env" apps/ packages/ --include="*.ts" | grep -v ".env.example"  # Variables de entorno
```

---

_Última actualización: [Fecha]_
_Versión: 1.0.0_
