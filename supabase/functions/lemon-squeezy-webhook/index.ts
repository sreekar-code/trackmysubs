import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const LEMON_SQUEEZY_SIGNING_SECRET = Deno.env.get('LEMON_SQUEEZY_SIGNING_SECRET')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  try {
    // Verify Lemon Squeezy signature
    const signature = req.headers.get('x-signature')
    if (!signature) {
      return new Response('Missing signature', { status: 401 })
    }

    // Get the raw body
    const body = await req.text()
    
    // Verify the signature (you'll need to implement this)
    // const isValid = verifySignature(signature, body, LEMON_SQUEEZY_SIGNING_SECRET)
    // if (!isValid) {
    //   return new Response('Invalid signature', { status: 401 })
    // }

    // Parse the webhook payload
    const payload = JSON.parse(body)

    // Initialize Supabase client with service role key
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    )

    // Call the webhook handler function
    const { data, error } = await supabase
      .rpc('handle_lemon_squeezy_webhook', {
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