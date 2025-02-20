import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Unlock Analytics Access
          </h3>
          <p className="text-gray-600 mb-6">
            Get detailed insights into your subscription spending patterns and trends by upgrading to our Premium plan.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                navigate('/pricing');
                onClose();
              }}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              View Pricing Plans
            </button>
            <button
              onClick={onClose}
              className="w-full text-gray-600 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradePrompt; 