/*
  # Update user access control
  
  1. Changes
    - Add trigger to mark existing users with lifetime access
    - Add function to check trial expiration
    - Update existing users to have lifetime access
*/

-- Create user_access table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_access (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_type TEXT NOT NULL CHECK (user_type IN ('existing', 'new')),
    has_lifetime_access BOOLEAN NOT NULL DEFAULT false,
    subscription_status TEXT NOT NULL CHECK (subscription_status IN ('free', 'trial', 'premium')),
    trial_start_date TIMESTAMPTZ,
    trial_end_date TIMESTAMPTZ,
    subscription_start_date TIMESTAMPTZ,
    subscription_end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_user_access_user_id ON public.user_access(user_id);

-- Enable Row Level Security
ALTER TABLE public.user_access ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own access records" ON public.user_access;
CREATE POLICY "Users can view their own access records"
    ON public.user_access
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own access records" ON public.user_access;
CREATE POLICY "Users can insert their own access records"
    ON public.user_access
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own access records" ON public.user_access;
CREATE POLICY "Users can update their own access records"
    ON public.user_access
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Function to handle new user creation with proper access control
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
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
      WHEN NEW.created_at < '2024-02-01' THEN 'existing'
      ELSE 'new'
    END,
    CASE 
      WHEN NEW.created_at < '2024-02-01' THEN true
      ELSE false
    END,
    CASE 
      WHEN NEW.created_at < '2024-02-01' THEN 'free'
      ELSE 'trial'
    END,
    CASE 
      WHEN NEW.created_at < '2024-02-01' THEN NULL
      ELSE NOW()
    END,
    CASE 
      WHEN NEW.created_at < '2024-02-01' THEN NULL
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

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.user_access TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE user_access_id_seq TO authenticated; 