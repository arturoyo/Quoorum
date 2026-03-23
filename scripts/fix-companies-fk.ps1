# Script para arreglar el foreign key de companies y crear el perfil
# PowerShell script para Windows

Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] Arreglando foreign key constraint de companies..." -ForegroundColor Cyan

# SQL que vamos a ejecutar
$sql = @"
-- [EMOJI]. Drop existing companies table
DROP TABLE IF EXISTS companies CASCADE;

-- [EMOJI]. Create companies table with correct FK to profiles
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name varchar([EMOJI]00) NOT NULL,
  context text NOT NULL,
  industry varchar([EMOJI]00),
  size varchar([EMOJI]0),
  description text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- [EMOJI]. Create index
CREATE INDEX IF NOT EXISTS companies_user_id_idx ON companies(user_id);

-- [EMOJI]. Create profile
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
  'f[EMOJI]98d[EMOJI][EMOJI]b-9[EMOJI][EMOJI][EMOJI]-[EMOJI][EMOJI]b9-87cf-a8[EMOJI]0a8[EMOJI]7a6[EMOJI]6',
  'b88[EMOJI]9[EMOJI]ab-[EMOJI]c[EMOJI]8-[EMOJI]9a0-a86b-cf[EMOJI][EMOJI]a96f66a9',
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

Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] SQL guardado en $sqlFile" -ForegroundColor Yellow

# Ejecutar SQL
Write-Host "[FAST] Ejecutando SQL en PostgreSQL..." -ForegroundColor Yellow
docker exec -i quoorum-postgres psql -U postgres -d quoorum -f /host_mnt/c/Quoorum/scripts/temp-fix.sql

Write-Host ""
Write-Host "[OK] Verificando resultados..." -ForegroundColor Green
docker exec quoorum-postgres psql -U postgres -d quoorum -c "SELECT id, email, name FROM profiles WHERE id = 'f[EMOJI]98d[EMOJI][EMOJI]b-9[EMOJI][EMOJI][EMOJI]-[EMOJI][EMOJI]b9-87cf-a8[EMOJI]0a8[EMOJI]7a6[EMOJI]6';"

Write-Host ""
Write-Host "[EMOJI][EMOJI][EMOJI]‰ Â[EMOJI]Listo! Ahora intenta guardar la empresa de nuevo." -ForegroundColor Green
