-- TerraSwiftFlow — Administration plateforme SaaS (propriétaire / staff)

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS billing_email TEXT,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS idx_organizations_subscription_status ON organizations(subscription_status);
CREATE INDEX IF NOT EXISTS idx_organizations_plan ON organizations(plan);
CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON organizations(created_at);

CREATE TABLE IF NOT EXISTS platform_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'support'
    CHECK (role IN ('super_admin', 'support', 'billing')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_users_role ON platform_users(role);

CREATE TABLE IF NOT EXISTS platform_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_audit_created ON platform_audit_log(created_at DESC);

CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO platform_settings (key, value)
VALUES
  ('general', '{"trial_days":14,"support_email":"contact@terraswiftflow.ci","app_name":"TerraSwiftFlow"}'::jsonb),
  ('pricing', '{"starter_monthly":25000,"pro_monthly":55000,"business_monthly":120000}'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE VIEW platform_tenant_overview AS
SELECT
  o.id,
  o.name,
  o.plan,
  o.subscription_status,
  o.trial_ends_at,
  o.billing_email,
  o.suspended_at,
  o.notes,
  o.created_at,
  COUNT(DISTINCT p.id) FILTER (WHERE p.active) AS active_users,
  COUNT(DISTINCT pr.id) AS properties_count,
  COUNT(DISTINCT c.id) AS clients_count,
  COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'en_cours') AS active_deals,
  COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'solde') AS closed_deals,
  COALESCE(SUM(pay.amount) FILTER (WHERE pay.paid_at >= NOW() - INTERVAL '30 days'), 0) AS revenue_30d
FROM organizations o
LEFT JOIN profiles p ON p.organization_id = o.id
LEFT JOIN properties pr ON pr.organization_id = o.id
LEFT JOIN clients c ON c.organization_id = o.id
LEFT JOIN deals d ON d.organization_id = o.id
LEFT JOIN payments pay ON pay.organization_id = o.id
GROUP BY o.id;

ALTER TABLE platform_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Accès réservé au service role (dashboard admin via INSFORGE_API_KEY)
CREATE POLICY IF NOT EXISTS platform_users_service ON platform_users
  FOR ALL USING (false);

CREATE POLICY IF NOT EXISTS platform_audit_service ON platform_audit_log
  FOR ALL USING (false);

CREATE POLICY IF NOT EXISTS platform_settings_service ON platform_settings
  FOR ALL USING (false);
