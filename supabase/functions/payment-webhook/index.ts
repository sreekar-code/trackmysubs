import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { hmac } from 'https://deno.land/x/hmac@v2.0.1/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, dodo-signature',
}

console.log("Payment webhook function started")

function verifySignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature) {
    console.log('No signature provided')
    return false
  }

  // Log the raw values for debugging
  console.log('Raw payload:', payload)
  console.log('Raw signature:', signature)
  console.log('Secret being used:', secret)

  // Try both raw and base64 encoded signature
  const computedSignature = hmac('sha256', secret, payload, 'utf8', 'hex')
  const computedSignatureBase64 = hmac('sha256', secret, payload, 'utf8', 'base64')
  
  console.log('Computed hex signature:', computedSignature)
  console.log('Computed base64 signature:', computedSignatureBase64)
  
  const isValidHex = signature === computedSignature
  const isValidBase64 = signature === computedSignatureBase64
  
  console.log('Signature verification results:', {
    hex: isValidHex,
    base64: isValidBase64
  })
  
  return isValidHex || isValidBase64
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

    // Get and verify the signature
    const signature = req.headers.get('dodo-signature')
    console.log('Signature from header:', signature)
    
    const webhookSecret = Deno.env.get('DODO_WEBHOOK_SECRET')
    if (!webhookSecret) {
      console.error('Webhook secret not configured')
      throw new Error('Webhook secret not configured')
    }
    console.log('Using webhook secret:', webhookSecret)

    if (!verifySignature(body, signature, webhookSecret)) {
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

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials:', { url: !!supabaseUrl, key: !!supabaseKey })
      throw new Error('Supabase credentials not configured')
    }

    console.log('Creating Supabase client with URL:', supabaseUrl)
    const supabaseClient = createClient(supabaseUrl, supabaseKey)

    // Log the event in the database
    console.log('Storing webhook event in database')
    const { data: webhookData, error: webhookError } = await supabaseClient
      .from('payment_webhook_events')
      .insert({
        event_type: event.type,
        event_id: event.id,
        payment_id: event.data?.id,
        user_id: event.data?.metadata?.userId,
        raw_data: event,
        created_at: new Date().toISOString()
      })
      .select()

    if (webhookError) {
      console.error('Error storing webhook:', webhookError)
      throw webhookError
    }
    console.log('Successfully stored webhook event:', webhookData)

    // Handle successful payment
    if (event.type === 'payment.succeeded' && event.data?.metadata?.userId) {
      const userId = event.data.metadata.userId
      console.log('Processing successful payment for user:', userId)

      // First check if user exists
      const { data: userData, error: userError } = await supabaseClient
        .from('user_access')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (userError && userError.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('Error fetching user:', userError)
        throw userError
      }

      const subscriptionType = event.data.metadata?.subscriptionType || 'premium'
      const subscriptionEndDate = subscriptionType === 'lifetime' 
        ? null  // null indicates lifetime subscription
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()

      // Update or insert user access
      const accessData = {
        user_id: userId,
        subscription_status: subscriptionType,
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: subscriptionEndDate,
        updated_at: new Date().toISOString()
      }

      console.log('Updating user access with data:', accessData)
      const { data: accessData2, error: accessError } = userData
        ? await supabaseClient
            .from('user_access')
            .update(accessData)
            .eq('user_id', userId)
            .select()
        : await supabaseClient
            .from('user_access')
            .insert(accessData)
            .select()

      if (accessError) {
        console.error('Error updating user access:', accessError)
        throw accessError
      }

      console.log('Successfully updated user access:', accessData2)
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