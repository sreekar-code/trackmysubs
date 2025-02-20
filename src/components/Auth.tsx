import React, { useState } from 'react';
import { signIn, signUp, resetPassword, signInWithGoogle } from '../lib/auth';
import { CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { user } = await signIn(email, password);
        if (user) {
          onSignIn();
          navigate('/dashboard');
        }
      } else {
        const { user } = await signUp(email, password);
        if (user) {
          onSignIn();
          navigate('/dashboard');
        }
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
      await signInWithGoogle();
      // The OAuth flow will handle the redirect automatically
      // The callback will redirect to /dashboard
    } catch (err) {
      console.error('Google auth error:', err);
      setError(err instanceof Error ? err.message : 'Google authentication failed');
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
              {isLogin ? 'Sign in to your account' : 'Create your account'}
            </h2>
            <p className="mt-3 text-center text-sm text-gray-600">
              {isLogin
                ? "Don't have an account? "
                : 'Already have an account? '}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                }}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

          {error && !resetSent && (
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

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
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
                Google
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
