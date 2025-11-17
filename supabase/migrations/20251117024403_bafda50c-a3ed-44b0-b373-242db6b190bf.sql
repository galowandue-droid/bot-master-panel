-- Provide has_role overload with (user_id, role) signature so existing RLS policies using has_role(auth.uid(), 'admin') work
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Verify: optional no-op select to ensure function exists (will not execute at runtime)
