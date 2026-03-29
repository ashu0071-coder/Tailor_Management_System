# SaaS Subscription Management System - Setup Guide


This guide will help you set up the complete subscription management system for your Tailor Management application.


## 🎯 Features Implemented


### For Shop Owners (Users)
- ✅ **Subscription Plans**: Choose between One-Time Purchase or Monthly Subscription
- ✅ **Trial Period**: 14-day free trial for new users
- ✅ **Subscription Status**: Real-time status display with progress indicators
- ✅ **Payment Notifications**: Alerts 3 days before subscription renewal
- ✅ **Access Control**: Automatic account deactivation when subscription expires
- ✅ **Payment History**: View all past payments and transactions


### For Admins
- ✅ **Subscription Dashboard**: Overview of all shops and their subscription status
- ✅ **Payment Management**: View all payments and transaction history
- ✅ **Manual Control**: Activate/deactivate shops manually
- ✅ **Plan Assignment**: Assign or change subscription plans for any shop
- ✅ **Statistics**: Real-time stats for revenue, active subscriptions, and renewals
- ✅ **Renewal Alerts**: See which shops have upcoming renewals or overdue payments


## 📋 Prerequisites


- Supabase project set up
- Supabase CLI installed
- Access to Supabase SQL Editor
- (Optional) Email service for notifications (SendGrid, AWS SES, Resend, etc.)


## 🚀 Installation Steps


### Step 1: Database Setup


1. **Run the Subscription Setup SQL**
   
   Open Supabase SQL Editor and run the complete script:
   ```bash
   # File: database/subscription_setup.sql
   ```
   
   This script will:
   - Create `subscription_plans` table with default plans
   - Add subscription columns to `user_profiles` table
   - Create `payment_history` table for tracking payments
   - Create `subscription_notifications` table for alerts
   - Set up RLS policies for security
   - Create helper functions and views


2. **Verify Database Setup**
   
   Run these verification queries in Supabase SQL Editor:
   ```sql
   -- Check if tables exist
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('subscription_plans', 'payment_history', 'subscription_notifications');


   -- View subscription plans
   SELECT * FROM subscription_plans;


   -- Check subscription columns
   SELECT column_name
   FROM information_schema.columns
   WHERE table_name = 'user_profiles'
   AND column_name LIKE '%subscription%';
   ```


### Step 2: Deploy Edge Functions


Deploy the Supabase Edge Functions for subscription management:


```bash
# Navigate to your project root
cd c:\Personal\tailor-management


# Deploy subscription alerts function (handles notifications and expiration)
supabase functions deploy subscription-alerts


# Deploy payment processing function
supabase functions deploy process-subscription-payment
```


### Step 3: Set Up Cron Jobs


To automatically send renewal notifications and expire subscriptions, set up Supabase Cron Jobs:


1. Go to your Supabase Dashboard
2. Navigate to **Database** → **Extensions**
3. Enable the `pg_cron` extension
4. Run this SQL to create cron jobs:


```sql
-- Run subscription alerts daily at 9:00 AM UTC
SELECT cron.schedule(
  'subscription-alerts-daily',
  '0 9 * * *',  -- Every day at 9:00 AM UTC
  $$
  SELECT net.http_post(
    url := 'YOUR_SUPABASE_PROJECT_URL/functions/v1/subscription-alerts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SUPABASE_ANON_KEY'
    ),
    body := jsonb_build_object()
  ) AS request_id;
  $$
);
```


**Replace**:
- `YOUR_SUPABASE_PROJECT_URL` with your project URL (e.g., `https://abcdefgh.supabase.co`)
- `YOUR_SUPABASE_ANON_KEY` with your anon/public key from Supabase settings


### Step 4: Configure Environment Variables


If you want to integrate email notifications, add these environment variables to your Edge Functions:


```bash
# In Supabase Dashboard → Edge Functions → Settings
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@yourdomain.com
SUPPORT_EMAIL=support@yourdomain.com
```


### Step 5: Update Existing Users


Set trial periods for existing users (optional):


```sql
-- Give all existing non-admin users a 14-day trial
UPDATE user_profiles
SET
  subscription_status = 'trial',
  trial_end_date = NOW() + INTERVAL '14 days',
  is_subscription_active = true
WHERE role != 'admin'
AND subscription_status IS NULL;
```


