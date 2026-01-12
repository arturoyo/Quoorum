# 🛡️ Guía de Seguridad: Row Level Security (RLS) en Supabase

> **Última actualización:** 19 Dic 2024
> **Nivel:** Intermedio-Avanzado
> **Tiempo de lectura:** 15 minutos

---

## 📚 Índice

1. [¿Qué es RLS?](#qué-es-rls)
2. [¿Qué salió mal? (Incidente 19 Dic)](#qué-salió-mal-incidente-19-dic)
3. [Las 7 Reglas de Oro](#las-7-reglas-de-oro)
4. [Patrones Correctos](#patrones-correctos)
5. [Errores Comunes](#errores-comunes)
6. [Template SQL Seguro](#template-sql-seguro)
7. [Cómo Testear RLS](#cómo-testear-rls)
8. [Checklist Pre-Deploy](#checklist-pre-deploy)

---

## ¿Qué es RLS?

**Row Level Security (RLS)** es una capa de seguridad de PostgreSQL que **filtra las filas** que un usuario puede ver/modificar basándose en políticas SQL.

### Ejemplo simple:
```sql
-- Sin RLS: Usuario A puede ver datos de Usuario B ❌
SELECT * FROM clients;  -- Retorna TODOS los clientes

-- Con RLS: Usuario A solo ve SUS clientes ✅
SELECT * FROM clients;  -- Solo retorna clients.user_id = auth.uid()
```

### ¿Por qué es crítico?
- **Sin RLS:** Cualquier usuario autenticado puede ver/modificar datos de otros usuarios
- **Con RLS:** Aislamiento total de datos por usuario
- **Problema:** Políticas mal escritas pueden **bloquear TODA la base de datos**

---

## ¿Qué salió mal? (Incidente 19 Dic)

### 🔴 Problema: Query Circular

Creé esta política en `magic_tokens`:

```sql
-- ❌ INCORRECTO - Causa timeout infinito
CREATE POLICY "Users can read own tokens"
  ON magic_tokens
  FOR SELECT
  TO authenticated
  USING (
    phone = (SELECT phone FROM profiles WHERE id = (SELECT auth.uid()))
    --      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    --      SUBQUERY a tabla con RLS
  );
```

### ¿Por qué es malo?

```
┌─────────────────────────────────────────┐
│ 1. Usuario hace: SELECT * FROM magic_tokens
│    ↓
│ 2. RLS evalúa: phone = (SELECT phone FROM profiles ...)
│    ↓
│ 3. Postgres hace: SELECT phone FROM profiles WHERE id = auth.uid()
│    ↓
│ 4. RLS de profiles evalúa: id = (SELECT auth.uid())
│    ↓
│ 5. LOOP: Vuelve a verificar RLS... infinitamente
│    ↓
│ 6. Resultado: TIMEOUT en TODOS los queries
└─────────────────────────────────────────┘
```

### 💥 Impacto:
- ✅ Antes de migración: Queries en 50ms
- ❌ Después de migración: TIMEOUT (30s+) en TODOS los queries
- 🔥 Toda la app dejó de funcionar

---

## Las 7 Reglas de Oro

### 1️⃣ **NUNCA hagas subqueries a tablas con RLS**

```sql
-- ❌ MAL - Subquery a tabla con RLS
USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()))

-- ✅ BIEN - Join directo sin RLS
USING (
  EXISTS (
    SELECT 1 FROM clients c
    WHERE c.id = messages.client_id
    AND c.user_id = (SELECT auth.uid())
  )
)
```

### 2️⃣ **Siempre usa (SELECT auth.uid()) con subquery**

```sql
-- ❌ MAL - Se reevalúa por cada fila
USING (user_id = auth.uid())

-- ✅ BIEN - Se evalúa UNA vez (InitPlan optimization)
USING (user_id = (SELECT auth.uid()))
```

**¿Por qué?**
- `auth.uid()` sin `SELECT` → Postgres lo evalúa **por cada fila**
- `(SELECT auth.uid())` → Postgres lo evalúa **una vez** y cachea

### 3️⃣ **Service role debe tener acceso completo**

```sql
-- ✅ SIEMPRE incluir esto primero
CREATE POLICY "Service role full access"
  ON tabla
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

**¿Por qué?**
- Los workers/background jobs usan `service_role`
- Sin esta política, tus workers fallan

### 4️⃣ **Políticas simples > Políticas complejas**

```sql
-- ❌ MAL - Demasiado complejo, difícil de debuguear
USING (
  (user_id = (SELECT auth.uid()) AND status = 'active')
  OR
  (shared_with @> ARRAY[(SELECT auth.uid())] AND status != 'deleted')
  OR
  (team_id IN (SELECT team_id FROM team_members WHERE user_id = (SELECT auth.uid())))
)

-- ✅ BIEN - Una política por caso de uso
CREATE POLICY "Users view own records" ON tabla FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users view shared records" ON tabla FOR SELECT TO authenticated
  USING (shared_with @> ARRAY[(SELECT auth.uid())]);

CREATE POLICY "Team members view team records" ON tabla FOR SELECT TO authenticated
  USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = (SELECT auth.uid())));
```

### 5️⃣ **Testea ANTES de aplicar en producción**

```sql
-- 1. Crea política en rama de desarrollo
CREATE POLICY "test_policy" ON tabla ...

-- 2. Verifica con EXPLAIN ANALYZE
EXPLAIN ANALYZE SELECT * FROM tabla LIMIT 10;
-- Debe completar en < 100ms

-- 3. Si tarda > 1s → HAY PROBLEMA
```

### 6️⃣ **Usa índices para columnas en RLS**

```sql
-- Si tienes esta política:
CREATE POLICY "Users view own" ON tabla
  USING (user_id = (SELECT auth.uid()));

-- DEBES tener este índice:
CREATE INDEX idx_tabla_user_id ON tabla(user_id);
```

### 7️⃣ **Documenta cada política**

```sql
CREATE POLICY "Users can view own clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ✅ Añadir comentario explicativo
COMMENT ON POLICY "Users can view own clients" ON clients IS
  'Allows authenticated users to view only their own client records.
   Uses (SELECT auth.uid()) for InitPlan optimization to avoid per-row evaluation.';
```

---

## Patrones Correctos

### Patrón 1: Tabla con `user_id` directo

**Aplica a:** profiles, clients, conversations, documents, etc.

```sql
-- ✅ TEMPLATE SEGURO
-- 1. Service role
CREATE POLICY "Service role full access to [tabla]"
  ON [tabla]
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. SELECT - Usuarios ven solo sus datos
CREATE POLICY "Users can view own [tabla]"
  ON [tabla]
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- 3. INSERT - Usuarios solo pueden crear para sí mismos
CREATE POLICY "Users can insert own [tabla]"
  ON [tabla]
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- 4. UPDATE - Usuarios solo pueden editar sus datos
CREATE POLICY "Users can update own [tabla]"
  ON [tabla]
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- 5. DELETE - Usuarios solo pueden borrar sus datos
CREATE POLICY "Users can delete own [tabla]"
  ON [tabla]
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));
```

### Patrón 2: Tabla de relación (N:M)

**Aplica a:** client_tags, conversation_tags, client_group_members

```sql
-- ✅ TEMPLATE SEGURO para tablas de relación
CREATE POLICY "Users can view own [relacion]"
  ON [relacion]
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM [tabla_principal] t
      WHERE t.id = [relacion].[tabla_principal]_id
      AND t.user_id = (SELECT auth.uid())
    )
  );

-- Ejemplo real: client_tags
CREATE POLICY "Users can view own client_tags"
  ON client_tags
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = client_tags.client_id
      AND c.user_id = (SELECT auth.uid())
    )
  );
