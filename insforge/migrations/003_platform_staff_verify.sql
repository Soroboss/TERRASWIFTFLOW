CREATE OR REPLACE FUNCTION platform_verify_user_email(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  UPDATE auth.users
  SET email_verified = true
  WHERE id = p_user_id;

  RETURN FOUND;
END;
$$;
