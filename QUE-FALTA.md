# 📋 ¿QUÉ FALTA? - Estado Actual del Proyecto

> **Última actualización:** 26 Mar 2026
> **Estado:** Entorno local restaurado ✅ | Validación local ✅ | Pendientes manuales externos ⏳

---

## 🛠️ PENDIENTES MANUALES REALES

Estos puntos requieren intervención humana, credenciales reales o decisiones operativas fuera del repo.

### 1. Secrets reales para funciones externas
- [ ] Configurar `STRIPE_SECRET_KEY`
- [ ] Configurar `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] Configurar `RESEND_API_KEY`
- [ ] Configurar `REDIS_URL` si se quiere cache persistente/rate limit real
- [ ] Sustituir valores dummy locales de Supabase/OpenAI por credenciales reales cuando se quiera uso no simulado

### 2. Perfil local para flujos reales
- [ ] Insertar o sincronizar al menos un registro en `profiles`
- [ ] Validar que el usuario autenticado local tiene `profile` asociado antes de crear debates reales

### 3. Infra local a revisar
- [ ] Confirmar si `docker compose` debe seguir siendo el camino oficial para PostgreSQL local
- [ ] Si sí: revisar por qué Compose entraba en estado inconsistente al recrear `quoorum-postgres`
- [ ] Mantener `localhost:5434` como puerto local canónico para no colisionar con otros proyectos del servidor

### 4. Producción / despliegue
- [ ] Vincular proyecto Vercel
- [ ] Cargar variables de entorno reales en dashboard de Vercel
- [ ] Decidir origen definitivo de PostgreSQL en producción (Supabase Postgres vs PostgreSQL dedicado)

### 5. Verificaciones recomendadas cuando vuelvas
- [ ] Ejecutar `pnpm validate:env`
- [ ] Ejecutar `pnpm preflight`
- [ ] Ejecutar `pnpm typecheck`
- [ ] Ejecutar `pnpm test:unit`
- [ ] Si ya hay perfil y secrets reales: probar creación de debate end-to-end

---

## ✅ COMPLETADO RECIENTEMENTE

### Restauración del entorno local (26 Mar 2026)
- ✅ `pnpm validate:env` operativo con `.env.local`
- ✅ `pnpm preflight` verde en este servidor
- ✅ PostgreSQL local operativo en `localhost:5434`
- ✅ `pnpm db:push` funcional tras exportar `userTierEnum`
- ✅ Documentación principal alineada al puerto/local setup real

### Sistema Proactivo (14 Ene 2025)
- ✅ Pre-flight checks automáticos
- ✅ Scripts de backup/rollback
- ✅ Integración con Husky
- ✅ Checklist interactivo pre-commit
- ✅ Documentación de errores (ERRORES-COMETIDOS.md)

### Sistema de Debates Básico
- ✅ Crear debates (draft + ejecutar)
- ✅ Listar debates con filtros
- ✅ Ver debates en tiempo real (polling 3s)
- ✅ Editar nombre de debate (inline)
- ✅ Eliminar debate (soft delete)
- ✅ Migración completa a PostgreSQL local

---

## 🔴 PRÓXIMOS PASOS CRÍTICOS

### 1. Schema Validation Automática (ESTA SEMANA)
**Prioridad:** 🔴 ALTA

**¿Qué es?**
- Script que valida automáticamente que el schema Drizzle coincide con PostgreSQL
- Detecta columnas faltantes, enums incorrectos, foreign keys rotas
- Se ejecuta en pre-flight checks

**Archivos a crear:**
```bash
scripts/validate-schema-sync.ts
```

**Beneficio:**
- ✅ Evita errores tipo "column does not exist"
- ✅ Evita errores tipo "invalid enum value"
- ✅ Detecta problemas ANTES de ejecutar código

**Tiempo estimado:** 2-3 horas

---

### 2. Tests de Integración Automáticos (PRÓXIMA SEMANA)
**Prioridad:** 🟡 MEDIA

**¿Qué es?**
- Tests que verifican flujos completos (crear debate → ejecutar → ver resultado)
- Ejecutados automáticamente en CI/CD

**Archivos a crear:**
```bash
packages/api/src/routers/__tests__/debates.integration.test.ts
apps/web/tests/e2e/debates.spec.ts
```

**Beneficio:**
- ✅ Detecta regresiones antes de producción
- ✅ Confianza al hacer cambios

**Tiempo estimado:** 4-6 horas

---

### 3. Funcionalidades Interactivas de Debates (FORUM Phase 4)
**Prioridad:** 🟡 MEDIA

#### A. Controles Interactivos Durante Debate
**Estado:** ❌ No implementado

**Funcionalidades:**
- [ ] Pausar/Reanudar debate en curso
- [ ] Saltar ronda actual
- [ ] Añadir contexto durante el debate
- [ ] Forzar consenso anticipado
- [ ] Selección manual de expertos

**Archivos a crear:**
```
apps/web/src/components/quoorum/interactive-controls.tsx
packages/api/src/routers/debates-interactive.ts
```

**Beneficio:**
- ✅ Mayor control del usuario sobre el debate
- ✅ Reducir costos (parar debate innecesario)

**Tiempo estimado:** 6-8 horas

---

#### B. Sistema de Notificaciones
**Estado:** ❌ No implementado

**Funcionalidades:**
- [ ] Email cuando debate completa
- [ ] Notificación in-app en tiempo real
- [ ] Preferencias de notificaciones

**Archivos a crear:**
```
packages/api/src/routers/notifications.ts
apps/web/src/components/notifications/notification-center.tsx
packages/email/src/templates/debate-completed.tsx
```

**Beneficio:**
- ✅ Usuario sabe cuándo revisar debate
- ✅ No tiene que estar pendiente

**Tiempo estimado:** 4-5 horas

---

### 4. Problemas Críticos Conocidos (ROADMAP)
**Prioridad:** 🔴 ALTA (para producción)

#### A. Email Service con Placeholders
**Problema:**
```typescript
// Si falta RESEND_API_KEY, NINGÚN email se envía
const apiKey = process.env.RESEND_API_KEY || 're_placeholder'
```

**Solución:**
- Validar que `RESEND_API_KEY` existe al iniciar app
- Fallar explícitamente si falta
- No usar placeholders silenciosos

**Tiempo estimado:** 30 min

---

#### B. 5 Routers Sin Tests
**Routers sin tests:**
1. `gmail.ts`
2. `integrations.ts`
3. `referrals.ts`
4. `tools.ts`
5. `usage.ts`

**Solución:**
- Crear tests de validación Zod mínimos
- Tests de autorización (userId filtering)

**Tiempo estimado:** 3-4 horas (todos)

---

## 📊 PRIORIZACIÓN RECOMENDADA

### AHORA MISMO (próximas 8 horas)
1. **Schema Validation Automática** (2-3h) → Previene errores críticos
2. **Fix Email Placeholders** (30min) → Crítico para producción
3. **Controles básicos de debate** (3h) → Pausar/Reanudar

### ESTA SEMANA (próximos 5 días)
4. **Tests para 5 routers** (4h) → Reduce riesgo
5. **Sistema de notificaciones básico** (4h) → Email on completion
6. **Tests de integración** (6h) → Automatización

### MES PRÓXIMO
- Funcionalidades avanzadas de debate (selección manual expertos)
- Optimizaciones de performance
- UI/UX improvements

---

## 🎯 FLUJO RECOMENDADO PARA HOY

```bash
# 1. Schema Validation (2-3h)
# Crear script que valida schema Drizzle vs PostgreSQL
pnpm create:script validate-schema-sync

# 2. Fix Email Placeholders (30min)
# Validar env vars críticas al inicio
pnpm add @t3-oss/env-nextjs  # Si no existe

# 3. Controles básicos debate (3h)
# Pausar/Reanudar debate en progreso
# - Backend: Endpoint pauseDebate + resumeDebate
# - Frontend: Botones en debate viewer
```

---

## ❓ PREGUNTA PARA TI

**¿Qué prefieres hacer primero?**

**Opción A: Continuar con sistema proactivo** → Schema validation (prevención)
**Opción B: Funcionalidades de debates** → Controles interactivos (UX)
**Opción C: Resolver bugs críticos** → Email placeholders + tests faltantes
**Opción D: Otra cosa** → Dime qué necesitas

---

_Recuerda: El sistema proactivo ya está funcionando. Cada commit ahora es seguro. 🚀_
