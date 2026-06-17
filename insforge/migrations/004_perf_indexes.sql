-- Indexes pour accélérer tableau de bord, encaissements et plans de masse
-- Projet InsForge : TERRASWIFTFLOW (ecugv5a9.eu-central.insforge.app)
-- Exécuter via : npx @insforge/cli db query "CREATE INDEX ..."

CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON public.payments(paid_at);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_due_date ON public.payment_schedules(due_date);
CREATE INDEX IF NOT EXISTS idx_deals_property_status ON public.deals(property_id, status);
