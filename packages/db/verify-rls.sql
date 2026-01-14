-- Verification Script: Check RLS Status
-- Run this in Supabase SQL Editor after applying the migration

-- ============================================
-- 1. Check RLS Status for All Tables
-- ============================================
SELECT
  schemaname,
  tablename,
  CASE
    WHEN rowsecurity THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END AS rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY
  CASE WHEN rowsecurity THEN 0 ELSE 1 END,
  tablename;

-- Expected: All tables should show "✅ ENABLED"

-- ============================================
-- 2. Count Policies by Table
-- ============================================
SELECT
  tablename,
  COUNT(*) AS policy_count,
  string_agg(policyname, ', ' ORDER BY policyname) AS policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC, tablename;

-- Expected: ~80-100 policies total across all tables

-- ============================================
-- 3. Check for Tables Without Policies (CRITICAL)
-- ============================================
SELECT
  t.tablename,
  '⚠️ NO POLICIES' AS status
FROM pg_tables t
LEFT JOIN pg_policies p ON p.tablename = t.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
  AND t.tablename NOT LIKE 'pg_%'
  AND t.tablename NOT LIKE 'sql_%'
  AND p.policyname IS NULL
  AND t.tablename NOT IN ('schema_migrations', 'drizzle_migrations')
ORDER BY t.tablename;

-- Expected: Empty result (all tables should have policies)

-- ============================================
-- 4. Verify Sensitive Columns are Protected
-- ============================================
SELECT
  'quoorum_context_sources' AS table_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'quoorum_context_sources'
        AND schemaname = 'public'
        AND cmd = 'SELECT'
    ) THEN '✅ Protected'
    ELSE '❌ Not Protected'
  END AS session_id_protection
UNION ALL
SELECT
  'quoorum_messages' AS table_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'quoorum_messages'
        AND schemaname = 'public'
        AND cmd = 'SELECT'
    ) THEN '✅ Protected'
    ELSE '❌ Not Protected'
  END AS session_id_protection;

-- Expected: Both should show "✅ Protected"

-- ============================================
-- 5. Test Policy Effectiveness (requires auth session)
-- ============================================
-- This will show if policies are properly filtering data
-- Run as an authenticated user

SELECT
  'Current User' AS test,
  auth.uid() AS user_id,
  CASE
    WHEN auth.uid() IS NULL THEN '❌ Not Authenticated'
    ELSE '✅ Authenticated'
  END AS auth_status;

-- Expected: Should show your user UUID and "✅ Authenticated"

-- ============================================
-- 6. Policy Details by Table Type
-- ============================================
-- User-owned tables
SELECT
  'USER-OWNED TABLES' AS category,
  tablename,
  policyname,
  cmd,
  CASE
    WHEN qual LIKE '%auth.uid()%' THEN '✅ User-scoped'
    ELSE '⚠️ Check policy'
  END AS scope_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('clients', 'conversations', 'deals', 'quoorum_debates')
ORDER BY tablename, cmd;

-- Admin tables
SELECT
  'ADMIN TABLES' AS category,
  tablename,
  policyname,
  cmd,
  CASE
    WHEN qual LIKE '%admin%' THEN '✅ Admin-scoped'
    ELSE '⚠️ Check policy'
  END AS scope_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('admin_users', 'admin_roles')
ORDER BY tablename, cmd;

-- Public read tables
SELECT
  'PUBLIC READ TABLES' AS category,
  tablename,
  policyname,
  cmd,
  CASE
    WHEN qual = 'true' AND cmd = 'SELECT' THEN '✅ Public read'
    ELSE '⚠️ Check policy'
  END AS scope_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('plans', 'quoorum_debate_templates', 'quoorum_translations')
ORDER BY tablename, cmd;

-- ============================================
-- 7. Security Summary Report
-- ============================================
WITH rls_stats AS (
  SELECT
    COUNT(*) FILTER (WHERE rowsecurity = true) AS tables_with_rls,
    COUNT(*) FILTER (WHERE rowsecurity = false) AS tables_without_rls,
    COUNT(*) AS total_tables
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'sql_%'
    AND tablename NOT IN ('schema_migrations', 'drizzle_migrations')
),
policy_stats AS (
  SELECT
    COUNT(DISTINCT tablename) AS tables_with_policies,
    COUNT(*) AS total_policies
  FROM pg_policies
  WHERE schemaname = 'public'
)
SELECT
  '═══════════════════════════════════════' AS separator,
  '      RLS SECURITY SUMMARY REPORT' AS title,
  '═══════════════════════════════════════' AS separator2
UNION ALL
SELECT '', '', ''
UNION ALL
SELECT
  'Tables with RLS enabled:',
  tables_with_rls::text || ' / ' || total_tables::text,
  CASE
    WHEN tables_with_rls = total_tables THEN '✅ PERFECT'
    WHEN tables_with_rls > 0 THEN '⚠️ PARTIAL'
    ELSE '❌ CRITICAL'
  END
FROM rls_stats
UNION ALL
SELECT
  'Tables with policies:',
  tables_with_policies::text,
  CASE
    WHEN tables_with_policies >= (SELECT total_tables FROM rls_stats) THEN '✅ GOOD'
    ELSE '⚠️ INCOMPLETE'
  END
FROM policy_stats
UNION ALL
SELECT
  'Total policies created:',
  total_policies::text,
  CASE
    WHEN total_policies >= 80 THEN '✅ COMPREHENSIVE'
    WHEN total_policies >= 40 THEN '⚠️ BASIC'
    ELSE '❌ INSUFFICIENT'
  END
FROM policy_stats
UNION ALL
SELECT '', '', ''
UNION ALL
SELECT
  '═══════════════════════════════════════',
  '',
  '';

-- ============================================
-- EXPECTED RESULTS SUMMARY
-- ============================================
/*
✅ All tables should have RLS enabled
✅ ~80-100 policies should exist
✅ No tables without policies
✅ Sensitive columns protected
✅ User authenticated (when running as logged-in user)
✅ Policies properly scoped by user_id

If any checks fail:
1. Re-run the migration script
2. Check for errors in Supabase logs
3. Verify table schemas have user_id columns
4. Test with authenticated user session
*/
