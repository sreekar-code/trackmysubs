/*
  # Allow category deletion
  
  1. Changes
    - Remove is_default restriction from RLS policies
    - Add new policies for full category management
  
  2. Security
    - Users can manage all their categories
    - Maintain row-level security
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read default categories and own categories" ON subscription_categories;
DROP POLICY IF EXISTS "Users can create own categories" ON subscription_categories;
DROP POLICY IF EXISTS "Users can update own categories" ON subscription_categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON subscription_categories;

-- Create new policies without is_default restrictions
CREATE POLICY "Users can read own categories"
  ON subscription_categories FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create categories"
  ON subscription_categories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON subscription_categories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON subscription_categories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);