## 📊 Admin Usage Guide


### Accessing the Subscription Dashboard


1. Log in as an admin user
2. Navigate to **Subscriptions** from the sidebar menu
3. View the dashboard with statistics:
   - Total Shops
   - Active Subscriptions
   - Monthly Revenue
   - Pending Renewals


### Managing Shop Subscriptions


#### View All Subscriptions
- Click the **Subscriptions** tab to see all shops
- Columns show: Shop Name, Email, Plan, Status, Next Billing, Total Paid, Alerts


#### Activate/Deactivate a Shop
- Click the **green checkmark** icon to deactivate an active shop
- Click the **red X** icon to activate an inactive shop


#### Assign a Subscription Plan
1. Click the **Edit** icon next to a shop
2. Select a plan from the dropdown
3. Add optional notes
4. Click **Assign Plan**


#### View Payment History
- Click the **Payments** tab
- See all transactions with dates, amounts, status, and methods


### Managing Subscription Plans


To add or modify subscription plans:


```sql
-- Add a new plan
INSERT INTO subscription_plans (name, description, plan_type, price, currency, features)
VALUES (
  'Premium Monthly',
  'Premium features with monthly billing',
  'monthly',
  49.99,
  'USD',
  '["Unlimited customers", "Priority support", "Advanced analytics", "Custom branding"]'::jsonb
);


-- Update an existing plan
UPDATE subscription_plans
SET price = 34.99
WHERE name = 'Monthly Subscription';


-- Deactivate a plan
UPDATE subscription_plans
SET is_active = false
WHERE name = 'Old Plan';
```


## 👤 Shop Owner Usage Guide


### Viewing Subscription Status


Shop owners will see a subscription status card at the top of their dashboard showing:
- Current plan
- Subscription status (Active, Trial, Expired, etc.)
- Days remaining (for trial or billing cycle)
- Next billing date
- Progress bar


### Subscription Notifications


Shop owners will receive notifications:
- **3 days before** renewal: "Your subscription will renew in 3 days"
- **On expiration**: "Your subscription has expired"
- **During trial**: "You have X days remaining in your trial"


### What Happens When Subscription Expires


When a subscription expires or is inactive:
1. User cannot access the main application
2. A blocking screen is displayed with subscription status
3. Options to renew or contact support are shown
4. Admin can manually reactivate the account


## 🔧 Customization Options


### Changing Trial Period


Edit in `database/subscription_setup.sql`:
```sql
-- Change from 14 days to 30 days
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP WITH TIME ZONE
DEFAULT (NOW() + INTERVAL '30 days');
```


### Changing Notification Timing


Edit the `create_renewal_notifications()` function:
```sql
-- Change from 3 days to 7 days notice
WHERE up.next_billing_date::date = (CURRENT_DATE + INTERVAL '7 days')::date
```


### Modifying Subscription Plans


Update prices or features directly:
```sql
UPDATE subscription_plans
SET
  price = 39.99,
  features = '["New Feature 1", "New Feature 2"]'::jsonb
WHERE plan_type = 'monthly';
```


## 🔗 Integration with Payment Gateways


To integrate with real payment gateways, update these files:


### For Stripe Integration


1. Install Stripe:
```bash
npm install @stripe/stripe-js
```


2. Update `subscriptionService.js`:
```javascript
import { loadStripe } from '@stripe/stripe-js';


export const processPayment = async (planId, paymentMethod) => {
  const stripe = await loadStripe('your_publishable_key');
 
  // Create payment intent
  const response = await fetch('/api/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planId, paymentMethod }),
  });
 
  const { clientSecret } = await response.json();
 
  // Confirm payment
  const result = await stripe.confirmCardPayment(clientSecret);
 
  if (result.error) {
    throw new Error(result.error.message);
  }
 
  return result.paymentIntent;
};
```


### For PayPal Integration


Similar approach with PayPal SDK. See PayPal documentation for details.


## 📧 Email Integration


To send actual emails instead of just logging, update `supabase/functions/subscription-alerts/index.ts`:


### Using SendGrid


