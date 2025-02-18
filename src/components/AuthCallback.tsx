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
        navigate('/', { 
          replace: true,
          state: { error: errorMessage }
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
              // Continue with navigation even if access record creation fails
              // The user can still use the app, and we can handle the missing record later
            }
          }

          // For normal sign in flow, just navigate to home
          navigate('/', { replace: true });
        }
      } catch (error) {
        console.error('Error processing authentication:', error);
        const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
        navigate('/', {
          replace: true,
          state: { 
            error: `Authentication failed: ${errorMessage}. Please try again.`
          }
        });
      }
    };

    handleCallback();
  }, [navigate, searchParams, location]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-violet-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Processing your request...</p>
      </div>
    </div>
  );
};

export default AuthCallback;