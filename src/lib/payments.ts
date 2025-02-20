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
    const successUrl = `${window.location.origin}/payment/success`;
    const cancelUrl = `${window.location.origin}/payment/cancel`;
    
    // Construct the static payment link with customer details
    const paymentUrl = `https://checkout.dodopayments.com/buy/${productId}?` + 
      `quantity=1` +
      `&redirect_url=${encodeURIComponent(successUrl)}` +
      `&email=${encodeURIComponent(user.email)}` +
      `&metadata_userId=${encodeURIComponent(user.id)}` +
      `&metadata_plan=premium`;

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

export async function handlePaymentSuccess(userId: string): Promise<boolean> {
  try {
    // First, get the current user access record
    const { data: accessData, error: accessError } = await supabase
      .from('user_access')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (accessError) {
      console.error('Error fetching user access:', accessError);
      return false;
    }

    // Calculate subscription end date (1 year from now)
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);

    // Update the user access record
    const { error: updateError } = await supabase
      .from('user_access')
      .update({
        subscription_status: 'premium',
        subscription_end_date: subscriptionEndDate.toISOString(),
        updated_at: new Date().toISOString(),
        // Clear trial dates if they exist
        trial_start_date: null,
        trial_end_date: null
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating user access:', updateError);
      return false;
    }

    // Create a payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert([
        {
          user_id: userId,
          amount: 10, // $10 for annual subscription
          currency: 'USD',
          status: 'succeeded',
          payment_date: new Date().toISOString(),
          subscription_period_start: new Date().toISOString(),
          subscription_period_end: subscriptionEndDate.toISOString()
        }
      ]);

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      // Don't return false here as the main update was successful
    }

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