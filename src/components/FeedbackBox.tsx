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
      const { data, error: submitError } = await supabase
        .rpc('submit_feedback', {
          p_message: message.trim(),
          p_email: email.trim() || null
        });

      if (submitError) throw submitError;

      if (!data.success) {
        throw new Error(data.message);
      }

      setSuccess(true);
      setMessage('');
      setEmail('');
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-full max-w-md bg-white rounded-lg shadow-lg p-4 sm:p-6 z-50">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center">
          <MessageCircle className="h-5 w-5 text-blue-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Share Your Feedback</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
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
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
              Your Feedback
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Tell us what you think..."
              maxLength={1000}
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">
              {message.length}/1000 characters
            </p>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email (optional)
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
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
  );
};

export default FeedbackBox; 