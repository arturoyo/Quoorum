-- ============================================================================
-- Script SQL SIMPLE para sincronizar IDs entre Supabase Auth y PostgreSQL Local
-- 
-- INSTRUCCIONES:
-- 1. PRIMERO ejecuta en Supabase SQL Editor para obtener los IDs:
--    SELECT email, id FROM auth.users WHERE email IN ('tier1@quoorum.pro', 'tier2@quoorum.pro', 'tier3@quoorum.pro');
-- 
-- 2. REEMPLAZA los UUIDs abajo con los IDs reales que obtengas
-- 
-- 3. Ejecuta este script en PostgreSQL local con:
--    docker exec quoorum-postgres psql -U postgres -d quoorum -c "AQUI_EL_SQL"
-- ============================================================================

BEGIN;

-- [WARN] REEMPLAZA estos UUIDs con los IDs reales de Supabase Auth:
-- Ejemplo: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

-- tier1@quoorum.pro → ID de Supabase Auth
UPDATE users SET id = 'REEMPLAZAR_CON_ID_TIER1'::uuid WHERE email = 'tier1@quoorum.pro';
UPDATE profiles SET user_id = 'REEMPLAZAR_CON_ID_TIER1'::uuid WHERE email = 'tier1@quoorum.pro';

-- tier2@quoorum.pro → ID de Supabase Auth
UPDATE users SET id = 'REEMPLAZAR_CON_ID_TIER2'::uuid WHERE email = 'tier2@quoorum.pro';
UPDATE profiles SET user_id = 'REEMPLAZAR_CON_ID_TIER2'::uuid WHERE email = 'tier2@quoorum.pro';

-- tier3@quoorum.pro → ID de Supabase Auth
UPDATE users SET id = 'REEMPLAZAR_CON_ID_TIER3'::uuid WHERE email = 'tier3@quoorum.pro';
UPDATE profiles SET user_id = 'REEMPLAZAR_CON_ID_TIER3'::uuid WHERE email = 'tier3@quoorum.pro';

COMMIT;

-- Verificar sincronización
SELECT 
  u.email,
  u.id = p.user_id as sincronizado,
  u.id as user_id,
  p.user_id as profile_user_id
FROM users u
LEFT JOIN profiles p ON p.email = u.email
WHERE u.email LIKE 'tier%@quoorum.pro'
ORDER BY u.email;
