import { supabase } from './supabase';
import type { Database } from './database.types';

interface PaymentResponse {
  success: boolean;
  error?: string;
  paymentUrl?: string;
}

export const initializePayment = async (userId: string): Promise<PaymentResponse> => {
  try {
    // First get the user's email from auth.users
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User not found');

    // Create payment session with Dodo Payments
    const response = await fetch('https://api.dodopayments.com/v1/payment-sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_DODO_PAYMENTS_API_KEY}`,
      },
      body: JSON.stringify({
        amount: 1000, // $10.00 in cents
        currency: 'USD',
        customer: {
          email: user.email,
          name: user.email, // Use email as name if profile doesn't exist
        },
        metadata: {
          userId: user.id,
          plan: 'premium',
        },
        success_url: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/payment/cancel`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
      console.error('Payment API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(errorData.message || `Payment API error: ${response.status} ${response.statusText}`);
    }

    const session = await response.json();

    // Ensure we have a valid URL before returning
    if (!session.url) {
      throw new Error('Payment session created but no URL returned');
    }

    return {
      success: true,
      paymentUrl: session.url,
    };
  } catch (error) {
    // Add more detailed error logging
    console.error('Payment initialization error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    // Check for network errors
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      return {
        success: false,
        error: 'Unable to connect to payment service. Please check your internet connection and try again.',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initialize payment',
    };
  }
};

export const handlePaymentSuccess = async (userId: string): Promise<boolean> => {
  try {
    const now = new Date();
    const oneYear = new Date(now.setFullYear(now.getFullYear() + 1));

    // First check if user_access record exists
    const { data: accessRecord, error: fetchError } = await supabase
      .from('user_access')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      // If no record exists, create one
      const { error: insertError } = await supabase
        .from('user_access')
        .insert({
          user_id: userId,
          user_type: 'new',
          has_lifetime_access: false,
          subscription_status: 'premium',
          subscription_start_date: new Date().toISOString(),
          subscription_end_date: oneYear.toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) throw insertError;
    } else {
      // Update existing record
      const { error: updateError } = await supabase
        .from('user_access')
        .update({
          subscription_status: 'premium',
          has_lifetime_access: false,
          subscription_start_date: new Date().toISOString(),
          subscription_end_date: oneYear.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;
    }

    return true;
  } catch (error) {
    console.error('Payment success handling error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
};

export const handlePaymentCancel = async (userId: string): Promise<boolean> => {
  try {
    // Log the cancellation for tracking
    console.log('Payment cancelled for user:', userId);
    return true;
  } catch (error) {
    console.error('Payment cancellation handling error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
}; 