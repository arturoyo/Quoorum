# 🛡️ PLAN DE REMEDIACIÓN DE SEGURIDAD - ACTUALIZADO

**Fecha:** 4 Enero 2026
**Estado:** 🟡 REFINADO DESPUÉS DE ANÁLISIS
**Vulnerabilidades Reales:** 104 (en 35 archivos non-admin)

---

## 📊 HALLAZGOS ACTUALIZADOS

### Filtrado Realizado

✅ **Eliminados falsos positivos:**

- Routers Admin (admin-\*.ts): 25+ archivos excluidos
  - Usan `adminProcedure` + verificación de permisos
  - Tablas globales sin userId/profileId
  - Autorización correcta mediante roles

### Estado Final

| Métrica                     | Inicial | Después Filtrado | Reducción |
| --------------------------- | ------- | ---------------- | --------- |
| Archivos vulnerables        | 64      | 35               | -45%      |
| Vulnerabilidades totales    | 293     | 104              | -64%      |
| Falsos positivos eliminados | -       | 189              | -         |

---

## 🎯 TOP 15 ARCHIVOS CRÍTICOS

| #   | Archivo                   | Vuln | UPDATE | DELETE | Prioridad  |
| --- | ------------------------- | ---- | ------ | ------ | ---------- |
| 1   | `referrals.ts`            | 10   | 10     | 0      | 🔴 CRÍTICA |
| 2   | `whatsapp-connections.ts` | 8    | 8      | 0      | 🔴 CRÍTICA |
| 3   | `prospecting.ts`          | 7    | 7      | 0      | 🔴 ALTA    |
| 4   | `integrations.ts`         | 6    | 6      | 0      | 🔴 ALTA    |
| 5   | `client-groups.ts`        | 5    | 4      | 1      | 🟠 ALTA    |
| 6   | `two-factor.ts`           | 5    | 4      | 1      | 🟠 ALTA    |
| 7   | `ai-models.ts`            | 4    | 3      | 1      | 🟠 MEDIA   |
| 8   | `gmail.ts`                | 4    | 4      | 0      | 🟠 MEDIA   |
| 9   | `goals.ts`                | 4    | 3      | 1      | 🟠 MEDIA   |
| 10  | `rewards.ts`              | 4    | 4      | 0      | 🟠 MEDIA   |
| 11  | `client-enrichment.ts`    | 3    | 3      | 0      | 🟡 MEDIA   |
| 12  | `consents.ts`             | 3    | 3      | 0      | 🟡 MEDIA   |
| 13  | `email-onboarding.ts`     | 3    | 2      | 1      | 🟡 MEDIA   |
| 14  | `gamification.ts`         | 3    | 3      | 0      | 🟡 MEDIA   |
| 15  | `gdpr.ts`                 | 3    | 3      | 0      | 🟡 MEDIA   |

**Resto (20 archivos):** 2 o menos vulnerabilidades cada uno

---

## ⚠️ COMPLEJIDAD DETECTADA: userId vs profileId

### Problema

No todos los routers usan el mismo campo de autorización:

**Patrón 1 - userId directamente:**

```typescript
// Tablas: clients, conversations, messages, deals
.where(and(eq(table.id, input.id), eq(table.userId, ctx.userId)))
```

**Patrón 2 - profileId:**

```typescript
// Tablas: agentEnabledConfig, wallieResponseConfig, userAiConfig
.where(and(eq(table.id, input.id), eq(table.profileId, ctx.userId)))
```

**Patrón 3 - relatedUserId:**

```typescript
// Algunas tablas legacy
.where(and(eq(table.id, input.id), eq(table.relatedUserId, ctx.userId)))
```

### Impacto

❌ **Auto-fix script NO puede aplicarse ciegamente** - requiere conocer el schema de cada tabla
✅ **Remediación manual es más segura** - permite revisar caso por caso

---

## 🔧 ESTRATEGIA DE REMEDIACIÓN CONSERVADORA

### Fase 1: Análisis Manual de Top 5 (PRIORIDAD MÁXIMA)

**Archivos:** referrals.ts, whatsapp-connections.ts, prospecting.ts, integrations.ts, client-groups.ts

**Proceso:**

1. Leer archivo completo
2. Identificar schema de tablas usadas
3. Determinar campo correcto (userId vs profileId)
4. Aplicar fix manual
5. Validar con TypeScript

**Tiempo estimado:** 2-3 horas

### Fase 2: Batch Semi-Automatizado (Archivos 6-15)

**Archivos:** two-factor.ts, ai-models.ts, gmail.ts, goals.ts, rewards.ts, client-enrichment.ts, consents.ts, email-onboarding.ts, gamification.ts, gdpr.ts

**Proceso:**

1. Crear script de análisis de schemas
2. Script detecta automáticamente userId vs profileId
3. Genera sugerencias de fix
4. Revisión manual antes de aplicar
5. Aplicar batch con supervisión

**Tiempo estimado:** 2-3 horas

### Fase 3: Remediación Rápida del Resto (Archivos 16-35)

**Archivos:** 20 archivos con ≤2 vulnerabilidades cada uno

**Proceso:**

1. Fix manual directo (son pocos)
2. Commit incremental por archivo

**Tiempo estimado:** 1-2 horas

---

## 📋 PLAN DE EJECUCIÓN DETALLADO

### PASO 1: Verificar Estado Actual

✅ **YA COMPLETADO:**

