-- Drop existing objects if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS has_analytics_access(uuid);
DROP TABLE IF EXISTS user_subscriptions;
DROP TABLE IF EXISTS plans;
DROP TYPE IF EXISTS subscription_status;

-- Create enum for subscription status
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'expired', 'trial');

-- Create plans table
CREATE TABLE plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    price numeric(10,2) NOT NULL,
    billing_interval text NOT NULL,
    features jsonb NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create user_subscriptions table
CREATE TABLE user_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    plan_id uuid REFERENCES plans NOT NULL,
    status subscription_status NOT NULL,
    trial_ends_at timestamptz,
    current_period_starts_at timestamptz,
    current_period_ends_at timestamptz,
    canceled_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT unique_user_subscription UNIQUE (user_id)
);

-- Add RLS policies
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Plans can be read by anyone
CREATE POLICY "Plans are viewable by everyone" ON plans
    FOR SELECT USING (true);

-- User subscriptions can only be read by the owner
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Insert default plans
INSERT INTO plans (name, price, billing_interval, features) VALUES
    ('Free', 0, 'lifetime', '{"analytics": false, "unlimited_subscriptions": true}'::jsonb),
    ('Premium', 7, 'yearly', '{"analytics": true, "unlimited_subscriptions": true}'::jsonb);

-- Function to automatically create free plan subscription for new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
    free_plan_id uuid;
BEGIN
    -- Get the free plan ID
    SELECT id INTO free_plan_id FROM plans WHERE name = 'Free';
    
    -- Create a subscription for the new user
    INSERT INTO user_subscriptions (
        user_id,
        plan_id,
        status,
        current_period_starts_at,
        current_period_ends_at
    ) VALUES (
        NEW.id,
        free_plan_id,
        'active',
        now(),
        null  -- Free plan doesn't expire
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create free subscription when a new user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to check if a user has access to analytics
CREATE OR REPLACE FUNCTION has_analytics_access(user_id uuid)
RETURNS boolean AS $$
DECLARE
    subscription_record RECORD;
    plan_features jsonb;
BEGIN
    -- Get the user's subscription and plan details
    SELECT 
        us.status,
        us.trial_ends_at,
        p.features
    INTO subscription_record
    FROM user_subscriptions us
    JOIN plans p ON us.plan_id = p.id
    WHERE us.user_id = user_id;

    -- If no subscription found, return false
    IF subscription_record IS NULL THEN
        RETURN false;
    END IF;

    -- Check if user has analytics access through their plan
    IF (subscription_record.features->>'analytics')::boolean THEN
        -- If plan includes analytics, check subscription status
        RETURN subscription_record.status = 'active' OR 
               (subscription_record.status = 'trial' AND subscription_record.trial_ends_at > now());
    END IF;

    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 