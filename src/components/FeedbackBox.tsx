import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { MessageCircle, X } from 'lucide-react';

interface FeedbackBoxProps {
  onClose: () => void;
}

const FeedbackBox: React.FC<FeedbackBoxProps> = ({ onClose }) => {
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please enter your feedback');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: submitError } = await supabase
        .from('feedback')
        .insert({
          message: message.trim(),
          email: email.trim() || null,
          user_id: user?.id || null,
          created_at: new Date().toISOString()
        });

      if (submitError) {
        console.error('Feedback submission error:', submitError);
        if (submitError.code === '42501') {
          throw new Error('Permission denied. Please try again later.');
        }
        throw submitError;
      }

      setSuccess(true);
      setMessage('');
      setEmail('');
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      if (err instanceof Error) {
        if (err.message.includes('rate limit')) {
          setError('Please wait a moment before submitting more feedback');
        } else if (err.message.includes('Permission denied')) {
          setError('Unable to submit feedback at this time. Please try again later.');
        } else {
          setError('Failed to submit feedback. Please try again later.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="modal-overlay" onClick={onClose} />
      
      {/* Feedback Box - Mobile optimized */}
      <div className="modal-content fixed sm:bottom-4 sm:right-4 bottom-0 right-0 w-full sm:w-[440px] max-w-full bg-white rounded-lg sm:rounded-lg shadow-xl p-4 sm:p-6 animate-slide-up">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <MessageCircle className="h-5 w-5 text-blue-500 mr-2" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900">Share Your Feedback</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors duration-200 p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          This is my first app and I might have made some errors. If you find any difficulty, please let me know.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success ? (
          <div className="mb-4 p-3 bg-green-50 rounded-md">
            <p className="text-sm text-green-700">Thank you for your feedback!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Your Feedback
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="resize-none w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Tell us what you think..."
                maxLength={1000}
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500">
                {message.length}/1000 characters
              </p>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email (optional)
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="your@email.com"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500">
                We'll only use this to follow up if needed
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 sm:py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Submit Feedback'
              )}
            </button>
          </form>
        )}
      </div>
    </>
  );
};

export default FeedbackBox; 