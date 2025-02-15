import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowLeft } from 'lucide-react';

const Blog: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <Link 
          to="/"
          className="inline-flex items-center text-xs sm:text-sm text-gray-500 hover:text-gray-700 mb-6 sm:mb-8"
        >
          <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          Back to Home
        </Link>

        <div className="text-center">
          <div className="flex justify-center mb-4 sm:mb-6">
            <BookOpen className="h-12 w-12 sm:h-16 sm:w-16 text-blue-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Blog Coming Soon
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto mb-8 sm:mb-12 px-2 sm:px-0">
            We're working on creating valuable content to help you better manage your subscriptions. 
            Stay tuned for articles about subscription management, money-saving tips, and more!
          </p>

          <Link
            to="/"
            className="inline-flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-lg sm:rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Blog; 