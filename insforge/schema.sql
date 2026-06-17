-- TerraSwiftFlow — Schéma InsForge (sans storage buckets)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

CREATE TABLE masterplans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT,
  total_lots INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_masterplans_organization ON masterplans(organization_id);

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

CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  total_amount NUMERIC(15, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'en_cours' CHECK (status IN ('en_cours', 'solde', 'annule')),
  payment_mode TEXT NOT NULL DEFAULT 'echelonne' CHECK (payment_mode IN ('cash', 'echelonne')),
  contract_type TEXT NOT NULL DEFAULT 'acd' CHECK (contract_type IN ('acd', 'lettre_villageoise', 'approbation_travaux')),
  deposit_amount NUMERIC(15, 2),
  balance_amount NUMERIC(15, 2),
  contract_stage TEXT NOT NULL DEFAULT 'provisoire' CHECK (contract_stage IN ('provisoire', 'definitif')),
  definitive_contract_at TIMESTAMPTZ,
  num_months INTEGER,
  signed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deals_organization ON deals(organization_id);
CREATE INDEX idx_deals_agent ON deals(agent_id);

CREATE TABLE payment_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  amount_due NUMERIC(15, 2) NOT NULL,
  label TEXT NOT NULL,
  line_type TEXT CHECK (line_type IN ('acompte', 'mensualite', 'reliquat', 'cash'))
);

CREATE INDEX idx_payment_schedules_deal ON payment_schedules(deal_id);
CREATE INDEX idx_payment_schedules_organization ON payment_schedules(organization_id);

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

CREATE TABLE deal_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL CHECK (method IN ('wave', 'orange_money', 'mtn', 'especes', 'virement')),
  refunded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deal_refunds_deal ON deal_refunds(deal_id);
CREATE INDEX idx_deal_refunds_organization ON deal_refunds(organization_id);

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

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY organizations_select ON organizations FOR SELECT USING (id = get_user_organization_id());
CREATE POLICY organizations_update ON organizations FOR UPDATE USING (id = get_user_organization_id() AND is_manager_or_owner());

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_select ON profiles FOR SELECT USING (organization_id = get_user_organization_id());
CREATE POLICY profiles_update_self ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY profiles_insert ON profiles FOR INSERT WITH CHECK (organization_id = get_user_organization_id() AND is_manager_or_owner());

ALTER TABLE masterplans ENABLE ROW LEVEL SECURITY;
CREATE POLICY masterplans_all ON masterplans FOR ALL USING (organization_id = get_user_organization_id()) WITH CHECK (organization_id = get_user_organization_id());

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY properties_all ON properties FOR ALL USING (organization_id = get_user_organization_id()) WITH CHECK (organization_id = get_user_organization_id());

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY clients_select ON clients FOR SELECT USING (organization_id = get_user_organization_id() AND (is_manager_or_owner() OR assigned_agent_id = auth.uid()));
CREATE POLICY clients_insert ON clients FOR INSERT WITH CHECK (organization_id = get_user_organization_id() AND (is_manager_or_owner() OR assigned_agent_id = auth.uid()));
CREATE POLICY clients_update ON clients FOR UPDATE USING (organization_id = get_user_organization_id() AND (is_manager_or_owner() OR assigned_agent_id = auth.uid()));
CREATE POLICY clients_delete ON clients FOR DELETE USING (organization_id = get_user_organization_id() AND is_manager_or_owner());

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY deals_select ON deals FOR SELECT USING (organization_id = get_user_organization_id() AND (is_manager_or_owner() OR agent_id = auth.uid()));
CREATE POLICY deals_insert ON deals FOR INSERT WITH CHECK (organization_id = get_user_organization_id() AND (is_manager_or_owner() OR agent_id = auth.uid()));
CREATE POLICY deals_update ON deals FOR UPDATE USING (organization_id = get_user_organization_id() AND (is_manager_or_owner() OR agent_id = auth.uid()));
CREATE POLICY deals_delete ON deals FOR DELETE USING (organization_id = get_user_organization_id() AND is_manager_or_owner());

