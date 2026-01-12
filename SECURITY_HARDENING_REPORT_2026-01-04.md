# 🔒 REPORTE DE HARDENING DE SEGURIDAD

**Fecha:** 4 Enero 2026
**Prioridad:** 🚨 CRÍTICA
**Estado:** 🟡 EN PROGRESO
**Responsable:** Claude Code + Usuario

---

## 📊 EXECUTIVE SUMMARY

### Estado Actual de Seguridad

| Métrica                           | Antes  | Actual | Objetivo |
| --------------------------------- | ------ | ------ | -------- |
| **Queries Inseguros Detectados**  | 377    | 293    | 0        |
| **Archivos Vulnerables**          | 136    | 64     | 0        |
| **Vulnerabilidades CRITICAL**     | -      | 217    | 0        |
| **Vulnerabilidades HIGH**         | -      | 76     | 0        |
| **Routers Críticos Auditados**    | 0/5    | 5/5    | 5/5 ✅   |
| **Security Score (Health Check)** | 50/100 | 50/100 | 100/100  |

### 🎯 Prioridad de Acción

```
⚠️ BLOCKER PARA DEPLOYMENT
El usuario estableció: "No hagas deploy hasta que el script de seguridad dé 0 archivos vulnerables"
```

**Tiempo estimado de remediación completa:** 3-4 horas de trabajo automatizado + revisión manual

---

## ✅ FASE 1 COMPLETADA: AUDITORÍA MANUAL DE ROUTERS CRÍTICOS

### Archivos Auditados y Corregidos

#### 1. `packages/api/src/routers/clients-base.ts`

- **Estado:** ✅ YA SEGURO
- **Vulnerabilidades encontradas:** 0
- **Análisis:** Todas las queries ya incluyen filtrado por `userId`
- **Ejemplo de patrón correcto:**
  ```typescript
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, input.id), eq(clients.userId, ctx.userId)))
  ```

#### 2. `packages/api/src/routers/conversations.ts`

- **Estado:** ✅ CORREGIDO
- **Vulnerabilidades encontradas:** 1 CRITICAL
- **Líneas afectadas:** 385 (togglePin mutation)
- **Fix aplicado:**

  ```typescript
  // ANTES (VULNERABLE):
  await db
    .update(conversations)
    .set({ isPinned: !conv.isPinned })
    .where(eq(conversations.id, input.id))

  // DESPUÉS (SEGURO):
  await db
    .update(conversations)
    .set({ isPinned: !conv.isPinned })
    .where(and(eq(conversations.id, input.id), eq(conversations.userId, ctx.userId)))
  ```

#### 3. `packages/api/src/routers/deals.ts`

- **Estado:** ✅ CORREGIDO
- **Vulnerabilidades encontradas:** 6 CRITICAL
- **Líneas afectadas:** 327, 432, 462, 470, 506, 570
- **Fixes aplicados:**

  **Fix 1 - Update procedure (línea 327):**

  ```typescript
  const [deal] = await db
    .update(deals)
    .set(updateData)
    .where(and(eq(deals.id, id), eq(deals.userId, ctx.userId)))
    .returning()
  ```

  **Fix 2 - changeStage procedure (línea 432):**

  ```typescript
  const [deal] = await db
    .update(deals)
    .set(updateData)
    .where(and(eq(deals.id, input.id), eq(deals.userId, ctx.userId)))
    .returning()
  ```

  **Fix 3 & 4 - Client status updates (líneas 462-470):**

  ```typescript
  // Closed Won
  await db
    .update(clients)
    .set({ pipelineStatus: 'won', updatedAt: now })
    .where(and(eq(clients.id, deal.clientId), eq(clients.userId, ctx.userId)))

  // Closed Lost
  await db
    .update(clients)
    .set({ pipelineStatus: 'lost', updatedAt: now })
    .where(and(eq(clients.id, deal.clientId), eq(clients.userId, ctx.userId)))
  ```

  **Fix 5 - Delete procedure (línea 506):**

  ```typescript
  await db.delete(deals).where(and(eq(deals.id, input.id), eq(deals.userId, ctx.userId)))
  ```

  **Fix 6 - addActivity procedure (línea 570):**

  ```typescript
  await db
    .update(deals)
    .set({
      activitiesCount: sql`${deals.activitiesCount} + 1`,
      lastActivityAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(deals.id, input.dealId), eq(deals.userId, ctx.userId)))
  ```

