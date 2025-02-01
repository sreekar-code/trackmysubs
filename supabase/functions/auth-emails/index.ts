import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from 'https://esm.sh/resend@1.0.0'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'), {
  port: 587, // Set SMTP port to 587
  secure: true // Use TLS
})

const SITE_URL = Deno.env.get('SITE_URL') || 'https://trackmysubs.in'

serve(async (req) => {
  const { type, email, data } = await req.json()

  try {
    switch (type) {
      case 'reset_password': {
        if (!data.redirectUrl) {
          throw new Error('Redirect URL is required')
        }

        await resend.emails.send({
          from: 'TrackMySubs <noreply@trackmysubs.in>',
          to: email,
          subject: 'Reset your password',
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Reset Your Password</title>
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 32px;">
                  <h1 style="color: #1F2937; margin-bottom: 16px;">Reset Your Password</h1>
                  <p style="color: #6B7280; margin-bottom: 24px;">We received a request to reset your password. You'll receive another email from Supabase with a link to reset your password.</p>
                  <p style="color: #6B7280; margin-top: 24px; font-size: 14px;">If you didn't request this password reset, you can safely ignore this email.</p>
                  <p style="color: #6B7280; margin-top: 8px; font-size: 14px;">The reset link will expire in 24 hours.</p>
                </div>
                <div style="text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #E5E7EB;">
                  <p style="color: #9CA3AF; font-size: 12px;">© ${new Date().getFullYear()} TrackMySubs. All rights reserved.</p>
                </div>
              </body>
            </html>
          `
        })
        break
      }
      
      default:
        throw new Error(`Unsupported email type: ${type}`)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to send email',
      details: error.toString()
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    })
  }
})