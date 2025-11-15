-- Create referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  referred_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
  reward_amount numeric DEFAULT 0,
  reward_given_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(referrer_id, referred_id)
);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON public.referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all referrals"
  ON public.referrals
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own referrals"
  ON public.referrals
  FOR SELECT
  USING (
    auth.uid() = referrer_id OR auth.uid() = referred_id
  );

-- Add referral settings to bot_settings if not exists
INSERT INTO public.bot_settings (key, value)
VALUES 
  ('referral_enabled', 'true'),
  ('referral_reward_type', 'fixed'),
  ('referral_reward_amount', '100'),
  ('referral_min_purchase', '0')
ON CONFLICT (key) DO NOTHING;