import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { handlePaymentCancel } from '../lib/payments';
import { XCircle } from 'lucide-react';

const PaymentCancel: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCancellation = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('User not authenticated');
        }

        await handlePaymentCancel(user.id);

        // Redirect to pricing after 3 seconds
        setTimeout(() => {
          navigate('/pricing');
        }, 3000);
      } catch (err) {
        console.error('Payment cancellation error:', err);
        setError(err instanceof Error ? err.message : 'Failed to process cancellation');
      }
    };

    processCancellation();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Cancelled
        </h1>
        <p className="text-gray-600 mb-6">
          Your payment was cancelled. No charges were made to your account.
        </p>
        {error ? (
          <p className="text-red-600 mb-4">{error}</p>
        ) : (
          <p className="text-sm text-gray-500 mb-6">
            Redirecting you back to pricing in a few seconds...
          </p>
        )}
        <button
          onClick={() => navigate('/pricing')}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Return to Pricing
        </button>
      </div>
    </div>
  );
};

export default PaymentCancel; 