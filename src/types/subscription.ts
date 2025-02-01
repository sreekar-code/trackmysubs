export interface Subscription {
  id: string;
  user_id: string;
  name: string;
  price: number;
  currency: string;
  billing_cycle: string;
  start_date: string;
  next_billing: string;
  category_id: string | null;
  created_at?: string;
  updated_at?: string;
} 