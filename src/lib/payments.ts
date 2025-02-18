import { supabase } from './supabase';

interface PaymentResponse {
  success: boolean;
  error?: string;
  paymentUrl?: string;
}

export const initializePayment = async (userId: string): Promise<PaymentResponse> => {
  try {
    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Create a payment session with Dodo Payments
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
          email: profile.email,
          name: profile.full_name || profile.email,
        },
        metadata: {
          userId: userId,
          plan: 'premium',
        },
        success_url: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/payment/cancel`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create payment session');
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
        subscription_status: 'premium',
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