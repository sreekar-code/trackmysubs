import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { hmac } from 'https://deno.land/x/hmac@v2.0.1/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, webhook-signature',
}

console.log("Payment webhook function started")

function verifySignature(payload: string, headers: Headers, secret: string): boolean {
  const signature = headers.get('webhook-signature')
  const timestamp = headers.get('webhook-timestamp')
  const webhookId = headers.get('webhook-id')

  // Log all headers for debugging
  console.log('All webhook headers:', Object.fromEntries(headers.entries()))

  if (!signature || !timestamp || !webhookId) {
    console.log('Missing required headers:', { 
      hasSignature: !!signature,
      hasTimestamp: !!timestamp,
      hasWebhookId: !!webhookId,
      signature,
      timestamp,
      webhookId
    })
    return false
  }

  // The signature format is "v1,<signature>"
  const [version, receivedSignature] = signature.split(',')
  if (version !== 'v1' || !receivedSignature) {
    console.log('Invalid signature format:', {
      fullSignature: signature,
      version,
      receivedSignature,
      expectedVersion: 'v1'
    })
    return false
  }

  // Log the raw values for debugging
  console.log('Raw values for signature verification:', {
    payload: payload.substring(0, 100) + '...', // Only log first 100 chars
    timestamp,
    webhookId,
    signatureHeader: signature,
    secretLength: secret.length
  })

  // Compute the signature using timestamp and payload
  const signaturePayload = `${timestamp}.${payload}`
  const computedSignature = hmac('sha256', secret, signaturePayload, 'utf8', 'base64')
  
  console.log('Signature comparison:', {
    received: receivedSignature,
    computed: computedSignature,
    match: receivedSignature === computedSignature
  })
  
  return receivedSignature === computedSignature
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.text()
    console.log('Received webhook payload:', body)

    // Log all headers for debugging
    const headers = Object.fromEntries(req.headers.entries())
    console.log('All received headers:', headers)

    const webhookSecret = Deno.env.get('DODO_WEBHOOK_SECRET')
    if (!webhookSecret) {
      console.error('Webhook secret not configured')
      throw new Error('Webhook secret not configured')
    }

    if (!verifySignature(body, req.headers, webhookSecret)) {
      console.error('Invalid signature')
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      )
    }

    // Parse the event
    const event = JSON.parse(body)
    console.log('Processing event:', JSON.stringify(event, null, 2))

    // Handle subscription events
    if (event.type === 'subscription.failed') {
      console.log('Subscription failed:', event.data)
      
      // Log the failed event
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

      if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase credentials:', { url: !!supabaseUrl, key: !!supabaseKey })
        throw new Error('Supabase credentials not configured')
      }

      const supabaseClient = createClient(supabaseUrl, supabaseKey)
      
      // Log the webhook event
      const { error: webhookError } = await supabaseClient
        .from('payment_webhook_events')
        .insert({
          event_type: event.type,
          event_id: headers['webhook-id'],
          payment_id: event.data.subscription_id,
          user_id: event.data.metadata?.userId,
          raw_data: event,
          created_at: new Date().toISOString()
        })

      if (webhookError) {
        console.error('Error storing failed webhook:', webhookError)
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    if (event.type === 'subscription.active' && event.data?.metadata?.userId) {
      const userId = event.data.metadata.userId
      const subscriptionId = event.data.subscription_id
      console.log('Processing subscription for user:', userId, 'subscription:', subscriptionId)

      // Create Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

      if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase credentials:', { url: !!supabaseUrl, key: !!supabaseKey })
        throw new Error('Supabase credentials not configured')
      }

      const supabaseClient = createClient(supabaseUrl, supabaseKey)

      // Calculate subscription dates
      const now = new Date()
      const trialEndDate = event.data.trial_period_days 
        ? new Date(now.getTime() + event.data.trial_period_days * 24 * 60 * 60 * 1000)
        : null

      // Update or insert user access
      const accessData = {
        user_id: userId,
        subscription_id: subscriptionId,
        subscription_status: 'premium',
        subscription_start_date: event.data.created_at,
        subscription_end_date: event.data.next_billing_date,
        trial_start_date: event.data.created_at,
        trial_end_date: trialEndDate?.toISOString(),
        updated_at: now.toISOString()
      }

      console.log('Updating user access with data:', accessData)
      const { error: accessError } = await supabaseClient
        .from('user_access')
        .upsert(accessData)

      if (accessError) {
        console.error('Error updating user access:', accessError)
        throw accessError
      }

      // Log the webhook event
      const { error: webhookError } = await supabaseClient
        .from('payment_webhook_events')
        .insert({
          event_type: event.type,
          event_id: headers['webhook-id'],
          payment_id: event.data.subscription_id,
          user_id: userId,
          raw_data: event,
          created_at: now.toISOString()
        })

      if (webhookError) {
        console.error('Error storing webhook:', webhookError)
        // Don't throw here as the main operation succeeded
      }

      console.log('Successfully processed subscription event')
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
}) 