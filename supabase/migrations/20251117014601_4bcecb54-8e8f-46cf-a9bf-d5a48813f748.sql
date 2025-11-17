-- Split bot_settings into public and secure tables for better security
-- public_bot_settings: Non-sensitive configs accessible to admins
-- secure_bot_settings: Payment tokens accessible only via SERVICE_ROLE in edge functions

-- Create public_bot_settings table
CREATE TABLE public.public_bot_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create secure_bot_settings table (no client access)
CREATE TABLE public.secure_bot_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.public_bot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secure_bot_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for public_bot_settings (admins can manage)
CREATE POLICY "Admins can manage public settings"
  ON public.public_bot_settings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- NO RLS policies for secure_bot_settings - only SERVICE_ROLE can access
-- This prevents any client-side access to payment tokens

-- Migrate data from old bot_settings table
-- Public settings (non-sensitive)
INSERT INTO public.public_bot_settings (key, value, updated_at)
SELECT key, value, updated_at
FROM public.bot_settings
WHERE key IN (
  'faq',
  'support_contact',
  'hide_empty_categories',
  'hide_empty_positions',
  'webhook_url',
  'bot_enabled',
  'maintenance_mode',
  'deposits_enabled',
  'purchases_enabled',
  'link_preview_enabled',
  'cryptobot_enabled',
  'wata_enabled',
  'heleket_enabled',
  'telegram_stars_enabled',
  'cryptobot_custom_link',
  'wata_custom_link',
  'heleket_custom_link',
  'telegram_stars_custom_link',
  'cryptobot_commission',
  'wata_commission',
  'heleket_commission',
  'telegram_stars_commission',
  'payment_min_amount',
  'payment_max_amount',
  'payment_success_message',
  'payment_failure_message',
  'payment_pending_message'
)
ON CONFLICT (key) DO NOTHING;

-- Secure settings (payment tokens)
INSERT INTO public.secure_bot_settings (key, value, updated_at)
SELECT key, value, updated_at
FROM public.bot_settings
WHERE key IN (
  'cryptobot_token',
  'wata_token',
  'heleket_token',
  'telegram_stars_token',
  'yoomoney_token'
)
ON CONFLICT (key) DO NOTHING;

-- Drop old bot_settings table
DROP TABLE IF EXISTS public.bot_settings CASCADE;

-- Create updated_at trigger for both tables
CREATE TRIGGER update_public_bot_settings_updated_at
  BEFORE UPDATE ON public.public_bot_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_secure_bot_settings_updated_at
  BEFORE UPDATE ON public.secure_bot_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_public_bot_settings_key ON public.public_bot_settings(key);
CREATE INDEX idx_secure_bot_settings_key ON public.secure_bot_settings(key);