import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Simple in-memory OTP storage for testing (replace with database later)
const otpStorage: { [key: string]: { otp: string; expiresAt: number } } = {}

export async function POST(request: NextRequest) {
  try {
    const { email, action, otp } = await request.json()

    if (action === 'send') {
      // Generate OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString()

      // Store OTP in memory (for testing)
      otpStorage[email] = {
        otp: generatedOtp,
        expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
      }

      console.log(`OTP for ${email}: ${generatedOtp}`)

      return NextResponse.json({
        message: 'OTP sent successfully',
        test_otp: generatedOtp // Remove in production
      })
    }

    if (action === 'verify') {
      // Verify OTP
      const storedOtp = otpStorage[email]

      if (!storedOtp || storedOtp.otp !== otp || storedOtp.expiresAt < Date.now()) {
        return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 })
      }

      // Remove used OTP
      delete otpStorage[email]

      return NextResponse.json({ message: 'OTP verified successfully' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('OTP error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
