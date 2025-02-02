import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'https://deno.land/std@0.168.0/crypto/mod.ts'

const RAZORPAY_WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// Verify Razorpay webhook signature
function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const hmac = createHmac('sha256', secret)
  hmac.update(body)
  const digest = hmac.digest('hex')
  return digest === signature
}

serve(async (req) => {
  try {
    // Verify Razorpay signature
    const signature = req.headers.get('x-razorpay-signature')
    if (!signature) {
      return new Response('Missing signature', { status: 401 })
    }

    // Get the raw body
    const body = await req.text()
    
    // Verify the signature
    const isValid = verifyWebhookSignature(body, signature, RAZORPAY_WEBHOOK_SECRET!)
    if (!isValid) {
      return new Response('Invalid signature', { status: 401 })
    }

    // Parse the webhook payload
    const payload = JSON.parse(body)

    // Initialize Supabase client
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    )

    // Call the webhook handler function
    const { data, error } = await supabase
      .rpc('handle_razorpay_webhook', {
        payload
      })

    if (error) throw error

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}) 