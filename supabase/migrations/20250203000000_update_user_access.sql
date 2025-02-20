/*
  # Update user access control
  
  1. Changes
    - Add trigger to mark existing users with lifetime access
    - Add function to check trial expiration
    - Update existing users to have lifetime access
*/

-- Function to handle new user creation with proper access control
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create user access record
  INSERT INTO public.user_access (
    user_id,
    user_type,
    has_lifetime_access,
    subscription_status,
    trial_start_date,
    trial_end_date,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    CASE 
      WHEN EXISTS (SELECT 1 FROM auth.users WHERE created_at < '2024-02-01') THEN 'existing'
      ELSE 'new'
    END,
    CASE 
      WHEN EXISTS (SELECT 1 FROM auth.users WHERE created_at < '2024-02-01') THEN true
      ELSE false
    END,
    CASE 
      WHEN EXISTS (SELECT 1 FROM auth.users WHERE created_at < '2024-02-01') THEN 'free'
      ELSE 'trial'
    END,
    CASE 
      WHEN EXISTS (SELECT 1 FROM auth.users WHERE created_at < '2024-02-01') THEN NULL
      ELSE NOW()
    END,
    CASE 
      WHEN EXISTS (SELECT 1 FROM auth.users WHERE created_at < '2024-02-01') THEN NULL
      ELSE NOW() + INTERVAL '7 days'
    END,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update existing users to have lifetime access
UPDATE public.user_access
SET 
  user_type = 'existing',
  has_lifetime_access = true,
  subscription_status = 'free',
  trial_start_date = NULL,
  trial_end_date = NULL,
  updated_at = NOW()
WHERE 
  user_id IN (
    SELECT id 
    FROM auth.users 
    WHERE created_at < '2024-02-01'
  ); 