```typescript
import { Client } from 'https://esm.sh/@sendgrid/mail@7.7.0';


const sendgridClient = new Client();
sendgridClient.setApiKey(Deno.env.get('SENDGRID_API_KEY') || '');


// In the notification loop
await sendgridClient.send({
  to: userEmail,
  from: Deno.env.get('EMAIL_FROM') || 'noreply@yourdomain.com',
  subject: 'Subscription Renewal Reminder',
  text: notification.message,
  html: `<p>${notification.message}</p>`,
});
```


### Using Resend


```typescript
import { Resend } from 'https://esm.sh/resend@1.0.0';


const resend = new Resend(Deno.env.get('RESEND_API_KEY'));


await resend.emails.send({
  from: 'noreply@yourdomain.com',
  to: userEmail,
  subject: 'Subscription Renewal Reminder',
  html: `<p>${notification.message}</p>`,
});
```


## 🧪 Testing


### Test Subscription Flow


1. **Create a test shop user**:
   ```sql
   -- Set up a test user in trial
   UPDATE user_profiles
   SET
     subscription_status = 'trial',
     trial_end_date = NOW() + INTERVAL '2 days',
     is_subscription_active = true
   WHERE email = 'test@example.com';
   ```


2. **Assign a subscription**:
   - Log in as admin
   - Go to Subscriptions page
   - Assign a plan to the test user


3. **Test expiration**:
   ```sql
   -- Force expiration for testing
   UPDATE user_profiles
   SET
     subscription_status = 'expired',
     is_subscription_active = false,
     trial_end_date = NOW() - INTERVAL '1 day'
   WHERE email = 'test@example.com';
   ```


4. **Test notifications**:
   ```bash
   # Manually trigger the subscription alerts function
   curl -X POST \
     'YOUR_SUPABASE_URL/functions/v1/subscription-alerts' \
     -H 'Authorization: Bearer YOUR_ANON_KEY'
   ```


## 🚨 Troubleshooting


### Users Not Getting Deactivated


Check if the cron job is running:
```sql
SELECT * FROM cron.job WHERE jobname = 'subscription-alerts-daily';
```


### Notifications Not Sending


1. Check Edge Function logs in Supabase Dashboard
2. Verify environment variables are set
3. Test the function manually using curl


### RLS Policy Issues


If admins can't see all subscriptions:
```sql
-- Grant admin access to all tables
GRANT ALL ON subscription_plans TO authenticated;
GRANT ALL ON payment_history TO authenticated;
GRANT ALL ON subscription_notifications TO authenticated;
```


## 📈 Monitoring & Analytics


### View Subscription Statistics


```sql
-- Get current stats
SELECT * FROM get_subscription_stats();


-- View all shop subscriptions
SELECT * FROM admin_shop_subscriptions;


-- Check overdue payments
SELECT * FROM admin_shop_subscriptions
WHERE payment_alert_status = 'overdue';
```


### Revenue Reports


```sql
-- Monthly revenue
SELECT
  DATE_TRUNC('month', payment_date) as month,
  SUM(amount) as total_revenue,
  COUNT(*) as transaction_count
FROM payment_history
WHERE payment_status = 'completed'
GROUP BY month
ORDER BY month DESC;


-- Revenue by plan type
SELECT
  sp.plan_type,
  sp.name,
  COUNT(ph.id) as transactions,
  SUM(ph.amount) as total_revenue
FROM payment_history ph
JOIN subscription_plans sp ON ph.subscription_plan_id = sp.id
WHERE ph.payment_status = 'completed'
GROUP BY sp.plan_type, sp.name;
```


## 🎓 Next Steps


1. **Set up payment gateway** (Stripe, PayPal, etc.)
2. **Configure email service** (SendGrid, AWS SES, Resend)
3. **Customize subscription plans** based on your pricing
4. **Test the complete flow** with test users
5. **Monitor subscriptions** regularly through the admin dashboard
6. **Set up webhooks** for payment gateway events
7. **Create backup/restore** procedures for subscription data


## 📞 Support


For issues or questions:
- Check Supabase logs for errors
- Review the Edge Function logs
- Check database query results
- Verify RLS policies are correct


## 🔐 Security Considerations


- ✅ RLS policies protect user data
- ✅ Service role key used only in Edge Functions
- ✅ Payment data encrypted at rest
- ✅ Subscription status checked on every request
- ✅ Admin-only functions properly secured


---


**Congratulations!** 🎉 Your SaaS subscription management system is now set up and ready to use.



