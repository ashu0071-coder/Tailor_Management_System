import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}


interface NotificationRecord {
  user_id: string
  email: string
  store_name: string
  next_billing_date: string
  price: number
  currency: string
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


    console.log('Starting subscription alerts check...')


    // Run the notification creation function
    const { data: notificationCount, error: functionError } = await supabaseClient
      .rpc('create_renewal_notifications')


    if (functionError) {
      console.error('Error creating notifications:', functionError)
      throw functionError
    }


    console.log(`Created ${notificationCount} renewal notifications`)


    // Run the expiration function
    const { data: expiredCount, error: expireError } = await supabaseClient
      .rpc('expire_overdue_subscriptions')


    if (expireError) {
      console.error('Error expiring subscriptions:', expireError)
      throw expireError
    }


    console.log(`Expired ${expiredCount} overdue subscriptions`)


    // Fetch pending notifications that need to be sent
    const { data: pendingNotifications, error: fetchError } = await supabaseClient
      .from('subscription_notifications')
      .select(`
        id,
        user_id,
        notification_type,
        message,
        metadata
      `)
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .limit(100)


    if (fetchError) {
      console.error('Error fetching notifications:', fetchError)
      throw fetchError
    }


    console.log(`Found ${pendingNotifications?.length || 0} pending notifications to send`)


    // Send notifications (in a real app, integrate with email service like SendGrid, AWS SES, etc.)
    const sentNotifications: string[] = []
    const failedNotifications: string[] = []


    for (const notification of pendingNotifications || []) {
      try {
        // Here you would integrate with your email service
        // For example: await sendEmail(notification)
        console.log(`Sending notification to user ${notification.user_id}:`, notification.message)
       
        // For now, we'll just log it and mark as sent
        // In production, integrate with:
        // - SendGrid: https://sendgrid.com/
        // - AWS SES: https://aws.amazon.com/ses/
        // - Resend: https://resend.com/
        // - Or any other email service
       
        // Mark notification as sent
        const { error: updateError } = await supabaseClient
          .from('subscription_notifications')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
          })
          .eq('id', notification.id)


        if (updateError) {
          console.error(`Error updating notification ${notification.id}:`, updateError)
          failedNotifications.push(notification.id)
        } else {
          sentNotifications.push(notification.id)
        }
      } catch (notificationError) {
        console.error(`Error sending notification ${notification.id}:`, notificationError)
        failedNotifications.push(notification.id)
       
        // Mark as failed
        await supabaseClient
          .from('subscription_notifications')
          .update({ status: 'failed' })
          .eq('id', notification.id)
      }
    }


    const response = {
      success: true,
      notifications_created: notificationCount,
      subscriptions_expired: expiredCount,
      notifications_sent: sentNotifications.length,
      notifications_failed: failedNotifications.length,
      timestamp: new Date().toISOString(),
    }


    console.log('Subscription alerts completed:', response)


    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in subscription alerts function:', error)
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



