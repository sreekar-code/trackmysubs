/*
  # Update category management policies

  1. Changes
    - Remove policies that allow users to create their own categories
    - Reorder default categories to move "Other" to the end
  
  2. Security
    - Drop policies for category creation/modification
    - Keep read-only access for users
*/

-- Drop the policies that allow users to create/modify categories
DROP POLICY IF EXISTS "Users can create own categories" ON subscription_categories;
DROP POLICY IF EXISTS "Users can update own categories" ON subscription_categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON subscription_categories;

-- Delete any user-created categories and update their subscriptions
UPDATE subscriptions 
SET category_id = (
  SELECT id 
  FROM subscription_categories 
  WHERE name = 'Other' 
  AND is_default = true
  LIMIT 1
)
WHERE category_id IN (
  SELECT id 
  FROM subscription_categories 
  WHERE NOT is_default
);

DELETE FROM subscription_categories WHERE NOT is_default;

-- Reorder default categories by updating timestamps
UPDATE subscription_categories 
SET created_at = CASE name
  WHEN 'Streaming' THEN now() - interval '9 days'
  WHEN 'Domain & Hosting' THEN now() - interval '8 days'
  WHEN 'Software' THEN now() - interval '7 days'
  WHEN 'Cloud Storage' THEN now() - interval '6 days'
  WHEN 'Music' THEN now() - interval '5 days'
  WHEN 'Gaming' THEN now() - interval '4 days'
  WHEN 'News & Media' THEN now() - interval '3 days'
  WHEN 'Productivity' THEN now() - interval '2 days'
  WHEN 'Education' THEN now() - interval '1 day'
  WHEN 'Other' THEN now()
END
WHERE is_default = true;