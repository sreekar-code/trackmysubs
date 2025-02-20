import React from 'react';
import { useUserAccess } from '../../hooks/useUserAccess';
import { CreditCard, Gift, Clock, CheckCircle, XCircle } from 'lucide-react';

export const UserAccessBanner: React.FC = () => {
  const { access, getTrialStatus } = useUserAccess();
  const { isInTrial, daysLeft } = getTrialStatus();

  if (!access) return null;

  // Existing users with lifetime access
  if (access.has_lifetime_access) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          <p className="text-green-700">
            You have lifetime access to all features. Thank you for being an early supporter!
          </p>
        </div>
      </div>
    );
  }

  // Premium users
  if (access.subscription_status === 'premium') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <CreditCard className="h-5 w-5 text-blue-500 mr-2" />
          <p className="text-blue-700">
            Premium member - Full access to all features
          </p>
        </div>
      </div>
    );
  }

  // Active trial users
  if (access.subscription_status === 'trial' && isInTrial) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Gift className="h-5 w-5 text-yellow-500 mr-2" />
            <p className="text-yellow-700">
              Trial Period: {daysLeft} {daysLeft === 1 ? 'day' : 'days'} remaining
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/upgrade'}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    );
  }

  // Trial ended users
  if (access.subscription_status === 'trial' && !isInTrial) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700">
              Your trial has ended. Upgrade to continue accessing analytics.
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/upgrade'}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    );
  }

  return null;
}; 