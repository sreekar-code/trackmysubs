import React from 'react';
import { Search, Filter, Settings, Clock } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  is_default: boolean;
}

interface SubscriptionFiltersProps {
  categories: Category[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedBillingCycle: string;
  setSelectedBillingCycle: (cycle: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onManageCategories: () => void;
  showRenewingSoon: boolean;
  setShowRenewingSoon: (show: boolean) => void;
  showExpired: boolean;
  setShowExpired: (show: boolean) => void;
}

const SubscriptionFilters: React.FC<SubscriptionFiltersProps> = ({
  categories,
  selectedCategory,
  setSelectedCategory,
  selectedBillingCycle,
  setSelectedBillingCycle,
  searchQuery,
  setSearchQuery,
  onManageCategories,
  showRenewingSoon,
  setShowRenewingSoon,
  showExpired,
  setShowExpired,
}) => {
  const sortedCategories = [...categories].sort((a, b) => {
    if (a.name === 'Other') return 1;
    if (b.name === 'Other') return -1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-4">
      <div className="space-y-3 sm:space-y-4">
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search subscriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {/* Category Filter */}
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {sortedCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Billing Cycle Filter */}
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
            <select
              value={selectedBillingCycle}
              onChange={(e) => setSelectedBillingCycle(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Billing Cycles</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowRenewingSoon(!showRenewingSoon)}
            className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              showRenewingSoon
                ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Clock className={`h-4 w-4 sm:h-5 sm:w-5 mr-2 ${showRenewingSoon ? 'text-yellow-500' : 'text-gray-400'}`} />
            Renew Soon
          </button>

          <button
            onClick={() => setShowExpired(!showExpired)}
            className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              showExpired
                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Clock className={`h-4 w-4 sm:h-5 sm:w-5 mr-2 ${showExpired ? 'text-red-500' : 'text-gray-400'}`} />
            Expired
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionFilters;