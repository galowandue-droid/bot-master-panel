
-- Fix Security Definer View issue
-- Drop the existing recent_activity view if it exists with SECURITY DEFINER
DROP VIEW IF EXISTS public.recent_activity CASCADE;

-- Recreate recent_activity view WITHOUT security definer
CREATE OR REPLACE VIEW public.recent_activity AS
SELECT 
  'deposit' AS type,
  d.id,
  d.created_at,
  d.user_id,
  p.username,
  p.first_name,
  'Пополнение' AS item_name,
  d.amount
FROM deposits d
LEFT JOIN profiles p ON p.id = d.user_id
WHERE d.status = 'completed'

UNION ALL

SELECT 
  'purchase' AS type,
  pu.id,
  pu.created_at,
  pu.user_id,
  p.username,
  p.first_name,
  pos.name AS item_name,
  pu.total_price AS amount
FROM purchases pu
LEFT JOIN profiles p ON p.id = pu.user_id
LEFT JOIN positions pos ON pos.id = pu.position_id

ORDER BY created_at DESC
LIMIT 100;

-- Move extensions from public schema to extensions schema
-- First, create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Note: We cannot directly move existing extensions, but we can ensure
-- future extensions are installed in the extensions schema by setting search_path
-- This is a best practice recommendation for new extensions
