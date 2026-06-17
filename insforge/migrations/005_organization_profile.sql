-- Profil entreprise (logo, contacts, RCCM, RIB, etc.)

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS company_profile JSONB NOT NULL DEFAULT '{}'::jsonb;
