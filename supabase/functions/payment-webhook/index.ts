import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { hmac } from 'https://deno.land/x/hmac@v2.0.1/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, dodo-signature',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the webhook secret from environment variables
    const webhookSecret = Deno.env.get('DODO_WEBHOOK_SECRET')
    if (!webhookSecret) {
      throw new Error('Missing webhook secret')
    }

    // Get the raw body and signature
    const body = await req.text()
    const signature = req.headers.get('dodo-signature')
    if (!signature) {
      throw new Error('No signature provided')
    }

    // Verify webhook signature
    const timestamp = signature.split(',')[0].split('=')[1]
    const receivedHmac = signature.split(',')[1].split('=')[1]
    
    const payload = timestamp + '.' + body
    const expectedHmac = await hmac('sha256', webhookSecret, payload, 'hex')
    
    if (receivedHmac !== expectedHmac) {
      throw new Error('Invalid signature')
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse the webhook payload
    const event = JSON.parse(body)

    // Insert the webhook event
    const { error } = await supabaseClient
      .from('payment_webhook_events')
      .insert({
        event_type: event.type,
        event_id: event.id,
        session_id: event.data.session_id,
        user_id: event.data.metadata?.userId,
        amount: event.data.amount,
        currency: event.data.currency,
        status: event.data.status,
        metadata: event.data.metadata,
        raw_event: event
      })

    if (error) {
      console.error('Error inserting webhook event:', error)
      throw error
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 