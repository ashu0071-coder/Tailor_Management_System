-- ============================================================================
-- TAILOR MANAGEMENT - SUBSCRIPTION & SAAS SETUP
-- Run this script in Supabase SQL Editor
-- ============================================================================
-- This script creates the subscription management system including:
-- 1. Subscription Plans (One-time vs Monthly)
-- 2. Shop Subscriptions (tracking which plan each shop has)
-- 3. Payment History (tracking all payments)
-- 4. Subscription Notifications (alerts before renewal)
-- 5. Access Control (active/inactive status)
-- ============================================================================


-- ============================================================================
-- STEP 1: Create subscription_plans table
-- Defines available subscription plans (one-time or monthly)
-- ============================================================================


CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('one_time', 'monthly')),
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- Add indexes
CREATE INDEX IF NOT EXISTS idx_subscription_plans_type ON subscription_plans(plan_type);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);


-- Add comments
COMMENT ON TABLE subscription_plans IS 'Available subscription plans for shops';
COMMENT ON COLUMN subscription_plans.plan_type IS 'Type of plan: one_time or monthly';
COMMENT ON COLUMN subscription_plans.price IS 'Price of the subscription plan';
COMMENT ON COLUMN subscription_plans.features IS 'JSON array of features included in the plan';


-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, plan_type, price, currency, features) VALUES
('One-Time Purchase', 'Lifetime access with a single payment', 'one_time', 10000.00, 'INR',
 '["Unlimited customers", "Unlimited orders", "All measurements", "Basic support"]'::jsonb),
('Monthly Subscription', 'Pay monthly for continued access', 'monthly', 500.00, 'INR',
 '["Unlimited customers", "Unlimited orders", "All measurements", "Priority support", "Regular updates"]'::jsonb)
ON CONFLICT DO NOTHING;


-- ============================================================================
-- STEP 2: Add subscription fields to user_profiles table
-- Track subscription status for each shop
-- ============================================================================


-- Add subscription-related columns to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS subscription_plan_id UUID REFERENCES subscription_plans(id),
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'inactive'
  CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'expired')),
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_subscription_active BOOLEAN DEFAULT false;


