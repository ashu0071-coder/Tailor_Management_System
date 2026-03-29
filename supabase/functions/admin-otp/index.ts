import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}


// Simple OTP storage (in production, use Redis or database)
const otpStore = new Map<string, { otp: string; expires: number; attempts: number }>()


// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }


  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )


    const { email, action } = await req.json()


    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }


    // Check if user exists and is admin
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, email')
      .eq('email', email)
      .single()


    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      )
    }


    if (profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'OTP is only available for admin users' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403
        }
      )
    }


    if (action === 'send') {
      // Generate OTP
      const otp = generateOTP()
      const expires = Date.now() + 10 * 60 * 1000 // 10 minutes


      // Store OTP
      otpStore.set(email, { otp, expires, attempts: 0 })


      // Send OTP via email using Resend
      const resendApiKey = Deno.env.get('RESEND_API_KEY')
     
      if (resendApiKey) {
        try {
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Tailor Management <onboarding@resend.dev>', // Use resend.dev for testing
              to: email,
              subject: 'Your Admin Login OTP',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #667eea;">Tailor Management - Admin Login</h2>
                  <p>Your OTP code is:</p>
                  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                    <h1 style="color: #667eea; font-size: 32px; letter-spacing: 8px; margin: 0;">${otp}</h1>
                  </div>
                  <p>This code will expire in 10 minutes.</p>
                  <p style="color: #64748b; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
                </div>
              `,
            }),
          })


          if (!emailResponse.ok) {
            const errorData = await emailResponse.json()
            console.error('Resend email error:', errorData)
            throw new Error('Failed to send OTP email')
          }


          console.log(`OTP sent to ${email} via Resend`)
        } catch (emailError) {
          console.error('Email sending error:', emailError)
          // Fallback to console log if email fails
          console.log(`OTP for ${email}: ${otp}`)
        }
      } else {
        // Development mode - log OTP to console
        console.log(`OTP for ${email}: ${otp}`)
      }


      return new Response(
        JSON.stringify({
          success: true,
          message: 'OTP sent to email',
          // In development, include OTP in response for testing
          ...((!resendApiKey) && { otp })
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    } else if (action === 'verify') {
      const { otp: inputOtp } = await req.json()


      if (!inputOtp) {
        return new Response(
          JSON.stringify({ error: 'OTP is required' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        )
      }


      const stored = otpStore.get(email)


      if (!stored) {
        return new Response(
          JSON.stringify({ error: 'OTP not found or expired. Please request a new one.' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        )
      }


      // Check expiration
      if (Date.now() > stored.expires) {
        otpStore.delete(email)
        return new Response(
          JSON.stringify({ error: 'OTP expired. Please request a new one.' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        )
      }


      // Check attempts
      if (stored.attempts >= 3) {
        otpStore.delete(email)
        return new Response(
          JSON.stringify({ error: 'Too many failed attempts. Please request a new OTP.' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        )
      }


      // Verify OTP
      if (stored.otp !== inputOtp) {
        stored.attempts++
        return new Response(
          JSON.stringify({
            error: 'Invalid OTP',
            attemptsLeft: 3 - stored.attempts
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        )
      }


      // OTP verified successfully
      otpStore.delete(email)


      return new Response(
        JSON.stringify({
          success: true,
          message: 'OTP verified successfully'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "send" or "verify"' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }


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



