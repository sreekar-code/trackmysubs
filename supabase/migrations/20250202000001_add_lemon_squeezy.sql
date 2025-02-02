-- Create table for storing Lemon Squeezy transactions
CREATE TABLE lemon_squeezy_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    store_id text NOT NULL,
    order_id text NOT NULL,
    order_item_id text NOT NULL,
    product_id text NOT NULL,
    variant_id text NOT NULL,
    subscription_id text,
    customer_id text NOT NULL,
    status text NOT NULL,
    total numeric(10,2) NOT NULL,
    currency text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    raw_data jsonb NOT NULL
);

-- Add RLS policy
ALTER TABLE lemon_squeezy_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON lemon_squeezy_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Function to handle Lemon Squeezy webhooks
CREATE OR REPLACE FUNCTION handle_lemon_squeezy_webhook(payload jsonb)
RETURNS jsonb AS $$
DECLARE
    event_name text;
    user_email text;
    user_id uuid;
    premium_plan_id uuid;
BEGIN
    -- Extract event name from payload
    event_name := payload->>'event';
    
    -- Handle different event types
    CASE event_name
        -- Order created/completed
        WHEN 'order_created' THEN
            -- Get user email from customer data
            user_email := payload->'data'->'attributes'->'user_email';
            
            -- Get user_id from auth.users
            SELECT id INTO user_id
            FROM auth.users
            WHERE email = user_email;

            -- Insert transaction record
            INSERT INTO lemon_squeezy_transactions (
                user_id,
                store_id,
                order_id,
                order_item_id,
                product_id,
                variant_id,
                customer_id,
                status,
                total,
                currency,
                raw_data
            ) VALUES (
                user_id,
                payload->'data'->'attributes'->>'store_id',
                payload->'data'->'attributes'->>'order_id',
                payload->'data'->'attributes'->>'order_item_id',
                payload->'data'->'attributes'->>'product_id',
                payload->'data'->'attributes'->>'variant_id',
                payload->'data'->'attributes'->>'customer_id',
                payload->'data'->'attributes'->>'status',
                (payload->'data'->'attributes'->>'total')::numeric,
                payload->'data'->'attributes'->>'currency',
                payload
            );

        -- Subscription created
        WHEN 'subscription_created' THEN
            -- Get user email from customer data
            user_email := payload->'data'->'attributes'->'user_email';
            
            -- Get user_id from auth.users
            SELECT id INTO user_id
            FROM auth.users
            WHERE email = user_email;

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
                current_period_starts_at = now(),
                current_period_ends_at = (payload->'data'->'attributes'->>'renews_at')::timestamptz
            WHERE user_id = user_id;

        -- Subscription cancelled
        WHEN 'subscription_cancelled' THEN
            -- Update subscription status
            UPDATE user_subscriptions
            SET 
                status = 'canceled',
                canceled_at = now()
            WHERE user_id = user_id;

        -- Subscription expired
        WHEN 'subscription_expired' THEN
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

        ELSE
            -- Log unknown event
            RAISE NOTICE 'Unknown event type: %', event_name;
    END CASE;

    RETURN payload;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 