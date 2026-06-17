-- Indexes pour accélérer tableau de bord, encaissements et plans de masse

CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_due_date ON payment_schedules(due_date);
CREATE INDEX IF NOT EXISTS idx_deals_property_status ON deals(property_id, status);