ALTER TABLE payment_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY payment_schedules_all ON payment_schedules FOR ALL USING (organization_id = get_user_organization_id()) WITH CHECK (organization_id = get_user_organization_id());

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY payments_all ON payments FOR ALL USING (organization_id = get_user_organization_id()) WITH CHECK (organization_id = get_user_organization_id());

ALTER TABLE deal_refunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY deal_refunds_all ON deal_refunds FOR ALL USING (organization_id = get_user_organization_id()) WITH CHECK (organization_id = get_user_organization_id());

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY documents_all ON documents FOR ALL USING (organization_id = get_user_organization_id()) WITH CHECK (organization_id = get_user_organization_id());

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY activities_select ON activities FOR SELECT USING (organization_id = get_user_organization_id() AND (is_manager_or_owner() OR agent_id = auth.uid()));
CREATE POLICY activities_insert ON activities FOR INSERT WITH CHECK (organization_id = get_user_organization_id() AND (is_manager_or_owner() OR agent_id = auth.uid()));
CREATE POLICY activities_update ON activities FOR UPDATE USING (organization_id = get_user_organization_id() AND (is_manager_or_owner() OR agent_id = auth.uid()));
CREATE POLICY activities_delete ON activities FOR DELETE USING (organization_id = get_user_organization_id() AND is_manager_or_owner());

ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_source_check;
ALTER TABLE clients ADD CONSTRAINT clients_source_check
  CHECK (source IS NULL OR source IN ('whatsapp', 'terrain', 'facebook', 'salon'));

ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_type_check;
ALTER TABLE activities ADD CONSTRAINT activities_type_check
  CHECK (type IN ('appel', 'visite', 'relance'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_deals_one_active_per_property
  ON deals (property_id)
  WHERE status IN ('en_cours', 'solde');

CREATE OR REPLACE FUNCTION sync_property_status_on_deal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'en_cours' THEN
    UPDATE properties SET status = 'reserve'
    WHERE id = NEW.property_id AND status = 'libre';
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'solde' THEN
      UPDATE properties SET status = 'vendu' WHERE id = NEW.property_id;
    ELSIF NEW.status = 'annule' THEN
      IF NOT EXISTS (
        SELECT 1 FROM deals
        WHERE property_id = NEW.property_id
          AND status IN ('en_cours', 'solde')
          AND id <> NEW.id
      ) THEN
        UPDATE properties SET status = 'libre' WHERE id = NEW.property_id;
      END IF;
    ELSIF NEW.status = 'en_cours' THEN
      UPDATE properties SET status = 'reserve' WHERE id = NEW.property_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS deals_sync_property_status ON deals;
CREATE TRIGGER deals_sync_property_status
  AFTER INSERT OR UPDATE OF status ON deals
  FOR EACH ROW
  EXECUTE FUNCTION sync_property_status_on_deal();

CREATE OR REPLACE FUNCTION check_property_available_for_deal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prop_status TEXT;
BEGIN
  IF NEW.status NOT IN ('en_cours', 'solde') THEN
    RETURN NEW;
  END IF;

  SELECT status INTO prop_status FROM properties WHERE id = NEW.property_id;

  IF prop_status IS NULL THEN
    RAISE EXCEPTION 'PROPERTY_NOT_FOUND';
  END IF;

  IF TG_OP = 'INSERT' AND prop_status <> 'libre' THEN
    RAISE EXCEPTION 'PROPERTY_UNAVAILABLE:%', prop_status;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS deals_check_property_available ON deals;
CREATE TRIGGER deals_check_property_available
  BEFORE INSERT ON deals
  FOR EACH ROW
  EXECUTE FUNCTION check_property_available_for_deal();

GRANT EXECUTE ON FUNCTION next_receipt_number(UUID) TO authenticated;
