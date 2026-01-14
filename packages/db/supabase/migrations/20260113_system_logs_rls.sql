-- ═══════════════════════════════════════════════════════════
-- RLS Policies para system_logs
-- ═══════════════════════════════════════════════════════════

-- Habilitar RLS
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════
-- POLICY 1: INSERT - Cualquiera puede insertar logs
-- ═══════════════════════════════════════════════════════════
-- Permite que tanto usuarios autenticados como no autenticados
-- puedan insertar logs (importante para errores de frontend sin auth)
CREATE POLICY "system_logs_insert_anyone"
  ON system_logs
  FOR INSERT
  WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- POLICY 2: SELECT - Solo admins pueden ver logs
-- ═══════════════════════════════════════════════════════════
CREATE POLICY "system_logs_select_admins"
  ON system_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM admin_users
      WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'admin')
    )
  );

-- ═══════════════════════════════════════════════════════════
-- POLICY 3: DELETE - Solo super_admins pueden eliminar logs
-- ═══════════════════════════════════════════════════════════
CREATE POLICY "system_logs_delete_super_admins"
  ON system_logs
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM admin_users
      WHERE user_id = auth.uid()
        AND role = 'super_admin'
    )
  );

-- ═══════════════════════════════════════════════════════════
-- VERIFICACIÓN
-- ═══════════════════════════════════════════════════════════

-- Verificar que RLS está habilitado
SELECT
  tablename,
  CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables
WHERE tablename = 'system_logs';

-- Verificar políticas creadas
SELECT
  policyname,
  cmd,
  CASE
    WHEN qual = 'true' THEN '✅ Public'
    WHEN qual LIKE '%admin%' THEN '✅ Admin only'
    ELSE '✅ Custom'
  END as access_level
FROM pg_policies
WHERE tablename = 'system_logs'
ORDER BY policyname;
