import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

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

      // Try to send email with Resend (optional - will work even if it fails)
      try {
        if (process.env.RESEND_API_KEY) {
          const { Resend } = await import('resend')
          const resend = new Resend(process.env.RESEND_API_KEY)

          await resend.emails.send({
            from: 'SmartFit Hub <noreply@smartfithub.com>',
            to: email,
            subject: 'Your SmartFit Hub Verification Code',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #00FF9C;">Welcome to SmartFit Hub!</h2>
                <p>Your verification code is:</p>
                <div style="font-size: 32px; font-weight: bold; color: #00FF9C; text-align: center; padding: 20px; border: 2px solid #00FF9C; border-radius: 8px; margin: 20px 0;">
                  ${generatedOtp}
                </div>
                <p>This code will expire in 5 minutes.</p>
                <p>If you didn't request this code, please ignore this email.</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="color: #666; font-size: 14px;">SmartFit Hub - Your AI Fitness Companion</p>
              </div>
            `,
          })

          console.log(`OTP email sent to ${email}: ${generatedOtp}`)
        } else {
          console.log(`Resend not configured - OTP for ${email}: ${generatedOtp}`)
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError)
        console.log(`OTP for ${email}: ${generatedOtp} (email failed, but OTP stored)`)
      }

      return NextResponse.json({
        message: 'OTP sent successfully',
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

      // Remove used OTP
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
