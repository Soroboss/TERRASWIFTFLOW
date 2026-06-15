-- TerraSwiftFlow — Données de démo (OPTIONNEL)
-- À exécuter APRÈS inscription du premier compte owner.
-- Remplacez YOUR_ORG_ID par l'UUID de votre organization (table organizations).

-- Exemple : trouver votre org_id
-- SELECT id, name FROM organizations;

/*
INSERT INTO masterplans (organization_id, name, total_lots, image_url)
VALUES (
  'YOUR_ORG_ID',
  'Résidence Les Palmiers — Bingerville',
  48,
  NULL
);

INSERT INTO properties (
  organization_id, type, title, reference, status, price_total,
  surface_m2, price_per_m2, location_label, lot_number, masterplan_id
)
SELECT
  'YOUR_ORG_ID',
  'terrain',
  'Parcelle ' || n.lot,
  'LP-' || n.lot,
  CASE n.lot % 5 WHEN 0 THEN 'vendu' WHEN 1 THEN 'reserve' ELSE 'libre' END,
  2500000 + (n.lot * 50000),
  400,
  6250,
  'Bingerville, Abidjan',
  n.lot,
  (SELECT id FROM masterplans WHERE organization_id = 'YOUR_ORG_ID' LIMIT 1)
FROM generate_series(1, 12) AS n(lot);

INSERT INTO clients (organization_id, full_name, phone, email, is_diaspora, country, source)
VALUES
  ('YOUR_ORG_ID', 'Kouassi Jean-Baptiste', '+2250707123456', 'kouassi@email.ci', false, 'Côte d''Ivoire', 'terrain'),
  ('YOUR_ORG_ID', 'Traoré Aminata', '+2250505987654', 'aminata@email.ci', true, 'France', 'whatsapp'),
  ('YOUR_ORG_ID', 'Diabaté Moussa', '+2250102030405', NULL, false, 'Côte d''Ivoire', 'facebook');
*/

-- Parcours de test manuel recommandé (sans seed) :
-- 1. /register → créer votre entreprise
-- 2. /dashboard/plans/nouveau → plan de masse
-- 3. /dashboard/biens/nouveau → terrains avec n° de lot
-- 4. /dashboard/clients/nouveau → clients
-- 5. /dashboard/deals/nouveau → vente + échéancier + versement
