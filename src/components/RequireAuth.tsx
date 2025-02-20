import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import LoadingSpinner from './LoadingSpinner';
import { useUserAccess } from '../hooks/useUserAccess';
import UpgradePrompt from './UpgradePrompt';

interface RequireAuthProps {
  children: React.ReactNode;
  requireAnalytics?: boolean;
}

const RequireAuth: React.FC<RequireAuthProps> = ({ children, requireAnalytics = false }) => {
  const location = useLocation();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const { getUserAccessDetails, loading: accessLoading } = useUserAccess();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    checkSession();
  }, []);

  if (loading || accessLoading) {
    return <LoadingSpinner />;
  }

  if (!session) {
    // Redirect to the login page with a return path
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check analytics access if required
  if (requireAnalytics) {
    const { showAnalytics, access } = getUserAccessDetails();
    if (!showAnalytics) {
      // Only redirect free users (who don't have lifetime access) to pricing
      if (access?.subscription_status === 'free' && !access?.has_lifetime_access) {
        return <Navigate to="/pricing" state={{ from: location.pathname }} replace />;
      }
      // Redirect to pricing for other cases (expired trial)
      return <Navigate to="/pricing" replace />;
    }
  }

  return (
    <>
      {children}
      <UpgradePrompt 
        isOpen={showUpgradePrompt} 
        onClose={() => setShowUpgradePrompt(false)} 
      />
    </>
  );
};

export default RequireAuth; 