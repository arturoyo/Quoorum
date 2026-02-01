# 🔧 Solución para Error 500 "Database error querying schema" en Supabase Auth

## Error Detectado
```json
{
  "code": 500,
  "error_code": "unexpected_failure",
  "msg": "Database error querying schema",
  "error_id": "9c4223834408030f-MAD"
}
```

## 🔍 Causas Posibles

1. **Problema con RLS (Row Level Security)** en tablas de Supabase
2. **Foreign keys rotas** entre `auth.users` y tablas públicas
3. **Schema corrupto** en Supabase
4. **Triggers o funciones** que fallan al crear sesión

## [OK] Soluciones

### Solución 1: Verificar Logs de Supabase

1. Ve a: [Supabase Dashboard](https://supabase.com/dashboard) → Tu proyecto
2. **Logs → Database Logs**
3. Busca errores relacionados con `auth.users` o `auth.sessions`
4. Revisa el mensaje de error específico

### Solución 2: Verificar RLS en Tablas Públicas

Ejecuta en Supabase SQL Editor:

```sql
-- Verificar si hay políticas RLS que puedan estar bloqueando
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'users')
ORDER BY tablename, policyname;
```

### Solución 3: Verificar Foreign Keys

```sql
-- Verificar constraints de foreign keys
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND (ccu.table_name = 'auth.users' OR tc.table_name IN ('profiles', 'users'));
```

### Solución 4: Verificar Triggers en auth.users

```sql
-- Verificar triggers que puedan estar fallando
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';
```

### Solución 5: Recrear Usuario (si todo lo demás falla)

Si el problema persiste, elimina y recrea el usuario en Supabase:

```sql
-- [WARN] CUIDADO: Esto eliminará el usuario de Supabase Auth
-- Solo hazlo si es necesario

-- 1. Eliminar usuario
DELETE FROM auth.users WHERE email = 'tier1@quoorum.pro';

-- 2. Recrear con el script create-users-supabase.sql
```

## [INFO] Solución Rápida: Usar Cookies para Test

Mientras se resuelve el problema de Supabase, puedes usar el sistema de cookies para hacer login:

1. Abre DevTools (F12)
2. Ve a **Application → Cookies**
3. Añade una cookie:
   - **Name:** `test-auth-bypass`
   - **Value:** `tier1@quoorum.pro` (o el email que quieras probar)
   - **Domain:** `localhost`
   - **Path:** `/`
4. Recarga la página
5. Deberías poder acceder al dashboard

Esto funciona porque el sistema tiene un modo test que permite acceso con cookies.
