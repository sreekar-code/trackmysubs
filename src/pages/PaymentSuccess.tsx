import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { handlePaymentSuccess } from '../lib/payments';
import { CheckCircle } from 'lucide-react';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processPayment = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('User not authenticated');
        }

        const success = await handlePaymentSuccess(user.id);
        if (!success) {
          throw new Error('Failed to process payment');
        }

        // Redirect to analytics after 3 seconds
        setTimeout(() => {
          navigate('/analytics');
        }, 3000);
      } catch (err) {
        console.error('Payment processing error:', err);
        setError(err instanceof Error ? err.message : 'Failed to process payment');
      }
    };

    processPayment();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Successful!
        </h1>
        <p className="text-gray-600 mb-6">
          Thank you for upgrading to Premium. You now have access to all analytics features.
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
            Redirecting you to analytics in a few seconds...
          </p>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess; 