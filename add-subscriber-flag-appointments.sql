-- Add subscriber flag to appointments table
-- This allows marking appointments as subscriber visits (already paid via subscription)

-- Step 1: Add is_subscriber column
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS is_subscriber BOOLEAN DEFAULT FALSE;

-- Step 2: Add subscriber_id column to link with subscriptions table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS subscriber_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL;

-- Step 3: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_subscriber 
ON appointments(subscriber_id) 
WHERE subscriber_id IS NOT NULL;

-- Step 4: Create index for is_subscriber flag
CREATE INDEX IF NOT EXISTS idx_appointments_is_subscriber 
ON appointments(is_subscriber) 
WHERE is_subscriber = TRUE;

-- Step 5: Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'appointments' 
  AND column_name IN ('is_subscriber', 'subscriber_id')
ORDER BY ordinal_position;

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE '✅ Subscriber flag added to appointments!';
  RAISE NOTICE 'Now you can mark appointments as subscriber visits.';
  RAISE NOTICE 'These appointments will not be counted as regular revenue.';
END $$;
