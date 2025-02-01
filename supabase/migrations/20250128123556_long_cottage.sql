/*
  # Update subscription categories RLS policies

  1. Changes
    - Drop existing RLS policies
    - Create new policies that allow:
      - Reading all categories (both default and user-created)
      - Creating own categories
      - Updating own non-default categories
      - Deleting own non-default categories

  2. Security
    - Maintains RLS on subscription_categories table
    - Ensures users can only modify their own categories
    - Prevents modification of default categories
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read all categories" ON subscription_categories;
DROP POLICY IF EXISTS "Users can create own categories" ON subscription_categories;
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