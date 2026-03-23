-- ============================================================================
-- Script SQL para sincronizar IDs entre Supabase Auth y PostgreSQL Local
-- 
-- IMPORTANTE: Este script debe ejecutarse en DOS lugares:
-- 
-- 1. PRIMERO en Supabase SQL Editor para obtener los IDs de auth.users
-- 2. LUEGO en PostgreSQL local para actualizar los IDs
-- ============================================================================

-- ============================================================================
-- PASO 1: Ejecutar en SUPABASE SQL Editor
-- ============================================================================
-- Copia este query y ejecútalo en Supabase Dashboard → SQL Editor
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

-- ============================================================================
-- PASO 2: Ejecutar en PostgreSQL Local (Docker)
-- ============================================================================
-- Después de obtener los IDs de Supabase, actualiza los registros en PostgreSQL local
-- Reemplaza los UUIDs con los que obtuviste del query anterior

-- Ejemplo (REEMPLAZA los UUIDs con los reales de Supabase):
/*
BEGIN;

-- Actualizar tier1@quoorum.pro
UPDATE users 
SET id = 'UUID_DE_SUPABASE_AUTH_TIER1' 
WHERE email = 'tier1@quoorum.pro';

UPDATE profiles 
SET user_id = 'UUID_DE_SUPABASE_AUTH_TIER1' 
WHERE email = 'tier1@quoorum.pro';

-- Actualizar tier2@quoorum.pro
UPDATE users 
SET id = 'UUID_DE_SUPABASE_AUTH_TIER2' 
WHERE email = 'tier2@quoorum.pro';

UPDATE profiles 
SET user_id = 'UUID_DE_SUPABASE_AUTH_TIER2' 
WHERE email = 'tier2@quoorum.pro';

-- Actualizar tier3@quoorum.pro
UPDATE users 
SET id = 'UUID_DE_SUPABASE_AUTH_TIER3' 
WHERE email = 'tier3@quoorum.pro';

UPDATE profiles 
SET user_id = 'UUID_DE_SUPABASE_AUTH_TIER3' 
WHERE email = 'tier3@quoorum.pro';

COMMIT;
*/
