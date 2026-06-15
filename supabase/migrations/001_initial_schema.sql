-- TerraSwiftFlow — Schéma initial multi-tenant
-- Exécuter dans Supabase SQL Editor ou via CLI

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Organisations ───────────────────────────────────────────────────────────

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'business')),
  modules JSONB NOT NULL DEFAULT '{}'::jsonb,
  subscription_status TEXT NOT NULL DEFAULT 'trial'
    CHECK (subscription_status IN ('trial', 'active', 'past_due', 'cancelled')),
  trial_ends_at TIMESTAMPTZ,
  receipt_counter INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Profils utilisateurs ──────────────────────────────────────────────────────

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('owner', 'manager', 'agent')),
  phone TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_organization ON profiles(organization_id);

-- ─── Helpers RLS ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION is_manager_or_owner()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(get_user_role() IN ('owner', 'manager'), false)
$$;

-- ─── Plans de masse ──────────────────────────────────────────────────────────

CREATE TABLE masterplans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT,
  total_lots INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_masterplans_organization ON masterplans(organization_id);

-- ─── Biens immobiliers ─────────────────────────────────────────────────────────

CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('terrain', 'maison')),
  title TEXT NOT NULL,
  reference TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'libre' CHECK (status IN ('libre', 'reserve', 'vendu')),
  price_total NUMERIC(15, 2) NOT NULL DEFAULT 0,
  surface_m2 NUMERIC(10, 2),
  price_per_m2 NUMERIC(15, 2),
  location_label TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  photos JSONB NOT NULL DEFAULT '[]'::jsonb,
  lot_number TEXT,
  masterplan_id UUID REFERENCES masterplans(id) ON DELETE SET NULL,
  rooms INTEGER,
  construction_status TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_properties_organization ON properties(organization_id);
CREATE INDEX idx_properties_masterplan ON properties(masterplan_id);
CREATE UNIQUE INDEX idx_properties_org_reference ON properties(organization_id, reference);

-- ─── Clients ───────────────────────────────────────────────────────────────────

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  is_diaspora BOOLEAN NOT NULL DEFAULT false,
  country TEXT NOT NULL DEFAULT 'Côte d''Ivoire',
  assigned_agent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clients_organization ON clients(organization_id);
CREATE INDEX idx_clients_agent ON clients(assigned_agent_id);

-- ─── Deals ─────────────────────────────────────────────────────────────────────

CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  total_amount NUMERIC(15, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'en_cours' CHECK (status IN ('en_cours', 'solde', 'annule')),
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deals_organization ON deals(organization_id);
CREATE INDEX idx_deals_agent ON deals(agent_id);

-- ─── Échéanciers ───────────────────────────────────────────────────────────────

CREATE TABLE payment_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  amount_due NUMERIC(15, 2) NOT NULL,
  label TEXT NOT NULL
);

CREATE INDEX idx_payment_schedules_deal ON payment_schedules(deal_id);
CREATE INDEX idx_payment_schedules_organization ON payment_schedules(organization_id);

-- ─── Paiements ─────────────────────────────────────────────────────────────────

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES payment_schedules(id) ON DELETE SET NULL,
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  amount NUMERIC(15, 2) NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('wave', 'orange_money', 'mtn', 'especes', 'virement')),
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  receipt_number TEXT NOT NULL,
  recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX idx_payments_organization ON payments(organization_id);
CREATE INDEX idx_payments_deal ON payments(deal_id);

-- ─── Documents ─────────────────────────────────────────────────────────────────

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  doc_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'brouillon',
  file_url TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_organization ON documents(organization_id);

-- ─── Activités / relances ──────────────────────────────────────────────────────

CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  note TEXT,
  due_at TIMESTAMPTZ,
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activities_organization ON activities(organization_id);
CREATE INDEX idx_activities_agent ON activities(agent_id);

-- ─── Fonction : numéro de reçu auto-incrémenté ─────────────────────────────────

