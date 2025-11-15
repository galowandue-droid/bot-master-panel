-- Drop the existing recent_activity view
DROP VIEW IF EXISTS public.recent_activity;

-- Recreate as a security definer view that checks admin role
CREATE OR REPLACE VIEW public.recent_activity 
WITH (security_invoker = false)
AS
SELECT 
  p.id,
  p.user_id,
  p.created_at,
  pr.username,
  pr.first_name,
  pos.name as item_name,
  p.total_price as amount,
  'purchase' as type
FROM purchases p
JOIN profiles pr ON pr.id = p.user_id
JOIN positions pos ON pos.id = p.position_id
WHERE has_role(auth.uid(), 'admin'::app_role)

UNION ALL

SELECT 
  d.id,
  d.user_id,
  d.created_at,
  pr.username,
  pr.first_name,
  d.payment_method as item_name,
  d.amount,
  'deposit' as type
FROM deposits d
JOIN profiles pr ON pr.id = d.user_id
WHERE has_role(auth.uid(), 'admin'::app_role)

ORDER BY created_at DESC;