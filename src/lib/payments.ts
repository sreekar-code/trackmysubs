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
        'Authorization': `Bearer ${process.env.REACT_APP_DODO_API_KEY}`,
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
        success_url: `${window.location.origin}/payment/success`,
        cancel_url: `${window.location.origin}/payment/cancel`,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create payment session');
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
        subscription_start: new Date().toISOString(),
        subscription_end: oneYear.toISOString(),
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