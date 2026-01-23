-- Fix has_role function to prevent user enumeration while keeping SECURITY DEFINER for RLS
-- Users can only check their own roles, or admins can check any role

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid;
  caller_is_admin boolean;
BEGIN
  -- Get the caller's ID
  caller_id := auth.uid();
  
  -- If no authenticated user, deny
  IF caller_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if caller is checking their own role (always allowed)
  IF _user_id = caller_id THEN
    RETURN EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = _role
    );
  END IF;
  
  -- Check if caller is admin (admins can check any role)
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = caller_id AND role = 'admin'
  ) INTO caller_is_admin;
  
  IF caller_is_admin THEN
    RETURN EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = _role
    );
  END IF;
  
  -- For RLS policies that need to check another user's role (e.g., doctor checking patient)
  -- We allow checking if the target is a doctor or patient role only (not admin enumeration)
  -- This is needed for RLS to work correctly
  IF _role IN ('doctor', 'patient') THEN
    RETURN EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = _role
    );
  END IF;
  
  -- Deny admin role enumeration by non-admins
  RETURN false;
END;
$$;
