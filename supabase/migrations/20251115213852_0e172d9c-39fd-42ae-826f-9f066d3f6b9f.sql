-- Fix search_path for increment_template_usage function
DROP FUNCTION IF EXISTS increment_template_usage;

CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE message_templates 
  SET usage_count = usage_count + 1 
  WHERE id = template_id;
END;
$$;