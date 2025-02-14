import React, { memo, useState } from 'react';
import { CreditCard, Clock, DollarSign, Zap, Tag, Globe, BarChart, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import FeedbackBox from './FeedbackBox';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

// Memoize Feature component to prevent unnecessary re-renders
const Feature = memo<FeatureProps>(({ icon, title, description }) => (
  <div className="relative pl-4">
    <div className="flex flex-col items-center text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  </div>
));

Feature.displayName = 'Feature';

// Pre-define icons with memoization to prevent recreation on each render
const icons = {
  zap: <Zap className="h-7 w-7 sm:h-8 sm:w-8 text-blue-500" />,
  clock: <Clock className="h-7 w-7 sm:h-8 sm:w-8 text-blue-500" />,
  dollar: <DollarSign className="h-7 w-7 sm:h-8 sm:w-8 text-blue-500" />,
  tag: <Tag className="h-7 w-7 sm:h-8 sm:w-8 text-blue-500" />,
  globe: <Globe className="h-7 w-7 sm:h-8 sm:w-8 text-blue-500" />,
  chart: <BarChart className="h-7 w-7 sm:h-8 sm:w-8 text-blue-500" />,
};

// Define features array to avoid recreation on each render
const features = [
  {
    icon: icons.zap,
    title: "Quick Overview",
    description: "Manage all your subscriptions in a clean, simple dashboard."
  },
  {
    icon: icons.clock,
    title: "Renewal Tracking",
    description: "Spot upcoming and overdue renewals at a glance."
  },
  {
    icon: icons.dollar,
    title: "Monthly Spend",
    description: "Track your total subscription costs in real-time."
  },
  {
    icon: icons.tag,
    title: "Custom Categories",
    description: "Organize subscriptions with your own categories."
  },
  {
    icon: icons.globe,
    title: "Multi-Currency",
    description: "Auto-convert costs to your preferred currency."
  },
  {
    icon: icons.chart,
    title: "Smart Analytics",
    description: "View spending trends with charts and calendar."
  }
];

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  const currentYear = new Date().getFullYear();
  const [showFeedback, setShowFeedback] = useState(false);
  
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white/90 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
              <span className="ml-2 text-lg sm:text-xl font-bold text-gray-900">
                trackmysubs.in
              </span>
            </div>
            <button
              onClick={onLogin}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              Login
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-grow flex flex-col">
        <div className="relative flex-grow flex items-center justify-center bg-gradient-to-b from-white to-blue-50">
          <div 
            className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,transparent)] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,white,transparent)]" 
            style={{ backgroundSize: '30px 30px' }} 
          />
          
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
                {features.map((feature, index) => (
                  <Feature
                    key={index}
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 py-24 sm:py-32">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Simple, Transparent Pricing
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Choose the plan that best fits your needs. Start with our free tier and upgrade anytime.
              </p>
            </div>

            <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-6">
              <div className="flex flex-col justify-between rounded-3xl bg-white p-8 ring-1 ring-gray-200 xl:p-10">
                <div>
                  <div className="flex items-center justify-between gap-x-4">
                    <h3 className="text-lg font-semibold leading-8 text-gray-900">Free</h3>
                    <p className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold leading-5 text-blue-600">
                      Get Started
                    </p>
                  </div>
                  <p className="mt-6 text-base leading-7 text-gray-600">
                    Perfect for tracking your subscriptions
                  </p>
                  <div className="mt-8 flex items-baseline gap-x-1">
                    <span className="text-4xl font-bold tracking-tight text-gray-900">$0</span>
                    <span className="text-sm font-semibold leading-6 text-gray-600">/month</span>
                  </div>
                  <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                    <li className="flex gap-x-3">
                      <Check className="h-6 w-5 flex-none text-blue-600" aria-hidden="true" />
                      Subscription Dashboard
                    </li>
                    <li className="flex gap-x-3">
                      <Check className="h-6 w-5 flex-none text-blue-600" aria-hidden="true" />
                      Track All Your Subscriptions
                    </li>
                    <li className="flex gap-x-3">
                      <Check className="h-6 w-5 flex-none text-blue-600" aria-hidden="true" />
                      Organize with Categories
                    </li>
                    <li className="flex gap-x-3">
                      <Check className="h-6 w-5 flex-none text-blue-600" aria-hidden="true" />
                      Multi-Currency Support
                    </li>
                  </ul>
                </div>
                <button
                  onClick={onGetStarted}
                  className="mt-8 block rounded-md bg-white px-3 py-2 text-center text-sm font-semibold leading-6 text-blue-600 ring-1 ring-inset ring-blue-200 hover:ring-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Get Started
                </button>
              </div>

              <div className="flex flex-col justify-between rounded-3xl bg-white p-8 ring-1 ring-gray-200 xl:p-10">
                <div>
                  <div className="flex items-center justify-between gap-x-4">
                    <h3 className="text-lg font-semibold leading-8 text-gray-900">Premium</h3>
                    <p className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold leading-5 text-blue-600">
                      Popular
                    </p>
                  </div>
                  <p className="mt-6 text-base leading-7 text-gray-600">
                    Everything in Free plus Analytics
                  </p>
                  <div className="mt-8 flex items-baseline gap-x-1">
                    <span className="text-4xl font-bold tracking-tight text-gray-900">$10</span>
                    <span className="text-sm font-semibold leading-6 text-gray-600">/year</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    That's less than $1/month
                  </p>
                  <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                    <li className="flex gap-x-3">
                      <Check className="h-6 w-5 flex-none text-blue-600" aria-hidden="true" />
                      Everything in Free tier
                    </li>
                    <li className="flex gap-x-3">
                      <Check className="h-6 w-5 flex-none text-blue-600" aria-hidden="true" />
                      Analytics Dashboard
                    </li>
                    <li className="flex gap-x-3">
                      <Check className="h-6 w-5 flex-none text-blue-600" aria-hidden="true" />
                      Spending Trends & Insights
                    </li>
                    <li className="flex gap-x-3">
                      <Check className="h-6 w-5 flex-none text-blue-600" aria-hidden="true" />
                      Visual Reports & Charts
                    </li>
                  </ul>
                </div>
                <button
                  onClick={onGetStarted}
                  className="mt-8 block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold leading-6 text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <nav className="flex flex-wrap justify-center space-x-6 mb-8">
            <Link to="/terms" className="text-gray-500 hover:text-gray-900">
              Terms & Conditions
            </Link>
            <Link to="/privacy" className="text-gray-500 hover:text-gray-900">
              Privacy Policy
            </Link>
            <Link to="/refund" className="text-gray-500 hover:text-gray-900">
              Refund Policy
            </Link>
            <a 
              href="mailto:trackmysubs.in@gmail.com" 
              className="text-gray-500 hover:text-gray-900"
            >
              Support
            </a>
            <button
              onClick={() => setShowFeedback(true)}
              className="text-gray-500 hover:text-gray-900"
            >
              Feedback
            </button>
          </nav>
          <div className="flex flex-col items-center">
            <p className="text-center text-gray-500 text-sm">
              © {currentYear} trackmysubs.in. All rights reserved.
            </p>
            <p className="mt-2 text-center text-gray-500 text-sm">
              Contact us: <a href="mailto:trackmysubs.in@gmail.com" className="text-blue-600 hover:text-blue-800">trackmysubs.in@gmail.com</a>
            </p>
          </div>
        </div>
      </footer>

      {showFeedback && (
        <FeedbackBox onClose={() => setShowFeedback(false)} />
      )}
    </div>
  );
};

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default memo(LandingPage);