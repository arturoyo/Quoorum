-- ============================================================================
-- Script para COMPARAR IDs entre Supabase Auth y PostgreSQL Local
-- 
-- PASO 1: Ejecutar en SUPABASE SQL Editor
-- ============================================================================
-- Copia y ejecuta esto en Supabase Dashboard → SQL Editor

SELECT 
  email,
  id as supabase_auth_id,
  created_at
FROM auth.users
WHERE email IN (
  'tier1@quoorum.pro',
  'tier2@quoorum.pro',
  'tier3@quoorum.pro',
  'info@imprent.es'
)
ORDER BY email;

-- ============================================================================
-- PASO 2: Comparar con PostgreSQL Local
-- ============================================================================
-- Los IDs actuales en PostgreSQL local son:
-- tier1@quoorum.pro: 3e9be6f1-0a61-4dec-9d3b-44746aaf03f6
-- tier2@quoorum.pro: 0cc9988b-a5a9-45bb-94d0-30079c465193
-- tier3@quoorum.pro: dd47ead1-2f0f-4f8d-8023-001f8d805f93
-- info@imprent.es: a0c0998c-17bb-4ef7-874e-08a6d685e81b
-- 
-- Si los IDs de Supabase Auth son DIFERENTES, necesitamos actualizar PostgreSQL local
-- Si son IGUALES, ya están sincronizados y puedes hacer login directamente
