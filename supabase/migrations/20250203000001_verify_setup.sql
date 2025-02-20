-- Verify and fix user_access table schema
DO $$
BEGIN
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
EXCEPTION
    WHEN duplicate_table THEN
        NULL;
END $$;

-- Create index on user_id if it doesn't exist
DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_user_access_user_id ON public.user_access(user_id);
EXCEPTION
    WHEN duplicate_table THEN
        NULL;
END $$;

-- Enable Row Level Security
ALTER TABLE public.user_access ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view their own access records" ON public.user_access;
DROP POLICY IF EXISTS "Users can insert their own access records" ON public.user_access;
DROP POLICY IF EXISTS "Users can update their own access records" ON public.user_access;
DROP POLICY IF EXISTS "Authenticated users can create access records" ON public.user_access;

-- Create comprehensive policies
CREATE POLICY "Users can view their own access records"
    ON public.user_access
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own access records"
    ON public.user_access
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own access records"
    ON public.user_access
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create or replace the function to handle new user creation
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

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create or replace the RPC function for creating user access
CREATE OR REPLACE FUNCTION public.create_user_access(
    p_user_id UUID,
    p_user_type TEXT,
    p_has_lifetime_access BOOLEAN,
    p_subscription_status TEXT,
    p_trial_start_date TIMESTAMPTZ,
    p_trial_end_date TIMESTAMPTZ
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
        p_user_id,
        p_user_type,
        p_has_lifetime_access,
        p_subscription_status,
        p_trial_start_date,
        p_trial_end_date,
        NOW(),
        NOW()
    );
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.user_access TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute permission on the RPC function
GRANT EXECUTE ON FUNCTION public.create_user_access TO authenticated;

-- Verify permissions
DO $$
BEGIN
    -- Check if table exists
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_access'
    ) THEN
        RAISE EXCEPTION 'user_access table does not exist';
    END IF;

    -- Check if RLS is enabled
    IF NOT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'user_access'
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION 'RLS is not enabled on user_access table';
    END IF;

    -- Check if policies exist
    IF NOT EXISTS (
        SELECT FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'user_access'
    ) THEN
        RAISE EXCEPTION 'No policies found on user_access table';
    END IF;

    -- Check if trigger exists
    IF NOT EXISTS (
        SELECT FROM pg_trigger
        WHERE tgname = 'on_auth_user_created'
    ) THEN
        RAISE EXCEPTION 'Trigger on_auth_user_created does not exist';
    END IF;

    -- Check if function exists
    IF NOT EXISTS (
        SELECT FROM pg_proc
        WHERE proname = 'create_user_access'
    ) THEN
        RAISE EXCEPTION 'Function create_user_access does not exist';
    END IF;

    RAISE NOTICE 'All database objects verified successfully';
END $$; 