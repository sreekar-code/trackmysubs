import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { handlePaymentSuccess } from '../lib/payments';
import { CheckCircle } from 'lucide-react';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processPayment = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }

        console.log('Processing payment for user:', user.id);

        // Handle payment success
        const success = await handlePaymentSuccess(user.id);
        if (!success) {
          throw new Error('Failed to process payment');
        }

        // Verify the update was successful by checking user access
        const { data: accessData, error: accessError } = await supabase
          .from('user_access')
          .select('subscription_status')
          .eq('user_id', user.id)
          .single();

        if (accessError || !accessData) {
          throw new Error('Failed to verify access update');
        }

        if (accessData.subscription_status !== 'premium') {
          throw new Error('Access update verification failed');
        }

        console.log('Payment processed successfully, user status:', accessData.subscription_status);

        setIsProcessing(false);
        // Redirect to analytics after 3 seconds
        setTimeout(() => {
          navigate('/analytics', { replace: true });
        }, 3000);
      } catch (err) {
        console.error('Payment processing error:', err);
        setError(err instanceof Error ? err.message : 'Failed to process payment');
        setIsProcessing(false);
      }
    };

    processPayment();
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-red-100">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Processing Error</h1>
          <p className="text-red-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/pricing')}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isProcessing ? 'Processing Payment...' : 'Payment Successful!'}
        </h1>
        <p className="text-gray-600 mb-6">
          {isProcessing 
            ? 'Please wait while we confirm your payment...'
            : 'Thank you for upgrading to Premium. You now have access to all analytics features.'}
        </p>
        <p className="text-sm text-gray-500">
          {isProcessing 
            ? 'This may take a few moments...'
            : 'Redirecting you to analytics in a few seconds...'}
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccess; 