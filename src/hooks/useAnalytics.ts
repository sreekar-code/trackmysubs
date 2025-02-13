import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Extend the Window interface to include Umami's type
declare global {
  interface Window {
    umami?: {
      track: (eventName: string, data?: Record<string, any>) => void;
    };
  }
}

export function useAnalytics() {
  const location = useLocation();

  // Track page views
  useEffect(() => {
    // Umami automatically tracks page views, but we can add custom logic here if needed
  }, [location]);

  // Function to track custom events
  const trackEvent = (eventName: string, data?: Record<string, any>) => {
    if (window.umami) {
      window.umami.track(eventName, data);
    }
  };

  return { trackEvent };
} 