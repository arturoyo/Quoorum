-- Script para verificar y arreglar la tabla companies
-- Ejecutar: docker exec -i quoorum-postgres psql -U postgres -d quoorum < C:\Quoorum\scripts\verify-and-fix-companies.sql

-- 1. Ver estructura actual
\d companies

-- 2. Si falta description, añadirla
ALTER TABLE companies ADD COLUMN IF NOT EXISTS description text;

-- 3. Verificar que todas las columnas existen
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'companies'
ORDER BY ordinal_position;

-- 4. Verificar que el perfil existe
SELECT id, email, name FROM profiles WHERE id = 'f198d53b-9524-45b9-87cf-a810a857a616';
