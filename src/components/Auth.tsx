import React, { useState } from 'react';
import { signIn, signUp, resetPassword, signInWithGoogle } from '../lib/auth';
import { CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface AuthProps {
  onSignIn: () => void;
}

const Auth: React.FC<AuthProps> = ({ onSignIn }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();

  const createUserAccess = async (user: any, retryCount = 0): Promise<boolean> => {
    try {
      console.log('Checking/creating access for user:', user.id);
      
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

      // Only create access record if it doesn't exist
      if (!existingAccess) {
        console.log('No existing access found, creating new record');
        
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

        // First try direct insert
        const { error: directInsertError } = await supabase
          .from('user_access')
          .insert([accessData]);

        if (directInsertError) {
          console.error('Direct insert failed:', directInsertError);
          
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
            console.error('RPC insert failed:', rpcError);
            throw rpcError;
          }
        }

        // Wait a bit before verifying to allow for any potential lag
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Verify the record was created
        const { data: verifyData, error: verifyError } = await supabase
          .from('user_access')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (verifyError || !verifyData) {
          throw new Error('Failed to verify access record creation');
        }

        console.log('Access record created and verified:', verifyData);
        return true;
      } else {
        console.log('Access record already exists:', existingAccess);
        return true;
      }
    } catch (error) {
      console.error('Error in createUserAccess:', error);
      if (retryCount < 3) {
        console.log(`Retrying after error... (attempt ${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return createUserAccess(user, retryCount + 1);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (signInError) throw signInError;
        if (!user) throw new Error('No user data returned');

        // Try to create user access record if needed
        await createUserAccess(user);

        onSignIn();
        navigate('/dashboard', { replace: true });
      } else {
        // Handle signup
        console.log('Attempting signup with email:', email);
        
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              created_at: new Date().toISOString()
            }
          }
        });
        
        if (signUpError) {
          console.error('Signup error:', signUpError);
          throw signUpError;
        }

        if (!data.user) {
          console.error('No user data returned from signup');
          throw new Error('No user data returned from signup');
        }

        console.log('Signup successful, user created:', data.user.id);
        
        // Show confirmation message
        setResetSent(true);
        setError(null);
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      // First sign in with Google
      const { data: signInData, error: signInError } = await signInWithGoogle();
      if (signInError) throw signInError;

      // Wait for session to be established
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get user data
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No user data returned');

      console.log('User authenticated:', user.id);

      // Try to create user access record if needed
      const accessCreated = await createUserAccess(user);
      if (!accessCreated) {
        throw new Error('Failed to create or verify user access record');
      }

      // Call onSignIn callback and navigate to dashboard
      onSignIn();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Google auth error:', err);
      setError(err instanceof Error ? err.message : 'Google authentication failed');
      // If there's an error, try to sign out to clean up any partial state
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to send reset email'
      );
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-violet-50">
        <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center">
              <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
              <span className="ml-2 text-lg sm:text-xl font-bold text-gray-900">
                trackmysubs.in
              </span>
            </div>
          </div>
        </nav>

        <div className="flex-grow flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-md space-y-6 bg-white p-6 sm:p-8 rounded-xl shadow-lg">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900">
                Reset your password
              </h2>
              <p className="mt-3 text-center text-sm text-gray-600">
                Enter your email address and we'll send you a link to reset your
                password.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 p-4 rounded-md">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {resetSent && (
              <div className="text-center">
                <div className="bg-green-50 p-4 rounded-md mb-4">
                  <p className="text-sm text-green-700">
                    {isLogin ? 'Check your email for a link to reset your password.' : 'Please check your email to confirm your account. You will be able to sign in after confirming your email address.'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetSent(false);
                    setIsLogin(true);
                  }}
                  className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                >
                  Return to sign in
                </button>
              </div>
            )}

            {!resetSent && (
              <form onSubmit={handleForgotPassword} className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter your email"
                  />
                </div>

                <div className="flex flex-col space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Sending reset link...
                      </div>
                    ) : (
                      'Send reset link'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                  >
                    Back to sign in
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-violet-50">
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center">
            <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
            <span className="ml-2 text-lg sm:text-xl font-bold text-gray-900">
              trackmysubs.in
            </span>
          </div>
        </div>
      </nav>

      <div className="flex-grow flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md space-y-6 bg-white p-6 sm:p-8 rounded-xl shadow-lg">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900">
              Sign in to your account
            </h2>
            <p className="mt-3 text-center text-sm text-gray-600">
              Continue with Google to manage your subscriptions
            </p>
          </div>

          {error && (
            <div className="bg-red-50 p-4 rounded-md">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin mr-3 h-5 w-5 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                  Signing in...
                </div>
              ) : (
                <>
                  <svg className="h-6 w-6 mr-3" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                    <path d="M1 1h22v22H1z" fill="none" />
                  </svg>
                  Continue with Google
                </>
              )}
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-gray-500">
            By continuing, you agree to our{' '}
            <a href="/terms" className="text-blue-600 hover:text-blue-800">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-blue-600 hover:text-blue-800">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
