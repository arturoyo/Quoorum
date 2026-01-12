# Preguntas de Ejecución Técnica - Wallie

> **Versión:** 1.1.0 | **Fecha:** 10 Dic 2025
> **Estado:** ✅ TODAS RESPONDIDAS
> **Respuestas en:** [`TECHNICAL-GUIDELINES.md`](./TECHNICAL-GUIDELINES.md)

---

## ✅ RESUMEN DE ESTADO

Todas las preguntas técnicas han sido analizadas contra el código actual del proyecto y respondidas en el documento [`TECHNICAL-GUIDELINES.md`](./TECHNICAL-GUIDELINES.md).

| Categoría | Preguntas | Estado |
|-----------|-----------|--------|
| Testing | 5 | ✅ Respondidas |
| Debugging | 5 | ✅ Respondidas |
| Features | 5 | ✅ Respondidas |
| Dependencias | 4 | ✅ Respondidas |
| Base de Datos | 5 | ✅ Respondidas |
| Hotfixes | 4 | ✅ Respondidas |
| Documentación | 4 | ✅ Respondidas |
| Performance | 4 | ✅ Respondidas |
| Technical Debt | 3 | ✅ Respondidas |
| Seguridad | 4 | ✅ Respondidas |

---

## Lo que ya tenemos implementado

### Testing
- **Vitest** configurado con 65 archivos de tests
- **Playwright** para E2E con 8 specs
- Coverage reporter configurado (text, json, html)
- Tests de validación Zod para todos los routers

### Debugging
- **Health Check** en `/api/health` (DB, Supabase, AI, WhatsApp, Stripe)
- **Activity Logger** para eventos de seguridad (`packages/api/src/lib/activity-logger.ts`)
- **Monitoring Dashboard** en `/admin/monitoring`
- Logs estructurados en `security_logs` table

### Git Flow
- **GITFLOW.md** documentado completamente
- Branches: main → develop → feature/fix/hotfix
- **Commitlint** configurado con conventional commits
- **Husky** + **lint-staged** para pre-commit

### Base de Datos
- **Drizzle ORM** con comandos: generate, push, studio, seed
- Migraciones en `packages/db/src/migrations/`
- 40+ índices ya creados

### Seguridad
- **Rate Limiting** con Upstash Redis (auth: 5/min, api: 100/min, ai: 20/min)
- **Zod validation** en todos los inputs
- **Security headers** configurados en next.config.js

---

## Preguntas y dónde encontrar la respuesta

### 1. TESTING

| # | Pregunta | Respuesta |
|---|----------|-----------|
| 1.1 | ¿Cuándo escribir tests? | **OBLIGATORIO:** Nuevo router → test validación Zod. Bug fix → test que reproduce. Ver `TECHNICAL-GUIDELINES.md § Testing` |
| 1.2 | ¿Qué coverage mínimo? | Routers: 100% (validación). Servicios críticos: 80%. UI: no requerido |
| 1.3 | ¿Cómo testear integraciones? | Mocks con Vitest. Ver `packages/api/src/__tests__/` como ejemplo |
| 1.4 | ¿Test DB separada? | No. Usamos mocks para tests unitarios |
| 1.5 | ¿E2E sin afectar prod? | Playwright en localhost. Ver `apps/web/e2e/` |

### 2. DEBUGGING

| # | Pregunta | Respuesta |
|---|----------|-----------|
| 2.1 | ¿Cómo debuggear en prod? | 1) `/admin/monitoring` 2) Vercel Logs 3) Supabase Studio. Ver `TECHNICAL-GUIDELINES.md § Debugging` |
| 2.2 | ¿Cómo reproducir bug? | Obtener userId/timestamp → Ver `security_logs` → Crear datos prueba en local |
| 2.3 | ¿Dónde están logs? | Runtime: Vercel. Seguridad: `security_logs` table. Errores: Sentry (pendiente) |
| 2.4 | ¿Acceso seguro a prod? | Supabase Studio solo lectura. NUNCA copiar datos de prod |
| 2.5 | ¿Retención de logs? | Vercel: 7-30 días. DB: indefinido |

### 3. FEATURES

| # | Pregunta | Respuesta |
|---|----------|-----------|
| 3.1 | ¿Flujo completo? | Backend First: Schema → Router → Tests → UI → typecheck → build → commit. Ver `TECHNICAL-GUIDELINES.md § Features` |
| 3.2 | ¿Priorizar features vs bugs? | Bugs críticos (afectan todos users) > Features > Bugs menores |
| 3.3 | ¿Features > 1 día? | Feature branches con commits diarios |
| 3.4 | ¿Rollout gradual? | No implementado aún. Evaluar cuando sea necesario |
| 3.5 | ¿Documentar decisiones? | En `CLAUDE.md` (Problemas Recurrentes) + commit messages descriptivos |

### 4. DEPENDENCIAS