-- Create indexes for subscription queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status
  ON user_profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_next_billing_date
  ON user_profiles(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_active
  ON user_profiles(is_subscription_active);


-- Add comments
COMMENT ON COLUMN user_profiles.subscription_status IS 'Current subscription status: active, inactive, cancelled, expired';
COMMENT ON COLUMN user_profiles.is_subscription_active IS 'Quick check if user can access the system';
COMMENT ON COLUMN user_profiles.next_billing_date IS 'Next payment due date for monthly subscriptions (1 month from start)';


-- ============================================================================
-- STEP 3: Create payment_history table
-- Track all payments made by shops
-- ============================================================================


CREATE TABLE IF NOT EXISTS payment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_plan_id UUID REFERENCES subscription_plans(id),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  payment_status VARCHAR(20) DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method VARCHAR(50),
  transaction_id VARCHAR(255),
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  billing_period_start TIMESTAMP WITH TIME ZONE,
  billing_period_end TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- Add indexes
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_history_payment_date ON payment_history(payment_date DESC);


-- Add comments
COMMENT ON TABLE payment_history IS 'Records all payments made by shops';
COMMENT ON COLUMN payment_history.payment_status IS 'Status: pending, completed, failed, refunded';
COMMENT ON COLUMN payment_history.billing_period_start IS 'Start of billing period for monthly subscriptions';
COMMENT ON COLUMN payment_history.billing_period_end IS 'End of billing period for monthly subscriptions';


-- Enable RLS
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;


-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own payment history" ON payment_history;
DROP POLICY IF EXISTS "Admins can view all payment history" ON payment_history;
DROP POLICY IF EXISTS "System can insert payment records" ON payment_history;


-- RLS Policies for payment_history
CREATE POLICY "Users can view their own payment history"
  ON payment_history FOR SELECT
  USING (auth.uid() = user_id);


CREATE POLICY "Admins can view all payment history"
  ON payment_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


CREATE POLICY "System can insert payment records"
  ON payment_history FOR INSERT
  WITH CHECK (true);


-- ============================================================================
-- STEP 4: Create subscription_notifications table
-- Track notifications sent to users about upcoming renewals
-- ============================================================================


CREATE TABLE IF NOT EXISTS subscription_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL
    CHECK (notification_type IN ('renewal_reminder', 'payment_failed', 'subscription_expired', 'trial_ending')),
  notification_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed')),
  message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- Add indexes
CREATE INDEX IF NOT EXISTS idx_subscription_notifications_user_id
  ON subscription_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_notifications_scheduled
  ON subscription_notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_subscription_notifications_status
  ON subscription_notifications(status);


-- Add comments
COMMENT ON TABLE subscription_notifications IS 'Tracks notifications sent to users about subscriptions';
COMMENT ON COLUMN subscription_notifications.scheduled_for IS 'When the notification should be sent (e.g., 3 days before renewal)';


-- Enable RLS
ALTER TABLE subscription_notifications ENABLE ROW LEVEL SECURITY;


-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON subscription_notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON subscription_notifications;


-- RLS Policies
CREATE POLICY "Users can view their own notifications"
  ON subscription_notifications FOR SELECT
  USING (auth.uid() = user_id);


CREATE POLICY "Admins can view all notifications"
  ON subscription_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- ============================================================================
-- STEP 5: Create functions for subscription management
-- ============================================================================


-- Function to check if user's subscription is active
CREATE OR REPLACE FUNCTION is_subscription_active(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_status VARCHAR(20);
  user_role VARCHAR(20);
  sub_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get user details
  SELECT subscription_status, role, subscription_end_date
  INTO user_status, user_role, sub_end_date
  FROM user_profiles
  WHERE id = user_uuid;
 
  -- Admins always have access
  IF user_role = 'admin' THEN
    RETURN true;
  END IF;
 
  -- Check if subscription is active
  IF user_status = 'active' THEN
    -- For one-time payments, no expiry check needed
    -- For monthly subscriptions, check if not expired
    IF sub_end_date IS NULL OR sub_end_date > NOW() THEN
      RETURN true;
    END IF;
  END IF;
 
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to process monthly subscription renewal
CREATE OR REPLACE FUNCTION process_subscription_renewal(user_uuid UUID, payment_success BOOLEAN)
RETURNS VOID AS $$
DECLARE
  current_plan_type VARCHAR(20);
BEGIN
  -- Get the plan type
  SELECT sp.plan_type INTO current_plan_type
  FROM user_profiles up
  JOIN subscription_plans sp ON up.subscription_plan_id = sp.id
  WHERE up.id = user_uuid;
 
  IF current_plan_type = 'monthly' THEN
    IF payment_success THEN
      -- Update subscription dates for successful payment
      UPDATE user_profiles
      SET
        subscription_status = 'active',
        is_subscription_active = true,
        subscription_end_date = next_billing_date,
        next_billing_date = next_billing_date + INTERVAL '1 month',
        updated_at = NOW()
      WHERE id = user_uuid;
    ELSE
      -- Mark as inactive if payment failed
      UPDATE user_profiles
      SET
        subscription_status = 'inactive',
        is_subscription_active = false,
        updated_at = NOW()
      WHERE id = user_uuid;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to create renewal notifications (to be run daily via cron)
CREATE OR REPLACE FUNCTION create_renewal_notifications()
RETURNS INTEGER AS $$
DECLARE
  notification_count INTEGER := 0;
  user_record RECORD;
BEGIN
  -- Find users whose billing date is in 3 days
  FOR user_record IN
    SELECT up.id, up.email, up.store_name, up.next_billing_date, sp.price
    FROM user_profiles up
    JOIN subscription_plans sp ON up.subscription_plan_id = sp.id
    WHERE sp.plan_type = 'monthly'
    AND up.subscription_status = 'active'
    AND up.next_billing_date::date = (CURRENT_DATE + INTERVAL '3 days')::date
    AND NOT EXISTS (
      -- Don't create duplicate notifications
      SELECT 1 FROM subscription_notifications sn
      WHERE sn.user_id = up.id
      AND sn.notification_type = 'renewal_reminder'
      AND sn.scheduled_for::date = up.next_billing_date::date
    )
  LOOP
    -- Create notification record
    INSERT INTO subscription_notifications (
      user_id,
      notification_type,
      scheduled_for,
      message,
      metadata
    ) VALUES (
      user_record.id,
      'renewal_reminder',
      user_record.next_billing_date,
      'Your subscription will renew in 3 days. Amount due: $' || user_record.price,
      jsonb_build_object(
        'store_name', user_record.store_name,
        'renewal_date', user_record.next_billing_date,
        'amount', user_record.price
      )
    );
   
    notification_count := notification_count + 1;
  END LOOP;
 
  RETURN notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to expire subscriptions (to be run daily via cron)
CREATE OR REPLACE FUNCTION expire_overdue_subscriptions()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Mark subscriptions as expired if billing date has passed
  UPDATE user_profiles
  SET
    subscription_status = 'expired',
    is_subscription_active = false,
    updated_at = NOW()
  WHERE subscription_status = 'active'
  AND next_billing_date < NOW()
  AND subscription_plan_id IN (
    SELECT id FROM subscription_plans WHERE plan_type = 'monthly'
  );
 
  GET DIAGNOSTICS expired_count = ROW_COUNT;
 
  -- Also expire trial accounts
  UPDATE user_profiles
  SET
    subscription_status = 'expired',
    is_subscription_active = false,
    updated_at = NOW()
  WHERE subscription_status = 'trial'
  AND trial_end_date < NOW();
 
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Drop existing function to allow changing return type
DROP FUNCTION IF EXISTS get_subscription_stats();


-- Function to get subscription statistics for admin dashboard
CREATE OR REPLACE FUNCTION get_subscription_stats()
RETURNS TABLE (
  total_shops BIGINT,
  active_subscriptions BIGINT,
  inactive_subscriptions BIGINT,
  one_time_purchases BIGINT,
  monthly_subscriptions BIGINT,
  total_monthly_revenue DECIMAL(10, 2),
  pending_renewals BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_shops,
    COUNT(*) FILTER (WHERE subscription_status = 'active')::BIGINT as active_subscriptions,
    COUNT(*) FILTER (WHERE subscription_status = 'inactive' OR subscription_status = 'expired')::BIGINT as inactive_subscriptions,
    COUNT(*) FILTER (
      WHERE subscription_plan_id IN (SELECT id FROM subscription_plans WHERE plan_type = 'one_time')
    )::BIGINT as one_time_purchases,
    COUNT(*) FILTER (
      WHERE subscription_plan_id IN (SELECT id FROM subscription_plans WHERE plan_type = 'monthly')
    )::BIGINT as monthly_subscriptions,
    COALESCE(SUM(sp.price) FILTER (
      WHERE sp.plan_type = 'monthly' AND up.subscription_status = 'active'
    ), 0)::DECIMAL(10, 2) as total_monthly_revenue,
    COUNT(*) FILTER (
      WHERE next_billing_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
      AND subscription_status = 'active'
      AND subscription_plan_id IN (SELECT id FROM subscription_plans WHERE plan_type = 'monthly')
    )::BIGINT as pending_renewals
  FROM user_profiles up
  LEFT JOIN subscription_plans sp ON up.subscription_plan_id = sp.id
  WHERE up.role != 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- STEP 6: Add updated_at triggers
-- ============================================================================


-- Trigger for subscription_plans
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- Trigger for payment_history
DROP TRIGGER IF EXISTS update_payment_history_updated_at ON payment_history;
CREATE TRIGGER update_payment_history_updated_at
  BEFORE UPDATE ON payment_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- STEP 7: Create views for easier querying
-- ============================================================================


-- Drop existing view to allow schema changes
DROP VIEW IF EXISTS admin_shop_subscriptions;


-- View for admin to see all shop subscriptions
CREATE OR REPLACE VIEW admin_shop_subscriptions AS
SELECT
  up.id as user_id,
  up.email,
  up.store_name,
  up.store_phone,
  up.subscription_status,
  up.is_subscription_active,
  up.subscription_start_date,
  up.subscription_end_date,
  up.next_billing_date,
  sp.name as plan_name,
  sp.plan_type,
  sp.price as plan_price,
  sp.currency,
  (
    SELECT COUNT(*) FROM payment_history ph
    WHERE ph.user_id = up.id AND ph.payment_status = 'completed'
  ) as total_payments,
  (
    SELECT COALESCE(SUM(amount), 0) FROM payment_history ph
    WHERE ph.user_id = up.id AND ph.payment_status = 'completed'
  ) as total_paid,
  CASE
    WHEN up.next_billing_date < NOW() AND sp.plan_type = 'monthly'
      THEN 'overdue'
    WHEN up.next_billing_date BETWEEN NOW() AND NOW() + INTERVAL '3 days'
      THEN 'due_soon'
    ELSE 'ok'
  END as payment_alert_status,
  up.created_at,
  up.updated_at
FROM user_profiles up
LEFT JOIN subscription_plans sp ON up.subscription_plan_id = sp.id
WHERE up.role != 'admin'
ORDER BY up.created_at DESC;


-- ============================================================================
-- STEP 8: Grant permissions
-- ============================================================================


-- Grant necessary permissions to authenticated users
GRANT SELECT ON subscription_plans TO authenticated;
GRANT SELECT ON admin_shop_subscriptions TO authenticated;


-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================


-- Check if all tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('subscription_plans', 'payment_history', 'subscription_notifications');


-- Check subscription columns in user_profiles
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_profiles'
AND column_name LIKE '%subscription%' OR column_name = 'trial_end_date';


-- View subscription plans
SELECT * FROM subscription_plans;


-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================


-- Next steps:
-- 1. ✅ Database schema created
-- 2. 📝 Deploy Edge Functions:
--    - check-subscription-alerts (daily cron job)
--    - process-subscription-payment
-- 3. 🎨 Update frontend with subscription management UI
-- 4. ⚙️ Set up Supabase cron jobs for:
--    - create_renewal_notifications() - Run daily
--    - expire_overdue_subscriptions() - Run daily
-- 5. 🧪 Test subscription workflows
-- ============================================================================



