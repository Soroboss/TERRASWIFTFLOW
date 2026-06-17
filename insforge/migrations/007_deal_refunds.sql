-- Annulation de vente avec remboursement (propriétaire / manager uniquement côté app)

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS deal_refunds (
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

CREATE INDEX IF NOT EXISTS idx_deal_refunds_deal ON deal_refunds(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_refunds_organization ON deal_refunds(organization_id);

ALTER TABLE deal_refunds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS deal_refunds_all ON deal_refunds;
CREATE POLICY deal_refunds_all ON deal_refunds
  FOR ALL
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());
