import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Extend the Window interface to include Umami's type
declare global {
  interface Window {
    umami?: {
      track: (eventName: string, data?: Record<string, any>) => void;
    };
  }
}

// Debounce function
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function useAnalytics() {
  const location = useLocation();
  const lastTrackedPath = useRef<string>(location.pathname);
  const errorCount = useRef(0);
  const maxRetries = 3;

  // Track page views with error handling and debouncing
  useEffect(() => {
    if (location.pathname === lastTrackedPath.current) return;
    lastTrackedPath.current = location.pathname;
  }, [location]);

  // Function to track custom events with debouncing and error handling
  const trackEvent = useCallback(
    debounce(async (eventName: string, data?: Record<string, any>) => {
      if (!window.umami || errorCount.current >= maxRetries) return;

      try {
        window.umami.track(eventName, data);
        errorCount.current = 0; // Reset error count on success
      } catch (error) {
        console.warn('Analytics tracking error:', error);
        errorCount.current++;
        
        if (errorCount.current >= maxRetries) {
          console.warn('Analytics disabled due to repeated errors');
        }
      }
    }, 1000), // 1 second debounce
    []
  );

  return { trackEvent };
} 