```

### Patrón 3: Datos públicos/compartidos

**Aplica a:** achievements, dynamic_plans, dynamic_features

```sql
-- ✅ TEMPLATE para datos públicos
CREATE POLICY "Service role full access to [tabla]"
  ON [tabla]
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view active [tabla]"
  ON [tabla]
  FOR SELECT
  TO authenticated
  USING (is_active = true AND is_visible = true);

-- Solo service role puede modificar
-- (no hay políticas de INSERT/UPDATE/DELETE para authenticated)
```

### Patrón 4: Tabla sin `user_id` (relación indirecta)

**Aplica a:** messages (depende de conversations)

```sql
-- ✅ TEMPLATE para tablas con relación indirecta
CREATE POLICY "Users can view own messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND c.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert own messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND c.user_id = (SELECT auth.uid())
    )
  );
```

---

## Errores Comunes

### ❌ Error 1: Subquery circular

```sql
-- MAL
CREATE POLICY "bad_policy" ON magic_tokens
  USING (
    phone = (SELECT phone FROM profiles WHERE id = (SELECT auth.uid()))
    --      ^^^^^ profiles tiene RLS → LOOP
  );

-- BIEN
CREATE POLICY "good_policy" ON magic_tokens
  USING (user_id = (SELECT auth.uid()));
```

### ❌ Error 2: Olvidar service_role

```sql
-- MAL - Workers fallarán
CREATE POLICY "Users can view" ON tabla
  USING (user_id = (SELECT auth.uid()));

-- BIEN - Workers funcionan
CREATE POLICY "Service role full access" ON tabla
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Users can view" ON tabla
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
```

### ❌ Error 3: No usar (SELECT auth.uid())

```sql
-- MAL - Evalúa por cada fila (lento)
USING (user_id = auth.uid())

