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

interface Category {
  id: string;
  name: string;
  is_default: boolean;
}

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
  const [subscriptionForm, setSubscriptionForm] = useState({
    name: '',
    price: '',
    billing_cycle: 'Monthly',
    start_date: '',
    next_billing: '',
    category_id: '',
    currency: 'USD'
  });

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
          .or(`user_id.eq.${user.id},is_default.eq.true`)
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

      setSubscriptions(subsResponse.data?.map((subscription: any) => ({
        id: subscription.id,
        user_id: subscription.user_id,
        name: subscription.name,
        price: subscription.price,
        billing_cycle: subscription.billing_cycle,
        start_date: subscription.start_date,
        next_billing: subscription.next_billing,
        category_id: subscription.category_id,
        currency: subscription.currency,
        category: subscription.category
      })) || []);
      
      setCategories(catsResponse.data?.map((category: any) => ({
        id: category.id,
        name: category.name,
        is_default: category.is_default
      })) || []);
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
          table: 'subscriptions'
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
        async (payload: any) => {
          console.log('📦 Category change received:', payload);
          
          // Only process changes for user's categories or default categories
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          
          if (payload.eventType === 'INSERT') {
            // Only add if it's a default category or belongs to the current user
            if (payload.new.is_default || payload.new.user_id === user.id) {
              setCategories(prev => {
                // Check if category already exists to prevent duplicates
                if (prev.some(cat => cat.id === payload.new.id)) {
                  return prev;
                }
                // Add new category and sort
                return [...prev, {
                  id: payload.new.id,
                  name: payload.new.name,
                  is_default: payload.new.is_default
                }].sort((a, b) => {
                  if (a.name === 'Other') return 1;
                  if (b.name === 'Other') return -1;
                  return a.name.localeCompare(b.name);
                });
              });
            }
          } else if (payload.eventType === 'DELETE') {
            // Only remove if it's the user's category
            if (!payload.old.is_default && payload.old.user_id === user.id) {
              setCategories(prev => prev.filter(cat => cat.id !== payload.old.id));
              // Update subscriptions that had this category
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
            }
          } else if (payload.eventType === 'UPDATE') {
            // Only update if it's a default category or belongs to the current user
            if (payload.new.is_default || payload.new.user_id === user.id) {
              setCategories(prev => prev.map(cat => 
                cat.id === payload.new.id ? {
                  ...cat,
                  name: payload.new.name,
                  is_default: payload.new.is_default
                } : cat
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
      billing_cycle: subscription.billing_cycle,
      start_date: subscription.start_date,
      next_billing: subscription.next_billing,
      category_id: subscription.category_id || '',
      currency: subscription.currency || 'USD'
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
      // First, update all subscriptions that use this category to have no category
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({ category_id: null })
        .eq('category_id', categoryId);

      if (updateError) throw updateError;

      // Then delete the category
      const { error: deleteError } = await supabase
        .from('subscription_categories')
        .delete()
        .eq('id', categoryId)
        .eq('is_default', false) // Only allow deletion of non-default categories
        .single();

      if (deleteError) throw deleteError;

      // Update local state immediately
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      // Update subscriptions that had this category
      setSubscriptions(prev => prev.map(sub => {
        if (sub.category_id === categoryId) {
          return {
            ...sub,
            category_id: null,
            category: undefined
          };
        }
        return sub;
      }));
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
        onSignOut={handleSignOut}
        showMobileMenu={showMobileMenu}
        setShowMobileMenu={setShowMobileMenu}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <DashboardStats subscriptions={subscriptions} />

        <div className="mt-4 sm:mt-8">
          <div className="flex items-center space-x-3 mb-4">
            <button
              onClick={() => {
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
                setShowModal(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Subscription
            </button>
            <button
              onClick={() => setShowCategoryManagement(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Manage Categories
            </button>
          </div>

          {subscriptions.length > 0 && (
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
          )}

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
                      billing_cycle: 'Monthly',
                      start_date: '',
                      next_billing: '',
                      category_id: '',
                      currency: 'USD'
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
