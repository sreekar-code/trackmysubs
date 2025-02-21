import { supabase } from '../lib/supabase';

interface WebhookEvent {
  id: string;
  type: string;
  data: {
    id: string;
    status: string;
    amount: number;
    currency: string;
    metadata?: {
      userId?: string;
      plan?: string;
    };
    customer?: {
      email?: string;
    };
    created_at: string;
  };
}

export async function handleWebhookEvent(event: WebhookEvent) {
  try {
    // First, store the raw webhook event
    const { error: webhookError } = await supabase
      .from('payment_webhook_events')
      .insert([
        {
          event_id: event.id,
          event_type: event.type,
          payment_id: event.data.id,
          raw_data: event,
          created_at: new Date().toISOString()
        }
      ]);

    if (webhookError) {
      console.error('Error storing webhook event:', webhookError);
      throw webhookError;
    }

    // If this is a payment success event, update user access
    if (event.type === 'payment.succeeded' && event.data.metadata?.userId) {
      const userId = event.data.metadata.userId;
      
      // Calculate subscription dates
      const now = new Date();
      const subscriptionEndDate = new Date(now);
      subscriptionEndDate.setFullYear(now.getFullYear() + 1);

      // Update user access
      const { error: accessError } = await supabase
        .from('user_access')
        .update({
          subscription_status: 'premium',
          subscription_start_date: now.toISOString(),
          subscription_end_date: subscriptionEndDate.toISOString(),
          updated_at: now.toISOString(),
          trial_start_date: null,
          trial_end_date: null
        })
        .eq('user_id', userId);

      if (accessError) {
        console.error('Error updating user access:', accessError);
        throw accessError;
      }

      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert([
          {
            user_id: userId,
            amount: event.data.amount,
            currency: event.data.currency,
            status: event.data.status,
            payment_date: event.data.created_at,
            subscription_period_start: now.toISOString(),
            subscription_period_end: subscriptionEndDate.toISOString()
          }
        ]);

      if (paymentError) {
        console.error('Error creating payment record:', paymentError);
        throw paymentError;
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Webhook handling error:', error);
    return { success: false, error };
  }
} 