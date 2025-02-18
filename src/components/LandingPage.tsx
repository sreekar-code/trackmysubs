import React, { memo, useState, useEffect, useRef } from 'react';
import { CreditCard, Clock, DollarSign, Zap, Tag, Globe, BarChart, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import FeedbackBox from './FeedbackBox';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

interface FeedbackBoxProps {
  onClose: () => void;
}

// Memoize Feature component to prevent unnecessary re-renders
const Feature = memo<FeatureProps>(({ icon, title, description }) => (
  <div className="relative px-4 py-6 sm:py-0">
    <div className="flex flex-col items-center text-center">
      <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-50 mb-4 sm:mb-6">
        {icon}
      </div>
      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">{title}</h3>
      <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-xs mx-auto">{description}</p>
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
  const [hasFeedbackShown, setHasFeedbackShown] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Check if feedback has been shown in this session
    const hasShown = sessionStorage.getItem('feedbackShown');
    if (hasShown) {
      setHasFeedbackShown(true);
    }

    // Set up intersection observer for automatic feedback trigger
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasFeedbackShown) {
          setTimeout(() => {
            setShowFeedback(true);
            setHasFeedbackShown(true);
            sessionStorage.setItem('feedbackShown', 'true');
          }, 1000); // Delay of 1 second after scrolling to the trigger point
        }
      },
      {
        threshold: 0.5, // Trigger when 50% of the element is visible
      }
    );

    if (triggerRef.current) {
      observer.observe(triggerRef.current);
    }

    return () => {
      if (triggerRef.current) {
        observer.unobserve(triggerRef.current);
      }
    };
  }, [hasFeedbackShown]);

  const handleFeedbackClose = () => {
    setShowFeedback(false);
    setHasFeedbackShown(true);
    sessionStorage.setItem('feedbackShown', 'true');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white/90 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
              <span className="ml-2 text-base sm:text-xl font-bold text-gray-900 truncate">
                trackmysubs.in
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/pricing"
                className="hidden sm:inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200"
              >
                Pricing
              </Link>
              <button
                onClick={onLogin}
                className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow flex flex-col">
        <div className="relative flex-grow flex items-center justify-center bg-gradient-to-b from-white to-blue-50">
          <div 
            className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,transparent)] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,white,transparent)]" 
            style={{ backgroundSize: '20px 20px' }} 
          />
          
          <div className="relative w-full">
            <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-32">
              <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight">
                  <span className="inline-block">Track Your</span>{' '}
                  <span className="inline-block">Subscriptions</span>
                  <span className="block mt-2 bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                    All in One Place
                  </span>
                </h1>
                <p className="mt-4 sm:mt-6 text-base sm:text-xl text-gray-600 max-w-3xl mx-auto px-4 sm:px-0">
                  Keep track of your subscriptions and never miss a renewal.
                </p>
                <div className="mt-6 sm:mt-10">
                  <button
                    onClick={onGetStarted}
                    className="inline-flex items-center justify-center px-5 sm:px-7 py-2.5 sm:py-3.5 text-base sm:text-lg font-medium rounded-xl text-white bg-blue-500 hover:bg-blue-600 transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.98] transform hover:-translate-y-0.5"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <div className="mx-auto grid max-w-5xl grid-cols-1 gap-y-8 sm:gap-y-16 sm:gap-x-8 md:grid-cols-2 lg:grid-cols-3">
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

        <div ref={triggerRef} className="h-1" aria-hidden="true" />

        <div className="bg-gray-50 py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl px-4 sm:px-0">
                Simple, Transparent Pricing
              </h2>
              <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 text-gray-600 px-4 sm:px-0">
                Choose the plan that best fits your needs. Start with our free tier and upgrade anytime.
              </p>
            </div>

            <div className="mx-auto mt-8 sm:mt-16 grid max-w-5xl grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2">
              {/* Free Plan */}
              <div className="flex flex-col justify-between rounded-2xl sm:rounded-3xl bg-white p-6 sm:p-8 ring-1 ring-gray-200">
                <div>
                  <div className="flex items-center justify-between gap-x-4">
                    <h3 className="text-lg font-semibold leading-8 text-gray-900">Free</h3>
                    <p className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold leading-5 text-blue-600">
                      Get Started
                    </p>
                  </div>
                  <p className="mt-4 sm:mt-6 text-sm sm:text-base leading-6 sm:leading-7 text-gray-600">
                    Perfect for tracking your subscriptions
                  </p>
                  <div className="mt-6 sm:mt-8 flex items-baseline gap-x-1">
                    <span className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">$0</span>
                    <span className="text-sm font-semibold leading-6 text-gray-600">/month</span>
                  </div>
                  <ul role="list" className="mt-6 sm:mt-8 space-y-2 sm:space-y-3 text-sm leading-6 text-gray-600">
                    <li className="flex gap-x-3 items-center">
                      <Check className="h-5 w-5 flex-none text-blue-600" aria-hidden="true" />
                      <span>Subscription Dashboard</span>
                    </li>
                    <li className="flex gap-x-3 items-center">
                      <Check className="h-5 w-5 flex-none text-blue-600" aria-hidden="true" />
                      <span>Track All Your Subscriptions</span>
                    </li>
                    <li className="flex gap-x-3 items-center">
                      <Check className="h-5 w-5 flex-none text-blue-600" aria-hidden="true" />
                      <span>Organize with Categories</span>
                    </li>
                    <li className="flex gap-x-3 items-center">
                      <Check className="h-5 w-5 flex-none text-blue-600" aria-hidden="true" />
                      <span>Multi-Currency Support</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={onGetStarted}
                  className="mt-6 sm:mt-8 block w-full rounded-lg sm:rounded-xl py-2.5 text-center text-sm font-semibold leading-6 text-blue-600 ring-1 ring-inset ring-blue-200 hover:ring-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  Get Started
                </button>
              </div>

              {/* Premium Plan */}
              <div className="flex flex-col justify-between rounded-2xl sm:rounded-3xl bg-white p-6 sm:p-8 ring-1 ring-gray-200">
                <div>
                  <div className="flex items-center justify-between gap-x-4">
                    <h3 className="text-lg font-semibold leading-8 text-gray-900">Premium</h3>
                    <p className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold leading-5 text-blue-600">
                      Popular
                    </p>
                  </div>
                  <p className="mt-4 sm:mt-6 text-sm sm:text-base leading-6 sm:leading-7 text-gray-600">
                    Everything in Free plus Analytics
                  </p>
                  <div className="mt-6 sm:mt-8 flex items-baseline gap-x-1">
                    <span className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">$10</span>
                    <span className="text-sm font-semibold leading-6 text-gray-600">/year</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    That's less than $1/month
                  </p>
                  <ul role="list" className="mt-6 sm:mt-8 space-y-2 sm:space-y-3 text-sm leading-6 text-gray-600">
                    <li className="flex gap-x-3 items-center">
                      <Check className="h-5 w-5 flex-none text-blue-600" aria-hidden="true" />
                      <span>Everything in Free tier</span>
                    </li>
                    <li className="flex gap-x-3 items-center">
                      <Check className="h-5 w-5 flex-none text-blue-600" aria-hidden="true" />
                      <span>Analytics Dashboard</span>
                    </li>
                    <li className="flex gap-x-3 items-center">
                      <Check className="h-5 w-5 flex-none text-blue-600" aria-hidden="true" />
                      <span>Spending Trends & Insights</span>
                    </li>
                    <li className="flex gap-x-3 items-center">
                      <Check className="h-5 w-5 flex-none text-blue-600" aria-hidden="true" />
                      <span>Visual Reports & Charts</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={onGetStarted}
                  className="mt-6 sm:mt-8 block w-full rounded-lg sm:rounded-xl py-2.5 text-center text-sm font-semibold leading-6 text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
          <nav className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Link to="/blog" className="text-sm text-gray-500 hover:text-gray-900">
              Blog
            </Link>
            <Link to="/terms" className="text-sm text-gray-500 hover:text-gray-900">
              Terms & Conditions
            </Link>
            <Link to="/privacy" className="text-sm text-gray-500 hover:text-gray-900">
              Privacy Policy
            </Link>
            <Link to="/refund" className="text-sm text-gray-500 hover:text-gray-900">
              Refund Policy
            </Link>
            <a 
              href="mailto:trackmysubs.in@gmail.com" 
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              Support
            </a>
            <button
              onClick={() => setShowFeedback(true)}
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              Feedback
            </button>
          </nav>
          <div className="flex flex-col items-center">
            <p className="text-center text-xs sm:text-sm text-gray-500">
              © {currentYear} trackmysubs.in. All rights reserved.
            </p>
            <p className="mt-2 text-center text-xs sm:text-sm text-gray-500">
              Contact us: <a href="mailto:trackmysubs.in@gmail.com" className="text-blue-600 hover:text-blue-800">trackmysubs.in@gmail.com</a>
            </p>
          </div>
        </div>
      </footer>

      {showFeedback && (
        <FeedbackBox onClose={handleFeedbackClose} />
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