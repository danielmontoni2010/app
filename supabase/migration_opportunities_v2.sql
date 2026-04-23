-- Migration: Redesign opportunities table for STM Radar
-- Run this in Supabase SQL Editor

-- Garante que a função de updated_at existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Garante que a função is_admin() existe
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old table and recreate with correct schema
DROP TABLE IF EXISTS opportunities CASCADE;

CREATE TABLE opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL, -- 'transferencia-bonus' | 'acumulo-turbinado' | 'clube' | 'cartao' | 'passagem'
  program text,
  description text,
  external_url text,
  is_vip boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  -- Flight-specific columns
  origin text,
  destination text,
  cabin_class text, -- 'economy' | 'business' | 'any'
  miles_amount integer,
  tax_amount numeric(10,2),
  available_from date,
  available_to date,

  -- Transfer/accumulation columns
  bonus_percentage integer,
  min_transfer integer,
  max_transfer integer,
  valid_until date
);

-- Trigger para updated_at
CREATE TRIGGER update_opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_opportunities_type ON opportunities(type);
CREATE INDEX idx_opportunities_program ON opportunities(program);
CREATE INDEX idx_opportunities_active ON opportunities(active);
CREATE INDEX idx_opportunities_is_vip ON opportunities(is_vip);
CREATE INDEX idx_opportunities_created_at ON opportunities(created_at DESC);

-- RLS
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Everyone (authenticated) can view active opportunities
CREATE POLICY "opportunities_read_active" ON opportunities
  FOR SELECT TO authenticated
  USING (active = true);

-- Admins can do everything
CREATE POLICY "opportunities_admin_all" ON opportunities
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Re-create alerts table FK (if it was dropped by CASCADE)
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid REFERENCES opportunities(id) ON DELETE CASCADE NOT NULL,
  goal_id uuid REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  notified_push boolean DEFAULT false,
  notified_email boolean DEFAULT false,
  seen_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alerts_user_read" ON alerts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "alerts_admin_all" ON alerts
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
