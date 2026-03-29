import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}


serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }


  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )


    // Get request body
    const { userId, planId, paymentDetails } = await req.json()


    if (!userId || !planId) {
      throw new Error('userId and planId are required')
    }


    // Get the plan details
    const { data: plan, error: planError } = await supabaseClient
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single()


    if (planError || !plan) {
      throw new Error('Invalid plan ID')
    }


    const now = new Date()
    const subscriptionData: any = {
      subscription_plan_id: planId,
      subscription_status: 'active',
      is_subscription_active: true,
      subscription_start_date: now.toISOString(),
    }


    // Set dates based on plan type
    if (plan.plan_type === 'monthly') {
      const nextBilling = new Date(now)
      nextBilling.setMonth(nextBilling.getMonth() + 1)
     
      const endDate = new Date(nextBilling)
     
      subscriptionData.next_billing_date = nextBilling.toISOString()
      subscriptionData.subscription_end_date = endDate.toISOString()
    } else {
      subscriptionData.subscription_end_date = null
      subscriptionData.next_billing_date = null
    }


    // Update user profile with subscription
    const { data: profileData, error: profileError } = await supabaseClient
      .from('user_profiles')
      .update(subscriptionData)
      .eq('id', userId)
      .select()
      .single()


    if (profileError) {
      throw profileError
    }


    // Create payment record
    const paymentData = {
      user_id: userId,
      subscription_plan_id: planId,
      amount: plan.price,
      currency: plan.currency,
      payment_status: paymentDetails?.status || 'completed',
      payment_method: paymentDetails?.method || 'stripe',
      transaction_id: paymentDetails?.transactionId || null,
      billing_period_start: now.toISOString(),
      billing_period_end: plan.plan_type === 'monthly'
        ? subscriptionData.subscription_end_date
        : null,
      notes: paymentDetails?.notes || `Subscribed to ${plan.name}`,
    }


    const { data: paymentRecord, error: paymentError } = await supabaseClient
      .from('payment_history')
      .insert([paymentData])
      .select()
      .single()


    if (paymentError) {
      throw paymentError
    }


    return new Response(
      JSON.stringify({
        success: true,
        subscription: profileData,
        payment: paymentRecord,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error processing subscription payment:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})



