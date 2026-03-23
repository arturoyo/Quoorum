-- ============================================================================
-- Script SQL para actualizar IDs de usuarios en PostgreSQL Local
-- 
-- EJECUTAR EN: PostgreSQL Local (Docker)
-- 
-- COMANDO:
-- docker exec quoorum-postgres psql -U postgres -d quoorum -f scripts/update-postgres-user-ids.sql
-- 
-- O copiar y pegar el contenido en:
-- docker exec -i quoorum-postgres psql -U postgres -d quoorum
-- ============================================================================

-- ============================================================================
-- IMPORTANTE: PRIMERO debes obtener los IDs de Supabase Auth
-- ============================================================================
-- Ejecuta este query en Supabase SQL Editor:
-- 
-- SELECT email, id as auth_user_id FROM auth.users 
-- WHERE email IN ('tier1@quoorum.pro', 'tier2@quoorum.pro', 'tier3@quoorum.pro')
-- ORDER BY email;
-- 
-- Luego REEMPLAZA los UUIDs abajo con los IDs reales que obtengas
-- ============================================================================

-- REEMPLAZA estos UUIDs con los IDs reales de Supabase Auth:
-- (Ejemplo: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')

\set tier1_auth_id 'REEMPLAZAR_CON_ID_DE_SUPABASE_TIER1'
\set tier2_auth_id 'REEMPLAZAR_CON_ID_DE_SUPABASE_TIER2'
\set tier3_auth_id 'REEMPLAZAR_CON_ID_DE_SUPABASE_TIER3'

-- Verificar que los IDs no sean placeholders
DO $$
BEGIN
  IF :'tier1_auth_id' = 'REEMPLAZAR_CON_ID_DE_SUPABASE_TIER1' THEN
    RAISE EXCEPTION 'Debes reemplazar los UUIDs con los IDs reales de Supabase Auth. Ejecuta primero get-supabase-user-ids.sql en Supabase.';
  END IF;
END $$;

BEGIN;

-- Actualizar tier1@quoorum.pro
UPDATE users 
SET id = :'tier1_auth_id'::uuid
WHERE email = 'tier1@quoorum.pro';

UPDATE profiles 
SET user_id = :'tier1_auth_id'::uuid
WHERE email = 'tier1@quoorum.pro';

-- Actualizar tier2@quoorum.pro
UPDATE users 
SET id = :'tier2_auth_id'::uuid
WHERE email = 'tier2@quoorum.pro';

UPDATE profiles 
SET user_id = :'tier2_auth_id'::uuid
WHERE email = 'tier2@quoorum.pro';

-- Actualizar tier3@quoorum.pro
UPDATE users 
SET id = :'tier3_auth_id'::uuid
WHERE email = 'tier3@quoorum.pro';

UPDATE profiles 
SET user_id = :'tier3_auth_id'::uuid
WHERE email = 'tier3@quoorum.pro';

COMMIT;

-- Verificar sincronización
SELECT 
  u.email,
  u.id as user_id,
  p.user_id as profile_user_id,
  CASE 
    WHEN u.id = p.user_id THEN '[OK] Sincronizado' 
    ELSE '[ERROR] Desincronizado' 
  END as status
FROM users u
LEFT JOIN profiles p ON p.email = u.email
WHERE u.email LIKE 'tier%@quoorum.pro'
ORDER BY u.email;
