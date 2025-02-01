/*
  # Create subscriptions table and policies

  1. New Tables
    - `subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `price` (numeric)
      - `billing_cycle` (text)
      - `start_date` (date)
      - `next_billing` (date)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `subscriptions` table
    - Add policies for authenticated users to:
      - Read their own subscriptions
      - Create new subscriptions
      - Update their own subscriptions
      - Delete their own subscriptions
*/

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  price numeric NOT NULL,
  billing_cycle text NOT NULL,
  start_date date NOT NULL,
  next_billing date NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_billing_cycle CHECK (billing_cycle IN ('Monthly', 'Quarterly', 'Yearly'))
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own subscriptions
CREATE POLICY "Users can read own subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy to allow users to create their own subscriptions
CREATE POLICY "Users can create subscriptions"
  ON subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own subscriptions
CREATE POLICY "Users can update own subscriptions"
  ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own subscriptions
CREATE POLICY "Users can delete own subscriptions"
  ON subscriptions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);