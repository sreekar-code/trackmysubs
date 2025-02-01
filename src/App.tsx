import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { CurrencyProvider } from './contexts/CurrencyContext';

// Optimize lazy loading with prefetch
const LandingPage = lazy(() =>
  import('./components/LandingPage' /* webpackPrefetch: true */)
);
const Dashboard = lazy(() =>
  import('./components/Dashboard' /* webpackPrefetch: true */)
);
const Analytics = lazy(() =>
  import('./components/Analytics' /* webpackPrefetch: true */)
);
const Auth = lazy(() =>
  import('./components/Auth' /* webpackPrefetch: true */)
);
const ResetPassword = lazy(() =>
  import('./components/ResetPassword' /* webpackPrefetch: true */)
);
const AuthCallback = lazy(() =>
  import('./components/AuthCallback' /* webpackPrefetch: true */)
);

// Optimized loading component
const LoadingFallback = React.memo(() => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
));

function App() {
  const [showAuth, setShowAuth] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    // Optimized session check
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (mounted) {
          setSession(session);
          setLoading(false);
        }
      } catch {
        if (mounted) {
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
      }
    });

    // Prefetch other components
    const prefetchComponents = () => {
      const prefetchPromises = [
        import('./components/Dashboard'),
        import('./components/Auth'),
        import('./components/LandingPage'),
        import('./components/Analytics'),
      ];
      Promise.all(prefetchPromises).catch(() => {});
    };

    // Prefetch after initial render
    setTimeout(prefetchComponents, 1000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
                <Auth onSignIn={() => setSession(true)} />
              ) : (
                <LandingPage onGetStarted={() => setShowAuth(true)} />
              )
            }
          />
          <Route
            path="/analytics"
            element={session ? <Analytics /> : <Navigate to="/" replace />}
          />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </CurrencyProvider>
  );
}

export default App