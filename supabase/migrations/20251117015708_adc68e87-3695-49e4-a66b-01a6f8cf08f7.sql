-- Bootstrap: Create first admin user to resolve RLS bootstrap problem
-- This migration runs with elevated privileges and bypasses RLS
INSERT INTO public.user_roles (user_id, role)
VALUES ('e38106c1-6f2f-4232-b9e5-4301d3e80207', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Log the bootstrap action with correct level format
INSERT INTO public.logs (level, message, metadata)
VALUES (
  'INFO',
  'Bootstrap: First admin user created via migration',
  jsonb_build_object(
    'user_id', 'e38106c1-6f2f-4232-b9e5-4301d3e80207',
    'action', 'bootstrap_admin',
    'note', 'Created via migration to resolve RLS bootstrap problem - allows first admin to manage other roles'
  )
);