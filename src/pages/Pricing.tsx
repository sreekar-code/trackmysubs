import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useUserAccess } from '../hooks/useUserAccess';
import { supabase } from '../lib/supabase';
import { initializePayment } from '../lib/payments';
import Auth from '../components/Auth';

const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const { access, loading } = useUserAccess();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const handleUpgrade = async () => {
    try {
      setError(null);
      setIsProcessing(true);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setShowAuth(true);
        return;
      }

      const { success, error: paymentError, paymentUrl } = await initializePayment(user.id);

      if (!success || !paymentUrl) {
        throw new Error(paymentError || 'Failed to initialize payment');
      }

      // Redirect to Dodo Payments checkout
      window.location.href = paymentUrl;
    } catch (err) {
      console.error('Error initiating upgrade:', err);
      setError(err instanceof Error ? err.message : 'Failed to initiate upgrade');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (showAuth) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto pt-12">
          <Auth onSignIn={() => {
            setShowAuth(false);
            handleUpgrade();
          }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get access to powerful analytics and insights to better manage your subscriptions.
          </p>
          {error && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <div className="mt-12 max-w-5xl mx-auto grid gap-8 lg:grid-cols-2">
          {/* Free Plan */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-8">
            <h3 className="text-lg font-semibold text-gray-900">Free</h3>
            <p className="mt-4 text-sm text-gray-500">Perfect for getting started</p>
            <p className="mt-6">
              <span className="text-4xl font-bold tracking-tight text-gray-900">$0</span>
              <span className="text-base font-medium text-gray-500">/month</span>
            </p>
            <ul className="mt-6 space-y-4">
              <li className="flex gap-3">
                <Check className="h-5 w-5 flex-shrink-0 text-blue-500" />
                <span className="text-sm text-gray-700">Track unlimited subscriptions</span>
              </li>
              <li className="flex gap-3">
                <Check className="h-5 w-5 flex-shrink-0 text-blue-500" />
                <span className="text-sm text-gray-700">Basic dashboard</span>
              </li>
              <li className="flex gap-3">
                <Check className="h-5 w-5 flex-shrink-0 text-blue-500" />
                <span className="text-sm text-gray-700">Custom categories</span>
              </li>
            </ul>
            <button
              onClick={() => navigate('/')}
              className="mt-8 w-full py-3 px-4 rounded-lg text-sm font-semibold text-blue-600 border border-blue-200 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              Get Started
            </button>
          </div>

          {/* Premium Plan */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-8 relative">
            <div className="absolute -top-4 left-0 right-0 flex justify-center">
              <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                Popular
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Premium</h3>
            <p className="mt-4 text-sm text-gray-500">Everything you need to analyze your subscriptions</p>
            <p className="mt-6">
              <span className="text-4xl font-bold tracking-tight text-gray-900">$10</span>
              <span className="text-base font-medium text-gray-500">/year</span>
            </p>
            <p className="mt-2 text-sm text-gray-500">That's less than $1/month</p>
            <ul className="mt-6 space-y-4">
              <li className="flex gap-3">
                <Check className="h-5 w-5 flex-shrink-0 text-blue-500" />
                <span className="text-sm text-gray-700">Everything in Free plan</span>
              </li>
              <li className="flex gap-3">
                <Check className="h-5 w-5 flex-shrink-0 text-blue-500" />
                <span className="text-sm text-gray-700">Advanced analytics dashboard</span>
              </li>
              <li className="flex gap-3">
                <Check className="h-5 w-5 flex-shrink-0 text-blue-500" />
                <span className="text-sm text-gray-700">Spending trends & insights</span>
              </li>
              <li className="flex gap-3">
                <Check className="h-5 w-5 flex-shrink-0 text-blue-500" />
                <span className="text-sm text-gray-700">Visual reports & charts</span>
              </li>
            </ul>
            <button
              onClick={handleUpgrade}
              disabled={access?.subscription_status === 'premium' || isProcessing}
              className={`mt-8 w-full py-3 px-4 rounded-lg text-sm font-semibold text-white 
                ${access?.subscription_status === 'premium'
                  ? 'bg-gray-400 cursor-not-allowed'
                  : isProcessing
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'} 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200`}
            >
              {access?.subscription_status === 'premium'
                ? 'Current Plan'
                : isProcessing
                ? 'Processing...'
                : 'Upgrade Now'}
            </button>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Questions about our pricing?{' '}
            <a
              href="mailto:trackmysubs.in@gmail.com"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Pricing; 