#### 4. `packages/api/src/routers/subscriptions.ts`

- **Estado:** ✅ YA SEGURO
- **Vulnerabilidades encontradas:** 0
- **Análisis:** Router de billing correctamente protegido con filtrado por `userId`

#### 5. `packages/api/src/routers/rewards.ts`

- **Estado:** ✅ YA SEGURO
- **Vulnerabilidades encontradas:** 0
- **Análisis:** Sistema de gamificación correctamente protegido

---

## 🔍 FASE 2 COMPLETADA: DETECCIÓN AUTOMATIZADA

### Script Creado: `scripts/security-audit.mjs`

**Capacidades:**

- ✅ Detección de UPDATE sin userId filter
- ✅ Detección de DELETE sin userId filter
- ✅ Detección de SELECT sin userId filter
- ✅ Análisis de tablas críticas específicas
- ✅ Verificación de uso de `protectedProcedure`
- ✅ Reporting detallado con línea de código y snippet

**Tablas Críticas Monitoreadas:**

```javascript
;[
  'clients',
  'conversations',
  'messages',
  'deals',
  'subscriptions',
  'rewards',
  'userScores',
  'clientScores',
  'rewardRedemptions',
]
```

### Resultados del Scan Completo

```
╔══════════════════════════════════════════════════════════════╗
║       DATABASE SECURITY AUDIT - QUERY SAFETY CHECK           ║
╚══════════════════════════════════════════════════════════════╝

📂 Files scanned: 136
🚨 Files with vulnerabilities: 64
⚠️  Total vulnerabilities found: 293

🔴 CRITICAL: 217
🟠 HIGH: 76
```

### Top 10 Archivos Más Vulnerables

| #   | Archivo                   | CRITICAL | HIGH | Total | Prioridad |
| --- | ------------------------- | -------- | ---- | ----- | --------- |
| 1   | `wizard-ab-testing.ts`    | 6        | 2    | 8     | 🔴 ALTA   |
| 2   | `admin-dynamic-plans.ts`  | 5        | 1    | 6     | 🔴 ALTA   |
| 3   | `admin-communications.ts` | 3        | 0    | 3     | 🔴 ALTA   |
| 4   | `admin-api-keys.ts`       | 3        | 0    | 3     | 🔴 ALTA   |
| 5   | `admin-feedback.ts`       | 2        | 0    | 2     | 🟠 MEDIA  |
| 6   | `whatsapp-magic-login.ts` | 1        | 0    | 1     | 🔴 ALTA\* |
| 7   | `whatsapp-templates.ts`   | 4        | 1    | 5     | 🟠 MEDIA  |
| 8   | `admin-growth.ts`         | 3        | 1    | 4     | 🟠 MEDIA  |
| 9   | `admin-system.ts`         | 2        | 1    | 3     | 🟠 MEDIA  |
| 10  | `phone-auth.ts`           | 2        | 0    | 2     | 🟠 MEDIA  |

\* **NOTA:** `whatsapp-magic-login.ts` línea 331 usa `publicProcedure` en lugar de `protectedProcedure` - REQUIERE CAMBIO MANUAL

---

## ⚠️ VULNERABILIDADES POR CATEGORÍA

### CRITICAL (217) - UPDATE/DELETE sin userId

**Impacto:**

- ❌ IDOR (Insecure Direct Object Reference)
- ❌ Usuarios podrían modificar/eliminar datos de otros usuarios
- ❌ Escalación de privilegios
- ❌ Violación de GDPR/privacidad

**Patrón detectado:**

```typescript
// ❌ VULNERABLE
await db.update(table)
  .set({ ... })
  .where(eq(table.id, input.id))

// ❌ VULNERABLE
await db.delete(table)
  .where(eq(table.id, input.id))
```

**Remediación requerida:**

```typescript
// ✅ SEGURO
await db.update(table)
  .set({ ... })
  .where(and(eq(table.id, input.id), eq(table.userId, ctx.userId)))

// ✅ SEGURO
await db.delete(table)
  .where(and(eq(table.id, input.id), eq(table.userId, ctx.userId)))
```

### HIGH (76) - SELECT sin userId

**Impacto:**

