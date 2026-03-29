-- ============================================================================
-- TAILOR MANAGEMENT - COMPLETE DATABASE SETUP
-- Run this script in Supabase SQL Editor
-- ============================================================================
-- This script includes all database changes needed for:
-- 1. Admin Password Management
-- 2. Admin OTP Authentication  
-- 3. Payment Tracking
-- 4. Mobile Application Support
-- ============================================================================


-- ============================================================================
-- STEP 1: Ensure role column exists in user_profiles table
-- Required for: Admin Password Management, Admin OTP
-- ============================================================================


-- Add role column if it doesn't exist
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';


-- Create index for role-based queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_role
ON user_profiles(role);


-- Add comments
COMMENT ON COLUMN user_profiles.role IS 'User role: admin or user (shop owner)';


-- ============================================================================
-- STEP 2: Add payment tracking fields to customers table
-- Required for: Payment Tracking Feature
-- ============================================================================


-- Add amount_paid and remaining_balance columns
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_balance DECIMAL(10, 2) DEFAULT 0;


-- Create index for filtering by payment status
CREATE INDEX IF NOT EXISTS idx_customers_remaining_balance
ON customers(remaining_balance);


-- Create index for amount_paid
CREATE INDEX IF NOT EXISTS idx_customers_amount_paid
ON customers(amount_paid);


-- Add comments for documentation
COMMENT ON COLUMN customers.amount_paid IS 'Total amount paid by customer';
COMMENT ON COLUMN customers.remaining_balance IS 'Remaining balance to be paid';


-- Update existing customers with default values
UPDATE customers
SET amount_paid = 0, remaining_balance = 0
WHERE amount_paid IS NULL OR remaining_balance IS NULL;


-- ============================================================================
-- STEP 3: Ensure payment_status column exists
-- Required for: Payment Tracking Feature
-- ============================================================================


-- Add payment_status column if it doesn't exist
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'Not Paid';


-- Create index for payment status queries
CREATE INDEX IF NOT EXISTS idx_customers_payment_status
ON customers(payment_status);


-- Add comment
COMMENT ON COLUMN customers.payment_status IS 'Payment status: Not Paid, Partial, or Paid';


-- ============================================================================
-- STEP 4: Update RLS (Row Level Security) policies if needed
-- Ensure users can only access their own data
-- ============================================================================


-- Enable RLS on customers table (if not already enabled)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;


-- Drop existing policies if they exist (to recreate them)
DROP POLICY IF EXISTS "Users can view their own customers" ON customers;
DROP POLICY IF EXISTS "Users can create their own customers" ON customers;
DROP POLICY IF EXISTS "Users can update their own customers" ON customers;
DROP POLICY IF EXISTS "Users can delete their own customers" ON customers;


-- Allow users to view their own customers
CREATE POLICY "Users can view their own customers"
ON customers FOR SELECT
USING (auth.uid() = user_id);


-- Allow users to create customers
CREATE POLICY "Users can create their own customers"
ON customers FOR INSERT
WITH CHECK (auth.uid() = user_id);


-- Allow users to update their own customers
CREATE POLICY "Users can update their own customers"
ON customers FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- Allow users to delete their own customers
CREATE POLICY "Users can delete their own customers"
ON customers FOR DELETE
USING (auth.uid() = user_id);


-- ============================================================================
-- STEP 5: Set up admin user (IMPORTANT - Update email!)
-- Replace 'admin@example.com' with your actual admin email
-- ============================================================================


-- Update the role for admin user
-- IMPORTANT: Change 'admin@example.com' to your actual admin email address
UPDATE user_profiles
SET role = 'admin'
WHERE email = 'admin@example.com';


-- If the admin user doesn't exist in user_profiles yet, you'll need to:
-- 1. First create the user in Supabase Auth
-- 2. Then run this query with the correct user ID:
-- INSERT INTO user_profiles (id, email, role, store_name)
-- VALUES ('user-uuid-here', 'admin@example.com', 'admin', 'Admin Account');


-- ============================================================================
-- STEP 6: Create helper function to get payment summary (optional but useful)
-- ============================================================================


-- Function to calculate total receivables
CREATE OR REPLACE FUNCTION get_total_receivables(user_uuid UUID)
RETURNS DECIMAL(10, 2) AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(remaining_balance), 0)
    FROM customers
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to get payment statistics
CREATE OR REPLACE FUNCTION get_payment_stats(user_uuid UUID)
RETURNS TABLE (
  total_paid DECIMAL(10, 2),
  total_pending DECIMAL(10, 2),
  paid_count BIGINT,
  partial_count BIGINT,
  unpaid_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(amount_paid), 0) as total_paid,
    COALESCE(SUM(remaining_balance), 0) as total_pending,
    COUNT(*) FILTER (WHERE payment_status = 'Paid') as paid_count,
    COUNT(*) FILTER (WHERE payment_status = 'Partial') as partial_count,
    COUNT(*) FILTER (WHERE payment_status = 'Not Paid') as unpaid_count
  FROM customers
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- STEP 7: Add updated_at triggers (if not already exists)
-- Helps track when records are modified
-- ============================================================================


-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Add updated_at trigger to customers table
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- Add updated_at trigger to user_profiles table
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- STEP 8: Verify the setup
-- ============================================================================


-- Check if role column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles' AND column_name = 'role';


-- Check if payment columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'customers'
AND column_name IN ('amount_paid', 'remaining_balance', 'payment_status');


-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('customers', 'user_profiles')
AND indexname LIKE 'idx_%';


-- Count customers by payment status
SELECT
  payment_status,
  COUNT(*) as count,
  SUM(amount_paid) as total_paid,
  SUM(remaining_balance) as total_pending
FROM customers
GROUP BY payment_status;


-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================


-- Next steps:
-- 1. ✅ Database schema updated
-- 2. 🔄 Deploy Edge Functions:
--    - supabase functions deploy get-shop-password
--    - supabase functions deploy update-shop-password
--    - supabase functions deploy admin-otp
-- 3. ⚙️ Set environment variables in Supabase Dashboard
-- 4. 🧪 Test all features
--
-- For detailed instructions, see:
-- - ADMIN_PASSWORD_MANAGEMENT.md
-- - ADMIN_OTP_SETUP.md
-- - PAYMENT_TRACKING_GUIDE.md
-- ============================================================================



