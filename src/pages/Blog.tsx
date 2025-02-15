import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowLeft } from 'lucide-react';

const Blog: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <Link 
          to="/"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Home
        </Link>

        <div className="text-center">
          <div className="flex justify-center mb-6">
            <BookOpen className="h-16 w-16 text-blue-500" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Blog Coming Soon
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-12">
            We're working on creating valuable content to help you better manage your subscriptions. 
            Stay tuned for articles about subscription management, money-saving tips, and more!
          </p>

          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Blog; 