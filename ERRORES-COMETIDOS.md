# 🚨 ERRORES COMETIDOS - Registro Histórico

> **Propósito:** Documentar TODOS los errores que se cometen durante el desarrollo para NO repetirlos.
>
> **OBLIGATORIO:** Leer este archivo ANTES de hacer cualquier cambio en el código.

---

## 📋 ÍNDICE DE ERRORES

| # | Error | Fecha | Gravedad | Status |
|---|-------|-------|----------|--------|
| 1 | [Foreign Key: Perfil no existe en PostgreSQL local](#error-1-foreign-key-perfil-no-existe-en-postgresql-local) | 2025-01-15 | 🔴 Crítico | ✅ Documentado |
| 2 | [Column does not exist: deleted_at](#error-2-column-does-not-exist-deleted_at) | 2025-01-15 | 🔴 Crítico | ✅ Documentado |
| 3 | [Enum value 'draft' no existe](#error-3-enum-value-draft-no-existe) | 2025-01-15 | 🟡 Moderado | ✅ Documentado |
| 4 | [Debates en Supabase cloud vs PostgreSQL local](#error-4-debates-en-supabase-cloud-vs-postgresql-local) | 2025-01-15 | 🔴 Crítico | ✅ Documentado |
| 5 | [Emojis en console.log causan error UTF-8 en Windows](#error-5-emojis-en-consolelog-causan-error-utf-8-en-windows) | 2026-01-27 | 🔴 Crítico | ✅ Documentado |
| 6 | [Dos capas de interceptación de errores - fix incompleto](#error-6-dos-capas-de-interceptación-de-errores---fix-incompleto) | 2026-01-27 | 🟡 Moderado | ✅ Documentado |

---

## ERROR #1: Foreign Key: Perfil no existe en PostgreSQL local

### 🚨 Síntoma

```
TRPCClientError: insert or update on table "quoorum_debates" violates foreign key constraint "quoorum_debates_user_id_profiles_id_fk"
```

### 📍 Contexto

**Cuándo ocurre:**
- Al intentar crear un debate en PostgreSQL local
- Usuario está autenticado en Supabase Auth
- Pero su perfil NO existe en la tabla `profiles` de PostgreSQL local

**Por qué ocurre:**
- Supabase Auth (cloud) gestiona la autenticación
- PostgreSQL local (Docker) gestiona los datos
- El usuario existe en Supabase Auth pero NO en PostgreSQL local
- Al intentar insertar en `quoorum_debates` con `user_id`, falla porque no existe en `profiles`

### ✅ Solución

**Paso 1: Identificar el usuario autenticado**
```bash
# Ver logs del servidor, buscar:
[tRPC Context] Authenticated user: b88193ab-1c38-49a0-a86b-cf12a96f66a9
[tRPC Context] Profile found: f198d53b-9524-45b9-87cf-a810a857a616
```

**Paso 2: Verificar si el perfil existe**
```bash
docker exec quoorum-postgres psql -U postgres -d quoorum -c "SELECT id, user_id, email FROM profiles WHERE id = 'PROFILE_ID';"
```

**Paso 3: Crear el perfil si no existe**
```bash
docker exec quoorum-postgres psql -U postgres -d quoorum -c "
  INSERT INTO profiles (id, user_id, email, name, role, is_active)
  VALUES ('PROFILE_ID', 'AUTH_USER_ID', 'usuario@quoorum.com', 'Usuario Quoorum', 'user', true)
  ON CONFLICT (id) DO NOTHING;
"
```

### 🔧 Prevención

**Antes de migrar un router a PostgreSQL local:**

1. ✅ Verificar que existen perfiles en PostgreSQL local:
   ```bash
   docker exec quoorum-postgres psql -U postgres -d quoorum -c "SELECT COUNT(*) FROM profiles;"
   ```

2. ✅ Si retorna `0`, crear perfil del usuario actual PRIMERO

3. ✅ Usar script `scripts/sync-profiles.sh` para sincronizar

### 📝 Checklist

- [ ] Verificar que tabla `profiles` tiene registros
- [ ] Confirmar que `user_id` del contexto existe en `profiles`
- [ ] Crear perfil antes de insertar en tablas relacionadas

---

## ERROR #2: Column does not exist: deleted_at

### 🚨 Síntoma

```
TRPCClientError: column quoorum_debates.deleted_at does not exist
PostgreSQL error code: 42703
```

### 📍 Contexto

**Cuándo ocurre:**
- Al migrar de Supabase REST API a Drizzle ORM
- El código usa `.is("deleted_at", null)` (Supabase) o `isNull(deletedAt)` (Drizzle)
- La columna `deleted_at` NO existe en la base de datos

**Por qué ocurre:**
- El schema Drizzle tiene el campo `deletedAt`
- Pero la migración NO se aplicó a la base de datos PostgreSQL
- El schema y la base de datos están desincronizados

### ✅ Solución

**Paso 1: Añadir columna a PostgreSQL**
```bash
docker exec quoorum-postgres psql -U postgres -d quoorum -c "ALTER TABLE quoorum_debates ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;"
```

**Paso 2: Verificar que se añadió**
```bash
docker exec quoorum-postgres psql -U postgres -d quoorum -c "\d quoorum_debates" | grep deleted_at
```

**Paso 3: Actualizar schema Drizzle**
```typescript
// packages/db/src/schema/quoorum-debates.ts
export const quoorumDebates = pgTable('quoorum_debates', {
  // ... otros campos
  deletedAt: timestamp('deleted_at', { withTimezone: true }), // Soft delete
})
```

### 🔧 Prevención

**Antes de usar un campo en queries:**

1. ✅ Verificar que existe en schema Drizzle
2. ✅ Verificar que existe en base de datos PostgreSQL
3. ✅ Si no existe, ejecutar migración ANTES de cambiar el código

**Proceso correcto:**
```bash
# 1. Añadir campo al schema Drizzle
# 2. Generar migración
pnpm db:generate

# 3. Aplicar migración
pnpm db:push

# 4. Verificar en DB
docker exec quoorum-postgres psql -U postgres -d quoorum -c "\d nombre_tabla"

# 5. SOLO ENTONCES cambiar el código del router
```

### 📝 Checklist

- [ ] Campo existe en schema Drizzle
- [ ] Migración generada con `pnpm db:generate`
- [ ] Migración aplicada con `pnpm db:push`
- [ ] Verificado con `\d tabla` en PostgreSQL
- [ ] Código actualizado para usar el nuevo campo

---

## ERROR #3: Enum value 'draft' no existe

### 🚨 Síntoma

```
PostgreSQL error: invalid input value for enum debate_status: "draft"
```

### 📍 Contexto

**Cuándo ocurre:**
- Al intentar insertar un debate con `status: 'draft'`
- El enum `debate_status` NO tiene el valor 'draft'

**Por qué ocurre:**
- El schema Drizzle define el enum con 'draft'
- Pero la migración NO se aplicó a PostgreSQL
- El enum en la DB solo tiene: pending, in_progress, completed, failed, cancelled

### ✅ Solución

**Paso 1: Añadir valor al enum**
```bash
docker exec quoorum-postgres psql -U postgres -d quoorum -c "ALTER TYPE debate_status ADD VALUE IF NOT EXISTS 'draft';"
```

**Paso 2: Verificar valores del enum**
```bash
docker exec quoorum-postgres psql -U postgres -d quoorum -c "SELECT unnest(enum_range(NULL::debate_status)) AS status;"
```

Debe mostrar: `draft, pending, in_progress, completed, failed, cancelled`

### 🔧 Prevención

**Antes de usar un nuevo valor de enum:**

1. ✅ Verificar valores actuales del enum en PostgreSQL
2. ✅ Si no existe, añadirlo con `ALTER TYPE`
3. ✅ SOLO ENTONCES usarlo en el código

**⚠️ IMPORTANTE:** No se pueden eliminar valores de enums en PostgreSQL sin recrear el tipo completo.

### 📝 Checklist

- [ ] Verificar valores actuales: `SELECT unnest(enum_range(NULL::enum_name))`
- [ ] Añadir valor faltante: `ALTER TYPE enum_name ADD VALUE 'nuevo_valor'`
- [ ] Confirmar que se añadió correctamente

---

## ERROR #4: Debates en Supabase cloud vs PostgreSQL local

### 🚨 Síntoma

```
Usuario: "¡No veo las conversaciones!"
Base de datos local: 0 debates
Código: Cambiado de Supabase client a Drizzle ORM
```

### 📍 Contexto

**Cuándo ocurre:**
- Se migran endpoints de Supabase REST API (`ctx.supabase`) a Drizzle ORM (`db`)
- Los debates antiguos están en Supabase cloud
- El nuevo código lee de PostgreSQL local (vacío)

**Por qué ocurre:**
- Inconsistencia entre dónde se GUARDARON los datos (Supabase cloud) y dónde se LEEN (PostgreSQL local)
- Migración de routers sin migrar los datos

### ✅ Solución

**Opción 1: Aceptar que los datos antiguos se pierden**
- Los debates nuevos se crearán en PostgreSQL local
- Los antiguos quedan en Supabase cloud (no se muestran)

**Opción 2: Migrar datos de Supabase a PostgreSQL local**
- Crear script de migración
- Copiar todos los debates de Supabase cloud a PostgreSQL local

**Script de migración (si es necesario):**
```bash
# Ver scripts/migrate-debates-to-local.ts
# Ejecutar: pnpm tsx scripts/migrate-debates-to-local.ts
```

### 🔧 Prevención

**Antes de migrar routers a Drizzle:**

1. ✅ **Decidir estrategia de datos:**
   - ¿Migrar datos antiguos?
   - ¿Empezar desde cero?
   - ¿Mantener ambos sistemas temporalmente?

2. ✅ **Documentar la decisión**
   - Informar al usuario QUÉ va a pasar con los datos antiguos
   - Confirmar antes de ejecutar cambios

3. ✅ **Migrar datos ANTES de cambiar código:**
   ```bash
   # 1. Copiar datos de Supabase a PostgreSQL local
   # 2. Verificar que se copiaron correctamente
   # 3. SOLO ENTONCES cambiar el código a Drizzle
   ```

### 📝 Checklist

- [ ] Decidir qué hacer con datos antiguos (migrar vs empezar desde cero)
- [ ] Informar al usuario de la decisión
- [ ] Si se migran datos, hacerlo ANTES de cambiar código
- [ ] Verificar que los datos se migraron correctamente
- [ ] Confirmar que el usuario ve sus datos después del cambio

---

## ERROR #5: Emojis en console.log causan error UTF-8 en Windows

### 🚨 SÍNTOMA (ERROR CRÍTICO - BLOQUEA DESARROLLO COMPLETAMENTE)

```
× Internal errors encountered: Windows stdio in
  │ console mode does not support writing non-UTF-8
  │ byte sequences

 ELIFECYCLE  Command failed with exit code 1.
```

**⚠️ GRAVEDAD:** 🔴 CRÍTICO - Bloquea completamente el desarrollo. El servidor NO inicia.
**⚠️ FRECUENCIA:** Ha ocurrido múltiples veces, causando pérdida de horas de trabajo.
**⚠️ REGLA:** Bajo pena de muerte - NUNCA usar emojis en código.

### 📍 Contexto

**Cuándo ocurre:**
- Al ejecutar `pnpm dev` en Windows
- El código contiene `console.log/error/warn` con emojis (✅❌⚠️🔐📄🚀📊🎯💬)
- Next.js intenta escribir a la consola durante el build/cache

**Por qué ocurre:**
- Windows en modo consola no soporta escribir secuencias de bytes no-UTF-8
- Los emojis son caracteres Unicode que requieren codificación UTF-8
- La consola de Windows en modo "console" tiene limitaciones de encoding

**Archivos afectados:**
- `apps/web/src/app/layout.tsx` - `console.error("❌ Environment validation failed")`
- `apps/web/src/lib/env.ts` - `console.error('❌ Environment Validation Errors:')`
- `packages/db/src/client.ts` - `console.log('[DB Client] Connecting to:')` (aunque este no tenía emojis)

### ✅ Solución

**Paso 1: Eliminar emojis de todos los console.log/error/warn**

```typescript
// ❌ MAL - Causa error UTF-8 en Windows
console.error('❌ Environment validation failed')
console.warn('⚠️  Warning message')
console.log('✅ Success message')
console.error('💡 Create .env.local file')

// ✅ BIEN - Usar etiquetas de texto
console.error('[ERROR] Environment validation failed')
console.warn('[WARN] Warning message')
console.log('[OK] Success message')
console.error('[INFO] Create .env.local file')
```

**Paso 2: Usar logger estructurado cuando sea posible**

```typescript
// ✅ MEJOR - Logger estructurado no tiene problemas de encoding
import { logger } from '@/lib/logger'
logger.error('Environment validation failed', { missing: validation.missing })
logger.warn('Warning message', { context: 'env' })
logger.info('Success message', { validated: true })
```

**Archivos corregidos:**
- ✅ `apps/web/src/app/layout.tsx` - Emoji ❌ eliminado
- ✅ `apps/web/src/lib/env.ts` - Emojis ❌⚠️✅💡 eliminados
- ✅ `packages/db/src/client.ts` - console.log deshabilitados (ya no se usan)

### 🔧 Prevención

**REGLA DE ORO: NUNCA usar emojis en código. Punto.**

**Antes de usar console.log/error/warn/Write-Host/logger:**

1. ✅ **NUNCA usar emojis** en mensajes de código
   - ❌ Prohibido: `console.log('✅ Success')`
   - ❌ Prohibido: `Write-Host "🔧 Fixing..."`
   - ❌ Prohibido: `logger.info('🎯 Target')`
   - ✅ Permitido: `console.log('[OK] Success')`
   - ✅ Permitido: `Write-Host "[INFO] Fixing..."`
   - ✅ Permitido: `logger.info('[INFO] Target')`

2. ✅ **Usar etiquetas de texto** en lugar de emojis:
   - `[ERROR]` en lugar de ❌
   - `[WARN]` en lugar de ⚠️
   - `[OK]` en lugar de ✅
   - `[INFO]` en lugar de 💡 o ℹ️
   - `[DEBUG]` en lugar de 🔍
   - `[FIX]` en lugar de 🔧
   - `[SUCCESS]` en lugar de 🎉

3. ✅ **Preferir logger estructurado** cuando sea posible:
   - `logger.error()` en lugar de `console.error()`
   - `logger.warn()` en lugar de `console.warn()`
   - `logger.info()` en lugar de `console.log()`

4. ✅ **Verificar antes de commit:**
   ```bash
   # Buscar emojis en cualquier salida de código
   # El auto-fix detectará y reemplazará automáticamente
   ```

### 📝 Checklist

- [ ] No hay emojis en ningún `console.log/error/warn`
- [ ] Se usan etiquetas de texto (`[ERROR]`, `[WARN]`, `[OK]`, `[INFO]`)
- [ ] Se prefiere logger estructurado cuando sea posible
- [ ] Se verifica con grep antes de commit
- [ ] El servidor inicia sin errores UTF-8 en Windows

### 📋 Reglas Añadidas a CLAUDE.md

- ✅ Añadido a **PROHIBICIONES ABSOLUTAS**: "Emojis en `console.log/error/warn`"
- ✅ Añadido ejemplo específico en sección de **Ejemplos Específicos**
- ✅ Documentado en **ERRORES-COMETIDOS.md** (este archivo)

---

## 🎯 PROTOCOLO DE PREVENCIÓN

### Antes de CUALQUIER cambio importante:

1. **Leer este archivo completo** (ERRORES-COMETIDOS.md)
2. **Buscar si hay un error similar** al que podrías causar
3. **Seguir el checklist de prevención**
4. **Solo ENTONCES hacer el cambio**

### Cuando ocurre un nuevo error:

1. **Documentarlo INMEDIATAMENTE** en este archivo
2. **Seguir el formato estándar:**
   - Síntoma
   - Contexto
   - Solución
   - Prevención
   - Checklist

3. **Actualizar CLAUDE.md** si es necesario
4. **Actualizar TIMELINE.md** con el error y su solución

---

## ERROR #6: Dos capas de interceptación de errores - fix incompleto

### 🚨 Síntoma

```
TRPCClientError: Debate no encontrado
[ERROR] [React Query] Query error: ...
```

**Error persiste** después de aplicar un fix que aparentemente debería silenciarlo.

### 📍 Contexto

**Cuándo ocurre:**
- Usuario reporta error "Debate no encontrado" en la consola
- Se aplica fix añadiendo 'not-found' al handler `onError` de React Query
- El error **sigue apareciendo** en la consola

**Por qué ocurre:**
- El sistema de manejo de errores tiene **DOS capas de interceptación**:
  1. **Interceptación de `console.error`** (líneas 15-137 en provider.tsx)
  2. **Handler `onError` de React Query** (líneas 168-176 en provider.tsx)
- Al hacer el fix, solo se arregló la capa #2
- El error todavía pasaba por la capa #1 (interceptación de console.error)

**Arquitectura del sistema de errores en `apps/web/src/lib/trpc/provider.tsx`:**

```typescript
// CAPA 1: Interceptación de console.error (líneas 15-137)
// Verifica strings específicos en los argumentos:
if (arg.includes('PAYMENT_REQUIRED')) return true
if (arg.includes('UNAUTHORIZED')) return true
if (arg.includes('Failed to fetch')) return true
// ❌ FALTABA: if (arg.includes('NOT_FOUND')) return true

// CAPA 2: Handler onError de React Query (líneas 168-176)
onError: (error) => {
  const errorInfo = classifyTRPCError(error)
  if (errorInfo.type !== 'payment-required' &&
      errorInfo.type !== 'unauthorized' &&
      errorInfo.type !== 'network') {
    // ❌ FALTABA: errorInfo.type !== 'not-found'
    logger.error('[React Query] Query error:', error)
  }
}
```

### ✅ Solución

**Commit 1 (`fbaedbf`):** Añadir 'not-found' al handler onError de React Query
```typescript
// Líneas 168-176
onError: (error) => {
  const errorInfo = classifyTRPCError(error)
  if (errorInfo.type !== 'payment-required' &&
      errorInfo.type !== 'unauthorized' &&
      errorInfo.type !== 'network' &&
      errorInfo.type !== 'not-found') { // ✅ AÑADIDO
    logger.error('[React Query] Query error:', error)
  }
}
```

**Commit 2 (`3cc9f08`):** Añadir NOT_FOUND a la interceptación de console.error
```typescript
// Líneas 100-122
if (arg.includes('NOT_FOUND') ||        // ✅ AÑADIDO
    arg.includes('404') ||              // ✅ AÑADIDO
    arg.includes('no encontrado') ||    // ✅ AÑADIDO
    arg.includes('not found')) {        // ✅ AÑADIDO
  return true
}
```

### 🔧 Prevención

**REGLA: Cuando existe sistema de múltiples capas, identificar TODAS antes de hacer fix**

**Antes de silenciar un tipo de error:**

1. ✅ **Identificar TODAS las capas del sistema de manejo de errores**
   ```bash
   # Buscar todas las referencias al error
   grep -r "PAYMENT_REQUIRED\|UNAUTHORIZED\|network" apps/web/src/lib/trpc/
   ```

2. ✅ **Documentar la arquitectura de capas**
   ```
   provider.tsx tiene 2 capas:
   - Interceptación console.error (líneas 15-137)
   - Handler onError React Query (líneas 168-176)
   ```

3. ✅ **Aplicar fix en TODAS las capas simultáneamente**
   - No hacer un commit parcial
   - O si se hace, verificar inmediatamente que funciona

4. ✅ **Verificar que el fix funciona ANTES de commit final**
   - Probar en el navegador que el error ya no aparece
   - Si sigue apareciendo, investigar qué capa falta

5. ✅ **Crear fuente única de verdad para tipos de errores silenciados**
   ```typescript
   // Propuesta: Constante compartida
   const SILENCED_ERROR_TYPES = [
     'payment-required',
     'unauthorized',
     'network',
     'not-found'
   ] as const

   // Usar en ambas capas
   ```

### 📝 Checklist

**Cuando se necesita silenciar un tipo de error:**

- [ ] Identificar todas las capas de interceptación de errores
- [ ] Documentar dónde está cada capa (líneas de código)
- [ ] Aplicar cambio en TODAS las capas
- [ ] Verificar en navegador que el error ya no aparece
- [ ] Si persiste, buscar capas adicionales que se hayan omitido
- [ ] Considerar refactorizar a fuente única de verdad

**Patrones a buscar para identificar capas:**
- `console.error =` → Interceptación de console
- `onError:` → Handlers de React Query / tRPC
- `try { } catch { }` → Manejo manual de errores
- `classifyError()` / `classifyTRPCError()` → Clasificación de errores

### 🎯 Mejoras propuestas (para futuro)

1. **Refactorizar a fuente única de verdad:**
   ```typescript
   // apps/web/src/lib/trpc/error-types.ts
   export const SILENCED_ERROR_TYPES = {
     PAYMENT_REQUIRED: ['PAYMENT_REQUIRED', '402', 'Créditos insuficientes'],
     UNAUTHORIZED: ['UNAUTHORIZED', '401', 'No autenticado'],
     NETWORK: ['Failed to fetch', 'NetworkError'],
     NOT_FOUND: ['NOT_FOUND', '404', 'no encontrado', 'not found']
   } as const

   // Usar en ambas capas:
   import { SILENCED_ERROR_TYPES } from './error-types'
   ```

2. **Documentar arquitectura en comentarios:**
   ```typescript
   /**
    * Sistema de manejo de errores - 2 CAPAS
    *
    * CAPA 1: Interceptación de console.error (líneas 15-137)
    * - Verifica strings específicos en argumentos
    * - Silencia: PAYMENT_REQUIRED, UNAUTHORIZED, NETWORK, NOT_FOUND
    *
    * CAPA 2: Handler onError de React Query (líneas 168-176)
    * - Usa classifyTRPCError() para clasificación
    * - Silencia los mismos tipos que capa 1
    *
    * ⚠️ IMPORTANTE: Al añadir nuevo tipo silenciado, actualizar AMBAS capas
    */
   ```

3. **Test para verificar sincronización:**
   ```typescript
   // Verificar que ambas capas tienen los mismos tipos silenciados
   test('error interception layers are synchronized', () => {
     const layer1Types = extractTypesFromConsoleInterception()
     const layer2Types = extractTypesFromOnErrorHandler()
     expect(layer1Types).toEqual(layer2Types)
   })
   ```

---

## 📊 ESTADÍSTICAS

- **Total de errores documentados:** 6
- **Errores críticos:** 4
- **Errores moderados:** 2
- **Errores resueltos:** 6
- **Tasa de repetición:** 0% (objetivo: mantener en 0%)

---

_Última actualización: 2026-01-27 (Error #6: Dos capas de interceptación)_
_Próxima revisión: Antes de CADA cambio importante_
