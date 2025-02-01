import React, { useState, useEffect } from 'react';
import { supabase, categoryOperations } from '../lib/supabase';
import { signOut } from '../lib/auth';
import { X } from 'lucide-react';
import DashboardHeader from './dashboard/DashboardHeader';
import DashboardStats from './dashboard/DashboardStats';
import SubscriptionList from './dashboard/SubscriptionList';
import SubscriptionModal from './dashboard/SubscriptionModal';
import CategoryManagement from './dashboard/CategoryManagement';
import SubscriptionFilters from './dashboard/SubscriptionFilters';
import { useCurrency } from '../contexts/CurrencyContext';
import { currencyService } from '../services/currencyService';

interface Subscription {
  id: string;
  user_id: string;
  name: string;
  price: number;
  currency: string;
  billing_cycle: string;
  start_date: string;
  next_billing: string;
  category_id: string | null;
  category?: {
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
  is_default: boolean;
}

// Add exchange rates (you would typically get these from an API)
const exchangeRates: { [key: string]: number } = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  JPY: 0.0067,
  AUD: 0.66,
  CAD: 0.74,
  INR: 0.012,
};

const Dashboard: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBillingCycle, setSelectedBillingCycle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRenewingSoon, setShowRenewingSoon] = useState(false);
  const [showExpired, setShowExpired] = useState(false);
  const [totalMonthlySpend, setTotalMonthlySpend] = useState(0);
  const [subscriptionForm, setSubscriptionForm] = useState({
    name: '',
    price: '',
    currency: '',
    billing_cycle: 'Monthly',
    start_date: '',
    next_billing: '',
    category_id: ''
  });
  const { currency: displayCurrency } = useCurrency();

  const convertAmount = (amount: number, fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) return amount;
    const inUSD = amount / exchangeRates[fromCurrency];
    return inUSD * exchangeRates[toCurrency];
  };

  const calculateMonthlyPrice = async (price: number, billingCycle: string, fromCurrency: string): Promise<number> => {
    const monthlyPrice = (() => {
      switch (billingCycle) {
        case 'Yearly':
          return price / 12;
        case 'Quarterly':
          return price / 3;
        default:
          return price;
      }
    })();

    return await currencyService.convertAmount(monthlyPrice, fromCurrency, displayCurrency);
  };

  useEffect(() => {
    const updateTotalSpend = async () => {
      let total = 0;
      for (const sub of subscriptions) {
        const monthlyPrice = await calculateMonthlyPrice(sub.price, sub.billing_cycle, sub.currency);
        total += monthlyPrice;
      }
      setTotalMonthlySpend(total);
    };

    updateTotalSpend();
  }, [subscriptions, displayCurrency]);

  const fetchData = async (retryCount = 0) => {
    console.log('🔄 Fetching data...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please sign in to view your subscriptions');
        setLoading(false);
        return;
      }

      console.log('📊 Fetching subscriptions and categories...');
      const [subsResponse, catsResponse] = await Promise.all([
        supabase
          .from('subscriptions')
          .select(`
            *,
            category:subscription_categories(name)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('subscription_categories')
          .select('*')
          .order('created_at', { ascending: true })
      ]);

      if (subsResponse.error || catsResponse.error) {
        console.error('❌ Error fetching data:', subsResponse.error || catsResponse.error);
        if (retryCount < 3) {
          console.log(`🔄 Retrying fetch attempt ${retryCount + 1}...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return fetchData(retryCount + 1);
        }
        throw subsResponse.error || catsResponse.error;
      }

      console.log('✅ Data fetched successfully:', {
        subscriptions: subsResponse.data?.length || 0,
        categories: catsResponse.data?.length || 0
      });

      setSubscriptions(subsResponse.data || []);
      setCategories(catsResponse.data || []);
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Set up real-time subscriptions
    const subscriptionsChannel = supabase.channel('subscriptions-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'subscriptions',
          filter: `user_id=eq.${supabase.auth.getUser().then(({ data }) => data.user?.id)}`
        },
        () => fetchData()
      )
      .subscribe();

    // Separate channel for categories with immediate state updates
    const categoriesChannel = supabase.channel('categories-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'subscription_categories'
        },
        async (payload) => {
          console.log('📦 Category change received:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newCategory = payload.new as Category;
            setCategories(prev => [...prev, newCategory].sort((a, b) => {
              if (a.name === 'Other') return 1;
              if (b.name === 'Other') return -1;
              return a.name.localeCompare(b.name);
            }));
          } else if (payload.eventType === 'DELETE') {
            setCategories(prev => prev.filter(cat => cat.id !== payload.old.id));
            // Update subscriptions to show as uncategorized
            setSubscriptions(prev => prev.map(sub => {
              if (sub.category_id === payload.old.id) {
                return {
                  ...sub,
                  category_id: null,
                  category: undefined
                };
              }
              return sub;
            }));
          } else if (payload.eventType === 'UPDATE') {
            setCategories(prev => prev.map(cat => 
              cat.id === payload.new.id ? { ...cat, ...payload.new } : cat
            ));
            // Update subscription category names in the UI immediately
            setSubscriptions(prev => prev.map(sub => {
              if (sub.category_id === payload.new.id) {
                return {
                  ...sub,
                  category: { name: payload.new.name }
                };
              }
              return sub;
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscriptionsChannel);
      supabase.removeChannel(categoriesChannel);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign out');
    }
  };

  const handleEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription.id);
    setSubscriptionForm({
      name: subscription.name,
      price: subscription.price.toString(),
      currency: subscription.currency,
      billing_cycle: subscription.billing_cycle,
      start_date: subscription.start_date,
      next_billing: subscription.next_billing,
      category_id: subscription.category_id || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', id)
        .single();

      if (error) throw error;
      setSubscriptions(prev => prev.filter(sub => sub.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete subscription');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await categoryOperations.deleteCategory(categoryId);
      // No need to call fetchData here as the real-time subscription will handle it
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {error && (
        <div className="bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <DashboardHeader
        onAddNew={() => {
          setEditingSubscription(null);
          setSubscriptionForm({
            name: '',
            price: '',
            currency: '',
            billing_cycle: 'Monthly',
            start_date: '',
            next_billing: '',
            category_id: ''
          });
          setShowModal(true);
        }}
        onSignOut={handleSignOut}
        showMobileMenu={showMobileMenu}
        setShowMobileMenu={setShowMobileMenu}
        onManageCategories={() => setShowCategoryManagement(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <DashboardStats
          totalMonthlySpend={totalMonthlySpend}
          subscriptionCount={subscriptions.length}
        />

        <div className="mt-4 sm:mt-8">
          <SubscriptionFilters
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedBillingCycle={selectedBillingCycle}
            setSelectedBillingCycle={setSelectedBillingCycle}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onManageCategories={() => setShowCategoryManagement(true)}
            showRenewingSoon={showRenewingSoon}
            setShowRenewingSoon={setShowRenewingSoon}
            showExpired={showExpired}
            setShowExpired={setShowExpired}
          />

          {subscriptions.length > 0 ? (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <SubscriptionList
                subscriptions={subscriptions}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                selectedCategory={selectedCategory}
                selectedBillingCycle={selectedBillingCycle}
                searchQuery={searchQuery}
                showRenewingSoon={showRenewingSoon}
                showExpired={showExpired}
              />
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-8 text-center">
                <p className="text-gray-500 mb-4">No subscriptions found</p>
                <button
                  onClick={() => {
                    setEditingSubscription(null);
                    setSubscriptionForm({
                      name: '',
                      price: '',
                      currency: '',
                      billing_cycle: 'Monthly',
                      start_date: '',
                      next_billing: '',
                      category_id: ''
                    });
                    setShowModal(true);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add Your First Subscription
                </button>
              </div>
            </div>
          )}
        </div>

        {showModal && (
          <SubscriptionModal
            showModal={showModal}
            setShowModal={setShowModal}
            subscriptionForm={subscriptionForm}
            setSubscriptionForm={setSubscriptionForm}
            editingSubscription={editingSubscription}
            setEditingSubscription={setEditingSubscription}
            categories={categories}
            fetchSubscriptions={fetchData}
          />
        )}

        {showCategoryManagement && (
          <CategoryManagement
            showCategoryManagement={showCategoryManagement}
            setShowCategoryManagement={setShowCategoryManagement}
            categories={categories}
            handleDeleteCategory={handleDeleteCategory}
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;