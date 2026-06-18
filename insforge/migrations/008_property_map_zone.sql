-- Zone cliquable sur le plan de masse (coordonnées normalisées 0–1)
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS map_zone JSONB;

COMMENT ON COLUMN properties.map_zone IS
  'Zone sur image plan de masse: {type:rect,x,y,w,h} ou {type:polygon,points:[[x,y],...]}';
