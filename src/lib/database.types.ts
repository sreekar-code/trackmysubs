export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      user_access: {
        Row: {
          id: string;
          user_id: string;
          user_type: 'new' | 'existing';
          has_lifetime_access: boolean;
          subscription_status: 'free' | 'trial' | 'premium';
          trial_start_date: string | null;
          trial_end_date: string | null;
          subscription_start_date: string | null;
          subscription_end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          user_type?: 'new' | 'existing';
          has_lifetime_access?: boolean;
          subscription_status?: 'free' | 'trial' | 'premium';
          trial_start_date?: string | null;
          trial_end_date?: string | null;
          subscription_start_date?: string | null;
          subscription_end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          user_type?: 'new' | 'existing';
          has_lifetime_access?: boolean;
          subscription_status?: 'free' | 'trial' | 'premium';
          trial_start_date?: string | null;
          trial_end_date?: string | null;
          subscription_start_date?: string | null;
          subscription_end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
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
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}