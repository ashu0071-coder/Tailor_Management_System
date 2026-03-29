-- ============================================================================
-- VERIFICATION SCRIPT
-- Run this after complete_setup.sql to verify everything is configured
-- ============================================================================


-- ============================================================================
-- 1. Check if all required columns exist
-- ============================================================================


SELECT
  'user_profiles - role column' as check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'user_profiles' AND column_name = 'role'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;


SELECT
  'customers - payment columns' as check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'customers'
      AND column_name IN ('amount_paid', 'remaining_balance', 'payment_status')
      GROUP BY table_name
      HAVING COUNT(*) = 3
    ) THEN '✅ ALL EXISTS'
    ELSE '❌ SOME MISSING'
  END as status;


-- ============================================================================
-- 2. Check if indexes are created
-- ============================================================================


SELECT
  indexname,
  tablename,
  '✅ Created' as status
FROM pg_indexes
WHERE tablename IN ('customers', 'user_profiles')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;


-- ============================================================================
-- 3. Check admin user setup
-- ============================================================================


SELECT
  email,
  role,
  CASE
    WHEN role = 'admin' THEN '✅ Admin user configured'
    ELSE '⚠️ Not an admin'
  END as admin_status
FROM user_profiles
WHERE role = 'admin';


-- If this returns no rows, you need to set up an admin user:
-- UPDATE user_profiles SET role = 'admin' WHERE email = 'your-admin@email.com';


-- ============================================================================
-- 4. Check RLS policies
-- ============================================================================


SELECT
  schemaname,
  tablename,
  policyname,
  '✅ Policy exists' as status
FROM pg_policies
WHERE tablename = 'customers'
ORDER BY policyname;


-- ============================================================================
-- 5. Sample data check - Customers with payment info
-- ============================================================================


SELECT
  COUNT(*) as total_customers,
  COUNT(*) FILTER (WHERE amount_paid IS NOT NULL) as has_amount_paid,
  COUNT(*) FILTER (WHERE remaining_balance IS NOT NULL) as has_remaining_balance,
  COUNT(*) FILTER (WHERE payment_status IS NOT NULL) as has_payment_status
FROM customers;


-- ============================================================================
-- 6. Payment statistics summary
-- ============================================================================


SELECT
  payment_status,
  COUNT(*) as customer_count,
  COALESCE(SUM(amount_paid), 0) as total_paid,
  COALESCE(SUM(remaining_balance), 0) as total_pending,
  COALESCE(AVG(amount_paid), 0) as avg_paid,
  COALESCE(AVG(remaining_balance), 0) as avg_pending
FROM customers
GROUP BY payment_status
ORDER BY
  CASE payment_status
    WHEN 'Paid' THEN 1
    WHEN 'Partial' THEN 2
    WHEN 'Not Paid' THEN 3
    ELSE 4
  END;


-- ============================================================================
-- 7. Check helper functions
-- ============================================================================


SELECT
  proname as function_name,
  '✅ Function exists' as status
FROM pg_proc
WHERE proname IN ('get_total_receivables', 'get_payment_stats', 'update_updated_at_column');


-- ============================================================================
-- 8. Test helper functions (if you have data)
-- ============================================================================


-- Example: Get payment stats for current user
-- Replace 'user-uuid-here' with actual user UUID
-- SELECT * FROM get_payment_stats('user-uuid-here');


-- Example: Get total receivables for current user
-- SELECT get_total_receivables('user-uuid-here');


-- ============================================================================
-- 9. Check triggers
-- ============================================================================


SELECT
  event_object_table as table_name,
  trigger_name,
  event_manipulation as event,
  '✅ Trigger exists' as status
FROM information_schema.triggers
WHERE event_object_table IN ('customers', 'user_profiles')
AND trigger_name LIKE '%updated_at%';


-- ============================================================================
-- VERIFICATION COMPLETE
-- ============================================================================


-- Summary of what to check:
-- ✅ All columns exist
-- ✅ All indexes created
-- ✅ Admin user configured
-- ✅ RLS policies in place
-- ✅ Helper functions created
-- ✅ Triggers working
--
-- If any checks show ❌ or ⚠️, review and re-run the relevant section
-- from complete_setup.sql
-- ============================================================================



