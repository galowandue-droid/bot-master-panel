-- Add admin role for the existing user
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'galowandue@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;