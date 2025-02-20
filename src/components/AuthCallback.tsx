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

        console.log('Processing user:', {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        });

        // Function to create user access record
        const createUserAccess = async (retryCount = 0): Promise<void> => {
          try {
            // First try direct insert
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

            console.log('Attempting direct insert of access record:', accessData);

            const { error: directInsertError } = await supabase
              .from('user_access')
              .insert([accessData])
              .select()
              .single();

            if (directInsertError) {
              console.log('Direct insert failed, trying RPC:', directInsertError);
              
              // If direct insert fails, try RPC
              const { error: rpcError } = await supabase.rpc('create_user_access', {
                p_user_id: user.id,
                p_user_type: accessData.user_type,
                p_has_lifetime_access: accessData.has_lifetime_access,
                p_subscription_status: accessData.subscription_status,
                p_trial_start_date: accessData.trial_start_date,
                p_trial_end_date: accessData.trial_end_date
              });

              if (rpcError) {
                console.error('RPC insert failed:', {
                  error: rpcError,
                  message: rpcError.message,
                  code: rpcError.code
                });

                // If we haven't retried too many times, wait and try again
                if (retryCount < 3) {
                  console.log(`Retrying... (attempt ${retryCount + 1})`);
                  await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
                  return createUserAccess(retryCount + 1);
                }

                throw new Error(`Failed to create user access record: ${rpcError.message}`);
              }
            }

            console.log('Access record created successfully');

            // Verify the record was created
            const { data: verifyData, error: verifyError } = await supabase
              .from('user_access')
              .select('*')
              .eq('user_id', user.id)
              .single();

            if (verifyError || !verifyData) {
              throw new Error('Failed to verify access record creation');
            }

            console.log('Access record verified:', verifyData);
          } catch (error) {
            if (retryCount < 3) {
              console.log(`Retrying after error... (attempt ${retryCount + 1})`);
              await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
              return createUserAccess(retryCount + 1);
            }
            throw error;
          }
        };

        // Check if user access record already exists
        const { data: existingAccess, error: accessCheckError } = await supabase
          .from('user_access')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (accessCheckError && accessCheckError.code !== 'PGRST116') {
          console.error('Error checking existing access:', accessCheckError);
          throw accessCheckError;
        }

        // Create access record if it doesn't exist
        if (!existingAccess) {
          console.log('No existing access record found, creating new one');
          await createUserAccess();
        } else {
          console.log('Existing access record found:', existingAccess);
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