- clients-base.ts (0 vulnerabilidades)
- conversations.ts (1 fix aplicado manualmente)
- deals.ts (6 fixes aplicados manualmente)
- subscriptions.ts (verificado seguro)

⚠️ **DISCREPANCIA DETECTADA:**

- rewards.ts aparece con 4 vulnerabilidades
- En auditoría manual anterior se marcó como "ya seguro"
- **ACCIÓN:** Re-verificar rewards.ts manualmente

### PASO 2: Re-verificar Archivos "Seguros"

**Comando:**

```bash
# Ver estado de rewards.ts
git diff HEAD packages/api/src/routers/rewards.ts
```

**Si tiene cambios no commiteados:**

- Revisar si los fixes previos fueron perdidos
- Re-aplicar si es necesario

### PASO 3: Comenzar con Top 1 - referrals.ts (10 vulnerabilidades)

**Análisis previo:**

1. Leer packages/db/src/schema/\*.ts para encontrar tabla `referrals`
2. Verificar si tiene userId, profileId, o ambos
3. Aplicar fixes apropiados

**Comando:**

```bash
# Buscar schema de referrals
grep -n "export const referrals" packages/db/src/schema/*.ts
grep -A 20 "export const referrals = pgTable" packages/db/src/schema/*.ts
```

### PASO 4: Continuar con Top 2-5

Repetir proceso de Paso 3 para:

- whatsapp-connections.ts
- prospecting.ts
- integrations.ts
- client-groups.ts

### PASO 5: Validación Incremental

**Después de cada archivo corregido:**

```bash
# TypeScript check (solo package api)
pnpm --filter @wallie/api typecheck

# Si pasa, commit
git add packages/api/src/routers/[archivo].ts
git commit -m "security(api): fix userId filters in [archivo].ts"
```

### PASO 6: Validación Final

**Cuando todos los archivos estén corregidos:**

```bash
# 1. TypeScript check completo
pnpm typecheck

# 2. Lint
pnpm lint

# 3. Tests
pnpm test

# 4. Re-scan de seguridad
node scripts/security-audit.mjs
# OBJETIVO: ✅ No vulnerabilities found!

# 5. Health check
node scripts/health-check.mjs
# OBJETIVO: Security score 100/100
```

---

## 🚨 BLOQUEADORES PARA DEPLOYMENT

1. ❌ **104 vulnerabilidades de seguridad sin resolver**
2. ⚠️ **Posible discrepancia en rewards.ts** (marcar como seguro vs 4 vulnerabilidades detectadas)
3. ❓ **Validación TypeScript pendiente** después de cada fix

---

## ✅ CRITERIOS DE ACEPTACIÓN

| Criterio                    | Objetivo | Validación                        |
| --------------------------- | -------- | --------------------------------- |
| Vulnerabilidades CRITICAL   | 0        | `node scripts/security-audit.mjs` |
| Vulnerabilidades HIGH       | 0        | `node scripts/security-audit.mjs` |
| TypeScript errors           | 0        | `pnpm typecheck`                  |
| Lint errors (critical)      | 0        | `pnpm lint`                       |
| Test failures               | 0        | `pnpm test`                       |
| Health Check Security Score | 100/100  | `node scripts/health-check.mjs`   |

---

## 🔄 ALTERNATIVA: Auto-Fix Inteligente con Schema Detection

### Opción B: Crear Script Avanzado

**Si se requiere velocidad > seguridad:**

Crear `security-auto-fix-v2.mjs` con:

1. Parser de schemas Drizzle
2. Detector de campo correcto (userId/profileId)
3. Aplicación automática con validación TypeScript entre archivos
4. Rollback automático si TypeScript falla

**Pros:**

- ✅ Más rápido (1-2 horas total)

**Contras:**

- ❌ Más riesgo de bugs
- ❌ Requiere desarrollo adicional del script (1 hora)
- ❌ Menos comprensión del código

**Recomendación:** ⚠️ **NO RECOMENDADO** - La remediación manual conservadora es más segura

---

## 📝 REGISTRO DE PROGRESO

### ✅ Completado

- [x] Auditoría inicial (293 vulnerabilidades)
- [x] Refinamiento de detección (189 falsos positivos eliminados)
- [x] Categorización de 104 vulnerabilidades reales
- [x] Fixes manuales en: conversations.ts (1), deals.ts (6)
- [x] Creación de scripts de auditoría

### ⏳ Pendiente

- [ ] Re-verificar rewards.ts
- [ ] Fix manual Top 5 (32 vulnerabilidades)
- [ ] Fix semi-automatizado archivos 6-15 (35 vulnerabilidades)
- [ ] Fix rápido del resto (37 vulnerabilidades)
- [ ] Validación final completa
- [ ] Re-scan objetivo 0 vulnerabilidades

---

## 🎯 NEXT ACTION

**RECOMENDACIÓN INMEDIATA:**

Comenzar con **remediación manual** del archivo más crítico:

```bash
# 1. Verificar schema de referrals
grep -A 30 "export const referrals = pgTable" packages/db/src/schema/*.ts

# 2. Abrir archivo
code packages/api/src/routers/referrals.ts

# 3. Buscar queries UPDATE
# 4. Añadir filtros userId/profileId apropiados
# 5. Validar TypeScript
# 6. Commit
```

**Tiempo estimado para completar todo:** 5-8 horas de trabajo manual cuidadoso

---

_Generado automáticamente por Claude Code_
_Fecha: 2026-01-04_
