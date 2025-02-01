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
  setSubscriptionForm: (form: SubscriptionFormData) => void;
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
  const { currency } = useCurrency();
  const currencySymbol = currencies[currency as keyof typeof currencies].symbol;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    const updates: any = { [name]: value };
    if (name === 'start_date' || name === 'billing_cycle') {
      const startDate = name === 'start_date' ? value : subscriptionForm.start_date;
      const cycle = name === 'billing_cycle' ? value : subscriptionForm.billing_cycle;
      
      if (startDate) {
        const endDate = calculateEndDate(startDate, cycle);
        updates.next_billing = endDate;
      }
    }

    setSubscriptionForm(prev => ({
      ...prev,
      ...updates
    }));
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
    if (!newCategoryName.trim()) {
      setModalError('Category name cannot be empty');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('subscription_categories')
        .insert([{
          name: newCategoryName.trim(),
          user_id: user.id,
          is_default: false
        }])
        .select()
        .single();

      if (error) throw error;

      setSubscriptionForm(prev => ({ ...prev, category_id: data.id }));
      setNewCategoryName('');
      setShowNewCategoryInput(false);
      setModalError(null);
    } catch (err) {
      console.error('Error creating category:', err);
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
        currency: subscriptionForm.currency || 'USD'
      };

      let error;

      if (editingSubscription) {
        ({ error } = await supabase
          .from('subscriptions')
          .update(subscriptionData)
          .eq('id', editingSubscription));
      } else {
        ({ error } = await supabase
          .from('subscriptions')
          .insert([{ ...subscriptionData, user_id: user.id }]));
      }

      if (error) throw error;

      setSubscriptionForm({
        name: '',
        price: '',
        billing_cycle: 'Monthly',
        start_date: '',
        next_billing: '',
        category_id: '',
        currency: 'USD'
      });
      setShowModal(false);
      setEditingSubscription(null);

      await fetchSubscriptions();
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Service Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              required
              value={subscriptionForm.name}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              Price
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">{currencySymbol}</span>
              </div>
              <input
                type="number"
                name="price"
                id="price"
                required
                min="0"
                step="0.01"
                value={subscriptionForm.price}
                onChange={handleInputChange}
                className="block w-full pl-7 pr-12 border border-gray-300 rounded-md shadow-sm py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <div className="absolute inset-y-0 right-0 flex items-center">
                <select
                  name="currency"
                  value={subscriptionForm.currency || 'USD'}
                  onChange={handleInputChange}
                  className="focus:ring-blue-500 focus:border-blue-500 h-full py-0 pl-2 pr-7 border-transparent bg-transparent text-gray-500 sm:text-sm rounded-md"
                >
                  {Object.entries(currencies).map(([code, { name }]) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="billing_cycle" className="block text-sm font-medium text-gray-700">
              Billing Cycle
            </label>
            <select
              id="billing_cycle"
              name="billing_cycle"
              required
              value={subscriptionForm.billing_cycle}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>

          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              name="start_date"
              id="start_date"
              required
              value={subscriptionForm.start_date}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category
            </label>
            {showNewCategoryInput ? (
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter category name"
                />
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 text-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add
                </button>
              </div>
            ) : (
              <div className="mt-1 flex rounded-md shadow-sm">
                <select
                  id="category"
                  name="category_id"
                  value={subscriptionForm.category_id}
                  onChange={handleInputChange}
                  className="flex-1 block w-full rounded-none rounded-l-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select a category</option>
                  {sortedCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewCategoryInput(true)}
                  className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 text-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  New
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                setModalError(null);
                setShowNewCategoryInput(false);
                setNewCategoryName('');
                setEditingSubscription(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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