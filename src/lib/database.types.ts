export interface Database {
  public: {
    Tables: {
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          price: number;
          billing_cycle: string;
          start_date: string;
          next_billing: string;
          created_at: string;
          category_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          price: number;
          billing_cycle: string;
          start_date: string;
          next_billing: string;
          created_at?: string;
          category_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          price?: number;
          billing_cycle?: string;
          start_date?: string;
          next_billing?: string;
          created_at?: string;
          category_id?: string | null;
        };
      };
      subscription_categories: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          is_default?: boolean;
          created_at?: string;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}