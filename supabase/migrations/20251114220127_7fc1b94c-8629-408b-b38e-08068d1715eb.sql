-- Create logs table
CREATE TABLE IF NOT EXISTS public.logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('INFO', 'WARNING', 'ERROR')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON public.logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_level ON public.logs(level);

-- Enable RLS
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view logs"
  ON public.logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert logs"
  ON public.logs FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete logs"
  ON public.logs FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create view for recent activity
CREATE OR REPLACE VIEW public.recent_activity AS
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