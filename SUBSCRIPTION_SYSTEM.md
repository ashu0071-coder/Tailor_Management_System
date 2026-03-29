# Subscription System Documentation


## Overview
Simplified SaaS subscription management system for the Tailor Management application with two payment models: **One-Time Payment** and **Monthly Subscription**.


## Key Features


### 1. **No Trial Period**
- Users are created directly with their selected subscription plan
- No 14-day trial or grace period
- Immediate activation upon creation


### 2. **Two Subscription Types**


#### One-Time Payment (₹10,000)
- **Duration**: Lifetime access
- **No expiry**: Access never expires
- **No reminders**: System doesn't send renewal notifications
- **No billing date**: `next_billing_date` is NULL


#### Monthly Subscription (₹500/month)
- **Duration**: Exactly 1 month from account creation
- **Billing cycle**: Starts from `subscription_start_date`
- **Renewal reminders**: Sent 3 days before expiry (only for monthly plans)
- **Auto-expiration**: Account deactivated if payment not received by `next_billing_date`


### 3. **Admin Control**
- Admin selects subscription plan during user creation
- Plan selection is **mandatory** when creating new shops
- Admin can manually activate/deactivate any shop
- No payment processing - admin marks subscriptions as active


## How It Works


### User Creation Flow
1. Admin goes to "Shop Management"
2. Clicks "Add Shop"
3. Fills in:
   - Email
   - Password
   - Shop Name
   - Phone (optional)
   - **Subscription Plan** (required - One-time or Monthly)
4. System automatically:
   - Creates user account
   - Activates subscription immediately
   - Sets `subscription_start_date` to current date
   - For monthly: Sets `subscription_end_date` to +1 month
   - For monthly: Sets `next_billing_date` to +1 month
   - For one-time: Both dates remain NULL
   - Creates payment history record


### Monthly Subscription Lifecycle


#### Initial State (Day 0)
```
subscription_status: 'active'
subscription_start_date: 2026-02-25 10:00:00
subscription_end_date: 2026-03-25 10:00:00
next_billing_date: 2026-03-25 10:00:00
is_subscription_active: true
```


#### 3 Days Before Expiry (Day 27)
- Daily cron job runs at 9:00 AM UTC
- System creates renewal reminder notification
- Notification stored in `subscription_notifications` table
- Email would be sent (if email service integrated)


#### Expiry Day (Day 30)
- Daily cron job runs
- If no payment received by `next_billing_date`:
  ```
  subscription_status: 'expired'
  is_subscription_active: false
  ```
- User loses access to system


#### After Renewal Payment
- Admin manually assigns new subscription
- Or use the "Assign Plan" feature in Admin Subscriptions


### One-Time Payment Lifecycle


#### Initial State
```
subscription_status: 'active'
subscription_start_date: 2026-02-25 10:00:00
subscription_end_date: NULL
next_billing_date: NULL
is_subscription_active: true
```


#### Forever Active
- Never expires
- No reminders sent
- Always active unless manually deactivated by admin


## Database Schema


### User Profile Fields
```sql
subscription_plan_id      UUID         -- References subscription_plans.id
subscription_status       VARCHAR(20)  -- 'active', 'inactive', 'expired', 'cancelled'
subscription_start_date   TIMESTAMPTZ  -- When subscription was activated
subscription_end_date     TIMESTAMPTZ  -- NULL for one-time, +1 month for monthly
next_billing_date         TIMESTAMPTZ  -- NULL for one-time, +1 month for monthly
is_subscription_active    BOOLEAN      -- Quick access check
```


### Subscription Plans
```sql
One-Time Purchase
- price: 10000.00 INR
- plan_type: 'one_time'


Monthly Subscription
- price: 500.00 INR
- plan_type: 'monthly'
```


### Payment History
Every subscription assignment creates a payment record:
```sql
user_id
subscription_plan_id
amount
currency: 'INR'
payment_status: 'completed'
payment_method: 'admin_assigned'
notes: 'Subscription assigned by admin during user creation'
```


## Cron Jobs


### Daily Subscription Alerts (9:00 AM UTC)
Runs: `subscription-alerts` Edge Function


**Actions:**
1. Create renewal notifications for monthly subscriptions (3 days before)
2. Expire overdue monthly subscriptions
3. Send pending notifications (if email service configured)


