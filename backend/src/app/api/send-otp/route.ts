import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email, action, otp } = await request.json()

    if (action === 'send') {
      // Generate OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString()

      // Store OTP in database
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

      const { error } = await supabase
        .from('email_otps')
        .insert({
          email,
          otp: generatedOtp,
          expires_at: expiresAt,
        })

      if (error) {
        console.error('Error storing OTP:', error)
        return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })
      }

      // In production, you would send email here
      // For testing, we'll just log it
      console.log(`OTP for ${email}: ${generatedOtp}`)

      return NextResponse.json({
        message: 'OTP sent successfully',
        // For testing purposes, include OTP in response
        // Remove this in production
        test_otp: generatedOtp
      })
    }

    if (action === 'verify') {
      // Verify OTP
      const { data, error } = await supabase
        .from('email_otps')
        .select('*')
        .eq('email', email)
        .eq('otp', otp)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (error || !data) {
        return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 })
      }

      // Delete used OTP
      await supabase
        .from('email_otps')
        .delete()
        .eq('id', data.id)

      return NextResponse.json({ message: 'OTP verified successfully' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('OTP error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
