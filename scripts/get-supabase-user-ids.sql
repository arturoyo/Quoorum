-- ============================================================================
-- PASO 1: Ejecutar en SUPABASE SQL Editor
-- ============================================================================
-- Copia y ejecuta este query en Supabase Dashboard → SQL Editor
-- Esto te dará los IDs de auth.users que necesitas para sincronizar

SELECT 
  email,
  id as auth_user_id,
  created_at
FROM auth.users
WHERE email IN (
  'tier1@quoorum.pro',
  'tier2@quoorum.pro',
  'tier3@quoorum.pro',
  'info@imprent.es'
)
ORDER BY email;
