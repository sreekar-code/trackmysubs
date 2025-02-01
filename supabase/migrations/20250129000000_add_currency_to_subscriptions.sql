/*
  # Add currency support to subscriptions

  1. Changes
    - Add currency column to subscriptions table
    - Set default currency to USD
    - Update existing subscriptions to use USD
*/

-- Add currency column to subscriptions
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD';

-- Update existing subscriptions to use USD
UPDATE subscriptions SET currency = 'USD' WHERE currency IS NULL; 