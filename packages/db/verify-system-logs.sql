-- ═══════════════════════════════════════════════════════════
-- Verificación del Sistema de Logging
-- ═══════════════════════════════════════════════════════════

-- 1. Verificar que RLS está habilitado
SELECT
  tablename,
  CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'system_logs';

-- 2. Verificar políticas creadas
SELECT
  policyname,
  cmd,
  CASE
    WHEN qual = 'true' THEN '✅ Public (anyone can insert)'
    WHEN qual LIKE '%admin%' THEN '✅ Admin only'
    ELSE '✅ Custom rule'
  END as access_level,
  qual as policy_rule
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'system_logs'
ORDER BY cmd, policyname;

-- 3. Contar logs existentes
SELECT
  COUNT(*) as total_logs,
  COUNT(DISTINCT level) as unique_levels,
  COUNT(DISTINCT source) as unique_sources
FROM system_logs;

-- 4. Logs por nivel
SELECT
  level,
  COUNT(*) as count
FROM system_logs
GROUP BY level
ORDER BY count DESC;

-- 5. Logs recientes (últimos 10)
SELECT
  created_at,
  level,
  source,
  message,
  user_id
FROM system_logs
ORDER BY created_at DESC
LIMIT 10;

-- 6. Verificar índices
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'system_logs'
ORDER BY indexname;
