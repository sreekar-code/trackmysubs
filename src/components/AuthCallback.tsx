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
          console.error('Session error:', sessionError);
          throw sessionError;
        }

        if (!data.session?.user) {
          console.error('No user data in session');
          throw new Error('No user data in session');
        }

        // Wait for session to be fully established
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Get user data
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error('Get user error:', userError);
          throw userError;
        }
        if (!user) {
          console.error('User not found after getting session');
          throw new Error('User not found');
        }

        console.log('Creating access record for user:', {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        });

        // Check if user access record already exists
        const { data: existingAccess, error: accessCheckError } = await supabase
          .from('user_access')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (accessCheckError && accessCheckError.code !== 'PGRST116') {
          console.error('Error checking existing access:', accessCheckError);
          throw accessCheckError;
        }

        // Only create access record if it doesn't exist
        if (!existingAccess) {
          const isExistingUser = new Date(user.created_at) < new Date('2024-02-01');
          const trialStartDate = new Date();
          const trialEndDate = new Date(trialStartDate);
          trialEndDate.setDate(trialEndDate.getDate() + 7);

          const accessData = {
            user_id: user.id,
            user_type: isExistingUser ? 'existing' : 'new',
            has_lifetime_access: isExistingUser,
            subscription_status: isExistingUser ? 'free' : 'trial',
            trial_start_date: isExistingUser ? null : trialStartDate.toISOString(),
            trial_end_date: isExistingUser ? null : trialEndDate.toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          console.log('Inserting new access record:', accessData);

          const { error: insertError } = await supabase
            .from('user_access')
            .insert([accessData]);

          if (insertError) {
            console.error('Error creating access record:', {
              error: insertError,
              code: insertError.code,
              details: insertError.details,
              hint: insertError.hint
            });
            throw new Error(`Failed to create user access record: ${insertError.message}`);
          }

          console.log('Access record created successfully');
        } else {
          console.log('Access record already exists for user');
        }

        // Navigate to dashboard
        navigate('/dashboard', { replace: true });
      } catch (err) {
        console.error('Error in auth callback:', err);
        navigate('/', {
          replace: true,
          state: { error: err instanceof Error ? err.message : 'Failed to authenticate' }
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