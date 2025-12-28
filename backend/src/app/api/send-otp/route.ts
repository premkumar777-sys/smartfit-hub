import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

// Simple in-memory OTP storage for testing
const otpStorage: { [key: string]: { otp: string; expiresAt: number } } = {}

export async function POST(request: NextRequest) {
  try {
    const { email, action, otp } = await request.json()

    if (action === 'send') {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString()

      otpStorage[email] = {
        otp: generatedOtp,
        expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
      }

      console.log(`OTP for ${email}: ${generatedOtp}`)

      return NextResponse.json({
        message: 'OTP sent successfully',
        test_otp: generatedOtp
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      })
    }

    if (action === 'verify') {
      const storedOtp = otpStorage[email]

      if (!storedOtp || storedOtp.otp !== otp || storedOtp.expiresAt < Date.now()) {
        return NextResponse.json({ error: 'Invalid or expired OTP' }, {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        })
      }

      delete otpStorage[email]

      return NextResponse.json({ message: 'OTP verified successfully' }, {
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
    console.error('OTP error:', error)
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
