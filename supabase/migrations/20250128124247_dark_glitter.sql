/*
  # Fix category management issues
  
  1. Changes
    - Add updated_at column to subscription_categories table
    - Add trigger to automatically update the timestamp
    - Update existing rows with current timestamp
*/

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscription_categories' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE subscription_categories ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Update existing rows to set updated_at
UPDATE subscription_categories 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Create function for updating timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatically updating timestamp
DROP TRIGGER IF EXISTS update_subscription_categories_updated_at ON subscription_categories;

CREATE TRIGGER update_subscription_categories_updated_at
    BEFORE UPDATE ON subscription_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();