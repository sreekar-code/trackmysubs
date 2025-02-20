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

        // Set session explicitly
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });

        if (setSessionError) {
          console.error('Set session error:', setSessionError);
          throw setSessionError;
        }

        // Wait for session to be set
        await new Promise(resolve => setTimeout(resolve, 1000));

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

        console.log('User retrieved successfully:', { id: user.id, email: user.email });

        // Check if user access record already exists
        const { data: existingAccess, error: accessError } = await supabase
          .from('user_access')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (accessError && accessError.code !== 'PGRST116') {
          console.error('Access check error:', accessError);
          throw accessError;
        }

        // Only create access record if it doesn't exist
        if (!existingAccess) {
          console.log('Creating new user access record for:', user.id);
          
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

          console.log('Attempting to insert access record:', accessData);

          const { error: insertError } = await supabase
            .from('user_access')
            .insert([accessData]);

          if (insertError) {
            console.error('Insert error:', insertError);
            throw new Error(`Failed to create user access record: ${insertError.message}`);
          }

          console.log('Access record created successfully');
        } else {
          console.log('Access record already exists:', existingAccess);
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