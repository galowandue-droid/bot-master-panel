-- Move pg_net extension from public schema to extensions schema
-- This addresses the security best practice of keeping extensions out of public schema

-- First ensure extensions schema exists
CREATE SCHEMA IF NOT EXISTS extensions;

-- Drop the extension from public schema and recreate in extensions
DROP EXTENSION IF EXISTS pg_net CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- Grant necessary permissions for edge functions to use pg_net
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA extensions TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA extensions TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA extensions TO postgres, anon, authenticated, service_role;