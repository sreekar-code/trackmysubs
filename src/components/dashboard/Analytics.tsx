import { FC } from 'react';
import { Subscription } from '@/types/subscription';
import { getCategoryColor } from '@/utils/colors';

interface TimelineMonth {
  date: string;
  total: number;
  subscriptions: Subscription[];
}

interface AnalyticsProps {
  subscriptions: Subscription[];
  timelineData: TimelineMonth[];
}

// Add this new utility function
const formatSubscriptionAmount = (amount: number, currency: string = 'USD') => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount);
};

const Analytics: FC<AnalyticsProps> = ({ subscriptions, timelineData }) => {
  // Calendar events
  const calendarEvents = subscriptions.map((subscription: Subscription) => ({
    title: `${subscription.name} - ${formatSubscriptionAmount(subscription.price, subscription.currency)}`,
    start: new Date(subscription.next_billing),
    end: new Date(subscription.next_billing),
    allDay: true,
    backgroundColor: getCategoryColor(subscription.category_id),
    borderColor: getCategoryColor(subscription.category_id),
  }));

  return (
    <div className="space-y-8">
      {/* Calendar View */}
      {/* ... existing calendar code ... */}

      {/* Timeline View */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Upcoming Payments</h2>
        {timelineData.map((month: TimelineMonth, index: number) => (
          <div key={month.date} className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{month.date}</h3>
              <span className="text-sm font-medium text-gray-500">
                Total: {formatSubscriptionAmount(month.total, 'USD')} {/* Note: For total we keep USD as it's a sum */}
              </span>
            </div>
            <div className="space-y-3">
              {month.subscriptions.map((subscription: Subscription) => (
                <div
                  key={subscription.id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-100"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: getCategoryColor(subscription.category_id),
                      }}
                    />
                    <span className="font-medium text-gray-900">{subscription.name}</span>
                  </div>
                  <span className="text-gray-600">
                    {formatSubscriptionAmount(subscription.price, subscription.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Analytics; 