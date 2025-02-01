/*
  # Add RLS policies for subscription categories

  1. Changes
    - Add RLS policies to allow users to:
      - Update their own categories
      - Delete their own categories
      - Create new categories
      - Read all categories (both default and user-created)

  2. Security
    - Users can only modify their own categories
    - Users can read all categories (including default ones)
    - Users cannot modify default categories
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own categories" ON subscription_categories;
DROP POLICY IF EXISTS "Users can create categories" ON subscription_categories;
DROP POLICY IF EXISTS "Users can update own categories" ON subscription_categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON subscription_categories;

-- Create new policies
CREATE POLICY "Users can read all categories"
  ON subscription_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own categories"
  ON subscription_categories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON subscription_categories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND NOT is_default)
  WITH CHECK (auth.uid() = user_id AND NOT is_default);

CREATE POLICY "Users can delete own categories"
  ON subscription_categories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND NOT is_default);