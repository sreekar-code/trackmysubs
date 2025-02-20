import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the code from URL
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Handle error cases first
        if (error) {
          console.error('Auth error:', error, errorDescription);
          navigate('/', { 
            replace: true,
            state: { error: errorDescription || 'Authentication failed' }
          });
          return;
        }

        if (!code) {
          console.error('No code parameter found in URL');
          navigate('/', { 
            replace: true,
            state: { error: 'Invalid authentication link' }
          });
          return;
        }

        // Exchange the code for a session
        const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
        
        if (sessionError) {
          throw sessionError;
        }

        if (!data.session?.user) {
          throw new Error('No user data in session');
        }

        // Check if this is a new user by looking up their access record
        const { data: accessData } = await supabase
          .from('user_access')
          .select('*')
          .eq('user_id', data.session.user.id)
          .single();

        if (!accessData) {
          // Create user access record with trial period for new users
          const trialStartDate = new Date();
          const trialEndDate = new Date(trialStartDate);
          trialEndDate.setDate(trialEndDate.getDate() + 7); // 7-day trial

          await supabase
            .from('user_access')
            .insert({
              user_id: data.session.user.id,
              user_type: 'new',
              has_lifetime_access: false,
              subscription_status: 'trial',
              trial_start_date: trialStartDate.toISOString(),
              trial_end_date: trialEndDate.toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        }

        // Navigate to dashboard with replace to prevent back button issues
        navigate('/dashboard', { replace: true });
      } catch (err) {
        console.error('Error in auth callback:', err);
        navigate('/', {
          replace: true,
          state: { error: 'Failed to authenticate. Please try again.' }
        });
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;