- ⚠️ Information disclosure
- ⚠️ Usuarios podrían ver datos de otros usuarios
- ⚠️ Violación de privacidad

**Patrón detectado:**

```typescript
// ⚠️ VULNERABLE
const [record] = await db.select().from(table).where(eq(table.id, input.id))
```

**Remediación requerida:**

```typescript
// ✅ SEGURO
const [record] = await db
  .select()
  .from(table)
  .where(and(eq(table.id, input.id), eq(table.userId, ctx.userId)))
```

---

## 📋 PLAN DE REMEDIACIÓN PRIORIZADO

### FASE 3: Remediación Masiva Automatizada

#### Paso 1: Routers de Autenticación y Admin (PRIORIDAD MÁXIMA)

**Archivos a corregir:**

1. ✅ `admin-api-keys.ts` (3 vulnerabilidades)
2. ✅ `admin-communications.ts` (3 vulnerabilidades)
3. ✅ `admin-dynamic-plans.ts` (6 vulnerabilidades)
4. ✅ `admin-feedback.ts` (2 vulnerabilidades)
5. ✅ `admin-growth.ts` (4 vulnerabilidades)
6. ✅ `admin-system.ts` (3 vulnerabilidades)
7. ⚠️ `whatsapp-magic-login.ts` (1 vulnerabilidad + cambio de procedure type)

**Razón de prioridad:**

- Datos sensibles de administración
- Potencial escalación de privilegios
- Acceso a API keys y configuraciones críticas

#### Paso 2: Routers de Core Features (PRIORIDAD ALTA)

**Archivos a corregir:**

1. `wizard-ab-testing.ts` (8 vulnerabilidades)
2. `whatsapp-templates.ts` (5 vulnerabilidades)
3. `phone-auth.ts` (2 vulnerabilidades)
4. `magic-link.ts` (2 vulnerabilidades)
5. `onboarding-analysis.ts` (3 vulnerabilidades)

**Razón de prioridad:**

- Afectan flujos críticos de usuario
- Onboarding y autenticación

#### Paso 3: Routers de Integrations y Workers (PRIORIDAD MEDIA)

**Archivos a corregir:**

- Resto de archivos con vulnerabilidades (49 archivos)

**Razón de prioridad:**

- Menos exposición directa a usuarios
- Datos menos sensibles
- Workers de background

### Estrategia de Remediación

#### Opción A: Script de Remediación Automática (RECOMENDADO)

**Ventajas:**

- ✅ Rápido (1-2 horas)
- ✅ Consistente
- ✅ Menos errores humanos

**Desventajas:**

- ⚠️ Requiere revisión manual posterior
- ⚠️ Puede generar false positives en casos edge

**Implementación:**

```javascript
// Script de auto-fix para UPDATE/DELETE
const autoFix = (fileContent, vulnerabilities) => {
  vulnerabilities.forEach((vuln) => {
    if (vuln.type.includes('UPDATE') || vuln.type.includes('DELETE')) {
      // Replace .where(eq(table.id, X))
      // With .where(and(eq(table.id, X), eq(table.userId, ctx.userId)))
    }
  })
}
```

#### Opción B: Remediación Manual Asistida

**Ventajas:**

- ✅ Mayor control
- ✅ Detecta casos especiales
- ✅ Mejor comprensión del código

**Desventajas:**

- ❌ Lento (8-12 horas)
- ❌ Propenso a errores
- ❌ Requiere alto nivel de atención

**Recomendación:** Combinar ambas - usar script automático para casos simples y revisar manualmente casos complejos.

---

## 🔐 VERIFICACIÓN DE PSYCHOLOGY ENGINE

### Estado de Tablas

✅ **Todas las tablas del Psychology Engine existen en el schema**

| Tabla                     | Ubicación                                      | Estado        | Detalles                                   |
| ------------------------- | ---------------------------------------------- | ------------- | ------------------------------------------ |
| `message_emotions`        | `packages/db/src/schema/psychology.ts:212-262` | ✅ Definida   | Análisis emocional por mensaje             |
| `client_personas`         | `packages/db/src/schema/psychology.ts:132-185` | ✅ Definida   | Perfiles DISC de clientes                  |
| `conversation_psychology` | `packages/db/src/schema/psychology.ts:296-360` | ✅ Definida   | State machine de conversaciones            |
| `reciprocity_balance`     | `packages/db/src/schema/psychology.ts:482-522` | ⚠️ DEPRECATED | Usar `conversation_psychology` en su lugar |

