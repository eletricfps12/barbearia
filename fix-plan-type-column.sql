-- Fix plan_type column - Make it nullable since we're using custom plans now
-- Run this in Supabase SQL Editor

-- Step 1: Make plan_type nullable (remove NOT NULL constraint)
ALTER TABLE subscriptions 
ALTER COLUMN plan_type DROP NOT NULL;

-- Step 2: Set default value for existing rows that might have NULL
UPDATE subscriptions 
SET plan_type = 'custom'
WHERE plan_type IS NULL;

-- Step 3: Verify the change
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'subscriptions' 
  AND column_name IN ('plan_type', 'plan_id', 'plan_name', 'plan_value', 'duration_days')
ORDER BY ordinal_position;

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE '✅ Column plan_type is now nullable!';
  RAISE NOTICE 'You can now save subscriptions with custom plans.';
END $$;
