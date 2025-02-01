import React, { useState } from 'react';
import { X, Tag } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCurrency, currencies } from '../../contexts/CurrencyContext';

interface Category {
  id: string;
  name: string;
  is_default: boolean;
}

interface SubscriptionFormData {
  name: string;
  price: string;
  billing_cycle: string;
  start_date: string;
  next_billing: string;
  category_id: string;
  currency: string;
}

interface SubscriptionModalProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  subscriptionForm: SubscriptionFormData;
  setSubscriptionForm: React.Dispatch<React.SetStateAction<SubscriptionFormData>>;
  editingSubscription: string | null;
  setEditingSubscription: (id: string | null) => void;
  categories: Category[];
  fetchSubscriptions: () => Promise<void>;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  showModal,
  setShowModal,
  subscriptionForm,
  setSubscriptionForm,
  editingSubscription,
  setEditingSubscription,
  categories,
  fetchSubscriptions,
}) => {
  const [modalError, setModalError] = useState<string | null>(null);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const { currency: displayCurrency } = useCurrency();
  const currencySymbol = currencies[displayCurrency as keyof typeof currencies].symbol;

  // Add supported currencies
  const supportedCurrencies = {
    USD: { symbol: '$', name: 'US Dollar' },
    EUR: { symbol: '€', name: 'Euro' },
    GBP: { symbol: '£', name: 'British Pound' },
    INR: { symbol: '₹', name: 'Indian Rupee' },
    JPY: { symbol: '¥', name: 'Japanese Yen' },
    AUD: { symbol: 'A$', name: 'Australian Dollar' },
    CAD: { symbol: 'C$', name: 'Canadian Dollar' },
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setSubscriptionForm(prev => {
      const updates: Partial<SubscriptionFormData> = { [name]: value };
      
      if (name === 'start_date' || name === 'billing_cycle') {
        const startDate = name === 'start_date' ? value : prev.start_date;
        const cycle = name === 'billing_cycle' ? value : prev.billing_cycle;
        
        if (startDate) {
          const endDate = calculateEndDate(startDate, cycle);
          updates.next_billing = endDate;
        }
      }

      return { ...prev, ...updates };
    });
  };

  const calculateEndDate = (startDate: string, billingCycle: string): string => {
    const start = new Date(startDate);
    if (billingCycle === 'Monthly') {
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(endDate.getDate() - 1);
      return endDate.toISOString().split('T')[0];
    } else if (billingCycle === 'Quarterly') {
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 3);
      endDate.setDate(endDate.getDate() - 1);
      return endDate.toISOString().split('T')[0];
    } else {
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);
      endDate.setDate(endDate.getDate() - 1);
      return endDate.toISOString().split('T')[0];
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: newCategory, error } = await supabase
        .from('subscription_categories')
        .insert({
          name: newCategoryName.trim(),
          user_id: user.id,
          is_default: false
        })
        .select()
        .single();

      if (error) throw error;

      if (newCategory) {
        setSubscriptionForm(prev => ({
          ...prev,
          category_id: newCategory.id
        }));
        setShowNewCategoryInput(false);
        setNewCategoryName('');
      }
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to create category');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const subscriptionData = {
        name: subscriptionForm.name,
        price: parseFloat(subscriptionForm.price),
        billing_cycle: subscriptionForm.billing_cycle,
        start_date: subscriptionForm.start_date,
        next_billing: subscriptionForm.next_billing,
        category_id: subscriptionForm.category_id || null,
        currency: subscriptionForm.currency || 'USD',
        user_id: user.id
      };

      let error;

      if (editingSubscription) {
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            name: subscriptionData.name,
            price: subscriptionData.price,
            billing_cycle: subscriptionData.billing_cycle,
            start_date: subscriptionData.start_date,
            next_billing: subscriptionData.next_billing,
            category_id: subscriptionData.category_id,
            currency: subscriptionData.currency
          })
          .eq('id', editingSubscription)
          .eq('user_id', user.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('subscriptions')
          .insert([subscriptionData]);
        error = insertError;
      }

      if (error) throw error;

      await fetchSubscriptions();
      setShowModal(false);
      setEditingSubscription(null);
      setSubscriptionForm({
        name: '',
        price: '',
        billing_cycle: 'Monthly',
        start_date: '',
        next_billing: '',
        category_id: '',
        currency: 'USD'
      });
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to save subscription');
    }
  };

  // Sort categories to put "Other" at the end
  const sortedCategories = [...categories].sort((a, b) => {
    if (a.name === 'Other') return 1;
    if (b.name === 'Other') return -1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {editingSubscription ? 'Edit Subscription' : 'Add New Subscription'}
          </h3>
          <button
            onClick={() => {
              setShowModal(false);
              setModalError(null);
              setShowNewCategoryInput(false);
              setNewCategoryName('');
              setEditingSubscription(null);
            }}
            className="text-gray-400 hover:text-gray-500 p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {modalError && (
          <div className="mb-4 bg-red-50 p-3 rounded-md">
            <div className="text-sm text-red-700">{modalError}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Service Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              required
              placeholder="e.g., Netflix, Spotify"
              value={subscriptionForm.name}
              onChange={handleInputChange}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Price and Currency */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Price and Currency
            </label>
            <div className="flex rounded-md shadow-sm">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">
                    {supportedCurrencies[subscriptionForm.currency || 'USD'].symbol}
                  </span>
                </div>
                <input
                  type="number"
                  name="price"
                  id="price"
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={subscriptionForm.price}
                  onChange={handleInputChange}
                  className="block w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <select
                name="currency"
                value={subscriptionForm.currency || 'USD'}
                onChange={handleInputChange}
                className="relative inline-flex items-center px-4 py-2.5 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(supportedCurrencies).map(([code, { name }]) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Billing Cycle */}
          <div>
            <label htmlFor="billing_cycle" className="block text-sm font-medium text-gray-700 mb-1">
              Billing Cycle
            </label>
            <select
              id="billing_cycle"
              name="billing_cycle"
              required
              value={subscriptionForm.billing_cycle}
              onChange={handleInputChange}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly (Every 3 months)</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              name="start_date"
              id="start_date"
              required
              value={subscriptionForm.start_date}
              onChange={handleInputChange}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            {showNewCategoryInput ? (
              <div className="flex rounded-md shadow-sm">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter category name"
                  className="flex-1 min-w-0 block w-full px-3 py-2.5 rounded-l-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex">
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    className="inline-flex items-center px-4 py-2.5 border border-l-0 border-gray-300 bg-gray-50 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewCategoryInput(false);
                      setNewCategoryName('');
                    }}
                    className="inline-flex items-center px-4 py-2.5 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex rounded-md shadow-sm">
                <select
                  id="category"
                  name="category_id"
                  value={subscriptionForm.category_id}
                  onChange={handleInputChange}
                  className="flex-1 block w-full rounded-l-md border border-gray-300 py-2.5 px-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {/* Default Categories */}
                  <optgroup label="Default Categories">
                    {sortedCategories
                      .filter(category => category.is_default)
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                  </optgroup>
                  {/* User Categories */}
                  <optgroup label="Your Categories">
                    {sortedCategories
                      .filter(category => !category.is_default)
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                  </optgroup>
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewCategoryInput(true)}
                  className="inline-flex items-center px-4 py-2.5 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <Tag className="h-4 w-4 mr-1" />
                  New
                </button>
              </div>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Choose a category or create a new one to organize your subscriptions
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                setModalError(null);
                setShowNewCategoryInput(false);
                setNewCategoryName('');
                setEditingSubscription(null);
              }}
              className="px-4 py-2.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {editingSubscription ? 'Save Changes' : 'Add Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubscriptionModal;