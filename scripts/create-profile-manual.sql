-- Script manual para crear perfil en PostgreSQL local
-- Reemplaza USER_PROFILE_ID y AUTH_USER_ID con los valores de los logs

-- PASO 1: Obtener los IDs de los logs del servidor
-- Busca en los logs: "[tRPC Context] Profile found: XXXX" → USER_PROFILE_ID
-- Busca en los logs: "[tRPC Context] Authenticated user: XXXX" → AUTH_USER_ID

-- PASO 2: Crear el perfil
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
  'USER_PROFILE_ID',  -- Reemplazar con el ID del perfil
  'AUTH_USER_ID',     -- Reemplazar con el ID de autenticación
  'tu-email@example.com',
  'Tu Nombre',
  'user',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- PASO 3: Verificar que se creó
SELECT id, user_id, email, name FROM profiles WHERE id = 'USER_PROFILE_ID';
