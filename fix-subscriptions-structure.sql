-- Fix subscriptions table structure
-- Run this if you're getting 400 errors when saving subscriptions

-- Step 1: Check and add missing columns
DO $$ 
BEGIN
  -- Add plan_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='subscriptions' AND column_name='plan_id'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added column: plan_id';
  END IF;

  -- Add plan_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='subscriptions' AND column_name='plan_name'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN plan_name VARCHAR(255);
    RAISE NOTICE 'Added column: plan_name';
  END IF;

  -- Add duration_days column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='subscriptions' AND column_name='duration_days'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN duration_days INTEGER DEFAULT 30;
    RAISE NOTICE 'Added column: duration_days';
  END IF;

  -- Add plan_value column if it doesn't exist (rename from old structure)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='subscriptions' AND column_name='plan_value'
  ) THEN
    -- Check if there's an old 'value' column to rename
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name='subscriptions' AND column_name='value'
    ) THEN
      ALTER TABLE subscriptions RENAME COLUMN value TO plan_value;
      RAISE NOTICE 'Renamed column: value -> plan_value';
    ELSE
      ALTER TABLE subscriptions ADD COLUMN plan_value DECIMAL(10, 2);
      RAISE NOTICE 'Added column: plan_value';
    END IF;
  END IF;
END $$;

-- Step 2: Migrate existing data if needed
UPDATE subscriptions 
SET 
  plan_name = CASE 
    WHEN plan_type = 'monthly' THEN 'Plano Mensal'
    WHEN plan_type = 'weekly' THEN 'Plano Semanal'
    ELSE 'Plano Personalizado'
  END,
  duration_days = CASE 
    WHEN plan_type = 'monthly' THEN 30
    WHEN plan_type = 'weekly' THEN 7
    ELSE 30
  END
WHERE plan_name IS NULL AND plan_type IS NOT NULL;

-- Step 3: Set NOT NULL constraints after migration
DO $$ 
BEGIN
  -- Make plan_name NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='subscriptions' AND column_name='plan_name' AND is_nullable='YES'
  ) THEN
    -- First set a default value for any NULL rows
    UPDATE subscriptions SET plan_name = 'Plano Padrão' WHERE plan_name IS NULL;
    ALTER TABLE subscriptions ALTER COLUMN plan_name SET NOT NULL;
    RAISE NOTICE 'Set plan_name as NOT NULL';
  END IF;

  -- Make plan_value NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='subscriptions' AND column_name='plan_value' AND is_nullable='YES'
  ) THEN
    -- First set a default value for any NULL rows
    UPDATE subscriptions SET plan_value = 0 WHERE plan_value IS NULL;
    ALTER TABLE subscriptions ALTER COLUMN plan_value SET NOT NULL;
    RAISE NOTICE 'Set plan_value as NOT NULL';
  END IF;

  -- Make duration_days NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='subscriptions' AND column_name='duration_days' AND is_nullable='YES'
  ) THEN
    -- First set a default value for any NULL rows
    UPDATE subscriptions SET duration_days = 30 WHERE duration_days IS NULL;
    ALTER TABLE subscriptions ALTER COLUMN duration_days SET NOT NULL;
    RAISE NOTICE 'Set duration_days as NOT NULL';
  END IF;
END $$;

-- Step 4: Show current table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE '✅ Subscriptions table structure fixed!';
  RAISE NOTICE 'You can now save subscriptions from the app.';
END $$;
