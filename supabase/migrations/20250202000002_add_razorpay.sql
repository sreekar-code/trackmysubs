-- Drop the Lemon Squeezy table since we won't be using it
DROP TABLE IF EXISTS lemon_squeezy_transactions;

-- Create table for storing Razorpay subscriptions
CREATE TABLE razorpay_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    razorpay_subscription_id text NOT NULL,
    razorpay_customer_id text NOT NULL,
    razorpay_plan_id text NOT NULL,
    status text NOT NULL,
    current_period_start timestamptz,
    current_period_end timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT unique_razorpay_subscription UNIQUE (razorpay_subscription_id)
);

-- Add RLS policies
ALTER TABLE razorpay_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON razorpay_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Function to handle Razorpay webhooks
CREATE OR REPLACE FUNCTION handle_razorpay_webhook(payload jsonb)
RETURNS jsonb AS $$
DECLARE
    event_name text;
    subscription_id text;
    user_id uuid;
    premium_plan_id uuid;
BEGIN
    -- Extract event name from payload
    event_name := payload->>'event';
    subscription_id := payload->'payload'->'subscription'->>'id';
    
    -- Get user_id from razorpay_subscriptions
    SELECT rs.user_id INTO user_id
    FROM razorpay_subscriptions rs
    WHERE rs.razorpay_subscription_id = subscription_id;

    -- Handle different event types
    CASE event_name
        -- Subscription activated
        WHEN 'subscription.activated' THEN
            -- Get premium plan id
            SELECT id INTO premium_plan_id
            FROM plans
            WHERE name = 'Premium';

            -- Update user's subscription
            UPDATE user_subscriptions
            SET 
                plan_id = premium_plan_id,
                status = 'active',
                trial_ends_at = now() + interval '7 days',
                current_period_starts_at = (payload->'payload'->'subscription'->>'current_period_start')::timestamptz,
                current_period_ends_at = (payload->'payload'->'subscription'->>'current_period_end')::timestamptz
            WHERE user_id = user_id;

            -- Update Razorpay subscription status
            UPDATE razorpay_subscriptions
            SET 
                status = 'active',
                current_period_start = (payload->'payload'->'subscription'->>'current_period_start')::timestamptz,
                current_period_end = (payload->'payload'->'subscription'->>'current_period_end')::timestamptz,
                updated_at = now()
            WHERE razorpay_subscription_id = subscription_id;

        -- Subscription cancelled
        WHEN 'subscription.cancelled' THEN
            -- Update subscription status
            UPDATE user_subscriptions
            SET 
                status = 'canceled',
                canceled_at = now()
            WHERE user_id = user_id;

            -- Update Razorpay subscription
            UPDATE razorpay_subscriptions
            SET 
                status = 'cancelled',
                updated_at = now()
            WHERE razorpay_subscription_id = subscription_id;

        -- Subscription expired/halted
        WHEN 'subscription.expired', 'subscription.halted' THEN
            -- Get free plan id
            SELECT id INTO premium_plan_id
            FROM plans
            WHERE name = 'Free';

            -- Update user's subscription back to free plan
            UPDATE user_subscriptions
            SET 
                plan_id = premium_plan_id,
                status = 'active',
                trial_ends_at = null,
                current_period_starts_at = now(),
                current_period_ends_at = null
            WHERE user_id = user_id;

            -- Update Razorpay subscription
            UPDATE razorpay_subscriptions
            SET 
                status = 'expired',
                updated_at = now()
            WHERE razorpay_subscription_id = subscription_id;

        ELSE
            -- Log unknown event
            RAISE NOTICE 'Unknown event type: %', event_name;
    END CASE;

    RETURN payload;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 