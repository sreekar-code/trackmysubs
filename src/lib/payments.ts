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