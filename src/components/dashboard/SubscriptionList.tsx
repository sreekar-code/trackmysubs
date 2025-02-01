import React from 'react';
import { Edit2, Tag, Trash2 } from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';

interface Subscription {
  id: string;
  user_id: string;
  name: string;
  price: number;
  billing_cycle: string;
  start_date: string;
  next_billing: string;
  category_id: string | null;
  currency: string;
  category?: {
    name: string;
  };
}

interface SubscriptionListProps {
  subscriptions: Subscription[];
  handleEdit: (subscription: Subscription) => void;
  handleDelete: (id: string) => void;
  selectedCategory: string;
  selectedBillingCycle: string;
  searchQuery: string;
  showRenewingSoon: boolean;
  showExpired: boolean;
}

const SubscriptionList: React.FC<SubscriptionListProps> = ({
  subscriptions,
  handleEdit,
  handleDelete,
  selectedCategory,
  selectedBillingCycle,
  searchQuery,
  showRenewingSoon,
  showExpired,
}) => {
  const { formatAmount } = useCurrency();

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

  const isExpired = (nextBilling: string): boolean => {
    const today = new Date();
    const billingDate = new Date(nextBilling);
    return billingDate < today;
  };

  const isExpiringSoon = (nextBilling: string): boolean => {
    const today = new Date();
    const billingDate = new Date(nextBilling);
    const diffTime = billingDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  };

  const formatSubscriptionAmount = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  const filteredSubscriptions = subscriptions.filter((subscription) => {
    const matchesCategory = !selectedCategory || subscription.category_id === selectedCategory;
    const matchesBillingCycle = !selectedBillingCycle || subscription.billing_cycle === selectedBillingCycle;
    const matchesSearch = !searchQuery || 
      subscription.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (subscription.category?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

    // Status filters
    let matchesStatus = true;
    if (showRenewingSoon && !showExpired) {
      matchesStatus = isExpiringSoon(subscription.next_billing);
    } else if (showExpired && !showRenewingSoon) {
      matchesStatus = isExpired(subscription.next_billing);
    } else if (showExpired && showRenewingSoon) {
      matchesStatus = isExpired(subscription.next_billing) || isExpiringSoon(subscription.next_billing);
    }

    return matchesCategory && matchesBillingCycle && matchesSearch && matchesStatus;
  });

  if (filteredSubscriptions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No subscriptions match your filters</p>
      </div>
    );
  }

  return (
    <>
      <div className="sm:hidden">
        {filteredSubscriptions.map((subscription) => (
          <div 
            key={subscription.id}
            className={`p-4 border-b border-gray-200 ${
              isExpired(subscription.next_billing) ? 'bg-red-50' :
              isExpiringSoon(subscription.next_billing) ? 'bg-yellow-50' : ''
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-grow pr-4">
                <h3 className="font-medium text-gray-900">{subscription.name}</h3>
                <div className="mt-1 space-y-1 text-sm">
                  <p className="font-medium text-gray-900">
                    {formatSubscriptionAmount(subscription.price, subscription.currency)}
                    {subscription.billing_cycle !== 'Monthly' && (
                      <span className="ml-1 text-xs text-gray-500">
                        ({formatSubscriptionAmount(calculateMonthlyPrice(subscription.price, subscription.billing_cycle), subscription.currency)}/mo)
                      </span>
                    )}
                  </p>
                  <p className="text-gray-600">{subscription.billing_cycle}</p>
                  <p className="text-gray-600">Started: {new Date(subscription.start_date).toLocaleDateString()}</p>
                  <div className="flex items-center">
                    <span className="text-gray-600">
                      Next bill: {new Date(subscription.next_billing).toLocaleDateString()}
                    </span>
                    {isExpired(subscription.next_billing) ? (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        Expired
                      </span>
                    ) : isExpiringSoon(subscription.next_billing) && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        Renew Soon
                      </span>
                    )}
                  </div>
                  {subscription.category && (
                    <div className="flex items-center mt-1">
                      <Tag className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-gray-500">{subscription.category.name}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => handleEdit(subscription)}
                  className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-50"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(subscription.id)}
                  className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cycle
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Started
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Next Bill
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSubscriptions.map((subscription) => (
              <tr 
                key={subscription.id}
                className={`hover:bg-gray-50 ${
                  isExpired(subscription.next_billing) ? 'bg-red-50' :
                  isExpiringSoon(subscription.next_billing) ? 'bg-yellow-50' : ''
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{subscription.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Tag className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-sm text-gray-500">
                      {subscription.category?.name || 'Uncategorized'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatSubscriptionAmount(subscription.price, subscription.currency)}
                    {subscription.billing_cycle !== 'Monthly' && (
                      <span className="ml-1 text-xs text-gray-500">
                        ({formatSubscriptionAmount(calculateMonthlyPrice(subscription.price, subscription.billing_cycle), subscription.currency)}/mo)
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{subscription.billing_cycle}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(subscription.start_date).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-900">
                      {new Date(subscription.next_billing).toLocaleDateString()}
                    </span>
                    {isExpired(subscription.next_billing) ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        Expired
                      </span>
                    ) : isExpiringSoon(subscription.next_billing) && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        Renew Soon
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleEdit(subscription)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(subscription.id)}
                      className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default SubscriptionList;