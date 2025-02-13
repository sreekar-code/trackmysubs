import React from 'react';
import { Link } from 'react-router-dom';

const Refund: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow rounded-lg p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Refund Policy</h1>
          
          <div className="space-y-8 text-gray-600">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Refund Eligibility</h2>
              <p className="leading-relaxed mb-4">
                We offer refunds for our premium subscriptions under the following conditions:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Request is made within 14 days of purchase</li>
                <li>Service has not been extensively used</li>
                <li>Valid reason for dissatisfaction is provided</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Refund Process</h2>
              <p className="leading-relaxed mb-4">To request a refund:</p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>
                  Contact us at{' '}
                  <a 
                    href="mailto:trackmysubs.in@gmail.com" 
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    trackmysubs.in@gmail.com
                  </a>
                </li>
                <li>Include your account email and purchase details</li>
                <li>Explain your reason for requesting a refund</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Processing Time</h2>
              <p className="leading-relaxed">
                Refund requests are typically processed within 5-7 business days. The refund will be issued to the original payment method used for the purchase.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Non-Refundable Items</h2>
              <p className="leading-relaxed mb-4">The following are not eligible for refunds:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Purchases made more than 14 days ago</li>
                <li>Accounts that have violated our Terms of Service</li>
                <li>Special promotional offers marked as non-refundable</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Cancellation of Service</h2>
              <p className="leading-relaxed">
                Upon refund approval, your premium features will be reverted to the free tier. You can continue using the basic features of the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Contact Information</h2>
              <p className="leading-relaxed">
                For any questions about our refund policy or to request a refund, please contact us at:{' '}
                <a 
                  href="mailto:trackmysubs.in@gmail.com" 
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  trackmysubs.in@gmail.com
                </a>
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link 
              to="/" 
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Refund; 