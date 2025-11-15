-- Create required_channels table
CREATE TABLE IF NOT EXISTS public.required_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id TEXT NOT NULL UNIQUE,
  channel_name TEXT NOT NULL,
  channel_username TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.required_channels ENABLE ROW LEVEL SECURITY;

-- Admins can manage channels
CREATE POLICY "Admins can manage required channels"
ON public.required_channels
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Everyone can view active channels
CREATE POLICY "Everyone can view active channels"
ON public.required_channels
FOR SELECT
USING (is_active = true);

-- Create user_channel_subscriptions table to track subscriptions
CREATE TABLE IF NOT EXISTS public.user_channel_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_subscribed BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id, channel_id)
);

-- Enable RLS
ALTER TABLE public.user_channel_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
ON public.user_channel_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can manage all subscriptions
CREATE POLICY "Admins can manage subscriptions"
ON public.user_channel_subscriptions
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_required_channels_updated_at
BEFORE UPDATE ON public.required_channels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();