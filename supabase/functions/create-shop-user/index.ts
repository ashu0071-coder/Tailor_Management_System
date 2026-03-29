import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}


serve(async (req) => {
  console.log('🚀 Function invoked!', req.method, req.url)
 
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight')
    return new Response('ok', { headers: corsHeaders })
  }


  try {
    console.log('🔍 Processing request...')
    // Create client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )


    // Create client with anon key to validate user JWT
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )


    // Verify the request is from an admin
    const authHeader = req.headers.get('Authorization')
    console.log('📋 Auth header:', authHeader ? 'Present' : 'Missing')
   
    if (!authHeader) {
      console.log('❌ No auth header')
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      )
    }
   
    const token = authHeader.replace('Bearer ', '')
    console.log('🔑 Token extracted, length:', token.length)
   
    // Validate user JWT with anon key
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    console.log('👤 User validation:', user ? user.id : 'Failed', authError ? authError.message : 'No error')


    if (authError || !user) {
      console.log('❌ Auth failed')
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      )
    }


    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()


    if (!profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403
        }
      )
    }


    const { email, password, store_name, store_phone, subscription_plan_id } = await req.json()


    if (!email || !password || !store_name) {
      return new Response(
        JSON.stringify({ error: 'Email, password, and store name are required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }


    if (!subscription_plan_id) {
      return new Response(
        JSON.stringify({ error: 'Subscription plan is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }


    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }


    // Create the new user with service role
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        store_name: store_name
      }
    })


    if (createError) {
      throw createError
    }


    if (!newUser.user) {
      return new Response(
        JSON.stringify({ error: 'User creation failed - no user returned' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }


    // Get subscription plan details
    const { data: planData, error: planError } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('id', subscription_plan_id)
      .single()


    if (planError || !planData) {
      // Clean up auth user
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return new Response(
        JSON.stringify({ error: 'Invalid subscription plan' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }


    // Calculate subscription dates based on plan type
    const now = new Date()
    let subscriptionEndDate = null
    let nextBillingDate = null
   
    if (planData.plan_type === 'monthly') {
      // Monthly subscription: 1 month from creation
      subscriptionEndDate = new Date(now)
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1)
      nextBillingDate = subscriptionEndDate
    }
    // For one-time payment: no end date, no billing date


    // Create the user profile with subscription
    const { error: profileInsertError } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        id: newUser.user.id,
        email: email,
        store_name: store_name,
        store_phone: store_phone || null,
        role: 'user',
        subscription_plan_id: subscription_plan_id,
        subscription_status: 'active',
        subscription_start_date: now.toISOString(),
        subscription_end_date: subscriptionEndDate?.toISOString() || null,
        next_billing_date: nextBillingDate?.toISOString() || null,
        is_subscription_active: true
      }, {
        onConflict: 'id'
      })


    if (profileInsertError) {
      console.error('Profile creation error:', profileInsertError)
      // Try to clean up the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      throw profileInsertError
    }


    // Create payment history record
    await supabaseAdmin
      .from('payment_history')
      .insert({
        user_id: newUser.user.id,
        subscription_plan_id: subscription_plan_id,
        amount: planData.price,
        currency: planData.currency,
        payment_status: 'completed',
        payment_method: 'admin_assigned',
        payment_date: now.toISOString(),
        billing_period_start: now.toISOString(),
        billing_period_end: subscriptionEndDate?.toISOString() || null,
        notes: `Subscription assigned by admin during user creation`
      })


    return new Response(
      JSON.stringify({
        success: true,
        message: 'Shop user created successfully',
        user: {
          id: newUser.user.id,
          email: email,
          store_name: store_name,
          store_phone: store_phone
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )


  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})



