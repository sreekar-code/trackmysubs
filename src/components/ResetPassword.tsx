import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyAndSetSession, updatePasswordWithToken } from '../lib/auth';
import { CreditCard } from 'lucide-react';

const ResetPassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const initializeSession = async () => {
      try {
        const state = location.state as { accessToken?: string; refreshToken?: string } | null;
        
        if (!state?.accessToken || !state?.refreshToken) {
          throw new Error('Invalid password reset link');
        }

        // Set up the session with the tokens
        await verifyAndSetSession(state.accessToken, state.refreshToken);

        // Clean up the URL
        window.history.replaceState(null, '', '/reset-password');
      } catch (err) {
        console.error('Session initialization error:', err);
        setError('Invalid or expired password reset link. Please request a new one.');
        // Delay redirect to show the error message
        setTimeout(() => navigate('/', { replace: true }), 3000);
      } finally {
        setInitializing(false);
      }
    };

    initializeSession();
  }, [navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate password
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await updatePasswordWithToken(newPassword);
      // Show success message and redirect
      navigate('/', { 
        replace: true,
        state: { message: 'Password successfully reset. Please sign in with your new password.' }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-violet-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying reset password link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-violet-50">
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
            <span className="ml-2 text-lg sm:text-xl font-bold text-gray-900">
              trackmysubs.in
            </span>
          </div>
        </div>
      </nav>

      <div className="flex items-center justify-center p-4 mt-8">
        <div className="w-full max-w-md">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Create a new password</h2>
            <p className="text-gray-600 text-sm mb-6">
              Your password must be at least six characters and should include a combination of numbers, letters and special characters (!$@%).
            </p>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 p-3 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  className="w-full border border-gray-300 rounded-md px-4 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className="w-full border border-gray-300 rounded-md px-4 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-md py-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    <span>Resetting Password...</span>
                  </div>
                ) : (
                  'Reset Password'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;