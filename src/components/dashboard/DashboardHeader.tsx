import React from 'react';
import { CreditCard, LogOut, Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface DashboardHeaderProps {
  onSignOut: () => void;
  showMobileMenu: boolean;
  setShowMobileMenu: (show: boolean) => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onSignOut,
  showMobileMenu,
  setShowMobileMenu,
}) => {
  const location = useLocation();
  const isAnalyticsPage = location.pathname === '/analytics';
  const isPricingPage = location.pathname === '/pricing';

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
              <span className="ml-2 text-lg sm:text-xl font-bold text-gray-900 truncate">
                trackmysubs.in
              </span>
            </Link>
            <div className="hidden sm:flex items-center ml-8 space-x-4">
              <Link
                to="/"
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  !isAnalyticsPage && !isPricingPage
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/analytics"
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  isAnalyticsPage
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Analytics
              </Link>
              <Link
                to="/pricing"
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  isPricingPage
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Pricing
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
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
              <Link
                to="/"
                className={`flex items-center space-x-2 w-full px-4 py-2 text-left ${
                  !isAnalyticsPage && !isPricingPage
                    ? 'text-blue-700 bg-blue-50'
                    : 'text-gray-700 hover:bg-gray-100'
                } rounded-lg transition-colors duration-200`}
              >
                <span>Dashboard</span>
              </Link>
              <Link
                to="/analytics"
                className={`flex items-center space-x-2 w-full px-4 py-2 text-left ${
                  isAnalyticsPage
                    ? 'text-blue-700 bg-blue-50'
                    : 'text-gray-700 hover:bg-gray-100'
                } rounded-lg transition-colors duration-200`}
              >
                <span>Analytics</span>
              </Link>
              <Link
                to="/pricing"
                className={`flex items-center space-x-2 w-full px-4 py-2 text-left ${
                  isPricingPage
                    ? 'text-blue-700 bg-blue-50'
                    : 'text-gray-700 hover:bg-gray-100'
                } rounded-lg transition-colors duration-200`}
              >
                <span>Pricing</span>
              </Link>
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