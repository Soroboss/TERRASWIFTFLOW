-- Processus de vente : mode paiement, type de contrat, acompte/reliquat, stade documentaire

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS payment_mode TEXT NOT NULL DEFAULT 'echelonne'
    CHECK (payment_mode IN ('cash', 'echelonne')),
  ADD COLUMN IF NOT EXISTS contract_type TEXT NOT NULL DEFAULT 'acd'
    CHECK (contract_type IN ('acd', 'lettre_villageoise', 'approbation_travaux')),
  ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS balance_amount NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS contract_stage TEXT NOT NULL DEFAULT 'provisoire'
    CHECK (contract_stage IN ('provisoire', 'definitif')),
  ADD COLUMN IF NOT EXISTS definitive_contract_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS num_months INTEGER;

ALTER TABLE payment_schedules
  ADD COLUMN IF NOT EXISTS line_type TEXT
    CHECK (line_type IN ('acompte', 'mensualite', 'reliquat', 'cash'));

COMMENT ON COLUMN deals.payment_mode IS 'cash = paiement comptant, echelonne = acompte + mensualités + reliquat';
COMMENT ON COLUMN deals.contract_type IS 'acd | lettre_villageoise | approbation_travaux';
COMMENT ON COLUMN deals.contract_stage IS 'provisoire jusqu''au solde du reliquat (ou paiement cash intégral)';
