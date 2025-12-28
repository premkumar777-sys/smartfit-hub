import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

// Simple in-memory OTP storage for testing (replace with database later)
const phoneOtpStorage: { [key: string]: { otp: string; expiresAt: number } } = {}

export async function POST(request: NextRequest) {
  try {
    const { phone, action, otp } = await request.json()

    if (action === 'send') {
      // Generate OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString()

      // Store OTP in memory (for testing)
      phoneOtpStorage[phone] = {
        otp: generatedOtp,
        expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
      }

      // Try to send SMS via Resend (optional - will work even if it fails)
      try {
        if (process.env.RESEND_API_KEY) {
          const { Resend } = await import('resend')
          const resend = new Resend(process.env.RESEND_API_KEY)

          const emailForSms = `${phone}@sms.resend.dev` // Resend's SMS gateway

          await resend.emails.send({
            from: 'SmartFit Hub <noreply@smartfithub.com>',
            to: emailForSms,
            subject: `Your verification code: ${generatedOtp}`,
            text: `Your SmartFit Hub verification code is: ${generatedOtp}. This code will expire in 5 minutes.`,
          })

          console.log(`Phone OTP SMS sent to ${phone}: ${generatedOtp}`)
        } else {
          console.log(`Resend not configured - Phone OTP for ${phone}: ${generatedOtp}`)
        }
      } catch (smsError) {
        console.error('Error sending SMS:', smsError)
        console.log(`Phone OTP for ${phone}: ${generatedOtp} (SMS failed, but OTP stored)`)
      }

      return NextResponse.json({
        message: 'Phone OTP sent successfully',
        test_otp: generatedOtp // For testing - remove in production
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      })
    }

    if (action === 'verify') {
      // Verify OTP
      const storedOtp = phoneOtpStorage[phone]

      if (!storedOtp || storedOtp.otp !== otp || storedOtp.expiresAt < Date.now()) {
        return NextResponse.json({ error: 'Invalid or expired phone OTP' }, {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        })
      }

      // Remove used OTP
      delete phoneOtpStorage[phone]

      return NextResponse.json({ message: 'Phone OTP verified successfully' }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, {
      status: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
  } catch (error: any) {
    console.error('Phone OTP error:', error)
    return NextResponse.json({ error: error.message }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
  }
}