CREATE OR REPLACE FUNCTION next_receipt_number(org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  UPDATE organizations
  SET receipt_counter = receipt_counter + 1
  WHERE id = org_id
  RETURNING receipt_counter INTO next_num;

  RETURN 'REC-' || LPAD(next_num::TEXT, 6, '0');
END;
$$;

-- ─── RLS : organizations ─────────────────────────────────────────────────────

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY organizations_select ON organizations
  FOR SELECT USING (id = get_user_organization_id());

CREATE POLICY organizations_update ON organizations
  FOR UPDATE USING (id = get_user_organization_id() AND is_manager_or_owner());

-- ─── RLS : profiles ────────────────────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select ON profiles
  FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY profiles_update_self ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY profiles_insert ON profiles
  FOR INSERT WITH CHECK (organization_id = get_user_organization_id() AND is_manager_or_owner());

-- ─── RLS : masterplans ─────────────────────────────────────────────────────────

ALTER TABLE masterplans ENABLE ROW LEVEL SECURITY;

CREATE POLICY masterplans_all ON masterplans
  FOR ALL USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- ─── RLS : properties ──────────────────────────────────────────────────────────

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY properties_all ON properties
  FOR ALL USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- ─── RLS : clients (restriction agent) ─────────────────────────────────────────

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY clients_select ON clients
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    AND (is_manager_or_owner() OR assigned_agent_id = auth.uid())
  );

CREATE POLICY clients_insert ON clients
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
    AND (is_manager_or_owner() OR assigned_agent_id = auth.uid())
  );

CREATE POLICY clients_update ON clients
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
    AND (is_manager_or_owner() OR assigned_agent_id = auth.uid())
  );

CREATE POLICY clients_delete ON clients
  FOR DELETE USING (
    organization_id = get_user_organization_id()
    AND is_manager_or_owner()
  );

-- ─── RLS : deals (restriction agent) ─────────────────────────────────────────────

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY deals_select ON deals
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    AND (is_manager_or_owner() OR agent_id = auth.uid())
  );

CREATE POLICY deals_insert ON deals
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
    AND (is_manager_or_owner() OR agent_id = auth.uid())
  );

CREATE POLICY deals_update ON deals
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
    AND (is_manager_or_owner() OR agent_id = auth.uid())
  );

CREATE POLICY deals_delete ON deals
  FOR DELETE USING (
    organization_id = get_user_organization_id()
    AND is_manager_or_owner()
  );

-- ─── RLS : payment_schedules ───────────────────────────────────────────────────

ALTER TABLE payment_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY payment_schedules_all ON payment_schedules
  FOR ALL USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- ─── RLS : payments ────────────────────────────────────────────────────────────

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY payments_all ON payments
  FOR ALL USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- ─── RLS : documents ───────────────────────────────────────────────────────────

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY documents_all ON documents
  FOR ALL USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- ─── RLS : activities ──────────────────────────────────────────────────────────

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY activities_select ON activities
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    AND (is_manager_or_owner() OR agent_id = auth.uid())
  );

CREATE POLICY activities_insert ON activities
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
    AND (is_manager_or_owner() OR agent_id = auth.uid())
  );

CREATE POLICY activities_update ON activities
  FOR UPDATE USING (
    organization_id = get_user_organization_id()
    AND (is_manager_or_owner() OR agent_id = auth.uid())
  );

CREATE POLICY activities_delete ON activities
  FOR DELETE USING (
    organization_id = get_user_organization_id()
    AND is_manager_or_owner()
  );

-- ─── Storage : photos des biens ────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('property-photos', 'property-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY property_photos_select ON storage.objects
  FOR SELECT USING (bucket_id = 'property-photos');

CREATE POLICY property_photos_insert ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'property-photos'
    AND (storage.foldername(name))[1] = get_user_organization_id()::text
  );

CREATE POLICY property_photos_update ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'property-photos'
    AND (storage.foldername(name))[1] = get_user_organization_id()::text
  );

CREATE POLICY property_photos_delete ON storage.objects
  FOR DELETE USING (
    bucket_id = 'property-photos'
    AND (storage.foldername(name))[1] = get_user_organization_id()::text
  );

-- ─── Storage : images plans de masse ───────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('masterplan-images', 'masterplan-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY masterplan_images_select ON storage.objects
  FOR SELECT USING (bucket_id = 'masterplan-images');

CREATE POLICY masterplan_images_insert ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'masterplan-images'
    AND (storage.foldername(name))[1] = get_user_organization_id()::text
  );

CREATE POLICY masterplan_images_delete ON storage.objects
  FOR DELETE USING (
    bucket_id = 'masterplan-images'
    AND (storage.foldername(name))[1] = get_user_organization_id()::text
  );
