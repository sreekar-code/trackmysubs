import React from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const type = searchParams.get('type');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      
      // Handle error cases first
      if (error) {
        let errorMessage = errorDescription || 'Authentication failed';
        if (error === 'access_denied' && errorDescription?.includes('expired')) {
          errorMessage = 'The password reset link has expired. Please request a new one.';
        }
        navigate('/login', { 
          replace: true,
          state: { error: errorMessage }
        });
        return;
      }

      if (!code) {
        console.error('No code parameter found in URL');
        navigate('/login', { 
          replace: true,
          state: { error: 'Invalid authentication link' }
        });
        return;
      }

      try {
        // Exchange the code for a session
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          throw error;
        }

        if (type === 'recovery') {
          // For password reset flow, navigate to reset password page with session tokens
          navigate('/reset-password', {
            replace: true,
            state: {
              accessToken: data.session.access_token,
              refreshToken: data.session.refresh_token
            }
          });
        } else {
          // Check if this is a new user
          const { data: existingAccess } = await supabase
            .from('user_access')
            .select('*')
            .eq('user_id', data.session.user.id)
            .single();

          if (!existingAccess) {
            // Create user access record with trial period for new users
            const trialStartDate = new Date();
            const trialEndDate = new Date(trialStartDate);
            trialEndDate.setDate(trialEndDate.getDate() + 7); // 7-day trial

            const { error: accessError } = await supabase
              .from('user_access')
              .insert({
                user_id: data.session.user.id,
                user_type: 'new',
                has_lifetime_access: false,
                subscription_status: 'trial',
                trial_start_date: trialStartDate.toISOString(),
                trial_end_date: trialEndDate.toISOString()
              });

            if (accessError) {
              console.error('Error creating user access record:', accessError);
            }
          }

          // For normal sign in flow, navigate to dashboard
          navigate('/dashboard', { replace: true });
        }
      } catch (err) {
        console.error('Error handling auth callback:', err);
        navigate('/login', {
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