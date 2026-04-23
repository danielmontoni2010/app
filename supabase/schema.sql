-- =============================================
-- STM Radar — Schema Completo
-- Execute no SQL Editor do Supabase
-- =============================================

-- EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABELAS
-- =============================================

-- Perfis de usuário
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  plan TEXT NOT NULL DEFAULT 'essencial' CHECK (plan IN ('essencial', 'pro')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'active' CHECK (
    subscription_status IN ('active', 'canceled', 'past_due')
  ),
  onesignal_player_id TEXT,
  notify_push BOOLEAN DEFAULT TRUE,
  notify_email BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admins
CREATE TABLE IF NOT EXISTS admins (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Metas dos alunos
CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('flight', 'accumulation', 'card')),
  title TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  origin TEXT,
  destination TEXT,
  date_from DATE,
  date_to DATE,
  max_miles INTEGER,
  cabin_class TEXT CHECK (cabin_class IN ('economy', 'business', 'any')),
  program TEXT,
  passengers INTEGER DEFAULT 1,
  description TEXT,
  opportunity_types TEXT[],
  target_program TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Oportunidades
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('flight', 'accumulation', 'card')),
  title TEXT NOT NULL,
  description TEXT,
  is_vip BOOLEAN DEFAULT FALSE,
  valid_until TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  origin TEXT,
  destination TEXT,
  miles INTEGER,
  program TEXT,
  cabin_class TEXT,
  available_dates JSONB,
  booking_link TEXT,
  opportunity_type TEXT,
  store TEXT,
  points_per_real NUMERIC,
  link TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alertas
CREATE TABLE IF NOT EXISTS alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  notified_push BOOLEAN DEFAULT FALSE,
  notified_email BOOLEAN DEFAULT FALSE,
  seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log de notificações
CREATE TABLE IF NOT EXISTS notifications_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  alert_id UUID REFERENCES alerts(id),
  channel TEXT CHECK (channel IN ('push', 'email')),
  status TEXT DEFAULT 'sent',
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pedidos da agência
CREATE TABLE IF NOT EXISTS agency_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id),
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  travel_date DATE,
  return_date DATE,
  passengers INTEGER DEFAULT 1,
  cabin_class TEXT DEFAULT 'economy',
  flexible_dates BOOLEAN DEFAULT FALSE,
  notes TEXT,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (
    status IN ('new', 'quoting', 'sent', 'closed', 'lost')
  ),
  admin_notes TEXT,
  quoted_price NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image_url TEXT,
  tags TEXT[],
  published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ÍNDICES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_type ON opportunities(type);
CREATE INDEX IF NOT EXISTS idx_opportunities_created_at ON opportunities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agency_requests_user_id ON agency_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_agency_requests_status ON agency_requests(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published);

-- =============================================
-- TRIGGER: updated_at automático
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_agency_requests_updated_at
  BEFORE UPDATE ON agency_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- TRIGGER: criar perfil automaticamente no signup
-- =============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Helper: verificar se usuário é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins WHERE id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- PROFILES
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL USING (is_admin());

-- ADMINS
CREATE POLICY "admins_select_own" ON admins
  FOR SELECT USING (auth.uid() = id);

-- GOALS
CREATE POLICY "goals_select_own" ON goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "goals_insert_own" ON goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "goals_update_own" ON goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "goals_delete_own" ON goals
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "goals_admin_all" ON goals
  FOR ALL USING (is_admin());

-- OPPORTUNITIES
CREATE POLICY "opportunities_select_authenticated" ON opportunities
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "opportunities_admin_all" ON opportunities
  FOR ALL USING (is_admin());

-- ALERTS
CREATE POLICY "alerts_select_own" ON alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "alerts_update_own" ON alerts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "alerts_admin_all" ON alerts
  FOR ALL USING (is_admin());

-- NOTIFICATIONS_LOG
CREATE POLICY "notifications_log_admin_all" ON notifications_log
  FOR ALL USING (is_admin());

-- AGENCY_REQUESTS
CREATE POLICY "agency_requests_select_own" ON agency_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "agency_requests_insert_own" ON agency_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "agency_requests_update_own" ON agency_requests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "agency_requests_admin_all" ON agency_requests
  FOR ALL USING (is_admin());

-- BLOG_POSTS
CREATE POLICY "blog_posts_select_published" ON blog_posts
  FOR SELECT USING (published = TRUE OR is_admin());

CREATE POLICY "blog_posts_admin_all" ON blog_posts
  FOR ALL USING (is_admin());
