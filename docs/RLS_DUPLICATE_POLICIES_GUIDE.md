# 🔐 Guía: Consolidación de Políticas RLS Duplicadas

**Fecha:** 29 Dic 2025
**Problema:** 373+ warnings de `multiple_permissive_policies` en Supabase
**Impacto:** Medio - No afecta funcionalidad pero complica mantenimiento

---

## 📋 Índice

1. [¿Qué es el Warning?](#qué-es-el-warning)
2. [¿Por Qué Ocurre?](#por-qué-ocurre)
3. [¿Cuándo es un Problema Real?](#cuándo-es-un-problema-real)
4. [Estrategias de Consolidación](#estrategias-de-consolidación)
5. [Ejemplos Prácticos](#ejemplos-prácticos)
6. [Plan de Acción](#plan-de-acción)

---

## ¿Qué es el Warning?

```
multiple_permissive_policies: Multiple permissive policies found for
table = X, role = Y, command = Z
```

**Significado:** Una tabla tiene **múltiples políticas PERMISSIVE** para la misma combinación de:

- Tabla
- Rol (anon, authenticated, dashboard_user, inngest, etc.)
- Comando (SELECT, INSERT, UPDATE, DELETE)

---

## ¿Por Qué Ocurre?

### Causa Principal: Creación Incremental de Políticas

Wallie ha evolucionado a través de múltiples migraciones RLS:

```
0014_enable_rls_security_hardening.sql
0015_optimize_rls_policies_performance.sql
0016_enable_rls_safe_final.sql
0017_enable_rls_production.sql
0018_fix_rls_for_direct_postgres.sql
0019_fix_rls_tags_and_related.sql
0020_enable_rls_dashboard_tables.sql
0021_enable_rls_all_remaining_tables.sql
0022_rls_remaining_56_tables.sql
0023_rls_performance_indexes.sql
0024_rls_admin_tables.sql
```

Cada migración pudo haber creado políticas SIN eliminar las anteriores, resultando en:

```sql
-- Migración 1
CREATE POLICY "Users can view clients" ON clients FOR SELECT USING (...);

-- Migración 2 (sin DROP)
CREATE POLICY "Enable read access for users" ON clients FOR SELECT USING (...);

-- Resultado: 2 políticas permissive para clients + SELECT + authenticated
```

---

## ¿Cuándo es un Problema Real?

### ✅ NO es Problema Crítico Si:

1. **Las políticas son EQUIVALENTES** (mismo resultado):

   ```sql
   -- Política A
   USING (user_id = auth.uid())

   -- Política B
   USING (user_id = (SELECT auth.uid()))

   -- Resultado: Ambas permiten lo mismo
   ```

2. **PostgreSQL usa OR lógico** entre permissive policies:
   - Si **cualquiera** de las políticas da TRUE → acceso permitido
   - No degrada performance significativamente con 2-3 políticas

### ⚠️ ES Problema Si:

1. **Lógica Contradictoria**:

   ```sql
   -- Política A: Solo activos
   USING (status = 'active')

   -- Política B: Todos
   USING (true)

   -- Resultado: B anula A, confusión
   ```

2. **Sobrecarga de Policies** (>5 por tabla/rol/cmd):
   - PostgreSQL debe evaluar TODAS las políticas
   - Impacto en performance

3. **Mantenimiento Complejo**:
   - ¿Cuál política modificar?
   - ¿Cuál eliminar?
   - Riesgo de romper lógica existente

---

## Estrategias de Consolidación

### Estrategia 1: Identificar Políticas Duplicadas Exactas

```sql
-- Query para encontrar duplicados
SELECT
  tablename,
  cmd,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ') as policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename, cmd
HAVING COUNT(*) > 1
ORDER BY policy_count DESC;
```

**Acción:**

1. Para cada tabla con duplicados
2. Comparar las condiciones USING y WITH CHECK
3. Si son idénticas → Eliminar todas menos una
4. Si son similares → Consolidar en una sola

### Estrategia 2: Política Única por Tabla/Comando

**Template:**

```sql
-- 1. DROP todas las políticas existentes para X tabla + Y comando
DROP POLICY IF EXISTS "policy_1" ON tabla;
DROP POLICY IF EXISTS "policy_2" ON tabla;
DROP POLICY IF EXISTS "policy_3" ON tabla;

-- 2. CREATE una única política consolidada
CREATE POLICY "Enable SELECT for authenticated users"
  ON tabla
  FOR SELECT
  TO authenticated
  USING (
    -- Consolidar TODAS las condiciones con OR
    (user_id = (SELECT auth.uid()))
    OR (is_public = true)
    OR (shared_with @> ARRAY[(SELECT auth.uid())])
  );
```

### Estrategia 3: Roles Diferentes = Políticas Diferentes

**Correcto:**

```sql
-- Política para 'authenticated'
CREATE POLICY "authenticated_can_read" ON tabla FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Política para 'dashboard_user'
CREATE POLICY "dashboard_can_read_all" ON tabla FOR SELECT
  TO dashboard_user
  USING (true);

-- Política para 'anon'
CREATE POLICY "anon_can_read_public" ON tabla FOR SELECT
  TO anon
  USING (is_public = true);
```

**NO genera warning** porque son **roles diferentes**.

### Estrategia 4: PERMISSIVE vs RESTRICTIVE

```sql
-- Múltiples PERMISSIVE (OR lógico)
CREATE POLICY "policy_a" ON tabla FOR SELECT USING (condition_a);
CREATE POLICY "policy_b" ON tabla FOR SELECT USING (condition_b);
-- Resultado: condition_a OR condition_b

-- PERMISSIVE + RESTRICTIVE (AND lógico)
CREATE POLICY "permissive" ON tabla FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "restrictive" ON tabla AS RESTRICTIVE FOR SELECT USING (status = 'active');
-- Resultado: (user_id = auth.uid()) AND (status = 'active')
```

**Cuándo usar RESTRICTIVE:**

- Para aplicar filtros globales (ej: soft deletes)
- Para agregar condiciones obligatorias sobre permissive

---

## Ejemplos Prácticos

### Ejemplo 1: clients (Multiple Policies Detected)

**Estado Actual (Hipotético):**

```sql
-- Política 1 (de migración vieja)
CREATE POLICY "Users can view clients" ON clients FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Política 2 (de optimización performance)
CREATE POLICY "Enable read access for users" ON clients FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Warning: multiple_permissive_policies
```

**Solución: Consolidar en Una**

```sql
-- DROP ambas
DROP POLICY IF EXISTS "Users can view clients" ON clients;
DROP POLICY IF EXISTS "Enable read access for users" ON clients;

-- CREATE única con nombre descriptivo
CREATE POLICY "authenticated_users_read_own_clients" ON clients
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));
```

### Ejemplo 2: conversations (Con Soft Deletes)

**Estado Actual:**

```sql
-- Política 1: Ownership
CREATE POLICY "Users own conversations" ON conversations FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- Política 2: Not deleted (alguien añadió después)
CREATE POLICY "Exclude deleted" ON conversations FOR SELECT
  USING (deleted_at IS NULL);

-- Warning: multiple_permissive_policies
```

**Problema:** Políticas PERMISSIVE usan OR → Pueden ver conversaciones ajenas si deleted_at IS NULL

**Solución: Usar RESTRICTIVE**

```sql
-- DROP política de soft delete
DROP POLICY IF EXISTS "Exclude deleted" ON conversations;

-- Mantener ownership como PERMISSIVE
-- (Ya existe, no cambiar)

-- Agregar soft delete como RESTRICTIVE (AND)
CREATE POLICY "soft_delete_filter" ON conversations
  AS RESTRICTIVE
  FOR SELECT
  USING (deleted_at IS NULL);

-- Resultado: (user_id = auth.uid()) AND (deleted_at IS NULL)
```

### Ejemplo 3: Roles Diferentes (NO Consolidar)

**Estado Actual:**

```sql
-- Política para usuarios normales
CREATE POLICY "users_read_own" ON analytics FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Política para dashboard admin
CREATE POLICY "dashboard_read_all" ON analytics FOR SELECT
  TO dashboard_user
  USING (true);

-- NO warning (roles diferentes)
```

**Acción:** ✅ **Dejar como está** - Son roles diferentes, es correcto tener múltiples políticas.

---

## Plan de Acción

### Fase 1: Auditoría (1-2 horas)

```sql
-- Script de auditoría
-- Guardar en: scripts/audit-duplicate-policies.sql

SELECT
  p.tablename,
  p.cmd,
  COUNT(*) as policy_count,
  STRING_AGG(p.policyname || ' (' || p.roles::text || ')', E'\n  ') as policies_detail
FROM pg_policies p
WHERE p.schemaname = 'public'
GROUP BY p.tablename, p.cmd, p.roles
HAVING COUNT(*) > 1
ORDER BY policy_count DESC, p.tablename;
```

**Output esperado:**

```
tablename      | cmd    | policy_count | policies_detail
---------------|--------|--------------|-------------------
clients        | SELECT | 3            | policy_a ({authenticated})
               |        |              | policy_b ({authenticated})
               |        |              | policy_c ({authenticated})
conversations  | SELECT | 2            | ...
```

### Fase 2: Categorización (30 min)

Para cada tabla con duplicados, determinar:

1. **Tipo A - Duplicados Exactos**: Policies idénticas o equivalentes
   - **Acción:** Eliminar todas menos una

2. **Tipo B - Condiciones Complementarias**: Policies con lógica diferente pero para mismo rol
   - **Acción:** Consolidar con OR en una sola policy

3. **Tipo C - Restricciones Globales**: Policies que aplican filtros adicionales
   - **Acción:** Convertir a RESTRICTIVE

4. **Tipo D - Roles Diferentes**: Policies para diferentes roles
   - **Acción:** ✅ Dejar como está (no es warning real)

### Fase 3: Consolidación Incremental (4-6 horas)

**NO hacer todo a la vez** - Hacer por bloques y validar:

#### Bloque 1: Tablas Core (Alta Prioridad)

```
clients
conversations
messages
deals
```

#### Bloque 2: Tablas Psychology Engine

```
client_personas
conversation_psychology
message_emotions
wallie_annotations
```

#### Bloque 3: Tablas Administrativas

```
email_threads
agent_usage
agent_usage_daily
security_logs
```

#### Bloque 4: Tablas Restantes

```
... (resto de tablas con warnings)
```

**Template de Consolidación:**

```sql
-- Migration: 0027_consolidate_policies_block1.sql

-- ═══════════════════════════════════════════════════════════
-- CLIENTS TABLE
-- ═══════════════════════════════════════════════════════════

DO $$
BEGIN
  RAISE NOTICE 'Consolidating clients policies...';
END $$;

-- 1. Backup de políticas existentes (en comentario)
/*
  Políticas anteriores:
  - "Users can view clients" - USING (user_id = auth.uid())
  - "Enable read access" - USING (user_id = (SELECT auth.uid()))
*/

-- 2. DROP todas las políticas duplicadas
DROP POLICY IF EXISTS "Users can view clients" ON clients;
DROP POLICY IF EXISTS "Enable read access for users" ON clients;
DROP POLICY IF EXISTS "authenticated_can_read" ON clients;

-- 3. CREATE única política consolidada
CREATE POLICY "authenticated_users_read_own_clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Repetir para INSERT, UPDATE, DELETE...
```

### Fase 4: Validación (1 hora)

Después de cada bloque:

1. **Ejecutar Tests:**

   ```bash
   pnpm test
   pnpm test:e2e
   ```

2. **Verificar en Supabase:**
   - SQL Editor: SELECT \* FROM clients WHERE user_id = auth.uid()
   - Verificar que devuelve datos correctos

3. **Revisar Linter:**

   ```
   Antes:  373 warnings
   Bloque 1: ~350 warnings (23 resueltos)
   Bloque 2: ~320 warnings (30 resueltos)
   ...
   ```

4. **Monitoring:**
   - Ver logs de errores RLS en Supabase Dashboard
   - Verificar performance de queries

---

## 🚨 Precauciones

### ⚠️ NO Consolidar Sin Entender

**Ejemplo de ERROR común:**

```sql
-- Política A: Users ven sus propios clientes
USING (user_id = auth.uid())

-- Política B: Users ven clientes compartidos
USING (shared_users @> ARRAY[auth.uid()])

-- ❌ MAL: Eliminar Política B pensando que es duplicado
-- ✅ BIEN: Consolidar ambas con OR
USING (
  user_id = (SELECT auth.uid())
  OR shared_users @> ARRAY[(SELECT auth.uid())]
)
```

### ⚠️ Probar en Entorno de Testing Primero

1. Crear branch `fix/rls-consolidation`
2. Aplicar cambios en DB de desarrollo
3. Ejecutar tests completos
4. Validar con usuario real
5. Solo entonces aplicar en producción

### ⚠️ Backup Antes de Consolidar

```bash
# Backup de políticas actuales
pg_dump --schema-only \
  -h aws-1-eu-central-2.pooler.supabase.com \
  -U postgres.kcopoxrrnvogcwdwnhjr \
  -d postgres \
  -t public.* \
  > backup_policies_$(date +%Y%m%d).sql
```

---

## 📊 Resultados Esperados

### Antes

```
✗ auth_rls_initplan: 17 warnings
✗ multiple_permissive_policies: 373 warnings
✗ duplicate_index: 1 warning
Total: 391 warnings
```

### Después (Optimista)

```
✓ auth_rls_initplan: 0 warnings (fixed by migration 0026)
✓ multiple_permissive_policies: ~50 warnings (legitimate multi-role policies)
✓ duplicate_index: 0 warnings (fixed by migration 0026)
Total: ~50 warnings
```

### Después (Realista)

```
✓ auth_rls_initplan: 0 warnings
✓ multiple_permissive_policies: ~150 warnings (needs per-table review)
✓ duplicate_index: 0 warnings
Total: ~150 warnings
```

**Nota:** Es posible que algunos warnings sean **legítimos** (ej: diferentes roles), por lo que **no es necesario llegar a 0 warnings absoluto**.

---

## 🔗 Referencias

- [PostgreSQL RLS Docs](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PERMISSIVE vs RESTRICTIVE](https://www.postgresql.org/docs/current/sql-createpolicy.html)

---

## 📝 Checklist de Consolidación

Por cada tabla con warnings:

- [ ] Listar todas las políticas existentes
- [ ] Identificar qué hace cada política
- [ ] Determinar si son duplicados o complementarias
- [ ] Decidir estrategia (consolidar, restrictive, o dejar)
- [ ] Escribir migración SQL
- [ ] Probar en desarrollo
- [ ] Validar con tests
- [ ] Aplicar en producción
- [ ] Verificar linter después

---

**Última actualización:** 29 Dic 2025
**Autor:** Claude Sonnet 4.5
**Versión:** 1.0.0
