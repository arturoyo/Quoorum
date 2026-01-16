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

## 📊 ESTADÍSTICAS

- **Total de errores documentados:** 4
- **Errores críticos:** 3
- **Errores moderados:** 1
- **Errores resueltos:** 4
- **Tasa de repetición:** 0% (objetivo: mantener en 0%)

---

_Última actualización: 2025-01-15_
_Próxima revisión: Antes de CADA cambio importante_
