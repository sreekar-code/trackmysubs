import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import NotFound from './components/NotFound';
import { supabase } from './lib/supabase';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { useAnalytics } from './hooks/useAnalytics';
import AnalyticsGuard from './components/AnalyticsGuard';
import RequireAuth from './components/RequireAuth';
import LoadingSpinner from './components/LoadingSpinner';
import Pricing from './pages/Pricing';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';

// Preload critical components
const preloadComponent = (factory: () => Promise<any>) => {
  const Component = lazy(factory);
  // Start loading the component in the background
  factory();
  return Component;
};

// Optimize lazy loading with chunk naming and preload
const LandingPage = preloadComponent(() =>
  import(/* webpackChunkName: "landing" */ './components/LandingPage')
);

const Dashboard = preloadComponent(() =>
  import(/* webpackChunkName: "dashboard" */ './components/Dashboard')
);

const Analytics = preloadComponent(() =>
  import(/* webpackChunkName: "analytics" */ './components/Analytics')
);

const Auth = lazy(() =>
  import(/* webpackChunkName: "auth" */ './components/Auth')
);

const ResetPassword = lazy(() =>
  import(/* webpackChunkName: "reset-password" */ './components/ResetPassword')
);

const AuthCallback = lazy(() =>
  import(/* webpackChunkName: "auth-callback" */ './components/AuthCallback')
);

// Lazy load the new pages
const Blog = lazy(() =>
  import(/* webpackChunkName: "blog" */ './pages/Blog')
);

const Terms = lazy(() =>
  import(/* webpackChunkName: "terms" */ './pages/Terms')
);

const Privacy = lazy(() =>
  import(/* webpackChunkName: "privacy" */ './pages/Privacy')
);

const Refund = lazy(() =>
  import(/* webpackChunkName: "refund" */ './pages/Refund')
);

// Optimized loading component with minimal UI
const LoadingFallback = React.memo(() => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
  </div>
));

function App() {
  const [showAuth, setShowAuth] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const { trackEvent } = useAnalytics();

  // Add function to handle login
  const handleLogin = async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession) {
        // If user is already logged in, update session and redirect to dashboard
        setSession(currentSession);
        trackEvent('user_login', { method: 'auto' });
        setShowAuth(false);
      } else {
        // If not logged in, show auth modal
        setShowAuth(true);
      }
    } catch (error) {
      console.error('Login check error:', error);
      setShowAuth(true);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Optimized session check with timeout
    const checkSession = async () => {
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 5000)
        );
        
        const { data: { session: currentSession } } = await Promise.race([sessionPromise, timeoutPromise]);
        
        if (mounted) {
          setSession(currentSession);
          if (currentSession) {
            trackEvent('session_restored');
            setShowAuth(false);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Session check error:', error);
        if (mounted) {
          setSession(null);
          setLoading(false);
        }
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        if (session) {
          setShowAuth(false);
          trackEvent('auth_state_changed', { state: 'signed_in' });
        } else {
          trackEvent('auth_state_changed', { state: 'signed_out' });
        }
      }
    });

    // Intelligent preloading based on user state
    const preloadNextComponents = () => {
      if (!session) {
        // If not logged in, preload auth-related components
        import('./components/Auth');
        import('./components/LandingPage');
      } else {
        // If logged in, preload dashboard and analytics
        import('./components/Dashboard');
        import('./components/Analytics');
      }
    };

    // Start preloading after initial render
    const preloadTimeout = setTimeout(preloadNextComponents, 1000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(preloadTimeout);
    };
  }, [trackEvent]);

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <CurrencyProvider>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route
            path="/"
            element={
              session ? (
                <Dashboard />
              ) : showAuth ? (
                <Auth onSignIn={() => {
                  setShowAuth(false);
                }} />
              ) : (
                <LandingPage 
                  onGetStarted={() => setShowAuth(true)} 
                  onLogin={handleLogin}
                />
              )
            }
          />
          <Route
            path="/analytics"
            element={
              <RequireAuth requireAnalytics>
                <AnalyticsGuard>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Analytics />
                  </Suspense>
                </AnalyticsGuard>
              </RequireAuth>
            }
          />
          <Route path="/blog" element={<Blog />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/refund" element={<Refund />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancel" element={<PaymentCancel />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/404" element={<NotFound />} />
        </Routes>
      </Suspense>
    </CurrencyProvider>
  );
}

export default App