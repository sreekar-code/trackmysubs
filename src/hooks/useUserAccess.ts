import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface UserAccess {
  id: string;
  user_id: string;
  user_type: 'existing' | 'new';
  has_lifetime_access: boolean;
  subscription_status: 'free' | 'trial' | 'premium';
  trial_start_date: string | null;
  trial_end_date: string | null;
  subscription_end_date: string | null;
}

interface UserAccessDetails {
  hasFullAccess: boolean;      // Whether user has access to all features
  showPricing: boolean;        // Whether to show pricing options
  showAnalytics: boolean;      // Whether to show analytics option
  isLifetimeUser: boolean;     // Whether user has lifetime access
  access: UserAccess | null;   // The raw access data
  trialStatus: {
    isInTrial: boolean;
    daysLeft: number;
  };
}

export function useUserAccess() {
  const [access, setAccess] = useState<UserAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setAccess(null);
          return;
        }

        // First check if user access exists
        const { data, error: fetchError } = await supabase
          .from('user_access')
          .select('id, user_id, user_type, has_lifetime_access, subscription_status, trial_start_date, trial_end_date, subscription_end_date')
          .eq('user_id', user.id)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        setAccess(data);
      } catch (err) {
        // Only log real errors, not "no rows returned"
        const error = err as { code?: string };
        if (error.code !== 'PGRST116') {
          console.error('Error fetching user access:', err);
          setError(err instanceof Error ? err.message : 'Failed to fetch user access');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAccess();

    // Subscribe to changes in user_access
    const channel = supabase
      .channel('user_access_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_access'
        },
        (payload) => {
          // Update access data when changes occur
          if (payload.new) {
            setAccess(payload.new as UserAccess);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const hasAnalyticsAccess = () => {
    if (!access) return false;
    
    // Existing users always have access
    if (access.has_lifetime_access) return true;
    
    // Premium users have access
    if (access.subscription_status === 'premium') return true;
    
    // Trial access check
    if (access.subscription_status === 'trial') {
      // Must have both start and end dates for trial
      if (!access.trial_start_date || !access.trial_end_date) {
        return false;
      }

      const now = new Date();
      const trialEnd = new Date(access.trial_end_date);
      
      // Check if trial is still valid
      if (now > trialEnd) {
        // Trial has expired
        return false;
      }
      
      return true;
    }
    
    return false;
  };

  // Add a helper to check trial status
  const getTrialStatus = () => {
    if (!access || access.subscription_status !== 'trial') {
      return { isInTrial: false, daysLeft: 0 };
    }

    if (!access.trial_end_date) {
      return { isInTrial: false, daysLeft: 0 };
    }

    const now = new Date();
    const trialEnd = new Date(access.trial_end_date);
    const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    return {
      isInTrial: daysLeft > 0,
      daysLeft
    };
  };

  // Add a helper to determine user access details
  const getUserAccessDetails = (): UserAccessDetails => {
    if (!access) {
      return {
        hasFullAccess: false,
        showPricing: true,
        showAnalytics: false,
        isLifetimeUser: false,
        access: null,
        trialStatus: { isInTrial: false, daysLeft: 0 }
      };
    }

    // Handle existing users with lifetime access
    if (access.has_lifetime_access) {
      return {
        hasFullAccess: true,
        showPricing: false,      // Never show pricing for lifetime users
        showAnalytics: true,     // Always show analytics for lifetime users
        isLifetimeUser: true,
        access,
        trialStatus: { isInTrial: false, daysLeft: 0 }
      };
    }

    // Handle premium users
    if (access.subscription_status === 'premium') {
      return {
        hasFullAccess: true,
        showPricing: false,      // Don't show pricing for premium users
        showAnalytics: true,
        isLifetimeUser: false,
        access,
        trialStatus: { isInTrial: false, daysLeft: 0 }
      };
    }

    // Get trial status
    const trialStatus = getTrialStatus();

    // Handle trial users
    if (access.subscription_status === 'trial') {
      return {
        hasFullAccess: trialStatus.isInTrial,
        showPricing: true,       // Show pricing during trial
        showAnalytics: trialStatus.isInTrial,
        isLifetimeUser: false,
        access,
        trialStatus
      };
    }

    // Handle free users (non-lifetime)
    return {
      hasFullAccess: false,
      showPricing: true,
      showAnalytics: true,      // Show analytics option but require upgrade
      isLifetimeUser: false,
      access,
      trialStatus: { isInTrial: false, daysLeft: 0 }
    };
  };

  return {
    access,
    loading,
    error,
    hasAnalyticsAccess,
    getTrialStatus,
    getUserAccessDetails
  };
} 