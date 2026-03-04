-- Create subscription_plans table for custom plans
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

-- Create subscriptions table for managing recurring customer subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  customer_email VARCHAR(255),
  plan_name VARCHAR(255) NOT NULL,
  plan_value DECIMAL(10, 2) NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 30,
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscription_goals table for monthly targets
CREATE TABLE IF NOT EXISTS subscription_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  month_year VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  target_count INTEGER NOT NULL,
  target_revenue DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(barbershop_id, month_year)
);

-- Add RLS policies
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_goals ENABLE ROW LEVEL SECURITY;

-- Policies for subscription_plans
CREATE POLICY "Users can view plans from their barbershop"
  ON subscription_plans FOR SELECT
  USING (
    barbershop_id IN (
      SELECT barbershop_id FROM barbers WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert plans to their barbershop"
  ON subscription_plans FOR INSERT
  WITH CHECK (
    barbershop_id IN (
      SELECT barbershop_id FROM barbers WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update plans from their barbershop"
  ON subscription_plans FOR UPDATE
  USING (
    barbershop_id IN (
      SELECT barbershop_id FROM barbers WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete plans from their barbershop"
  ON subscription_plans FOR DELETE
  USING (
    barbershop_id IN (
      SELECT barbershop_id FROM barbers WHERE profile_id = auth.uid()
    )
  );

-- Policy for subscriptions: users can only see subscriptions from their barbershop
CREATE POLICY "Users can view subscriptions from their barbershop"
  ON subscriptions FOR SELECT
  USING (
    barbershop_id IN (
      SELECT barbershop_id FROM barbers WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert subscriptions to their barbershop"
  ON subscriptions FOR INSERT
  WITH CHECK (
    barbershop_id IN (
      SELECT barbershop_id FROM barbers WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update subscriptions from their barbershop"
  ON subscriptions FOR UPDATE
  USING (
    barbershop_id IN (
      SELECT barbershop_id FROM barbers WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete subscriptions from their barbershop"
  ON subscriptions FOR DELETE
  USING (
    barbershop_id IN (
      SELECT barbershop_id FROM barbers WHERE profile_id = auth.uid()
    )
  );

-- Policy for subscription_goals
CREATE POLICY "Users can view goals from their barbershop"
  ON subscription_goals FOR SELECT
  USING (
    barbershop_id IN (
      SELECT barbershop_id FROM barbers WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert goals to their barbershop"
  ON subscription_goals FOR INSERT
  WITH CHECK (
    barbershop_id IN (
      SELECT barbershop_id FROM barbers WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update goals from their barbershop"
  ON subscription_goals FOR UPDATE
  USING (
    barbershop_id IN (
      SELECT barbershop_id FROM barbers WHERE profile_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_subscription_plans_barbershop ON subscription_plans(barbershop_id);
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX idx_subscriptions_barbershop ON subscriptions(barbershop_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_plan ON subscriptions(plan_id);
CREATE INDEX idx_subscription_goals_barbershop ON subscription_goals(barbershop_id);
CREATE INDEX idx_subscription_goals_month ON subscription_goals(month_year);
