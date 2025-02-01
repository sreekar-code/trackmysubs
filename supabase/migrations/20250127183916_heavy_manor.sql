/*
  # Add subscription categories

  1. New Tables
    - `subscription_categories`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `is_default` (boolean)
      - `created_at` (timestamptz)

  2. Changes
    - Add `category_id` to `subscriptions` table
    - Add foreign key constraint to `subscription_categories`
    - Insert default categories

  3. Security
    - Enable RLS on `subscription_categories`
    - Add policies for CRUD operations
*/

-- Create subscription categories table
CREATE TABLE IF NOT EXISTS subscription_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  name text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_category_name_per_user UNIQUE (user_id, name)
);

-- Add category_id to subscriptions
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES subscription_categories;

-- Enable RLS
ALTER TABLE subscription_categories ENABLE ROW LEVEL SECURITY;

-- Policies for subscription_categories
CREATE POLICY "Users can read default categories and own categories"
  ON subscription_categories FOR SELECT
  TO authenticated
  USING (is_default = true OR auth.uid() = user_id);

CREATE POLICY "Users can create own categories"
  ON subscription_categories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND NOT is_default);

CREATE POLICY "Users can update own categories"
  ON subscription_categories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND NOT is_default)
  WITH CHECK (auth.uid() = user_id AND NOT is_default);

CREATE POLICY "Users can delete own categories"
  ON subscription_categories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND NOT is_default);

-- Insert default categories
INSERT INTO subscription_categories (name, is_default) VALUES
  ('Streaming', true),
  ('Domain & Hosting', true),
  ('Software', true),
  ('Cloud Storage', true),
  ('Music', true),
  ('Gaming', true),
  ('News & Media', true),
  ('Productivity', true),
  ('Education', true),
  ('Other', true)
ON CONFLICT DO NOTHING;