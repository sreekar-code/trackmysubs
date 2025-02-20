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
        const sessionId = searchParams.get('session_id');
        if (!sessionId) {
          throw new Error('No session ID found');
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Verify the payment session with Dodo Payments
        const response = await fetch(`https://live.dodopayments.com/v1/payment-sessions/${sessionId}`, {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_DODO_PAYMENTS_API_KEY}`,
            'Origin': window.location.origin,
          },
          mode: 'cors',
          credentials: 'same-origin',
        });

        if (!response.ok) {
          throw new Error('Failed to verify payment session');
        }

        const session = await response.json();
        if (session.status !== 'completed') {
          throw new Error('Payment not completed');
        }

        const success = await handlePaymentSuccess(user.id);
        if (!success) {
          throw new Error('Failed to process payment');
        }

        setIsProcessing(false);
        // Redirect to analytics after 3 seconds
        setTimeout(() => {
          navigate('/analytics');
        }, 3000);
      } catch (err) {
        console.error('Payment processing error:', err);
        setError(err instanceof Error ? err.message : 'Failed to process payment');
        setIsProcessing(false);
      }
    };

    processPayment();
  }, [navigate, searchParams]);

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
        {error ? (
          <>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/pricing')}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Again
            </button>
          </>
        ) : (
          <p className="text-sm text-gray-500">
            {isProcessing 
              ? 'This may take a few moments...'
              : 'Redirecting you to analytics in a few seconds...'}
          </p>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess; 