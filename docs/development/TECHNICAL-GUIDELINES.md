# Guías de Ejecución Técnica - Wallie

> **Versión:** 1.0.0 | **Fecha:** 10 Dic 2025
> **Propósito:** Respuestas definitivas sobre cómo ejecutar el desarrollo sin errores
> **Basado en:** Análisis del código actual del proyecto

---

## 📋 Índice

1. [Testing](#1-testing)
2. [Debugging y Errores](#2-debugging-y-errores)
3. [Desarrollo de Features](#3-desarrollo-de-features)
4. [Dependencias](#4-dependencias)
5. [Base de Datos](#5-base-de-datos)
6. [Hotfixes y Emergencias](#6-hotfixes-y-emergencias)
7. [Documentación](#7-documentación)
8. [Performance](#8-performance)
9. [Technical Debt](#9-technical-debt)
10. [Seguridad](#10-seguridad-en-desarrollo)

---

## 1. TESTING

### ¿Qué tenemos actualmente?

| Tipo | Herramienta | Archivos | Ubicación |
|------|-------------|----------|-----------|
| Unit Tests | Vitest | 65 archivos | `packages/**/src/__tests__/` |
| E2E Tests | Playwright | 8 specs | `apps/web/e2e/` |
| Validation Tests | Vitest + Zod | Todos los routers | `packages/api/src/__tests__/` |

### ¿Cuándo escribir tests?

```
┌─────────────────────────────────────────────────────────────┐
│  OBLIGATORIO:                                                │
│  ✓ Nuevo router tRPC → test de validación Zod               │
│  ✓ Bug fix → test que reproduce el bug ANTES de arreglar    │
│  ✓ Lógica de negocio crítica → unit test                    │
│                                                              │
│  RECOMENDADO:                                                │
│  ○ Componentes complejos → tests de componente              │
│  ○ Flujos críticos → E2E con Playwright                     │
└─────────────────────────────────────────────────────────────┘
```

### Patrón de test de validación (usar como template)

```typescript
// packages/api/src/__tests__/[router]-validation.test.ts
import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Copiar el schema del router
const createSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
})

describe('[router] validation schemas', () => {
  describe('createSchema', () => {
    it('should accept valid data', () => {
      const result = createSchema.safeParse({ name: 'Test' })
      expect(result.success).toBe(true)
    })

    it('should reject invalid data', () => {
      const result = createSchema.safeParse({ name: '' })
      expect(result.success).toBe(false)
    })
  })
})
```

### Comandos de testing

```bash
# Ejecutar todos los tests
pnpm test

# Watch mode (desarrollo)
pnpm test:watch

# Con coverage
pnpm test:coverage

# E2E (requiere app corriendo)
cd apps/web && npx playwright test

# E2E con UI
cd apps/web && npx playwright test --ui
```

### Coverage mínimo requerido

| Área | Mínimo | Ideal |
|------|--------|-------|
| Routers (validación) | 100% | 100% |
| Servicios críticos | 80% | 90% |
| Componentes UI | No requerido | 60% |

---

## 2. DEBUGGING Y ERRORES

### ¿Qué tenemos para debugging?

| Herramienta | Propósito | Ubicación/Acceso |
|-------------|-----------|------------------|
| Health Check | Estado de servicios | `/api/health` |
| Activity Logger | Eventos de seguridad | `packages/api/src/lib/activity-logger.ts` |
| Monitoring Dashboard | Vista en tiempo real | `/admin/monitoring` |
| Vercel Logs | Logs de producción | Dashboard Vercel |
| Sentry | Error tracking | ⚠️ PENDIENTE configurar |

### Proceso de debugging en producción

```
┌─────────────────────────────────────────────────────────────┐
│  PASO 1: Identificar el error                               │
│  - Revisar /admin/monitoring para errores recientes         │
│  - Revisar Vercel Dashboard → Logs                          │
│  - Buscar en Sentry (cuando esté configurado)               │
├─────────────────────────────────────────────────────────────┤
│  PASO 2: Obtener contexto                                   │
│  - userId o conversationId del usuario afectado             │
│  - Timestamp del error                                       │
│  - Revisar securityLogs en Supabase Studio                  │
├─────────────────────────────────────────────────────────────┤
│  PASO 3: Reproducir en local                                │
│  - NUNCA copiar datos de producción a local                 │
│  - Usar Supabase Studio para ver datos (solo lectura)       │
│  - Crear datos de prueba que simulen el escenario           │
├─────────────────────────────────────────────────────────────┤
│  PASO 4: Arreglar y verificar                               │
│  - Escribir test que reproduce el bug                       │
│  - Arreglar el bug                                          │
│  - pnpm typecheck && pnpm build                             │
│  - Commit con mensaje: fix(scope): descripción              │
└─────────────────────────────────────────────────────────────┘
```

### Health Check - Servicios monitoreados

```typescript
// GET /api/health devuelve:
{
  status: 'healthy' | 'degraded' | 'unhealthy',
  services: {
    database: { status, latency },   // PostgreSQL via Drizzle
    supabase: { status, latency },   // Supabase REST API
    ai: { status, latency },         // Gemini API key
    whatsapp: { status, latency },   // WhatsApp credentials
    stripe: { status, latency }      // Stripe key
  }
}
```

### Logs de seguridad disponibles

El `activity-logger.ts` registra automáticamente:
- `login` / `login_failed` - Intentos de login
- `logout` - Cierre de sesión
- `two_factor_enabled` / `two_factor_disabled` - Cambios 2FA
- `password_changed` - Cambio de contraseña
- `profile_updated` / `settings_updated` - Cambios de perfil
- `session_revoked` / `all_sessions_revoked` - Revocación de sesiones
- `subscription_*` - Cambios de suscripción
- `client_*` - Cambios en clientes
- `whatsapp_connected` / `whatsapp_disconnected` - Estado WhatsApp

### ¿Dónde ver logs?

| Tipo | Ubicación | Retención |
|------|-----------|-----------|
| Runtime logs | Vercel Dashboard → Logs | 7-30 días |
| Security logs | Supabase → `security_logs` table | Indefinido |
| Error tracking | Sentry (⚠️ pendiente) | 90 días |
| Build logs | Vercel Dashboard → Deployments | 30 días |

---

## 3. DESARROLLO DE FEATURES

### Flujo completo para feature nueva

```
┌─────────────────────────────────────────────────────────────┐
│  FASE 1: PLANIFICACIÓN (antes de codear)                    │
├─────────────────────────────────────────────────────────────┤
│  [ ] Leer CLAUDE.md completo                                │
│  [ ] Definir: ¿Qué tablas nuevas necesito?                  │
│  [ ] Definir: ¿Qué endpoints/routers necesito?              │
│  [ ] Identificar dependencias existentes                     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  FASE 2: DESARROLLO (Backend First)                         │
├─────────────────────────────────────────────────────────────┤
│  [ ] git checkout develop && git pull                       │
│  [ ] git checkout -b feature/nombre-descriptivo             │
│  [ ] Crear schema DB → pnpm db:generate → pnpm db:push      │
│  [ ] Crear router tRPC + exportar en root.ts                │
│  [ ] Crear test de validación del router                    │
│  [ ] pnpm typecheck (verificar que compila)                 │
│  [ ] Crear componentes UI                                    │
│  [ ] pnpm typecheck && pnpm build                           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  FASE 3: VERIFICACIÓN (obligatorio)                         │
├─────────────────────────────────────────────────────────────┤
│  [ ] pnpm typecheck   → SIN ERRORES                         │
│  [ ] pnpm lint        → SIN ERRORES CRÍTICOS                │
│  [ ] pnpm build       → COMPILA EXITOSAMENTE                │
│  [ ] pnpm test        → TESTS PASAN                         │
│  [ ] Probar manualmente en localhost:3000                   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  FASE 4: COMMIT Y PR                                        │
├─────────────────────────────────────────────────────────────┤
│  [ ] git add .                                               │
│  [ ] git commit -m "feat(scope): descripción"               │
│  [ ] git push origin feature/nombre-descriptivo             │
│  [ ] Crear PR → develop                                      │
│  [ ] Esperar CI verde                                        │
│  [ ] Merge (squash preferido)                               │
└─────────────────────────────────────────────────────────────┘
```

### Checklist de nuevo router

```bash
# 1. Crear archivo del router
touch packages/api/src/routers/mi-router.ts

# 2. ⚠️ IMPORTANTE: Añadir al root (NO OLVIDAR)
# Editar packages/api/src/root.ts:
# import { miRouter } from './routers/mi-router'
# export const appRouter = router({
#   ...otros,
#   mi: miRouter,  // ← AÑADIR
# })

# 3. Crear test de validación
touch packages/api/src/__tests__/mi-router-validation.test.ts

# 4. Verificar
pnpm typecheck
```

### Checklist de nuevo schema DB

```bash
# 1. Crear archivo de schema
touch packages/db/src/schema/mi-tabla.ts

# 2. ⚠️ IMPORTANTE: Exportar en index (NO OLVIDAR)
# Editar packages/db/src/schema/index.ts:
# export * from './mi-tabla'

# 3. Generar y aplicar migración
pnpm db:generate
pnpm db:push

# 4. Verificar en Supabase Studio
pnpm db:studio
```

### Features que tardan más de 1 día

```bash
# Usar feature branches
git checkout -b feature/mi-feature-grande

# Commits frecuentes (mínimo diarios)
git commit -m "feat(scope): progreso día 1"
git push origin feature/mi-feature-grande

# NUNCA dejar código sin commit al final del día
```

---

## 4. DEPENDENCIAS

### Política de dependencias

```
┌─────────────────────────────────────────────────────────────┐
│  ANTES DE AÑADIR UNA DEPENDENCIA:                           │
│                                                              │
│  [ ] ¿Realmente la necesito?                                │
│  [ ] ¿Está en STACK.md como aprobada?                       │
│  [ ] ¿Tiene mantenimiento activo? (commits últimos 6 meses) │
│  [ ] ¿Cuánto añade al bundle size?                          │
│  [ ] ¿Hay alternativa nativa o más ligera?                  │
└─────────────────────────────────────────────────────────────┘
```

### Cuándo actualizar dependencias

| Tipo | Frecuencia | Acción |
|------|------------|--------|
| Security patches | Inmediatamente | `pnpm update [pkg]` |
| Minor versions | Mensualmente | Revisar changelog |
| Major versions | Caso por caso | Evaluar breaking changes |

### Verificar vulnerabilidades

```bash
# Auditar dependencias
pnpm audit

# Si hay vulnerabilidades:
# - Critical/High → Arreglar ANTES de merge
# - Medium/Low → Crear issue para arreglar
```

### Añadir dependencia nueva

```bash
# En el package correcto
pnpm add <paquete> --filter @wallie/api

# O en root si es herramienta de desarrollo
pnpm add -D <paquete> -w

# Verificar que sigue compilando
pnpm typecheck && pnpm build
```

---

## 5. BASE DE DATOS

### Herramientas disponibles

| Comando | Propósito |
|---------|-----------|
| `pnpm db:generate` | Genera migración desde cambios en schema |
| `pnpm db:push` | Aplica migraciones a la base de datos |
| `pnpm db:studio` | Abre Drizzle Studio (GUI) |
| `pnpm db:seed` | Ejecuta seed de datos |

### Proceso de migración segura

```
┌─────────────────────────────────────────────────────────────┐
│  REGLA DE ORO: Nunca romper datos existentes                │
└─────────────────────────────────────────────────────────────┘

AÑADIR COLUMNA:
1. Añadir con .default() o .nullable()
2. pnpm db:generate
3. pnpm db:push
4. Actualizar código para usar nueva columna

ELIMINAR COLUMNA (proceso de 2 pasos):
1. PRIMERO: Eliminar referencias en código
2. Deploy y verificar que funciona
3. DESPUÉS: Eliminar columna de schema
4. pnpm db:generate && pnpm db:push

RENOMBRAR COLUMNA (proceso de 3 pasos):
1. Añadir columna nueva
2. Migrar datos (script manual)
3. Eliminar columna vieja (en siguiente release)
```

### Verificar migración antes de aplicar

```bash
# 1. Generar migración
pnpm db:generate

# 2. Revisar SQL generado en packages/db/src/migrations/
# Verificar que no hay DROP destructivos

# 3. Aplicar en desarrollo primero
pnpm db:push

# 4. Verificar en Supabase Studio
pnpm db:studio
```

### Índices

```typescript
// Añadir índices en campos de:
// - Foreign keys (automático en Drizzle)
// - Campos de búsqueda frecuente
// - Campos de ordenamiento

// Ejemplo en schema:
import { index } from 'drizzle-orm/pg-core'

export const clients = pgTable('clients', {
  // ... campos
}, (table) => ({
  userIdIdx: index('clients_user_id_idx').on(table.userId),
  emailIdx: index('clients_email_idx').on(table.email),
}))
```

---

## 6. HOTFIXES Y EMERGENCIAS

### Evaluación de severidad (5 min máximo)

| Pregunta | Sí → Acción |
|----------|-------------|
| ¿Afecta a TODOS los usuarios? | CRÍTICO - hotfix inmediato |
| ¿Hay pérdida de datos? | CRÍTICO - hotfix inmediato |
| ¿Usuarios no pueden hacer login? | CRÍTICO - hotfix inmediato |
| ¿Pagos no funcionan? | CRÍTICO - hotfix inmediato |
| ¿Solo afecta feature secundaria? | ALTO - fix en develop |
| ¿Es cosmético? | BAJO - siguiente sprint |

### Proceso de hotfix

```bash
# 1. Crear branch desde main
git checkout main
git pull origin main
git checkout -b hotfix/descripcion-corta

# 2. Fix MÍNIMO - solo lo necesario
# NO refactors, NO mejoras, NO "ya que estoy..."

# 3. Verificar (OBLIGATORIO)
pnpm typecheck && pnpm build

# 4. Commit
git commit -m "fix(scope): descripción del fix urgente"

# 5. Push y PR DIRECTO a main
git push origin hotfix/descripcion-corta
# Crear PR → main (saltar develop)

# 6. DESPUÉS del merge a main:
git checkout develop
git merge main  # Traer el hotfix a develop también
git push origin develop
```

### Si el deploy falla

```
┌─────────────────────────────────────────────────────────────┐
│  OPCIÓN 1: Rollback en Vercel (MÁS RÁPIDO)                  │
│  Dashboard → Deployments → Deploy anterior → Redeploy       │
├─────────────────────────────────────────────────────────────┤
│  OPCIÓN 2: Git revert                                       │
│  git revert HEAD                                             │
│  git push origin main                                        │
├─────────────────────────────────────────────────────────────┤
│  OPCIÓN 3: Hotfix rápido                                    │
│  git checkout -b hotfix/fix-deploy-issue                    │
│  # Arreglar → PR directo a main                             │
└─────────────────────────────────────────────────────────────┘
```

### Post-mortem (después de hotfix)

```markdown
## Post-mortem: [Nombre del incidente]

**Fecha:** YYYY-MM-DD
**Severidad:** Crítico/Alto/Medio
**Duración:** X minutos/horas

### ¿Qué pasó?
[Descripción del problema]

### ¿Por qué pasó?
[Root cause analysis]

### ¿Cómo se arregló?
[Descripción del fix]

### ¿Cómo prevenir en el futuro?
- [ ] Acción 1
- [ ] Acción 2
```

---

## 7. DOCUMENTACIÓN

### Cuándo actualizar documentación

| Evento | Documento a actualizar |
|--------|------------------------|
| Nuevo router | `API-REFERENCE.md` |
| Nuevo schema DB | `API-REFERENCE.md` |
| Nueva convención/patrón | `CLAUDE.md` (Problemas Recurrentes) |
| Error que se repite | `CLAUDE.md` (Problemas Recurrentes) |
| Nuevo flujo de deploy | `DEPLOYMENT-CHECKLIST.md` |

### Qué documentar obligatoriamente

```
✅ DOCUMENTAR:
- Funciones públicas de packages
- Endpoints de API (inputs, outputs)
- Decisiones arquitectónicas importantes
- Errores comunes y sus soluciones

❌ NO DOCUMENTAR:
- Código que se explica solo
- Implementación interna obvia
- Comentarios tipo "incrementa contador"
```

### Dónde documentar

| Tipo | Ubicación |
|------|-----------|
| Instrucciones para IA | `CLAUDE.md` |
| Referencia de API | `docs/API-REFERENCE.md` |
| Arquitectura | `docs/architecture/SYSTEM.md` |
| Stack tecnológico | `docs/architecture/STACK.md` |
| Flujo de Git | `docs/development/GITFLOW.md` |
| Checklist de deploy | `docs/checklists/DEPLOYMENT-CHECKLIST.md` |

---

## 8. PERFORMANCE

### Límites aceptables

| Métrica | ✅ Aceptable | ⚠️ Alerta | ❌ Crítico |
|---------|-------------|-----------|-----------|
| Page load | < 2s | 2-4s | > 4s |
| API response | < 200ms | 200-500ms | > 500ms |
| DB query | < 50ms | 50-200ms | > 200ms |
| AI response | < 3s | 3-10s | > 10s |

### Monitorear performance

```bash
# Health check muestra latencia de servicios
curl https://app.wallie.com/api/health | jq '.services'

# Ver en dashboard
/admin/monitoring
```

### Rate limits configurados

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| Auth | 5 requests | 1 minuto |
| Email check | 10 requests | 1 minuto |
| OTP | 3 requests | 1 minuto |
| API general | 100 requests | 1 minuto |
| Workers | 60 requests | 1 minuto |
| AI | 20 requests | 1 minuto |

### Si detectas query lenta

```sql
-- En Supabase SQL Editor:
-- 1. Habilitar pg_stat_statements (si no está)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 2. Ver queries más lentas
SELECT query, calls, mean_time, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;

-- 3. Analizar query específica
EXPLAIN ANALYZE SELECT * FROM clients WHERE user_id = 'xxx';
```

---

## 9. TECHNICAL DEBT

### Cómo marcar deuda técnica

```typescript
// En código - usar comentario estandarizado:
// TECH_DEBT: [descripción del problema]
// TODO: [lo que se debería hacer]
// Fecha: YYYY-MM-DD

// Ejemplo:
// TECH_DEBT: Este query hace N+1, debería usar join
// TODO: Refactorizar para usar single query con relations
// Fecha: 2025-12-10
```

### Cuándo pagar deuda técnica

```
┌─────────────────────────────────────────────────────────────┐
│  PRIORIDAD:                                                  │
│                                                              │
│  1. Bloquea desarrollo de features → Arreglar YA            │
│  2. Causa bugs en producción → Próximo sprint               │
│  3. Código feo pero funciona → Cuando toque esa área        │
│  4. "Nice to have" → Backlog                                │
└─────────────────────────────────────────────────────────────┘
```

### Regla del Boy Scout

```
"Deja el código mejor de como lo encontraste"

- Si tocas un archivo para una feature, arregla pequeños issues
- Pero NO hagas refactors grandes mezclados con features
- Refactors grandes → PR separado
```

---

## 10. SEGURIDAD EN DESARROLLO

### Manejo de secrets

```
┌─────────────────────────────────────────────────────────────┐
│  REGLAS ABSOLUTAS:                                          │
│                                                              │
│  ❌ NUNCA secrets en código (ni "temporalmente")            │
│  ❌ NUNCA commitear .env (está en .gitignore)               │
│  ❌ NUNCA compartir secrets por Slack/email                 │
│                                                              │
│  ✅ Desarrollo: .env.local (no en git)                      │
│  ✅ Producción: Vercel Environment Variables                │
│  ✅ Compartir: 1Password / LastPass / similar               │
└─────────────────────────────────────────────────────────────┘
```

### Si se expone un secret

```bash
# INMEDIATAMENTE (no esperar):

# 1. Revocar el secret en el servicio origen
# - Stripe: Dashboard → API Keys → Roll key
# - Supabase: Project Settings → API → Regenerate
# - etc.

# 2. Generar nuevo secret

# 3. Actualizar en Vercel
# Dashboard → Settings → Environment Variables

# 4. Si fue commit, limpiar historial
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# 5. Documentar incidente (post-mortem)
```

### Validación de inputs (YA implementado)

Todos los routers usan Zod para validación:
- `z.string().uuid()` para IDs
- `z.string().email()` para emails
- `z.string().min(1).max(100)` para nombres
- etc.

### Autorización (SIEMPRE verificar)

```typescript
// En CADA query que accede a datos de usuario:
.where(and(
  eq(table.id, input.id),
  eq(table.userId, ctx.userId)  // ← NUNCA OLVIDAR
))
```

---

## Resumen: Los 5 Mandamientos

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  1. ANTES de codear → pnpm typecheck                        │
│  2. ANTES de commit → pnpm build                            │
│  3. SIEMPRE filtrar por userId en queries                   │
│  4. NUNCA secrets en código                                 │
│  5. Bug fix → test que reproduce PRIMERO                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

_Última actualización: 10 Dic 2025_
