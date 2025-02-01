/*
  # Fix category realtime updates

  1. Changes
    - Add trigger for category changes
    - Update RLS policies for better realtime support
    - Add updated_at trigger

  2. Security
    - Maintain existing RLS security model
    - Add better auditing for changes
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read all categories" ON subscription_categories;
DROP POLICY IF EXISTS "Users can create own categories" ON subscription_categories;
DROP POLICY IF EXISTS "Users can update own categories" ON subscription_categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON subscription_categories;

-- Create new policies with better realtime support
CREATE POLICY "Enable read access for authenticated users"
  ON subscription_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON subscription_categories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for user's own categories"
  ON subscription_categories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND NOT is_default)
  WITH CHECK (auth.uid() = user_id AND NOT is_default);

CREATE POLICY "Enable delete for user's own categories"
  ON subscription_categories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND NOT is_default);

-- Create function to notify of changes
CREATE OR REPLACE FUNCTION notify_category_changes()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'category_changes',
    json_build_object(
      'operation', TG_OP,
      'record', row_to_json(NEW)
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for changes
DROP TRIGGER IF EXISTS category_changes_trigger ON subscription_categories;
CREATE TRIGGER category_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE
  ON subscription_categories
  FOR EACH ROW
  EXECUTE FUNCTION notify_category_changes();

-- Ensure updated_at is set
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_subscription_categories_updated_at ON subscription_categories;
CREATE TRIGGER set_subscription_categories_updated_at
  BEFORE UPDATE ON subscription_categories
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();