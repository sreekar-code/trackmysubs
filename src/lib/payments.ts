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

    // Create payment URL using static payment link format
    const productId = import.meta.env.VITE_DODO_PRODUCT_ID as string;
    if (!productId) {
      throw new Error('Product ID is not configured');
    }

    // Base URLs for success and cancel
    const baseSuccessUrl = `${window.location.origin}/payment/success`;
    const baseCancelUrl = `${window.location.origin}/payment/cancel`;
    
    // Construct the static payment link with customer details
    const paymentUrl = `https://test.checkout.dodopayments.com/buy/${productId}?` + 
      `quantity=1` +
      `&success_url=${encodeURIComponent(baseSuccessUrl)}` +
      `&cancel_url=${encodeURIComponent(baseCancelUrl)}` +
      `&email=${encodeURIComponent(user.email || '')}` +
      `&metadata[userId]=${encodeURIComponent(user.id)}` +
      `&metadata[subscriptionType]=premium`;

    console.log('Generated payment URL:', paymentUrl);

    return {
      success: true,
      paymentUrl,
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

export async function handlePaymentSuccess(userId: string, subscriptionId: string): Promise<boolean> {
  try {
    // First, get the current user access record
    const { data: accessData, error: accessError } = await supabase
      .from('user_access')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (accessError && accessError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error fetching user access:', accessError);
      return false;
    }

    // Calculate subscription dates
    const now = new Date();
    const subscriptionEndDate = new Date(now);
    subscriptionEndDate.setFullYear(now.getFullYear() + 1);

    const updateData = {
      subscription_status: 'premium' as const,
      subscription_start_date: now.toISOString(),
      subscription_end_date: subscriptionEndDate.toISOString(),
      updated_at: now.toISOString(),
      subscription_id: subscriptionId,
      // Clear trial dates if they exist
      trial_start_date: null,
      trial_end_date: null
    };

    console.log('Updating user access with data:', {
      userId,
      subscriptionId,
      ...updateData
    });

    // Update or insert the user access record
    const { error: upsertError } = await supabase
      .from('user_access')
      .upsert({
        user_id: userId,
        ...updateData
      });

    if (upsertError) {
      console.error('Error updating user access:', upsertError);
      return false;
    }

    // Verify the update
    const { data: verifyData, error: verifyError } = await supabase
      .from('user_access')
      .select('subscription_status, subscription_id')
      .eq('user_id', userId)
      .single();

    if (verifyError || !verifyData || verifyData.subscription_status !== 'premium') {
      console.error('Failed to verify update:', { verifyError, verifyData });
      return false;
    }

    // Create a payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert([
        {
          user_id: userId,
          subscription_id: subscriptionId,
          amount: 10, // $10 for annual subscription
          currency: 'USD',
          status: 'succeeded',
          payment_date: now.toISOString(),
          subscription_period_start: now.toISOString(),
          subscription_period_end: subscriptionEndDate.toISOString()
        }
      ]);

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      // Don't return false here as the main update was successful
    }

    console.log('Payment success handled successfully for user:', userId);
    return true;
  } catch (error) {
    console.error('Payment success handling error:', error);
    return false;
  }
}

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