-- BIEN - Evalúa una vez (rápido)
USING (user_id = (SELECT auth.uid()))
```

### ❌ Error 4: Política muy restrictiva en anon

```sql
-- MAL - Bloquea login/signup
CREATE POLICY "Strict policy" ON profiles
  FOR ALL TO anon
  USING (false);  -- ❌ Nadie puede crear cuenta

-- BIEN - Permitir signup
CREATE POLICY "Allow signup" ON profiles
  FOR INSERT TO anon
  WITH CHECK (true);  -- ✅ Cualquiera puede crear su perfil
```

---

## Template SQL Seguro

### Para tablas con `user_id` directo

```sql
-- ==================================================
-- RLS para: [NOMBRE_TABLA]
-- Creado: [FECHA]
-- Patrón: user_id directo
-- ==================================================

-- PASO 1: Habilitar RLS
ALTER TABLE [tabla] ENABLE ROW LEVEL SECURITY;

-- PASO 2: Service role (SIEMPRE primero)
CREATE POLICY "Service role full access to [tabla]"
  ON [tabla]
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- PASO 3: Políticas para authenticated users
CREATE POLICY "Users can view own [tabla]"
  ON [tabla]
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own [tabla]"
  ON [tabla]
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own [tabla]"
  ON [tabla]
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own [tabla]"
  ON [tabla]
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- PASO 4: Índice para performance
CREATE INDEX IF NOT EXISTS idx_[tabla]_user_id
  ON [tabla](user_id);

-- PASO 5: Documentar
COMMENT ON POLICY "Users can view own [tabla]" ON [tabla] IS
  'Allows users to view only their own records. Uses InitPlan optimization.';
```

---

## Cómo Testear RLS

### 1. Test de Performance

```sql
-- Ejecutar ANTES de habilitar RLS
EXPLAIN ANALYZE SELECT * FROM tabla LIMIT 100;
-- Anota el tiempo

-- Ejecutar DESPUÉS de habilitar RLS
EXPLAIN ANALYZE SELECT * FROM tabla LIMIT 100;
-- Comparar tiempo

-- ✅ Diferencia < 2x → OK
-- ⚠️ Diferencia 2x-10x → Revisar índices
-- ❌ Diferencia > 10x → PROBLEMA, revisar políticas
```

### 2. Test de Aislamiento

```sql
-- Como usuario A
SET request.jwt.claims.sub = 'user-a-uuid';
SELECT COUNT(*) FROM tabla;  -- Debe retornar solo datos de A

-- Como usuario B
SET request.jwt.claims.sub = 'user-b-uuid';
SELECT COUNT(*) FROM tabla;  -- Debe retornar solo datos de B

-- Verificar que no hay overlap
```

### 3. Test de Service Role

```sql
-- Como service role
SET ROLE service_role;
SELECT COUNT(*) FROM tabla;  -- Debe retornar TODOS los datos

-- Como authenticated
SET ROLE authenticated;
SELECT COUNT(*) FROM tabla;  -- Debe retornar solo datos del usuario
```

---

## Checklist Pre-Deploy

Antes de aplicar RLS en producción, verifica:

- [ ] **Leí la guía completa de RLS**
- [ ] **Revisé los patrones correctos para mi tabla**
- [ ] **No hay subqueries a tablas con RLS**
- [ ] **Todas las políticas usan `(SELECT auth.uid())`**
- [ ] **Incluí política para service_role**
- [ ] **Creé índices necesarios (`user_id`, etc.)**
- [ ] **Testé performance con EXPLAIN ANALYZE**
- [ ] **Testé aislamiento de datos entre usuarios**
- [ ] **Documenté cada política con COMMENT**
- [ ] **Tengo un rollback plan** (script para DISABLE RLS)
- [ ] **Apliqué primero en rama de desarrollo**
- [ ] **Verifiqué que workers funcionan**

---

## 🆘 Plan de Rollback

Si algo sale mal después de aplicar RLS:

```sql
-- EMERGENCY ROLLBACK
-- Ejecutar en SQL Editor de Supabase

-- 1. Deshabilitar RLS en tabla problemática
ALTER TABLE [tabla] DISABLE ROW LEVEL SECURITY;

-- 2. Borrar todas las políticas
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = '[tabla]'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON [tabla]', pol.policyname);
  END LOOP;
END $$;

-- 3. Verificar que la app funciona
-- 4. Revisar políticas, corregir, re-aplicar
```

---

## 📚 Recursos Adicionales

- [Supabase RLS Docs](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Docs](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Database Linter](https://supabase.com/docs/guides/database/database-linter)
- [InitPlan Optimization](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select)

---

## 🤝 Contribuir

Si encuentras un error o tienes una mejora para esta guía:
1. Documenta el caso de uso
2. Propón el cambio con ejemplo antes/después
3. Actualiza la fecha de "Última actualización"

---

**Última revisión:** 19 Dic 2024
**Próxima revisión:** Después de implementar RLS en 5+ tablas
