-- TerraSwiftFlow — Passe 2 : contraintes métier anti-double-vente + sync statuts

-- Source client normalisée
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_source_check;
ALTER TABLE clients ADD CONSTRAINT clients_source_check
  CHECK (source IS NULL OR source IN ('whatsapp', 'terrain', 'facebook', 'salon'));

-- Type activité normalisé
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_type_check;
ALTER TABLE activities ADD CONSTRAINT activities_type_check
  CHECK (type IN ('appel', 'visite', 'relance'));

-- Anti-double-vente : un seul deal actif par bien
CREATE UNIQUE INDEX IF NOT EXISTS idx_deals_one_active_per_property
  ON deals (property_id)
  WHERE status IN ('en_cours', 'solde');

-- Sync statut bien ↔ deal
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

-- Vérification avant insertion deal
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

-- Exposer next_receipt_number via RPC
GRANT EXECUTE ON FUNCTION next_receipt_number(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION next_receipt_number(UUID) TO service_role;
