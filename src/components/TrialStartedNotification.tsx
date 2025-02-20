import React, { useState, useEffect } from 'react';
import { useUserAccess } from '../hooks/useUserAccess';

interface TrialStartedNotificationProps {
  onClose: () => void;
}

const TrialStartedNotification: React.FC<TrialStartedNotificationProps> = ({ onClose }) => {
  const [show, setShow] = useState(false);
  const { access } = useUserAccess();

  useEffect(() => {
    // Show notification only for new trial users
    if (access?.subscription_status === 'trial' && access?.trial_start_date) {
      const trialStart = new Date(access.trial_start_date);
      const now = new Date();
      const hoursSinceTrialStart = (now.getTime() - trialStart.getTime()) / (1000 * 60 * 60);
      
      // Only show if trial started in the last hour
      if (hoursSinceTrialStart < 1) {
        setShow(true);
      }
    }
  }, [access]);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-white rounded-lg shadow-lg border border-blue-100 p-4 z-50">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="ml-3 w-0 flex-1">
          <p className="text-sm font-medium text-gray-900">
            Trial Started!
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Your 7-day free trial has begun. Enjoy full access to all analytics features!
          </p>
          <div className="mt-3 flex space-x-3">
            <button
              onClick={() => {
                setShow(false);
                onClose();
              }}
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Got it
            </button>
          </div>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={() => {
              setShow(false);
              onClose();
            }}
            className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrialStartedNotification; 