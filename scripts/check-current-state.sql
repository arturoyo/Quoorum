-- ============================================================================
-- Script para VERIFICAR el estado actual de usuarios en ambas bases de datos
-- 
-- EJECUTAR EN DOS LUGARES:
-- 1. En Supabase SQL Editor (para ver auth.users)
-- 2. En PostgreSQL Local (para ver users y profiles)
-- ============================================================================

-- ============================================================================
-- PARTE 1: Ejecutar en SUPABASE SQL Editor
-- ============================================================================
-- Copia y ejecuta esto en Supabase Dashboard → SQL Editor

SELECT 
  email,
  id as auth_user_id,
  email_confirmed_at IS NOT NULL as email_confirmed,
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
-- PARTE 2: Ejecutar en PostgreSQL Local (Docker)
-- ============================================================================
-- Ejecuta esto en PostgreSQL local para ver qué hay actualmente

-- Ver usuarios en tabla users
SELECT 
  email,
  id as user_id,
  tier,
  credits,
  is_active,
  created_at
FROM users
WHERE email IN (
  'tier1@quoorum.pro',
  'tier2@quoorum.pro',
  'tier3@quoorum.pro',
  'info@imprent.es'
)
ORDER BY email;

-- Ver perfiles en tabla profiles
SELECT 
  email,
  id as profile_id,
  user_id as profile_user_id,
  role,
  is_active,
  created_at
FROM profiles
WHERE email IN (
  'tier1@quoorum.pro',
  'tier2@quoorum.pro',
  'tier3@quoorum.pro',
  'info@imprent.es'
)
ORDER BY email;

-- Verificar si los IDs coinciden entre users y profiles
SELECT 
  u.email,
  u.id as user_id,
  p.user_id as profile_user_id,
  CASE 
    WHEN u.id = p.user_id THEN '[OK] Coinciden' 
    ELSE '[ERROR] NO coinciden' 
  END as status
FROM users u
LEFT JOIN profiles p ON p.email = u.email
WHERE u.email IN (
  'tier1@quoorum.pro',
  'tier2@quoorum.pro',
  'tier3@quoorum.pro',
  'info@imprent.es'
)
ORDER BY u.email;
