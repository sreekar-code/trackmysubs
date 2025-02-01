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