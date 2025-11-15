-- Create RPC function for incrementing template usage
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE message_templates 
  SET usage_count = usage_count + 1 
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;