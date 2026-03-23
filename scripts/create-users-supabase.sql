-- ============================================================================
-- Script SQL para crear usuarios de prueba en Supabase Auth
-- 
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- 
-- IMPORTANTE: Este script crea usuarios con contraseñas hasheadas usando bcrypt
-- ============================================================================

-- Habilitar extensión pgcrypto si no está habilitada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- Usuario Tier 1 (Starter)
-- ============================================================================
DO $$
DECLARE
  tier1_user_id UUID := gen_random_uuid();
BEGIN
  -- Verificar si el usuario ya existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'tier1@quoorum.pro') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      aud,
      role,
      raw_app_meta_data,
      raw_user_meta_data
    ) VALUES (
      tier1_user_id,
      '00000000-0000-0000-0000-000000000000',
      'tier1@quoorum.pro',
      crypt('Tier1Test2026!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      'authenticated',
      'authenticated',
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Tier 1 User"}'
    );
    
    RAISE NOTICE '[OK] Usuario tier1@quoorum.pro creado con ID: %', tier1_user_id;
  ELSE
    RAISE NOTICE '[WARN]  Usuario tier1@quoorum.pro ya existe';
  END IF;
END $$;

-- ============================================================================
-- Usuario Tier 2 (Pro)
-- ============================================================================
DO $$
DECLARE
  tier2_user_id UUID := gen_random_uuid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'tier2@quoorum.pro') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      aud,
      role,
      raw_app_meta_data,
      raw_user_meta_data
    ) VALUES (
      tier2_user_id,
      '00000000-0000-0000-0000-000000000000',
      'tier2@quoorum.pro',
      crypt('Tier2Test2026!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      'authenticated',
      'authenticated',
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Tier 2 User"}'
    );
    
    RAISE NOTICE '[OK] Usuario tier2@quoorum.pro creado con ID: %', tier2_user_id;
  ELSE
    RAISE NOTICE '[WARN]  Usuario tier2@quoorum.pro ya existe';
  END IF;
END $$;

-- ============================================================================
-- Usuario Tier 3 (Business)
-- ============================================================================
DO $$
DECLARE
  tier3_user_id UUID := gen_random_uuid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'tier3@quoorum.pro') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      aud,
      role,
      raw_app_meta_data,
      raw_user_meta_data
    ) VALUES (
      tier3_user_id,
      '00000000-0000-0000-0000-000000000000',
      'tier3@quoorum.pro',
      crypt('Tier3Test2026!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      'authenticated',
      'authenticated',
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Tier 3 User"}'
    );
    
    RAISE NOTICE '[OK] Usuario tier3@quoorum.pro creado con ID: %', tier3_user_id;
  ELSE
    RAISE NOTICE '[WARN]  Usuario tier3@quoorum.pro ya existe';
  END IF;
END $$;

-- ============================================================================
-- Usuario Admin (info@imprent.es) - Solo si no existe
-- ============================================================================
DO $$
DECLARE
  admin_user_id UUID := gen_random_uuid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'info@imprent.es') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      aud,
      role,
      raw_app_meta_data,
      raw_user_meta_data
    ) VALUES (
      admin_user_id,
      '00000000-0000-0000-0000-000000000000',
      'info@imprent.es',
      crypt('InfoImprent2026!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      'authenticated',
      'authenticated',
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Arturo Royo"}'
    );
    
    RAISE NOTICE '[OK] Usuario info@imprent.es creado con ID: %', admin_user_id;
  ELSE
    RAISE NOTICE '[WARN]  Usuario info@imprent.es ya existe (no se modificará)';
  END IF;
END $$;

-- ============================================================================
-- Verificar usuarios creados
-- ============================================================================
SELECT 
  email,
  email_confirmed_at IS NOT NULL as email_confirmed,
  created_at,
  raw_user_meta_data->>'full_name' as name
FROM auth.users
WHERE email IN (
  'tier1@quoorum.pro',
  'tier2@quoorum.pro',
  'tier3@quoorum.pro',
  'info@imprent.es'
)
ORDER BY email;
