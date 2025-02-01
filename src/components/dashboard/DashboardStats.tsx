import React, { useState, useEffect } from 'react';
import { ListChecks } from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { convertCurrency } from '../../utils/currencyConverter';

interface DashboardStatsProps {
  subscriptions: {
    price: number;
    billing_cycle: string;
    currency: string;
  }[];
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
  subscriptions
}) => {
  const { formatAmount, currency, currencies, setCurrency } = useCurrency();
  const currencySymbol = currencies[currency as keyof typeof currencies].symbol;
  const [totalMonthlySpend, setTotalMonthlySpend] = useState<number>(0);
  const [isConverting, setIsConverting] = useState(false);

  const calculateMonthlyPrice = (price: number, billingCycle: string): number => {
    switch (billingCycle) {
      case 'Yearly':
        return price / 12;
      case 'Quarterly':
        return price / 3;
      default:
        return price;
    }
  };

  useEffect(() => {
    const calculateTotalSpend = async () => {
      setIsConverting(true);
      try {
        let total = 0;
        
        // Convert each subscription's price to the selected currency and sum up
        for (const sub of subscriptions) {
          const monthlyPrice = calculateMonthlyPrice(sub.price, sub.billing_cycle);
          const convertedPrice = await convertCurrency(monthlyPrice, sub.currency, currency);
          total += convertedPrice;
        }
        
        setTotalMonthlySpend(total);
      } catch (error) {
        console.error('Error calculating total spend:', error);
      } finally {
        setIsConverting(false);
      }
    };

    calculateTotalSpend();
  }, [subscriptions, currency]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-4 sm:p-6">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <h3 className="text-sm font-medium text-gray-600">Monthly Spend</h3>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="ml-2 text-sm border border-gray-300 rounded-md py-1 px-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer hover:bg-gray-50 transition-colors"
            >
              {Object.entries(currencies).map(([code, { name }]) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>
          {isConverting ? (
            <div className="mt-2 flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-blue-600">
              {formatAmount(totalMonthlySpend)}
            </p>
          )}
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-4 sm:p-6">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 sm:h-14 sm:w-14 bg-blue-50 rounded-full flex items-center justify-center">
            <ListChecks className="h-6 w-6 sm:h-7 sm:w-7 text-blue-500" />
          </div>
          <h3 className="mt-3 text-sm font-medium text-gray-600">Active Subscriptions</h3>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-blue-600">
            {subscriptions.length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;