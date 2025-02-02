import React from 'react';

const CancellationPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Cancellation and Refund Policy</h1>
          
          <div className="prose prose-blue max-w-none">
            <p className="text-gray-600 mb-4">Last updated: {new Date().toLocaleDateString()}</p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Subscription Cancellation</h2>
              <ul className="list-disc pl-5 text-gray-600 mb-4">
                <li>You can cancel your premium subscription at any time</li>
                <li>After cancellation, you'll continue to have premium access until the end of your current billing period</li>
                <li>Once the billing period ends, your account will automatically revert to the free plan</li>
                <li>No partial refunds are provided for unused portions of the subscription</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Free Trial</h2>
              <ul className="list-disc pl-5 text-gray-600 mb-4">
                <li>New premium subscriptions come with a 7-day free trial</li>
                <li>You can cancel during the trial period without being charged</li>
                <li>If you don't cancel before the trial ends, you'll be charged for the annual subscription</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Refund Policy</h2>
              <p className="text-gray-600 mb-4">
                We generally do not provide refunds for premium subscriptions. However, we may consider refund requests in the following cases:
              </p>
              <ul className="list-disc pl-5 text-gray-600 mb-4">
                <li>Technical issues prevented you from accessing premium features</li>
                <li>Accidental or duplicate charges</li>
                <li>Service unavailability for extended periods</li>
              </ul>
              <p className="text-gray-600 mb-4">
                Refund requests must be submitted within 7 days of the charge. Each request will be evaluated on a case-by-case basis.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. How to Cancel</h2>
              <p className="text-gray-600 mb-4">To cancel your premium subscription:</p>
              <ol className="list-decimal pl-5 text-gray-600 mb-4">
                <li>Log into your account</li>
                <li>Go to Account Settings</li>
                <li>Select 'Subscription'</li>
                <li>Click 'Cancel Subscription'</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Contact Us</h2>
              <p className="text-gray-600">
                For any questions about cancellations or refunds, please contact us at{' '}
                <a href="mailto:support@trackmysubs.in" className="text-blue-600 hover:text-blue-500">
                  support@trackmysubs.in
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancellationPolicy; 