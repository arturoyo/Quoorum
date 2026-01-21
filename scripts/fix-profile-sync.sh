#!/bin/bash
# Script para verificar y sincronizar perfiles

echo "🔍 Verificando perfiles en PostgreSQL local..."

# Verificar cuántos perfiles hay
PROFILE_COUNT=$(docker exec quoorum-postgres psql -U postgres -d quoorum -t -c "SELECT COUNT(*) FROM profiles;")

echo "📊 Perfiles encontrados: $PROFILE_COUNT"

if [ "$PROFILE_COUNT" -eq 0 ]; then
  echo "⚠️ No hay perfiles en PostgreSQL local"
  echo ""
  echo "Para sincronizar perfiles desde Supabase, ejecuta:"
  echo "  cd scripts"
  echo "  pnpm tsx sync-profiles-from-supabase.ts"
  echo ""
  echo "O copia los IDs de los logs del servidor:"
  echo "  [tRPC Context] Authenticated user: AUTH_USER_ID"
  echo "  [tRPC Context] Profile found: PROFILE_ID"
  echo ""
  echo "Y ejecuta este comando SQL:"
  echo "  docker exec quoorum-postgres psql -U postgres -d quoorum"
  echo ""
  echo "  INSERT INTO profiles (id, user_id, email, name, role, is_active)"
  echo "  VALUES ('PROFILE_ID', 'AUTH_USER_ID', 'tu-email@example.com', 'Tu Nombre', 'user', true)"
  echo "  ON CONFLICT (id) DO NOTHING;"
else
  echo "✅ Listando perfiles existentes:"
  docker exec quoorum-postgres psql -U postgres -d quoorum -c "SELECT id, user_id, email, name FROM profiles;"
fi
