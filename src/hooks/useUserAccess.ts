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

        const { data, error } = await supabase
          .from('user_access')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setAccess(data);
      } catch (err) {
        console.error('Error fetching user access:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch user access');
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
    
    // Trial users have access during trial period
    if (access.subscription_status === 'trial' && access.trial_end_date) {
      const trialEnd = new Date(access.trial_end_date);
      return trialEnd > new Date();
    }
    
    return false;
  };

  return {
    access,
    loading,
    error,
    hasAnalyticsAccess
  };
} 