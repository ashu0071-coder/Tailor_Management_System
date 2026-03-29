# SaaS Subscription System - Quick Reference


## 🎯 Overview


Your tailor management application now includes a complete SaaS subscription management system with:
- One-time purchase or monthly subscription options
- Automatic renewal reminders (3 days before due date)
- Access control based on subscription status
- Admin dashboard for managing all shop subscriptions
- Payment history tracking
- Trial period support


## 📁 Files Created/Modified


### Database
- `database/subscription_setup.sql` - Complete database schema and functions


### Services
- `src/services/subscriptionService.js` - All subscription-related API calls


### Pages
- `src/pages/AdminSubscriptions.jsx` - Admin subscription management dashboard


### Components
- `src/components/SubscriptionStatus.jsx` - Subscription status card for shop owners
- `src/components/ProtectedRoute.jsx` - **UPDATED** with subscription checks


### Layouts
- `src/layouts/MainLayout.jsx` - **UPDATED** to show subscription status


### Routes
- `src/App.jsx` - **UPDATED** with admin subscriptions route


### Edge Functions
- `supabase/functions/subscription-alerts/index.ts` - Daily cron job for notifications
- `supabase/functions/process-subscription-payment/index.ts` - Payment processing


### Documentation
- `SUBSCRIPTION_SETUP_GUIDE.md` - Complete setup and usage guide


## 🚀 Quick Start


### 1. Set Up Database (5 minutes)


```bash
# Run in Supabase SQL Editor
c:\Personal\tailor-management\database\subscription_setup.sql
```


### 2. Deploy Edge Functions (2 minutes)


```bash
cd c:\Personal\tailor-management
supabase functions deploy subscription-alerts
supabase functions deploy process-subscription-payment
```


### 3. Set Up Cron Job (3 minutes)


```sql
-- In Supabase SQL Editor, enable pg_cron extension
-- Then create the cron job (see SUBSCRIPTION_SETUP_GUIDE.md)
```


### 4. Test the System (5 minutes)


```sql
-- Create a test user with trial
UPDATE user_profiles
SET
  subscription_status = 'trial',
  trial_end_date = NOW() + INTERVAL '14 days',
  is_subscription_active = true
WHERE email = 'yourtestemail@example.com';
```


## 🎨 User Features


### For Shop Owners


**Subscription Status Card** (shown on all pages):
- Current plan and status
- Days remaining
- Next billing date
- Renew/Subscribe buttons


**Access Control**:
- Trial: 14 days free access
- Active: Full access
- Expired/Inactive: Blocked with renewal prompt


**Notifications**:
- 3-day renewal reminder
- Trial ending alerts
- Payment failure notices


### For Admins


**Subscription Dashboard** (`/admin/subscriptions`):
- Statistics cards (Total Shops, Active, Revenue, Renewals)
- Subscriptions table with status, alerts, and actions
- Payment history view
- Quick activate/deactivate toggle
- Assign plan to any shop


**Controls**:
- Manually activate/deactivate shops
- Assign or change subscription plans
- View payment history
- Monitor overdue payments


## 💰 Subscription Plans


### Default Plans (configured in database)


1. **One-Time Purchase** - $299.99
   - Lifetime access
   - No recurring payments
   - All features included


2. **Monthly Subscription** - $29.99/month
   - Monthly billing
   - Auto-renewal
   - Priority support


### Customizing Plans


```sql
-- Add a new plan
INSERT INTO subscription_plans (name, description, plan_type, price, features)
VALUES (
  'Premium',
  'Premium tier with extra features',
  'monthly',
  49.99,
  '["Feature 1", "Feature 2", "Feature 3"]'::jsonb
);


-- Update pricing
UPDATE subscription_plans
SET price = 24.99
WHERE name = 'Monthly Subscription';
```


## 🔧 Common Admin Tasks


### Give a Shop Free Access


```sql
UPDATE user_profiles
SET
  subscription_status = 'active',
  is_subscription_active = true,
  subscription_plan_id = (SELECT id FROM subscription_plans WHERE plan_type = 'one_time' LIMIT 1)
WHERE email = 'shop@example.com';
```


### Extend Trial Period


```sql
UPDATE user_profiles
SET trial_end_date = trial_end_date + INTERVAL '7 days'
WHERE email = 'shop@example.com';
```


### View Shops Due for Renewal


```sql
SELECT * FROM admin_shop_subscriptions
WHERE payment_alert_status = 'due_soon';
```


### Manual Payment Record


