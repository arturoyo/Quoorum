-- Script SQL para crear perfil manualmente
-- INSTRUCCIONES:
--
-- 1. Busca en los logs del servidor (donde corre pnpm dev) estas líneas:
--    [tRPC Context] Authenticated user: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
--    [tRPC Context] Profile found: YYYYYYYY-YYYY-YYYY-YYYY-YYYYYYYYYYYY
--
-- 2. Reemplaza los valores abajo con esos IDs
-- 3. Ejecuta este script:
--    docker exec quoorum-postgres psql -U postgres -d quoorum -f /path/to/this/file.sql
--
-- O copia el INSERT y ejecútalo manualmente:
--    docker exec quoorum-postgres psql -U postgres -d quoorum
--    (luego pega el INSERT)

-- IMPORTANTE: Reemplaza estos valores con los de tus logs:
-- PROFILE_ID = el ID de "[tRPC Context] Profile found: XXXX"
-- AUTH_USER_ID = el ID de "[tRPC Context] Authenticated user: XXXX"

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
  'PROFILE_ID',     -- ← Reemplazar con Profile found ID
  'AUTH_USER_ID',   -- ← Reemplazar con Authenticated user ID
  'tu-email@example.com',  -- ← Tu email real
  'Tu Nombre',      -- ← Tu nombre
  'user',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Verificar que se creó:
SELECT id, user_id, email, name FROM profiles WHERE id = 'PROFILE_ID';
