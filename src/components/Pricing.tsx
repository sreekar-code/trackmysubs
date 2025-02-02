import React, { useEffect } from 'react';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface PricingProps {
  onClose: () => void;
}

// Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

const RAZORPAY_KEY_ID = 'YOUR_RAZORPAY_KEY_ID';
const PREMIUM_PLAN_ID = 'YOUR_RAZORPAY_PLAN_ID';

export const Pricing: React.FC<PricingProps> = ({ onClose }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleUpgrade = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Create a Razorpay subscription
      const options = {
        key: RAZORPAY_KEY_ID,
        subscription_id: PREMIUM_PLAN_ID,
        name: 'TrackMySubs Premium',
        description: 'Yearly Premium Subscription',
        image: 'your-logo-url',
        prefill: {
          email: user.email,
        },
        handler: async function (response: any) {
          // Handle successful payment
          try {
            const { error } = await supabase.from('razorpay_subscriptions').insert({
              user_id: user.id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_customer_id: response.razorpay_customer_id,
              razorpay_plan_id: PREMIUM_PLAN_ID,
              status: 'active'
            });

            if (error) throw error;
            
            // Close the pricing modal and refresh the page
            onClose();
            window.location.reload();
          } catch (error) {
            console.error('Error saving subscription:', error);
          }
        },
        modal: {
          ondismiss: function() {
            console.log('Checkout form closed');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Error initiating checkout:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity">
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6">
            <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
              <button
                type="button"
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="text-center">
              <h3 className="text-2xl font-bold leading-6 text-gray-900 mb-8">
                Choose Your Plan
              </h3>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Free Plan */}
              <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="p-6">
                  <h3 className="text-lg font-semibold leading-6 text-gray-900">Free</h3>
                  <p className="mt-4 text-sm text-gray-500">Perfect for getting started with subscription tracking.</p>
                  <p className="mt-8">
                    <span className="text-4xl font-bold tracking-tight text-gray-900">₹0</span>
                    <span className="text-sm font-semibold leading-6 text-gray-600">/forever</span>
                  </p>
                  <button
                    type="button"
                    className="mt-6 block w-full rounded-md bg-gray-100 px-3 py-2 text-center text-sm font-semibold text-gray-900 hover:bg-gray-200"
                  >
                    Current Plan
                  </button>
                </div>
                <div className="border-t border-gray-100 px-6 py-6">
                  <ul role="list" className="space-y-4">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 shrink-0" />
                      <span className="ml-3 text-sm text-gray-700">Unlimited subscriptions</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 shrink-0" />
                      <span className="ml-3 text-sm text-gray-700">Basic dashboard</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 shrink-0" />
                      <span className="ml-3 text-sm text-gray-700">Multi-currency support</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Premium Plan */}
              <div className="relative rounded-lg border border-blue-200 bg-white shadow-sm">
                <div className="absolute -top-4 right-8 inline-flex items-center rounded-full bg-blue-100 px-4 py-1 text-xs font-medium text-blue-700">
                  Popular
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold leading-6 text-gray-900">Premium</h3>
                  <p className="mt-4 text-sm text-gray-500">Perfect for analyzing your subscription spending.</p>
                  <p className="mt-8">
                    <span className="text-4xl font-bold tracking-tight text-gray-900">₹499</span>
                    <span className="text-sm font-semibold leading-6 text-gray-600">/year</span>
                  </p>
                  <button
                    onClick={handleUpgrade}
                    type="button"
                    className="mt-6 block w-full rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                  >
                    Upgrade Now
                  </button>
                </div>
                <div className="border-t border-gray-100 px-6 py-6">
                  <ul role="list" className="space-y-4">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 shrink-0" />
                      <span className="ml-3 text-sm text-gray-700">Everything in Free</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 shrink-0" />
                      <span className="ml-3 text-sm text-gray-700">Advanced analytics</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 shrink-0" />
                      <span className="ml-3 text-sm text-gray-700">Spending insights</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 shrink-0" />
                      <span className="ml-3 text-sm text-gray-700">Calendar view</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 shrink-0" />
                      <span className="ml-3 text-sm text-gray-700">7-day free trial</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing; 