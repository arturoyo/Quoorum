# 🔧 PLAN DE CORRECCIÓN MASIVA

**Generado:** 26 Dic 2025
**Problemas detectados:** 3 críticos + 100+ warnings

---

## 📊 RESUMEN EJECUTIVO

### Problemas por Severidad

| Severidad                 | Cantidad | Impacto         |
| ------------------------- | -------- | --------------- |
| 🔴 CRÍTICO (Runtime 500s) | 60+      | App NO funciona |
| 🟠 ERROR TypeScript       | 1        | Build falla     |
| 🟠 ERROR ESLint           | 1        | Lint falla      |
| 🟡 WARNINGS ESLint        | 100+     | Calidad código  |

---

## 🚨 PASO 1: FIX CRÍTICOS (BLOQUEAN TODO)

### 1.1 TypeScript Error en leads.ts

**Archivo:** `packages/api/src/routers/leads.ts:126`

**Problema:**

```typescript
// Línea 126 - or() puede retornar undefined
or(
  isNotNull(clients.waBusinessBio),
  isNotNull(clients.googleMapsRating),
  isNotNull(clients.ocrText)
)
```

**Fix:**

```typescript
// Asegurar que siempre retorna SQL<unknown>
const enrichmentFilter = or(
  isNotNull(clients.waBusinessBio),
  isNotNull(clients.googleMapsRating),
  isNotNull(clients.ocrText)
)

if (enrichmentFilter) {
  conditions.push(enrichmentFilter)
}
```

**Comando:**

```bash
# Editar packages/api/src/routers/leads.ts líneas 124-132
```

---

### 1.2 ESLint Error en generate.ts

**Archivo:** `packages/ai/src/generate.ts:204`

**Problema:**

```typescript
// Uso explícito de 'any'
error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
```

**Fix:**

```typescript
// Reemplazar 'any' con tipo específico o unknown + type guard
```

**Comando:**

```bash
# Editar packages/ai/src/generate.ts línea 204
```

---

### 1.3 Runtime 500s - Investigar Causa Raíz

**Endpoints Afectados:**

- conversations.unreadCount (50+ errores)
- profiles.getWizardV2Progress
- rewards.getBalance
- referrals.getStats
- stats.\* (múltiples)
- inbox.getFeed
- usage.getSummary
- tags.list

**Posibles Causas:**

1. ❌ Base de datos desconectada
2. ❌ Autenticación fallando (userId undefined)
3. ❌ Schema desactualizado
4. ❌ Queries con campos inexistentes

**Plan de Investigación:**

```bash
# 1. Verificar logs de error detallados
tail -f server-logs.txt | grep "TRPCError"

# 2. Test manual de endpoint simple
curl http://localhost:3001/api/trpc/profiles.checkOnboarding

# 3. Verificar schema DB sincronizado
pnpm db:studio

# 4. Test autenticación
# Verificar que userId existe en requests
```

---

## 🟡 PASO 2: FIX WARNINGS (CALIDAD CÓDIGO)

### 2.1 Console.log en Producción (14 warnings)

**Archivos afectados:**

- `src/app/api/auth/test-login/route.ts` (2)
- `src/hooks/use-agent-realtime.ts` (8)
- `src/lib/monitoring.ts` (7)

**Fix masivo:**

```bash
# Script para remover console.logs
node scripts/remove-console-logs.js
```

---

### 2.2 Unused Variables (60+ warnings)

**Fix masivo:**

```bash
# Auto-fix con ESLint
pnpm lint:fix
```

---

### 2.3 Missing useEffect Dependencies (10+ warnings)

**Requiere revisión manual** - cada caso es diferente.

**Estrategia:**

1. Identificar callbacks que deberían ser memoizados
2. Agregar a dependencies o extraer fuera de componente
3. Usar exhaustive-deps lint rule

---

## 🎯 ORDEN DE EJECUCIÓN

### Fase 1: Bloqueantes (30min)

```bash
# 1. Fix TypeScript error
# Editar packages/api/src/routers/leads.ts

# 2. Fix ESLint error
# Editar packages/ai/src/generate.ts

# 3. Verify fixes
pnpm typecheck
pnpm lint
```

### Fase 2: Runtime 500s (1-2h)

```bash
# 1. Investigar causa raíz
# Ver logs de tRPC con errores detallados

# 2. Fix más común: añadir null checks
# Ejemplo: if (!ctx.userId) throw new TRPCError({code: 'UNAUTHORIZED'})

# 3. Verificar schemas DB sincronizados
pnpm db:push

# 4. Test manual endpoints
```

### Fase 3: Warnings (1h)

```bash
# 1. Auto-fix lo que se pueda
pnpm lint:fix

# 2. Remover console.logs
# Script custom o manual

# 3. Fix unused vars manualmente
```

---

## 📋 CHECKLIST DE VALIDACIÓN

Después de cada fase:

- [ ] `pnpm typecheck` → 0 errores
- [ ] `pnpm lint` → 0 errores (warnings ok por ahora)
- [ ] `pnpm build` → exitoso
- [ ] Servidor arranca sin errores 500
- [ ] Dashboard carga correctamente
- [ ] Login funciona
- [ ] Al menos 1 endpoint tRPC responde 200

---

## 🚀 SIGUIENTE PASO INMEDIATO

**AHORA MISMO:**

1. Fix TypeScript error en leads.ts (5min)
2. Fix ESLint error en generate.ts (5min)
3. Verificar build pasa (5min)
4. Investigar logs 500 para encontrar causa raíz (15min)

**COMANDO PARA EMPEZAR:**

```bash
# 1. Ver error exacto de TypeScript
pnpm typecheck 2>&1 | grep "error TS"

# 2. Ver línea exacta del error ESLint
pnpm lint 2>&1 | grep "error  Unexpected any"
```
