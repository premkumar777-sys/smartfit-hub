import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

      console.log(`Phone OTP for ${phone}: ${generatedOtp}`)

      return NextResponse.json({
        message: 'Phone OTP sent successfully',
        test_otp: generatedOtp // Remove in production
      })
    }

    if (action === 'verify') {
      // Verify OTP
      const storedOtp = phoneOtpStorage[phone]

      if (!storedOtp || storedOtp.otp !== otp || storedOtp.expiresAt < Date.now()) {
        return NextResponse.json({ error: 'Invalid or expired phone OTP' }, { status: 400 })
      }

      // Remove used OTP
      delete phoneOtpStorage[phone]

      return NextResponse.json({ message: 'Phone OTP verified successfully' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Phone OTP error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
