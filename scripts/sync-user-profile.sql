-- Script para sincronizar perfil de usuario en PostgreSQL local
-- Ejecutar cuando veas el error "violates foreign key constraint"

-- PASO 1: Identificar tu userId de los logs del servidor
-- Busca en los logs: "[tRPC Context] Profile found: XXXX"
-- Reemplaza USER_PROFILE_ID abajo con ese ID

-- PASO 2: Crear el perfil en PostgreSQL local
INSERT INTO profiles (
  id,
  user_id,
  email,
  name,
  role,
  is_active,
  created_at,
  updated_at
) VALUES (
  'USER_PROFILE_ID',  -- ID del perfil (de los logs)
  'AUTH_USER_ID',     -- ID de Supabase Auth (de los logs)
  'tu-email@example.com',
  'Tu Nombre',
  'user',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Verificar que se creó
SELECT id, email, name FROM profiles;
