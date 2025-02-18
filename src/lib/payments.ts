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

    // Get or create profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    if (profileError) {
      // If profile doesn't exist, create it
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([{ 
          id: user.id, 
          email: user.email 
        }]);
      
      if (insertError) throw insertError;
    }

    // Create a payment session with Dodo Payments
    const response = await fetch('https://payments.dodopayments.com/v1/payment-sessions', {
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
          name: profile?.full_name || user.email,
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

    return {
      success: true,
      paymentUrl: session.url,
    };
  } catch (error) {
    console.error('Payment initialization error:', error);
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

    // Update user access record
    const { error: updateError } = await supabase
      .from('user_access')
      .update({
        subscription_status: 'premium' as const,
        has_lifetime_access: false,
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: oneYear.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    return true;
  } catch (error) {
    console.error('Payment success handling error:', error);
    return false;
  }
};

export const handlePaymentCancel = async (userId: string): Promise<boolean> => {
  try {
    // No need to update anything, just return true to indicate successful handling
    return true;
  } catch (error) {
    console.error('Payment cancellation handling error:', error);
    return false;
  }
}; 