import React from 'react';
import { ListChecks } from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';

interface DashboardStatsProps {
  totalMonthlySpend: number;
  subscriptionCount: number;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
  totalMonthlySpend,
  subscriptionCount,
}) => {
  const { formatAmount, currency, currencies } = useCurrency();
  const currencySymbol = currencies[currency as keyof typeof currencies].symbol;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-4 sm:p-6">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 sm:h-14 sm:w-14 bg-blue-50 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-semibold text-blue-500">
            {currencySymbol}
          </div>
          <h3 className="mt-3 text-sm font-medium text-gray-600">Monthly Spend</h3>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-blue-600">
            {formatAmount(totalMonthlySpend)}
          </p>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-4 sm:p-6">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 sm:h-14 sm:w-14 bg-blue-50 rounded-full flex items-center justify-center">
            <ListChecks className="h-6 w-6 sm:h-7 sm:w-7 text-blue-500" />
          </div>
          <h3 className="mt-3 text-sm font-medium text-gray-600">Active Subscriptions</h3>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-blue-600">
            {subscriptionCount}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;