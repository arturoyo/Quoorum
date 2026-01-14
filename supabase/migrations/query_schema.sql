-- Query para obtener la estructura real de las tablas en Supabase
-- Ejecuta esto primero para ver qué columnas tienen las tablas

SELECT
    t.table_name,
    string_agg(c.column_name, ', ' ORDER BY c.ordinal_position) as columns
FROM information_schema.tables t
JOIN information_schema.columns c ON c.table_name = t.table_name AND c.table_schema = t.table_schema
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT LIKE 'pg_%'
    AND t.table_name NOT LIKE 'sql_%'
GROUP BY t.table_name
ORDER BY t.table_name;
