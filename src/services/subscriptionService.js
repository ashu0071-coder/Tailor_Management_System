import { supabase, isAbortError } from './supabase';


// ============================================================================
// SUBSCRIPTION PLANS
// ============================================================================


/**
 * Get all available subscription plans
 */
export const getSubscriptionPlans = async () => {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true });


  if (error) throw error;
  return data;
};


/**
 * Get a specific subscription plan by ID
 */
export const getSubscriptionPlan = async (planId) => {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', planId)
    .single();


  if (error) throw error;
  return data;
};


// ============================================================================
// USER SUBSCRIPTION STATUS
// ============================================================================


/**
 * Get current user's subscription details
 */
export const getCurrentUserSubscription = async () => {
  const { data: { user } } = await supabase.auth.getUser();
 
  if (!user) throw new Error('User not authenticated');


  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      *,
      subscription_plans (
        id,
        name,
        plan_type,
        price,
        currency,
        features
      )
    `)
    .eq('id', user.id)
    .single();


  if (error) throw error;
  return data;
};


/**
 * Check if current user's subscription is active
 */
export const isSubscriptionActive = async () => {
  try {
    const subscription = await getCurrentUserSubscription();
   
    // Admins always have access
    if (subscription.role === 'admin') {
      return true;
    }


    // Check if subscription is active
    if (subscription.subscription_status === 'active' && subscription.is_subscription_active) {
      return true;
    }


    // Check if still in trial
    if (subscription.subscription_status === 'trial') {
      const trialEndDate = new Date(subscription.trial_end_date);
      return trialEndDate > new Date();
    }


    return false;
  } catch (error) {
    if (isAbortError(error)) {
      // Non-actionable aborted request (likely dev HMR/StrictMode or timeout). Treat as no subscription.
      return false;
    }
    console.error('Error checking subscription status:', error);
    return false;
  }
};


/**
 * Get days remaining in trial or until next billing
 */
export const getDaysRemaining = async () => {
  const subscription = await getCurrentUserSubscription();
 
  if (subscription.subscription_status === 'trial' && subscription.trial_end_date) {
    const trialEnd = new Date(subscription.trial_end_date);
    const now = new Date();
    const daysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
    return { type: 'trial', days: daysRemaining };
  }


  if (subscription.next_billing_date) {
    const billingDate = new Date(subscription.next_billing_date);
    const now = new Date();
    const daysRemaining = Math.ceil((billingDate - now) / (1000 * 60 * 60 * 24));
    return { type: 'billing', days: daysRemaining };
  }


  return null;
};


// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================


/**
 * Subscribe to a plan
 */
export const subscribeToPlan = async (planId, paymentDetails = {}) => {
  const { data: { user } } = await supabase.auth.getUser();
 
  if (!user) throw new Error('User not authenticated');


  // Get the plan details
  const plan = await getSubscriptionPlan(planId);
 
  const now = new Date();
  const subscriptionData = {
    subscription_plan_id: planId,
    subscription_status: 'active',
    is_subscription_active: true,
    subscription_start_date: now.toISOString(),
  };


  // Set dates based on plan type
  if (plan.plan_type === 'monthly') {
    const nextBilling = new Date(now);
    nextBilling.setMonth(nextBilling.getMonth() + 1);
   
    const endDate = new Date(nextBilling);
   
    subscriptionData.next_billing_date = nextBilling.toISOString();
    subscriptionData.subscription_end_date = endDate.toISOString();
  } else {
    // One-time purchase - no end date
    subscriptionData.subscription_end_date = null;
    subscriptionData.next_billing_date = null;
  }


  // Update user profile with subscription
  const { data: profileData, error: profileError } = await supabase
    .from('user_profiles')
    .update(subscriptionData)
    .eq('id', user.id)
    .select()
    .single();


  if (profileError) throw profileError;


  // Create payment record
  const paymentData = {
    user_id: user.id,
    subscription_plan_id: planId,
    amount: plan.price,
    currency: plan.currency,
    payment_status: 'completed',
    payment_method: paymentDetails.method || 'manual',
    transaction_id: paymentDetails.transactionId || null,
    billing_period_start: now.toISOString(),
    billing_period_end: plan.plan_type === 'monthly'
      ? subscriptionData.subscription_end_date
      : null,
    notes: paymentDetails.notes || `Subscribed to ${plan.name}`,
  };


  const { data: paymentRecord, error: paymentError } = await supabase
    .from('payment_history')
    .insert([paymentData])
    .select()
    .single();


  if (paymentError) throw paymentError;


  return { subscription: profileData, payment: paymentRecord };
};


/**
 * Cancel subscription
 */
export const cancelSubscription = async () => {
  const { data: { user } } = await supabase.auth.getUser();
 
  if (!user) throw new Error('User not authenticated');


  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      subscription_status: 'cancelled',
      is_subscription_active: false,
    })
    .eq('id', user.id)
    .select()
    .single();


  if (error) throw error;
  return data;
};


/**
 * Renew subscription (process payment for monthly subscription)
 */
export const renewSubscription = async (paymentDetails = {}) => {
  const { data: { user } } = await supabase.auth.getUser();
 
  if (!user) throw new Error('User not authenticated');


  const subscription = await getCurrentUserSubscription();
  const plan = subscription.subscription_plans;


  if (plan.plan_type !== 'monthly') {
    throw new Error('Only monthly subscriptions can be renewed');
  }


  const now = new Date();
  const nextBilling = new Date(now);
  nextBilling.setMonth(nextBilling.getMonth() + 1);
 
  const endDate = new Date(nextBilling);


  // Update subscription dates
  const { data: profileData, error: profileError } = await supabase
    .from('user_profiles')
    .update({
      subscription_status: 'active',
      is_subscription_active: true,
      subscription_end_date: endDate.toISOString(),
      next_billing_date: nextBilling.toISOString(),
    })
    .eq('id', user.id)
    .select()
    .single();


  if (profileError) throw profileError;


  // Create payment record
  const paymentData = {
    user_id: user.id,
    subscription_plan_id: plan.id,
    amount: plan.price,
    currency: plan.currency,
    payment_status: 'completed',
    payment_method: paymentDetails.method || 'manual',
    transaction_id: paymentDetails.transactionId || null,
    billing_period_start: now.toISOString(),
    billing_period_end: endDate.toISOString(),
    notes: paymentDetails.notes || 'Monthly subscription renewal',
  };


  const { data: paymentRecord, error: paymentError } = await supabase
    .from('payment_history')
    .insert([paymentData])
    .select()
    .single();


  if (paymentError) throw paymentError;


  return { subscription: profileData, payment: paymentRecord };
};


// ============================================================================
// PAYMENT HISTORY
// ============================================================================


/**
 * Get payment history for current user
 */
export const getUserPaymentHistory = async () => {
  const { data: { user } } = await supabase.auth.getUser();
 
  if (!user) throw new Error('User not authenticated');


  const { data, error } = await supabase
    .from('payment_history')
    .select(`
      *,
      subscription_plans (
        name,
        plan_type
      )
    `)
    .eq('user_id', user.id)
    .order('payment_date', { ascending: false });


  if (error) throw error;
  return data;
};


/**
 * Get all payment history (admin only)
 */
export const getAllPaymentHistory = async () => {
  const { data, error } = await supabase
    .from('payment_history')
    .select(`
      *,
      subscription_plans (
        name,
        plan_type
      )
    `)
    .order('payment_date', { ascending: false });


  if (error) throw error;
  return data;
};


// ============================================================================
// ADMIN FUNCTIONS
// ============================================================================


/**
 * Get all shops with their subscription details (admin only)
 */
export const getAllShopSubscriptions = async () => {
  const { data, error } = await supabase
    .from('admin_shop_subscriptions')
    .select('*')
    .order('created_at', { ascending: false });


  if (error) throw error;
  return data;
};


/**
 * Get subscription statistics (admin only)
 */
export const getSubscriptionStats = async () => {
  const { data, error } = await supabase
    .rpc('get_subscription_stats');


  if (error) throw error;
  return data;
};


/**
 * Manually update shop subscription status (admin only)
 */
export const updateShopSubscriptionStatus = async (userId, status, isActive) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      subscription_status: status,
      is_subscription_active: isActive,
    })
    .eq('id', userId)
    .select()
    .single();


  if (error) throw error;
  return data;
};


/**
 * Manually activate/deactivate a shop (admin only)
 */
export const toggleShopActive = async (userId, isActive) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      is_subscription_active: isActive,
      subscription_status: isActive ? 'active' : 'inactive',
    })
    .eq('id', userId)
    .select()
    .single();


  if (error) throw error;
  return data;
};


/**
 * Assign a subscription plan to a shop (admin only)
 */
export const assignSubscriptionPlan = async (userId, planId, paymentDetails = {}) => {
  // Get the plan details
  const plan = await getSubscriptionPlan(planId);
 
  const now = new Date();
  const subscriptionData = {
    subscription_plan_id: planId,
    subscription_status: 'active',
    is_subscription_active: true,
    subscription_start_date: now.toISOString(),
  };


  // Set dates based on plan type
  if (plan.plan_type === 'monthly') {
    const nextBilling = new Date(now);
    nextBilling.setMonth(nextBilling.getMonth() + 1);
   
    const endDate = new Date(nextBilling);
   
    subscriptionData.next_billing_date = nextBilling.toISOString();
    subscriptionData.subscription_end_date = endDate.toISOString();
  } else {
    subscriptionData.subscription_end_date = null;
    subscriptionData.next_billing_date = null;
  }


  // Update user profile
  const { data: profileData, error: profileError } = await supabase
    .from('user_profiles')
    .update(subscriptionData)
    .eq('id', userId)
    .select()
    .single();


  if (profileError) throw profileError;


  // Create payment record if payment details provided
  if (paymentDetails.createPaymentRecord !== false) {
    const paymentData = {
      user_id: userId,
      subscription_plan_id: planId,
      amount: plan.price,
      currency: plan.currency,
      payment_status: paymentDetails.status || 'completed',
      payment_method: paymentDetails.method || 'admin_assigned',
      transaction_id: paymentDetails.transactionId || null,
      billing_period_start: now.toISOString(),
      billing_period_end: plan.plan_type === 'monthly'
        ? subscriptionData.subscription_end_date
        : null,
      notes: paymentDetails.notes || `Admin assigned ${plan.name}`,
    };


    await supabase
      .from('payment_history')
      .insert([paymentData]);
  }


  return profileData;
};


// ============================================================================
// NOTIFICATIONS
// ============================================================================


/**
 * Get user's subscription notifications
 */
export const getUserNotifications = async () => {
  const { data: { user } } = await supabase.auth.getUser();
 
  if (!user) throw new Error('User not authenticated');


  const { data, error } = await supabase
    .from('subscription_notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);


  if (error) throw error;
  return data;
};


/**
 * Get unread notifications count
 */
export const getUnreadNotificationsCount = async () => {
  const { data: { user } } = await supabase.auth.getUser();
 
  if (!user) throw new Error('User not authenticated');


  const { count, error } = await supabase
    .from('subscription_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'sent')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days


  if (error) throw error;
  return count || 0;
};


export default {
  // Plans
  getSubscriptionPlans,
  getSubscriptionPlan,
 
  // User Subscription
  getCurrentUserSubscription,
  isSubscriptionActive,
  getDaysRemaining,
  subscribeToPlan,
  cancelSubscription,
  renewSubscription,
 
  // Payment History
  getUserPaymentHistory,
  getAllPaymentHistory,
 
  // Admin Functions
  getAllShopSubscriptions,
  getSubscriptionStats,
  updateShopSubscriptionStatus,
  toggleShopActive,
  assignSubscriptionPlan,
 
  // Notifications
  getUserNotifications,
  getUnreadNotificationsCount,
};



