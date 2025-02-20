export interface Subscription {
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

export interface Category {
  id: string;
  name: string;
  is_default: boolean;
}

export interface UserAccess {
  id: string;
  user_id: string;
  user_type: 'existing' | 'new';
  has_lifetime_access: boolean;
  subscription_status: 'free' | 'trial' | 'premium';
  trial_start_date: string | null;
  trial_end_date: string | null;
  subscription_end_date: string | null;
} 