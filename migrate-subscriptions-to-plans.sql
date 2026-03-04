-- Migration: Add custom plans system to subscriptions
-- This script updates the existing subscriptions table to support custom plans

-- Step 1: Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Add new columns to subscriptions table (if they don't exist)
DO $$ 
BEGIN
  -- Add plan_id column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='subscriptions' AND column_name='plan_id') THEN
    ALTER TABLE subscriptions ADD COLUMN plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL;
  END IF;

  -- Add plan_name column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='subscriptions' AND column_name='plan_name') THEN
    ALTER TABLE subscriptions ADD COLUMN plan_name VARCHAR(255);
  END IF;

  -- Add duration_days column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='subscriptions' AND column_name='duration_days') THEN
    ALTER TABLE subscriptions ADD COLUMN duration_days INTEGER DEFAULT 30;
  END IF;
END $$;

-- Step 3: Migrate existing data from plan_type to plan_name
UPDATE subscriptions 
SET plan_name = CASE 
  WHEN plan_type = 'monthly' THEN 'Plano Mensal'
  WHEN plan_type = 'weekly' THEN 'Plano Semanal'
  ELSE 'Plano Personalizado'
END
WHERE plan_name IS NULL;

-- Step 4: Set duration_days based on plan_type
UPDATE subscriptions 
SET duration_days = CASE 
  WHEN plan_type = 'monthly' THEN 30
  WHEN plan_type = 'weekly' THEN 7
  ELSE 30
END
WHERE duration_days IS NULL;

-- Step 5: Drop the old plan_type column constraint (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name='subscriptions' AND column_name='plan_type') THEN
    ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_type_check;
  END IF;
END $$;

-- Step 6: Enable RLS on subscription_plans
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for subscription_plans (drop if exists first)
DROP POLICY IF EXISTS "Users can view plans from their barbershop" ON subscription_plans;
CREATE POLICY "Users can view plans from their barbershop"
  ON subscription_plans FOR SELECT
  USING (
    barbershop_id IN (
      SELECT barbershop_id FROM barbers WHERE profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert plans to their barbershop" ON subscription_plans;
CREATE POLICY "Users can insert plans to their barbershop"
  ON subscription_plans FOR INSERT
  WITH CHECK (
    barbershop_id IN (
      SELECT barbershop_id FROM barbers WHERE profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update plans from their barbershop" ON subscription_plans;
CREATE POLICY "Users can update plans from their barbershop"
  ON subscription_plans FOR UPDATE
  USING (
    barbershop_id IN (
      SELECT barbershop_id FROM barbers WHERE profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete plans from their barbershop" ON subscription_plans;
CREATE POLICY "Users can delete plans from their barbershop"
  ON subscription_plans FOR DELETE
  USING (
    barbershop_id IN (
      SELECT barbershop_id FROM barbers WHERE profile_id = auth.uid()
    )
  );

-- Step 8: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscription_plans_barbershop ON subscription_plans(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan_id);

-- Step 9: Make plan_name and duration_days NOT NULL (after migration)
ALTER TABLE subscriptions ALTER COLUMN plan_name SET NOT NULL;
ALTER TABLE subscriptions ALTER COLUMN duration_days SET NOT NULL;

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'New table created: subscription_plans';
  RAISE NOTICE 'Subscriptions table updated with new columns';
  RAISE NOTICE 'Existing data migrated from plan_type to plan_name';
END $$;
