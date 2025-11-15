-- Create user segments table
CREATE TABLE IF NOT EXISTS public.user_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  conditions jsonb NOT NULL DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create user segment members table
CREATE TABLE IF NOT EXISTS public.user_segment_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id uuid REFERENCES public.user_segments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  added_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(segment_id, user_id)
);

-- Create broadcast buttons table
CREATE TABLE IF NOT EXISTS public.broadcast_buttons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id uuid REFERENCES public.broadcasts(id) ON DELETE CASCADE NOT NULL,
  text text NOT NULL,
  url text,
  row integer NOT NULL DEFAULT 0,
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add new columns to broadcasts table
ALTER TABLE public.broadcasts 
  ADD COLUMN IF NOT EXISTS segment_id uuid REFERENCES public.user_segments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS media_type text CHECK (media_type IN ('photo', 'video', 'document')),
  ADD COLUMN IF NOT EXISTS schedule_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS media_caption text;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_segment_members_segment ON public.user_segment_members(segment_id);
CREATE INDEX IF NOT EXISTS idx_user_segment_members_user ON public.user_segment_members(user_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_buttons_broadcast ON public.broadcast_buttons(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_broadcasts_segment ON public.broadcasts(segment_id);
CREATE INDEX IF NOT EXISTS idx_broadcasts_schedule ON public.broadcasts(schedule_at);

-- Enable RLS
ALTER TABLE public.user_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_segment_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_buttons ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_segments
CREATE POLICY "Admins can manage segments"
  ON public.user_segments
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_segment_members
CREATE POLICY "Admins can manage segment members"
  ON public.user_segment_members
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for broadcast_buttons
CREATE POLICY "Admins can manage broadcast buttons"
  ON public.broadcast_buttons
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_user_segments_updated_at
  BEFORE UPDATE ON public.user_segments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();