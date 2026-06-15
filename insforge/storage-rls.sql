-- Storage RLS TerraSwiftFlow (à appliquer après création des buckets)
-- npx @insforge/cli db import insforge/storage-rls.sql

CREATE POLICY IF NOT EXISTS property_photos_select ON storage.objects
  FOR SELECT USING (bucket_id = 'property-photos');

CREATE POLICY IF NOT EXISTS property_photos_insert ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'property-photos'
    AND (storage.foldername(name))[1] = get_user_organization_id()::text
  );

CREATE POLICY IF NOT EXISTS property_photos_update ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'property-photos'
    AND (storage.foldername(name))[1] = get_user_organization_id()::text
  );

CREATE POLICY IF NOT EXISTS property_photos_delete ON storage.objects
  FOR DELETE USING (
    bucket_id = 'property-photos'
    AND (storage.foldername(name))[1] = get_user_organization_id()::text
  );

CREATE POLICY IF NOT EXISTS masterplan_images_select ON storage.objects
  FOR SELECT USING (bucket_id = 'masterplan-images');

CREATE POLICY IF NOT EXISTS masterplan_images_insert ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'masterplan-images'
    AND (storage.foldername(name))[1] = get_user_organization_id()::text
  );

CREATE POLICY IF NOT EXISTS masterplan_images_delete ON storage.objects
  FOR DELETE USING (
    bucket_id = 'masterplan-images'
    AND (storage.foldername(name))[1] = get_user_organization_id()::text
  );
