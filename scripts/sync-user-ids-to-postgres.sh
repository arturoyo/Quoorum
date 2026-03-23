#!/bin/bash
# ============================================================================
# Script para sincronizar IDs de Supabase Auth a PostgreSQL Local
# 
# USO:
# 1. Ejecuta get-supabase-user-ids.sql en Supabase para obtener los IDs
# 2. Copia los IDs aquí abajo
# 3. Ejecuta este script: bash scripts/sync-user-ids-to-postgres.sh
# ============================================================================

echo "🔄 Sincronizando IDs de usuarios entre Supabase Auth y PostgreSQL Local..."
echo ""

# ============================================================================
# PASO 1: Obtener IDs de Supabase Auth
# ============================================================================
# Ejecuta este query en Supabase SQL Editor y copia los resultados aquí:
# SELECT email, id FROM auth.users WHERE email IN ('tier1@quoorum.pro', 'tier2@quoorum.pro', 'tier3@quoorum.pro', 'info@imprent.es');

# REEMPLAZA estos UUIDs con los reales de Supabase Auth:
TIER1_AUTH_ID="REEMPLAZAR_CON_ID_DE_SUPABASE"
TIER2_AUTH_ID="REEMPLAZAR_CON_ID_DE_SUPABASE"
TIER3_AUTH_ID="REEMPLAZAR_CON_ID_DE_SUPABASE"
INFO_AUTH_ID="REEMPLAZAR_CON_ID_DE_SUPABASE"

# ============================================================================
# PASO 2: Actualizar PostgreSQL Local
# ============================================================================

if [ "$TIER1_AUTH_ID" = "REEMPLAZAR_CON_ID_DE_SUPABASE" ]; then
  echo "[ERROR] Error: Debes reemplazar los UUIDs con los IDs reales de Supabase Auth"
  echo "   Ejecuta primero: scripts/get-supabase-user-ids.sql en Supabase"
  exit 1
fi

echo "📝 Actualizando usuarios en PostgreSQL local..."

docker exec quoorum-postgres psql -U postgres -d quoorum <<EOF
BEGIN;

-- Actualizar tier1@quoorum.pro
UPDATE users 
SET id = '$TIER1_AUTH_ID' 
WHERE email = 'tier1@quoorum.pro';

UPDATE profiles 
SET user_id = '$TIER1_AUTH_ID' 
WHERE email = 'tier1@quoorum.pro';

-- Actualizar tier2@quoorum.pro
UPDATE users 
SET id = '$TIER2_AUTH_ID' 
WHERE email = 'tier2@quoorum.pro';

UPDATE profiles 
SET user_id = '$TIER2_AUTH_ID' 
WHERE email = 'tier2@quoorum.pro';

-- Actualizar tier3@quoorum.pro
UPDATE users 
SET id = '$TIER3_AUTH_ID' 
WHERE email = 'tier3@quoorum.pro';

UPDATE profiles 
SET user_id = '$TIER3_AUTH_ID' 
WHERE email = 'tier3@quoorum.pro';

COMMIT;

-- Verificar sincronización
SELECT 
  u.email,
  u.id as user_id,
  p.user_id as profile_user_id,
  CASE WHEN u.id = p.user_id THEN '[OK] Sincronizado' ELSE '[ERROR] Desincronizado' END as status
FROM users u
LEFT JOIN profiles p ON p.email = u.email
WHERE u.email LIKE 'tier%@quoorum.pro'
ORDER BY u.email;
EOF

echo ""
echo "[OK] Sincronización completada"
