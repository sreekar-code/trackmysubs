import React from 'react';
import { CreditCard, Plus, LogOut, Menu, CreditCard as PricingIcon } from 'lucide-react';
import CurrencySelector from './CurrencySelector';
import { useUserAccess } from '../hooks/useUserAccess';
import { useNavigate } from 'react-router-dom';

interface DashboardHeaderProps {
  onAddNew: () => void;
  onSignOut: () => void;
  showMobileMenu: boolean;
  setShowMobileMenu: (show: boolean) => void;
  onManageCategories: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onAddNew,
  onSignOut,
  showMobileMenu,
  setShowMobileMenu,
  onManageCategories
}) => {
  const { access } = useUserAccess();
  const navigate = useNavigate();

  // Only show pricing for non-lifetime access users
  const showPricing = !access?.has_lifetime_access;

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="flex items-center">
              <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
              <span className="ml-2 text-lg sm:text-xl font-bold text-gray-900 truncate">
                trackmysubs
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="hidden sm:flex items-center">
              <CurrencySelector />
            </div>
            <button 
              onClick={onAddNew}
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <Plus className="h-5 w-5 sm:mr-2" />
              <span className="hidden sm:inline">Add New</span>
            </button>
            <button
              onClick={onManageCategories}
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 ml-2"
            >
              <span>Manage Categories</span>
            </button>
            {showPricing && (
              <button
                onClick={() => navigate('/pricing')}
                className="inline-flex items-center px-3 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <PricingIcon className="h-5 w-5 sm:mr-2" />
                <span className="hidden sm:inline">Pricing</span>
              </button>
            )}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="sm:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              onClick={onSignOut}
              className="hidden sm:inline-flex items-center p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {showMobileMenu && (
          <div className="sm:hidden mt-4 pb-2 border-t border-gray-200">
            <div className="pt-4 space-y-4">
              <CurrencySelector />
              <button
                onClick={onManageCategories}
                className="flex items-center space-x-2 w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <span>Manage Categories</span>
              </button>
              {showPricing && (
                <button
                  onClick={() => navigate('/pricing')}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <PricingIcon className="h-5 w-5" />
                  <span>Pricing</span>
                </button>
              )}
              <button
                onClick={onSignOut}
                className="flex items-center space-x-2 w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default DashboardHeader;