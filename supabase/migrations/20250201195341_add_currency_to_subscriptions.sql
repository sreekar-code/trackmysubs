-- Add currency column to subscriptions table
ALTER TABLE subscriptions ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD';

-- Update existing subscriptions to have USD as currency
UPDATE subscriptions SET currency = 'USD' WHERE currency IS NULL; 