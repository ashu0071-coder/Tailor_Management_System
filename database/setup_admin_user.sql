-- ============================================================================
-- ADMIN USER SETUP
-- Run this script to set up your admin user
-- ============================================================================


-- ============================================================================
-- OPTION 1: If your admin user already exists in user_profiles
-- ============================================================================


-- Simply update the role to 'admin'
-- IMPORTANT: Replace 'asiftahashildar0071@email.com' with your actual email


UPDATE user_profiles
SET role = 'admin'
WHERE email = 'asiftahashildar0071@email.com';


-- Verify the update
SELECT id, email, role, store_name, created_at
FROM user_profiles
WHERE email = 'asiftahashildar0071@email.com';


-- ============================================================================
-- OPTION 2: If your admin user doesn't exist in user_profiles yet
-- ============================================================================


-- First, create the user in Supabase Auth (do this in Supabase Dashboard):
-- 1. Go to Authentication → Users
-- 2. Click "Add user"
-- 3. Enter email and password
-- 4. Copy the User ID (UUID)


-- Then insert into user_profiles:
-- IMPORTANT: Replace these values:
-- - 'user-uuid-from-auth' with the UUID from step 4
-- - 'asiftahashildar0071@email.com' with your admin email
-- - 'Admin User' with desired display name


INSERT INTO user_profiles (id, email, role, store_name, store_phone)
VALUES (
  'user-uuid-from-auth',           -- User UUID from Auth
  'asiftahashildar0071@email.com',          -- Admin email
  'admin',                         -- Role (don't change this)
  'Admin User',                    -- Display name
  NULL                             -- Phone (optional)
)
ON CONFLICT (id)
DO UPDATE SET role = 'admin';


-- ============================================================================
-- OPTION 3: Create admin from existing shop user
-- ============================================================================


-- If you want to promote an existing shop user to admin:


UPDATE user_profiles
SET role = 'admin'
WHERE id = 'existing-user-uuid-here';


-- Or by email:
UPDATE user_profiles
SET role = 'admin'
WHERE email = 'existing-user@email.com';


-- ============================================================================
-- VERIFY ADMIN SETUP
-- ============================================================================


-- List all admin users
SELECT
  id,
  email,
  role,
  store_name,
  created_at,
  '✅ Admin configured' as status
FROM user_profiles
WHERE role = 'admin';


-- If this returns no rows, admin is not set up yet!


-- ============================================================================
-- ADDITIONAL ADMIN USERS (Optional)
-- ============================================================================


-- You can have multiple admin users
-- Just repeat OPTION 1 or OPTION 2 for each admin


-- Example: Promote multiple users to admin
-- UPDATE user_profiles
-- SET role = 'admin'
-- WHERE email IN (
--   'admin1@example.com',
--   'admin2@example.com',
--   'admin3@example.com'
-- );


-- ============================================================================
-- DOWNGRADE ADMIN TO REGULAR USER (if needed)
-- ============================================================================


-- To remove admin privileges:
-- UPDATE user_profiles
-- SET role = 'user'
-- WHERE email = 'user@example.com';


-- ============================================================================
-- NOTES
-- ============================================================================


-- Admin users have special privileges:
-- 1. Can view and manage all shops (in Admin Shops page)
-- 2. Can view and update shop passwords
-- 3. Require OTP verification on login (enhanced security)
-- 4. Can create new shop users


-- Regular shop users (role = 'user'):
-- 1. Can only see their own data
-- 2. Login without OTP
-- 3. Manage their own customers, measurements, orders


-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================


-- Problem: Can't log in with OTP
-- Solution: Make sure user has role = 'admin' in user_profiles


-- Problem: OTP not working
-- Solution:
-- 1. Check edge function is deployed: supabase functions deploy admin-otp
-- 2. Check email service is configured (see ADMIN_OTP_SETUP.md)
-- 3. In development, check browser console for OTP


-- Problem: Admin user not found
-- Solution: Check if user exists in both:
-- 1. Supabase Auth (Authentication → Users)
-- 2. user_profiles table


-- ============================================================================
-- QUICK REFERENCE
-- ============================================================================


-- Get all users with their roles:
-- SELECT email, role FROM user_profiles ORDER BY role, email;


-- Count users by role:
-- SELECT role, COUNT(*) FROM user_profiles GROUP BY role;


-- Find specific user:
-- SELECT * FROM user_profiles WHERE email = 'user@example.com';


-- ============================================================================





