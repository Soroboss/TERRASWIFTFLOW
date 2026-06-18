-- Suivi administratif ACD / titre foncier (workflow lotisseur)

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS acd_status TEXT NOT NULL DEFAULT 'non_demarre'
    CHECK (acd_status IN ('non_demarre', 'dossier_depose', 'bornage', 'en_administration', 'delivre')),
  ADD COLUMN IF NOT EXISTS acd_notes TEXT,
  ADD COLUMN IF NOT EXISTS acd_updated_at TIMESTAMPTZ;

-- Slug public pour vérification parcelle (optionnel par organisation)
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS public_slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_public_slug
  ON organizations (public_slug)
  WHERE public_slug IS NOT NULL;
