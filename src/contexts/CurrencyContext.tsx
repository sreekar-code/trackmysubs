import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  formatAmount: (amount: number) => string;
  currencies: typeof currencies;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const currencies = {
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'British Pound' },
  JPY: { symbol: '¥', name: 'Japanese Yen' },
  AUD: { symbol: 'A$', name: 'Australian Dollar' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar' },
  INR: { symbol: '₹', name: 'Indian Rupee' },
} as const;

// Cache formatters
const formatterCache = new Map<string, Intl.NumberFormat>();

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState('USD');
  const [loading, setLoading] = useState(true);

  const fetchUserPreferences = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('currency')
          .eq('user_id', user.id)
          .single();

        if (preferences) {
          setCurrencyState(preferences.currency);
        } else {
          await supabase
            .from('user_preferences')
            .insert([{ user_id: user.id, currency: 'USD' }]);
        }
      } else {
        setCurrencyState('USD');
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      setCurrencyState('USD');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserPreferences();

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setCurrencyState('USD');
      } else if (event === 'SIGNED_IN') {
        fetchUserPreferences();
      }
    });

    const preferencesChannel = supabase
      .channel('user_preferences_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_preferences',
        },
        (payload) => {
          const { data: { user } } = supabase.auth.getUser();
          if (user && payload.new && payload.new.user_id === user.id) {
            fetchUserPreferences();
          }
        }
      )
      .subscribe();

    return () => {
      authSubscription.unsubscribe();
      supabase.removeChannel(preferencesChannel);
    };
  }, [fetchUserPreferences]);

  const setCurrency = useCallback(async (newCurrency: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('user_preferences')
          .upsert({ 
            user_id: user.id, 
            currency: newCurrency,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });
          
        if (!error) {
          setCurrencyState(newCurrency);
        }
      }
    } catch (error) {
      console.error('Error updating currency preference:', error);
    }
  }, []);

  const formatAmount = useCallback((amount: number): string => {
    try {
      let formatter = formatterCache.get(currency);
      if (!formatter) {
        formatter = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        formatterCache.set(currency, formatter);
      }
      return formatter.format(amount);
    } catch (error) {
      console.error('Error formatting currency:', error);
      return `${currencies[currency as keyof typeof currencies].symbol}${amount.toFixed(2)}`;
    }
  }, [currency]);

  const contextValue = useMemo(() => ({
    currency,
    setCurrency,
    formatAmount,
    currencies
  }), [currency, setCurrency, formatAmount]);

  if (loading) {
    return null;
  }

  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};