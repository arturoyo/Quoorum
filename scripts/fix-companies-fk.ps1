# Script para arreglar el foreign key de companies y crear el perfil
# PowerShell script para Windows

Write-Host "🔧 Arreglando foreign key constraint de companies..." -ForegroundColor Cyan

# SQL que vamos a ejecutar
$sql = @"
-- 1. Drop existing companies table
DROP TABLE IF EXISTS companies CASCADE;

-- 2. Create companies table with correct FK to profiles
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name varchar(200) NOT NULL,
  context text NOT NULL,
  industry varchar(100),
  size varchar(50),
  description text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 3. Create index
CREATE INDEX IF NOT EXISTS companies_user_id_idx ON companies(user_id);

-- 4. Create profile
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
  'f198d53b-9524-45b9-87cf-a810a857a616',
  'b88193ab-1c38-49a0-a86b-cf12a96f66a9',
  'usuario@quoorum.com',
  'Usuario Quoorum',
  'user',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;
"@

# Guardar SQL en archivo temporal
$sqlFile = "C:\Quoorum\scripts\temp-fix.sql"
$sql | Out-File -FilePath $sqlFile -Encoding UTF8

Write-Host "📝 SQL guardado en $sqlFile" -ForegroundColor Yellow

# Ejecutar SQL
Write-Host "⚡ Ejecutando SQL en PostgreSQL..." -ForegroundColor Yellow
docker exec -i quoorum-postgres psql -U postgres -d quoorum -f /host_mnt/c/Quoorum/scripts/temp-fix.sql

Write-Host ""
Write-Host "[OK] Verificando resultados..." -ForegroundColor Green
docker exec quoorum-postgres psql -U postgres -d quoorum -c "SELECT id, email, name FROM profiles WHERE id = 'f198d53b-9524-45b9-87cf-a810a857a616';"

Write-Host ""
Write-Host "🎉 ¡Listo! Ahora intenta guardar la empresa de nuevo." -ForegroundColor Green
