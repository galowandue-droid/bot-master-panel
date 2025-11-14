-- Fix security warnings

-- 1. Add RLS policies for purchase_items table
CREATE POLICY "Admins can manage purchase_items"
  ON public.purchase_items FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Drop and recreate recent_activity view without SECURITY DEFINER
DROP VIEW IF EXISTS public.recent_activity;

-- Create a simple view without security definer (users will need appropriate permissions to access underlying tables)
CREATE VIEW public.recent_activity WITH (security_invoker=true) AS
SELECT 
  'purchase' as type,
  p.id,
  p.created_at,
  p.user_id,
  pr.username,
  pr.first_name,
  pos.name as item_name,
  p.total_price as amount
FROM purchases p
LEFT JOIN profiles pr ON p.user_id = pr.id
LEFT JOIN positions pos ON p.position_id = pos.id
ORDER BY p.created_at DESC
LIMIT 20;

-- 3. Fix function search path for update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SET search_path = public;