import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please connect to Supabase using the "Connect to Supabase" button.');
}

// Memoized storage implementation with error boundaries
const customStorage = {
  cache: new Map(),
  getItem: (key: string): string | null => {
    try {
      // Check cache first
      if (customStorage.cache.has(key)) {
        return customStorage.cache.get(key);
      }
      const value = localStorage.getItem(key);
      if (value) {
        customStorage.cache.set(key, value);
      }
      return value;
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      customStorage.cache.set(key, value);
      localStorage.setItem(key, value);
    } catch {
      // Fail silently
    }
  },
  removeItem: (key: string): void => {
    try {
      customStorage.cache.delete(key);
      localStorage.removeItem(key);
    } catch {
      // Fail silently
    }
  }
};

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);

// Initialize session recovery with debounced auth state changes
let authStateTimeout: NodeJS.Timeout;
supabase.auth.onAuthStateChange(async (event, session) => {
  clearTimeout(authStateTimeout);
  authStateTimeout = setTimeout(async () => {
    if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
      // Clear all auth data
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('lastSignIn');
      sessionStorage.clear();
      customStorage.cache.clear();
    }
  }, 100);
});

// Optimized category operations with caching
const categoryCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const categoryOperations = {
  async createCategory(name: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data: existingCategory, error: fetchError } = await supabase
      .from('subscription_categories')
      .select('id')
      .eq('name', name.trim())
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (existingCategory) throw new Error('A category with this name already exists');

    const { data, error: createError } = await supabase
      .from('subscription_categories')
      .insert([{
        name: name.trim(),
        user_id: user.id,
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (createError) throw createError;
    
    // Update cache
    categoryCache.clear();
    return data;
  },

  async updateCategory(categoryId: string, name: string) {
    const { data: existingCategories, error: fetchError } = await supabase
      .from('subscription_categories')
      .select('id, name')
      .neq('id', categoryId)
      .eq('name', name.trim())
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (existingCategories) throw new Error('A category with this name already exists');

    const { data, error: updateError } = await supabase
      .from('subscription_categories')
      .update({ 
        name: name.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', categoryId)
      .select()
      .single();

    if (updateError) throw updateError;
    
    // Update cache
    categoryCache.clear();
    return data;
  },

  async deleteCategory(categoryId: string) {
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
      .eq('id', categoryId);

    if (deleteError) throw deleteError;
    
    // Update cache
    categoryCache.clear();
  }
};