| # | Pregunta | Respuesta |
|---|----------|-----------|
| 4.1 | ¿Cuándo actualizar? | Security: inmediato. Minor: mensual. Major: evaluar. Ver `TECHNICAL-GUIDELINES.md § Dependencias` |
| 4.2 | ¿Evaluar nueva dep? | ¿Necesaria? ¿En STACK.md? ¿Mantenida? ¿Bundle size? |
| 4.3 | ¿Vulnerabilidad? | `pnpm audit`. Critical/High bloquea merge. Medium/Low → issue |
| 4.4 | ¿Breaking changes? | Evaluar caso por caso. Leer changelog. Probar en branch |

### 5. BASE DE DATOS

| # | Pregunta | Respuesta |
|---|----------|-----------|
| 5.1 | ¿Migraciones sin downtime? | Añadir columna → Deploy → Eliminar columna vieja en siguiente release. Ver `TECHNICAL-GUIDELINES.md § DB` |
| 5.2 | ¿Revertir migración? | Si no hay datos: DROP. Si hay datos: restore backup |
| 5.3 | ¿Datos prueba vs prod? | NUNCA mezclar. Usar `pnpm db:seed` para datos de prueba |
| 5.4 | ¿Cuándo índices? | FKs (auto), campos de búsqueda, campos de ordenamiento |
| 5.5 | ¿Queries lentas? | `pg_stat_statements` + `EXPLAIN ANALYZE` |

### 6. HOTFIXES

| # | Pregunta | Respuesta |
|---|----------|-----------|
| 6.1 | ¿Proceso hotfix? | `git checkout main` → `hotfix/xxx` → fix mínimo → build → PR directo a main. Ver `TECHNICAL-GUIDELINES.md § Hotfixes` |
| 6.2 | ¿Merge directo a main? | SÍ, solo para hotfixes críticos. Después merge a develop |
| 6.3 | ¿Comunicar incidente? | Post-mortem doc. Template en `TECHNICAL-GUIDELINES.md` |
| 6.4 | ¿Deploy falla? | Rollback en Vercel (más rápido) o `git revert` |

### 7. DOCUMENTACIÓN

| # | Pregunta | Respuesta |
|---|----------|-----------|
| 7.1 | ¿Cuándo actualizar? | Nuevo router → `API-REFERENCE.md`. Error recurrente → `CLAUDE.md`. Ver `TECHNICAL-GUIDELINES.md § Docs` |
| 7.2 | ¿Qué documentar? | API endpoints, arquitectura, errores comunes. NO código obvio |
| 7.3 | ¿Dónde decisiones? | `CLAUDE.md` (sección Problemas Recurrentes) |
| 7.4 | ¿Sync docs-código? | Durante PR, revisar si docs necesitan update |

### 8. PERFORMANCE

| # | Pregunta | Respuesta |
|---|----------|-----------|
| 8.1 | ¿Detectar problemas? | `/api/health` (latencia servicios), `/admin/monitoring` |
| 8.2 | ¿Qué monitorear? | Page load, API response, DB query, AI response |
| 8.3 | ¿Límites? | API: <200ms. DB: <50ms. AI: <3s. Page: <2s. Ver `TECHNICAL-GUIDELINES.md § Performance` |
| 8.4 | ¿Profiling? | `pg_stat_statements` para DB. Vercel Analytics para frontend |

### 9. TECHNICAL DEBT

| # | Pregunta | Respuesta |
|---|----------|-----------|
| 9.1 | ¿Trackear? | Comentarios `// TECH_DEBT:` en código |
| 9.2 | ¿Cuándo pagar? | Bloquea features → YA. Causa bugs → próximo sprint. Feo → cuando toque |
| 9.3 | ¿Evitar? | Code review, tests, regla Boy Scout ("deja mejor de como lo encontraste") |

### 10. SEGURIDAD

| # | Pregunta | Respuesta |
|---|----------|-----------|
| 10.1 | ¿Manejar secrets? | `.env.local` (dev), Vercel env vars (prod). NUNCA en código. Ver `TECHNICAL-GUIDELINES.md § Seguridad` |
| 10.2 | ¿Rotar keys? | Cada 90 días o inmediatamente si hay sospecha |
| 10.3 | ¿Secret expuesto? | 1) Revocar en servicio 2) Generar nuevo 3) Actualizar Vercel 4) Limpiar git history |
| 10.4 | ¿Auditar accesos? | `security_logs` table + `/admin/monitoring` |

---

## 📚 Documentos relacionados

| Documento | Propósito |
|-----------|-----------|
| [`TECHNICAL-GUIDELINES.md`](./TECHNICAL-GUIDELINES.md) | **Respuestas detalladas con ejemplos** |
| [`CLAUDE.md`](/CLAUDE.md) | Reglas inviolables + Problemas recurrentes |
| [`GITFLOW.md`](./GITFLOW.md) | Estrategia de Git completa |
| [`DEPLOYMENT-CHECKLIST.md`](../checklists/DEPLOYMENT-CHECKLIST.md) | Checklist de deploy |
| [`API-REFERENCE.md`](../API-REFERENCE.md) | Referencia de routers y schemas |

---

## Los 5 Mandamientos (Resumen)

```
1. ANTES de codear → pnpm typecheck
2. ANTES de commit → pnpm build
3. SIEMPRE filtrar por userId en queries
4. NUNCA secrets en código
5. Bug fix → test que reproduce PRIMERO
```

---

_Última actualización: 10 Dic 2025_
