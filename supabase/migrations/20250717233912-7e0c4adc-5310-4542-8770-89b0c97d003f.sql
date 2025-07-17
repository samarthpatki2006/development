-- First, let's update the user_profiles table to have proper email as primary auth
-- and remove the plain text password field
ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS password;

-- Create a function to get user email by college and user code
CREATE OR REPLACE FUNCTION public.get_user_email_for_auth(college_code text, user_code text)
RETURNS TABLE(email text, user_id uuid, user_type user_type_enum, first_name text, last_name text, college_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.email,
    up.id,
    up.user_type,
    up.first_name,
    up.last_name,
    up.college_id
  FROM user_profiles up
  JOIN colleges c ON up.college_id = c.id
  WHERE c.code = get_user_email_for_auth.college_code
    AND up.user_code = get_user_email_for_auth.user_code
    AND up.is_active = true;
END;
$$;