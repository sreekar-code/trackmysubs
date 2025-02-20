import React from 'react';
import { useUserAccess } from '../../hooks/useUserAccess';
import { Lock, TrendingUp } from 'lucide-react';

interface AnalyticsAccessGateProps {
  children: React.ReactNode;
}

export const AnalyticsAccessGate: React.FC<AnalyticsAccessGateProps> = ({ children }) => {
  const { hasAnalyticsAccess, access, getTrialStatus } = useUserAccess();
  const { isInTrial, daysLeft } = getTrialStatus();

  if (hasAnalyticsAccess()) {
    return <>{children}</>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 text-center">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-gray-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Analytics Access Required
          </h2>
          {access?.subscription_status === 'trial' && !isInTrial ? (
            <p className="text-gray-600 mb-6">
              Your trial period has ended. Upgrade to premium to continue accessing detailed analytics 
              and insights about your subscriptions.
            </p>
          ) : (
            <p className="text-gray-600 mb-6">
              Get detailed insights about your subscription spending with our analytics feature.
            </p>
          )}
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Premium Analytics Features
              </h3>
              <ul className="text-gray-600 text-sm space-y-2">
                <li>• Detailed spending trends and patterns</li>
                <li>• Category-wise expense breakdown</li>
                <li>• Monthly and yearly comparisons</li>
                <li>• Subscription optimization suggestions</li>
                <li>• Export and reporting capabilities</li>
              </ul>
            </div>
            
            <button
              onClick={() => window.location.href = '/upgrade'}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Upgrade to Premium
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 