**Query:**
```sql
SELECT cron.schedule(
  'daily-subscription-alerts',
  '0 9 * * *',
  $$ SELECT net.http_post(...) $$
);
```


## Admin Features


### Shop Management Page
- Create new shops with subscription selection
- Edit shop details (name, phone, email)
- Update passwords
- Delete shops


### Subscription Management Page
**Statistics:**
- Total Shops
- Active Subscriptions
- Monthly Revenue (sum of active monthly plans)
- Pending Renewals (monthly plans expiring in 7 days)


**Shop Cards:**
- View all shops with subscription details
- Quick activate/deactivate toggle
- Assign/change subscription plans
- View payment history
- Alert indicators for overdue/due soon


## Access Control


### Protected Routes
```javascript
// ProtectedRoute checks:
is_subscription_active === true
```


### Subscription Status Check
```sql
-- Admins: Always have access
-- One-time: Active if subscription_status = 'active'
-- Monthly: Active if subscription_status = 'active' AND subscription_end_date > NOW()
```


## Edge Functions


### 1. create-shop-user
**Purpose**: Create new shop with subscription


**Input:**
```json
{
  "email": "shop@example.com",
  "password": "password123",
  "store_name": "My Tailor Shop",
  "store_phone": "+91 98765 43210",
  "subscription_plan_id": "uuid-here"
}
```


**Process:**
1. Validate admin authorization
2. Validate subscription plan exists
3. Create auth user
4. Calculate subscription dates based on plan type
5. Create user profile with subscription
6. Create payment history record


**Output:**
```json
{
  "success": true,
  "message": "Shop user created successfully",
  "user": { /* user details */ }
}
```


### 2. subscription-alerts
**Purpose**: Daily automated subscription management


**Process:**
1. Call `create_renewal_notifications()` - Creates notifications for monthly plans expiring in 3 days
2. Call `expire_overdue_subscriptions()` - Marks overdue subscriptions as expired
3. Fetch and send pending notifications
4. Mark notifications as sent


**Runs**: Daily at 9:00 AM UTC via pg_cron


## Deployment Instructions


### 1. Database Setup
Run in Supabase SQL Editor:
```bash
# File: database/subscription_setup.sql
```


This creates:
- subscription_plans table with 2 plans
- Payment history tracking
- Notification system
- Database functions
- RLS policies
- Admin view


### 2. Deploy Edge Functions
```bash
# Already deployed via Supabase Dashboard:
# - create-shop-user
# - subscription-alerts
# - process-subscription-payment
```


### 3. Setup Cron Job
Run in Supabase SQL Editor:
```sql
SELECT cron.schedule(
  'daily-subscription-alerts',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url:='https://opwccxudpfrxlqpekhcj.supabase.co/functions/v1/subscription-alerts',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);
```


### 4. Verify Setup
```sql
-- Check subscription plans
SELECT * FROM subscription_plans;


-- Check cron job
SELECT * FROM cron.job;


-- Check functions exist
SELECT routine_name FROM information_schema.routines
WHERE routine_name LIKE '%subscription%';
```


## Future Enhancements


### Optional Features (Not Implemented)
1. **Payment Gateway Integration**
   - Razorpay (India)
   - Stripe
   - PayPal


2. **Email Service Integration**
   - SendGrid
   - AWS SES
   - Resend


3. **SMS Notifications**
   - Twilio
   - MSG91 (India)


4. **Automatic Payment Processing**
   - Recurring billing for monthly subscriptions
   - Auto-renewal


## Testing Checklist


- [ ] Create shop with one-time payment
- [ ] Verify shop has immediate access
- [ ] Verify no expiry date set
- [ ] Create shop with monthly subscription
- [ ] Verify subscription_end_date is +1 month
- [ ] Test manual activate/deactivate
- [ ] Verify expired subscriptions lose access
- [ ] Check cron job execution
- [ ] Verify notifications created 3 days before
- [ ] Test payment history recording


## Support


For issues or questions:
1. Check database logs in Supabase Dashboard
2. Check Edge Function logs
3. Check cron job execution history
4. Review RLS policies for access issues


---


**Last Updated**: February 25, 2026
**Version**: 2.0 (Simplified - No Trials, Admin-Controlled)