```sql
INSERT INTO payment_history (user_id, subscription_plan_id, amount, payment_status, notes)
VALUES (
  'user-uuid-here',
  'plan-uuid-here',
  29.99,
  'completed',
  'Manual payment received via bank transfer'
);
```


## 📊 Key Database Functions


```sql
-- Check if user subscription is active
SELECT is_subscription_active('user-uuid');


-- Get subscription statistics
SELECT * FROM get_subscription_stats();


-- Create renewal notifications (runs via cron)
SELECT create_renewal_notifications();


-- Expire overdue subscriptions (runs via cron)
SELECT expire_overdue_subscriptions();
```


## 🔗 API Endpoints (subscriptionService.js)


### User Functions
- `getCurrentUserSubscription()` - Get user's subscription details
- `isSubscriptionActive()` - Check if subscription is active
- `subscribeToPlan(planId, paymentDetails)` - Subscribe to a plan
- `renewSubscription(paymentDetails)` - Renew monthly subscription
- `cancelSubscription()` - Cancel subscription
- `getUserPaymentHistory()` - Get user's payment history


### Admin Functions
- `getAllShopSubscriptions()` - Get all shops with subscription data
- `getSubscriptionStats()` - Get dashboard statistics
- `toggleShopActive(userId, isActive)` - Activate/deactivate shop
- `assignSubscriptionPlan(userId, planId, details)` - Assign plan to shop
- `getAllPaymentHistory()` - Get all payment transactions


## ⚙️ Configuration


### Notification Timing


Default: 3 days before renewal. To change:


```sql
-- Edit in subscription_setup.sql, line ~385
WHERE up.next_billing_date::date = (CURRENT_DATE + INTERVAL '3 days')::date
-- Change '3 days' to your preferred value
```


### Trial Period


Default: 14 days. To change:


```sql
-- Edit in subscription_setup.sql, line ~115
DEFAULT (NOW() + INTERVAL '14 days')
-- Change '14 days' to your preferred value
```


### Subscription Status Values


- `trial` - Free trial period
- `active` - Active paid subscription
- `inactive` - Manually deactivated by admin
- `expired` - Subscription period ended
- `cancelled` - User cancelled subscription


## 🐛 Troubleshooting


### "Subscription Required" blocking all users


```sql
-- Check subscription status
SELECT id, email, subscription_status, is_subscription_active
FROM user_profiles
WHERE role != 'admin';


-- Fix: Activate subscriptions
UPDATE user_profiles
SET is_subscription_active = true
WHERE role != 'admin';
```


### Notifications not sending


1. Check Edge Function logs in Supabase Dashboard
2. Verify cron job is running:
   ```sql
   SELECT * FROM cron.job;
   ```
3. Manually trigger:
   ```bash
   curl -X POST 'YOUR_URL/functions/v1/subscription-alerts' \
     -H 'Authorization: Bearer YOUR_KEY'
   ```


### Admin can't see subscriptions page


```sql
-- Verify admin role
SELECT id, email, role FROM user_profiles WHERE role = 'admin';


-- Grant permissions
GRANT SELECT ON admin_shop_subscriptions TO authenticated;
```


## 📈 Metrics to Monitor


```sql
-- Active vs Inactive
SELECT subscription_status, COUNT(*)
FROM user_profiles
WHERE role != 'admin'
GROUP BY subscription_status;


-- Revenue this month
SELECT SUM(amount) as revenue
FROM payment_history
WHERE payment_status = 'completed'
AND payment_date >= DATE_TRUNC('month', NOW());


-- Churn rate
SELECT
  COUNT(*) FILTER (WHERE subscription_status = 'cancelled') as cancelled,
  COUNT(*) as total,
  (COUNT(*) FILTER (WHERE subscription_status = 'cancelled')::float / COUNT(*) * 100) as churn_rate
FROM user_profiles
WHERE role != 'admin';
```


## 🎯 Next Steps


1. ✅ Run database setup SQL
2. ✅ Deploy Edge Functions
3. ✅ Set up cron job
4. ⏳ Integrate payment gateway (Stripe/PayPal)
5. ⏳ Configure email service (SendGrid/SES)
6. ⏳ Test complete subscription flow
7. ⏳ Monitor and adjust as needed


## 💡 Tips


- Give new shops a trial period to test the system
- Monitor the admin dashboard daily for overdue payments
- Set up email notifications before relying on the system
- Keep payment records for accounting purposes
- Regularly backup the payment_history table
- Consider offering discounts for annual subscriptions
- Use the manual activate/deactivate feature sparingly


---


**Need Help?** Check `SUBSCRIPTION_SETUP_GUIDE.md` for detailed documentation.