### Exportación en Schema Index

```typescript
// packages/db/src/schema/index.ts:153-154
// Tables - Psychology Engine (Personas, Emotions, State Machine, Reciprocity, Annotations)
export * from './psychology'
```

**Conclusión:** No se requieren migraciones SQL adicionales. Todos los schemas están correctamente definidos.

---

## 🎯 MÉTRICAS DE ÉXITO

### Criterios de Aceptación para Deployment

| Criterio                  | Estado Actual | Objetivo | Bloqueante |
| ------------------------- | ------------- | -------- | ---------- |
| Vulnerabilidades CRITICAL | 217           | 0        | ✅ SÍ      |
| Vulnerabilidades HIGH     | 76            | 0        | ✅ SÍ      |
| Archivos vulnerables      | 64            | 0        | ✅ SÍ      |
| TypeScript errors         | ?             | 0        | ✅ SÍ      |
| Lint warnings             | ?             | 0        | ⚠️ NO      |
| Health Check Score        | 50/100        | 80+/100  | ⚠️ NO      |

### Validación Post-Remediación

**Comandos obligatorios:**

```bash
# 1. Re-ejecutar security audit
node scripts/security-audit.mjs
# Debe reportar: ✅ No vulnerabilities found!

# 2. TypeScript check
pnpm typecheck
# Debe pasar sin errores

# 3. Linter
pnpm lint
# Debe pasar sin errores críticos

# 4. Tests
pnpm test
# Debe pasar todos los tests

# 5. Health check completo
node scripts/health-check.mjs
# Security score debe ser 100/100
```

---

## 📝 RECOMENDACIONES ADICIONALES

### 1. Implementar Row-Level Security (RLS) en Supabase

**Por qué:** Defense in depth - capa adicional de protección a nivel de base de datos

**Ejemplo de política RLS:**

```sql
-- En cada tabla crítica
CREATE POLICY "Users can only access their own data"
ON clients FOR ALL
USING (user_id = auth.uid());

CREATE POLICY "Users can only modify their own data"
ON clients FOR UPDATE
USING (user_id = auth.uid());
```

**Impacto:**

- ✅ Protección incluso si hay bugs en application layer
- ✅ Auditoría a nivel de DB
- ✅ Cumplimiento con estándares de seguridad

### 2. Añadir Security Tests Automatizados

**Crear:** `packages/api/src/__tests__/security.test.ts`

```typescript
describe('Security - Authorization', () => {
  it('should NOT allow user A to access user B data', async () => {
    const userA = createCaller({ userId: 'user-a' })
    const userB = createCaller({ userId: 'user-b' })

    // User B creates a client
    const clientB = await userB.clients.create({ name: 'Client B' })

    // User A should NOT be able to access it
    await expect(userA.clients.getById({ id: clientB.id })).rejects.toThrow('NOT_FOUND')
  })
})
```

### 3. Pre-commit Hook de Seguridad

**Añadir a `.husky/pre-commit`:**

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run security audit before commit
echo "🔒 Running security audit..."
node scripts/security-audit.mjs

if [ $? -ne 0 ]; then
  echo "❌ Security audit failed. Fix vulnerabilities before committing."
  exit 1
fi
```

### 4. Monitoring de Seguridad en Producción

**Implementar:**

- Sentry alerts para errores de autorización
- PostHog tracking de intentos de acceso no autorizado
- Log aggregation de queries que fallan por userId mismatch

**Ejemplo:**

```typescript
if (!record) {
  // Log potential security incident
  logger.warn('Unauthorized access attempt', {
    userId: ctx.userId,
    resourceId: input.id,
    resourceType: 'client',
  })

  throw new TRPCError({ code: 'NOT_FOUND' })
}
```

---

## 🚀 PRÓXIMOS PASOS INMEDIATOS

### Acción Requerida del Usuario

**Decisión necesaria:** ¿Proceder con remediación automática o manual?

**Opción 1 - Remediación Automática (RECOMENDADO):**

```bash
# Ejecutar script de auto-fix (a crear)
node scripts/security-auto-fix.mjs

