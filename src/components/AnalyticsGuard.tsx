import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserAccess } from '../hooks/useUserAccess';

interface AnalyticsGuardProps {
  children: React.ReactNode;
}

const AnalyticsGuard: React.FC<AnalyticsGuardProps> = ({ children }) => {
  const { loading, hasAnalyticsAccess } = useUserAccess();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasAnalyticsAccess()) {
    // Redirect to dashboard with a return path
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default AnalyticsGuard; 