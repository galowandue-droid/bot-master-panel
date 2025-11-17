-- Bootstrap: Temporarily disable RLS to insert first admin
-- This resolves the bootstrap problem where RLS prevents admin creation when no admins exist

-- Temporarily disable RLS on user_roles
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Insert first admin user
INSERT INTO public.user_roles (user_id, role)
VALUES ('e38106c1-6f2f-4232-b9e5-4301d3e80207', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- Re-enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Add bootstrap safety net policy for future
-- This allows first admin creation if all admins are deleted
CREATE POLICY "Bootstrap: Allow first admin if none exist"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  role = 'admin'::app_role 
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'admin'::app_role
  )
);

-- Log the bootstrap action with correct level
INSERT INTO public.logs (level, message, metadata)
VALUES (
  'INFO',
  'Bootstrap: First admin created with RLS temporary bypass',
  jsonb_build_object(
    'user_id', 'e38106c1-6f2f-4232-b9e5-4301d3e80207',
    'email', 'galowandue@gmail.com',
    'method', 'RLS_TEMPORARY_DISABLE',
    'note', 'RLS was temporarily disabled to insert first admin, then re-enabled with bootstrap safety policy'
  )
);