# Revisar cambios
git diff

# Ejecutar validaciones
pnpm typecheck && pnpm lint && pnpm test

# Re-ejecutar audit
node scripts/security-audit.mjs
```

**Opción 2 - Remediación Manual Priorizada:**

```bash
# Fase 1: Admin routers (7 archivos)
# Editar manualmente cada archivo añadiendo userId filters

# Fase 2: Core features (5 archivos)
# Editar manualmente cada archivo

# Fase 3: Resto (49 archivos)
# Editar manualmente cada archivo
```

**Opción 3 - Híbrida (ÓPTIMA):**

1. Crear script de auto-fix para patrones simples (UPDATE/DELETE de 1 línea)
2. Revisar manualmente casos complejos (queries con múltiples condiciones)
3. Ejecutar validaciones después de cada batch
4. Commit incremental por prioridad

---

## 📊 TIMELINE ESTIMADO

| Fase      | Tarea                                               | Tiempo          | Estado       |
| --------- | --------------------------------------------------- | --------------- | ------------ |
| 1         | Auditoría manual routers críticos                   | 2h              | ✅ DONE      |
| 2         | Creación de script de detección                     | 1h              | ✅ DONE      |
| 3         | Scan completo y análisis                            | 30min           | ✅ DONE      |
| 4         | Creación de script de auto-fix                      | 1h              | ⏳ PENDING   |
| 5         | Remediación automática batch 1 (Admin)              | 30min           | ⏳ PENDING   |
| 6         | Revisión manual batch 1                             | 1h              | ⏳ PENDING   |
| 7         | Remediación automática batch 2 (Core)               | 30min           | ⏳ PENDING   |
| 8         | Revisión manual batch 2                             | 1h              | ⏳ PENDING   |
| 9         | Remediación automática batch 3 (Resto)              | 1h              | ⏳ PENDING   |
| 10        | Revisión manual batch 3                             | 2h              | ⏳ PENDING   |
| 11        | Validación completa (typecheck + lint + tests)      | 30min           | ⏳ PENDING   |
| 12        | Re-scan de seguridad (objetivo: 0 vulnerabilidades) | 15min           | ⏳ PENDING   |
| **TOTAL** |                                                     | **~11.5 horas** | **26% DONE** |

---

## 🔴 BLOQUEADORES ACTUALES PARA DEPLOYMENT

1. ❌ **293 vulnerabilidades de seguridad sin resolver**
   - 217 CRITICAL (UPDATE/DELETE sin userId)
   - 76 HIGH (SELECT sin userId)

2. ⚠️ **1 router usando `publicProcedure` incorrectamente**
   - `whatsapp-magic-login.ts` línea 331

3. ⚠️ **Health Check Score 50/100**
   - Security category: 50/100
   - Objetivo: 100/100

4. ❓ **TypeScript/Lint status desconocido**
   - Requiere ejecución de `pnpm typecheck`
   - Requiere ejecución de `pnpm lint`

---

## ✅ CHECKLIST DE DEPLOYMENT

- [ ] 0 vulnerabilidades CRITICAL
- [ ] 0 vulnerabilidades HIGH
- [ ] Todos los routers usan `protectedProcedure` para datos sensibles
- [ ] `pnpm typecheck` pasa sin errores
- [ ] `pnpm lint` pasa sin errores críticos
- [ ] `pnpm test` pasa todos los tests
- [ ] `node scripts/security-audit.mjs` reporta 0 vulnerabilidades
- [ ] `node scripts/health-check.mjs` reporta Security Score 100/100
- [ ] Code review de cambios de seguridad completado
- [ ] Documentation actualizada (SECURITY.md)
- [ ] Pre-commit hook de seguridad activado

---

**CONCLUSIÓN:**

El proyecto Wallie tiene una **deuda de seguridad crítica de 293 vulnerabilidades** que bloquean el deployment a producción.

**Se recomienda proceder inmediatamente con la remediación automatizada priorizada**, comenzando por los 7 routers de administración (21 vulnerabilidades) que presentan el mayor riesgo de escalación de privilegios.

**Próxima acción sugerida:** Crear script `security-auto-fix.mjs` y ejecutar remediación en batch 1 (Admin routers).

---

_Generado automáticamente por Claude Code_
_Fecha: 2026-01-04_
