-- ============================================================================
-- Script SQL DIRECTO - Copiar y pegar directamente en PostgreSQL
-- 
-- PASO 1: Obtén los IDs ejecutando en Supabase SQL Editor:
-- SELECT email, id FROM auth.users WHERE email IN ('tier1@quoorum.pro', 'tier2@quoorum.pro', 'tier3@quoorum.pro');
-- 
-- PASO 2: Reemplaza los UUIDs abajo y ejecuta este SQL completo
-- ============================================================================

BEGIN;

-- REEMPLAZA estos UUIDs con los IDs reales de Supabase Auth:
UPDATE users SET id = 'REEMPLAZAR_CON_ID_TIER1'::uuid WHERE email = 'tier1@quoorum.pro';
UPDATE profiles SET user_id = 'REEMPLAZAR_CON_ID_TIER1'::uuid WHERE email = 'tier1@quoorum.pro';

UPDATE users SET id = 'REEMPLAZAR_CON_ID_TIER2'::uuid WHERE email = 'tier2@quoorum.pro';
UPDATE profiles SET user_id = 'REEMPLAZAR_CON_ID_TIER2'::uuid WHERE email = 'tier2@quoorum.pro';

UPDATE users SET id = 'REEMPLAZAR_CON_ID_TIER3'::uuid WHERE email = 'tier3@quoorum.pro';
UPDATE profiles SET user_id = 'REEMPLAZAR_CON_ID_TIER3'::uuid WHERE email = 'tier3@quoorum.pro';

COMMIT;

SELECT u.email, u.id = p.user_id as sincronizado FROM users u LEFT JOIN profiles p ON p.email = u.email WHERE u.email LIKE 'tier%@quoorum.pro';
