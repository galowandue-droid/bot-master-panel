-- Create audit_log table for tracking admin actions
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX idx_audit_log_resource ON public.audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_log_action ON public.audit_log(action);

-- Enable RLS
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs"
  ON public.audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Create webhook_logs table for monitoring webhooks
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_name TEXT NOT NULL,
  request_body JSONB,
  response_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  processing_time_ms INTEGER,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_webhook_logs_name ON public.webhook_logs(webhook_name);
CREATE INDEX idx_webhook_logs_created_at ON public.webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_status ON public.webhook_logs(response_status);

-- Enable RLS
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read webhook logs
CREATE POLICY "Admins can read webhook logs"
  ON public.webhook_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Create function to automatically log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only log if user is admin
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  ) THEN
    INSERT INTO public.audit_log (
      user_id,
      action,
      resource_type,
      resource_id,
      changes
    ) VALUES (
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      COALESCE(NEW.id::TEXT, OLD.id::TEXT),
      CASE
        WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
        WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW)
        WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
      END
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add triggers for important tables
CREATE TRIGGER audit_profiles_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_action();

CREATE TRIGGER audit_broadcasts_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.broadcasts
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_action();

CREATE TRIGGER audit_categories_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_action();

CREATE TRIGGER audit_positions_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.positions
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_action();

CREATE TRIGGER audit_user_roles_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_action();