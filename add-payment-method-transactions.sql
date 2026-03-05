-- Add payment_method column to financial_transactions table
-- This allows tracking if transaction was cash, card, or pix

-- Step 1: Add payment_method column
ALTER TABLE financial_transactions 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'cash';

-- Step 2: Set default values for existing records
UPDATE financial_transactions 
SET payment_method = 'cash' 
WHERE payment_method IS NULL;

-- Step 3: Add check constraint for valid payment methods
ALTER TABLE financial_transactions
DROP CONSTRAINT IF EXISTS financial_transactions_payment_method_check;

ALTER TABLE financial_transactions
ADD CONSTRAINT financial_transactions_payment_method_check 
CHECK (payment_method IN ('cash', 'card', 'pix', 'other'));

-- Step 4: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_financial_transactions_payment_method 
ON financial_transactions(payment_method);

-- Step 5: Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'financial_transactions' 
  AND column_name = 'payment_method';

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE '✅ Payment method column added to financial_transactions!';
  RAISE NOTICE 'Valid values: cash, card, pix, other';
  RAISE NOTICE 'Now you can track payment methods for each transaction.';
END $$;
