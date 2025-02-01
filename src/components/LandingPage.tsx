import React from 'react';
import { CreditCard, Clock, DollarSign, Zap, Tag, Globe, BarChart } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white/90 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
            <span className="ml-2 text-lg sm:text-xl font-bold text-gray-900">
              trackmysubs.in
            </span>
          </div>
        </div>
      </nav>

      <main className="flex-grow flex flex-col">
        <div className="relative flex-grow flex items-center justify-center bg-gradient-to-b from-white to-blue-50">
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,transparent)] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,white,transparent)]" style={{ backgroundSize: '30px 30px' }} />
          
          <div className="relative w-full">
            <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
              <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight">
                  <span className="inline-block">Track Your</span>{' '}
                  <span className="inline-block">Subscriptions</span>
                  <span className="block mt-2 bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                    All in One Place
                  </span>
                </h1>
                <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
                  Keep track of your subscriptions and never miss a renewal.
                </p>
                <div className="mt-8 sm:mt-10">
                  <button
                    onClick={onGetStarted}
                    className="inline-flex items-center justify-center px-6 sm:px-7 py-3 sm:py-3.5 text-base sm:text-lg font-medium rounded-xl text-white bg-blue-500 hover:bg-blue-600 transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.98] transform hover:-translate-y-0.5"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white py-24 sm:py-32">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="mx-auto grid max-w-5xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:grid-cols-3">
                <Feature
                  icon={<Zap className="h-7 w-7 sm:h-8 sm:w-8 text-blue-500" />}
                  title="Quick Overview"
                  description="Simple dashboard to manage all your subscriptions in one place."
                />
                <Feature
                  icon={<Clock className="h-7 w-7 sm:h-8 sm:w-8 text-blue-500" />}
                  title="Renewal Tracking"
                  description="Visual indicators to help you spot upcoming and overdue renewals."
                />
                <Feature
                  icon={<DollarSign className="h-7 w-7 sm:h-8 sm:w-8 text-blue-500" />}
                  title="Monthly Spend"
                  description="Real-time calculation of your total monthly subscription costs."
                />
                <Feature
                  icon={<Tag className="h-7 w-7 sm:h-8 sm:w-8 text-blue-500" />}
                  title="Custom Categories"
                  description="Create and manage your own categories to organize subscriptions better."
                />
                <Feature
                  icon={<Globe className="h-7 w-7 sm:h-8 sm:w-8 text-blue-500" />}
                  title="Multi-Currency"
                  description="Support for multiple currencies with automatic conversion to your preferred currency."
                />
                <Feature
                  icon={<BarChart className="h-7 w-7 sm:h-8 sm:w-8 text-blue-500" />}
                  title="Smart Analytics"
                  description="Visualize your spending patterns with interactive charts and calendar view."
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} trackmysubs.in. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const Feature: React.FC<FeatureProps> = ({ icon, title, description }) => {
  return (
    <div className="relative pl-4">
      <div className="flex flex-col items-center text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 mb-6">
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

export default LandingPage;