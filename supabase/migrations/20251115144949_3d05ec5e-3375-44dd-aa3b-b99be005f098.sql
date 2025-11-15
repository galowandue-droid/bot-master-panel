-- Enable pg_cron and pg_net for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to automatically process referral rewards
CREATE OR REPLACE FUNCTION process_referral_reward()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referral_record RECORD;
  reward_amount NUMERIC;
  reward_percent NUMERIC := 0.10; -- 10% commission by default
BEGIN
  -- Check if buyer has an active referral (was referred by someone)
  SELECT * INTO referral_record
  FROM referrals
  WHERE referred_id = NEW.user_id
    AND status = 'pending'
  LIMIT 1;

  -- If referral exists, process reward
  IF FOUND THEN
    -- Calculate reward (10% of purchase)
    reward_amount := NEW.total_price * reward_percent;

    -- Update referral status and reward
    UPDATE referrals
    SET 
      status = 'completed',
      reward_amount = reward_amount,
      reward_given_at = NOW()
    WHERE id = referral_record.id;

    -- Credit referrer's balance
    UPDATE profiles
    SET balance = balance + reward_amount
    WHERE id = referral_record.referrer_id;

    -- Log the reward
    INSERT INTO logs (level, message, metadata)
    VALUES (
      'info',
      'Referral reward processed',
      jsonb_build_object(
        'referrer_id', referral_record.referrer_id,
        'referred_id', NEW.user_id,
        'purchase_id', NEW.id,
        'reward_amount', reward_amount
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for automatic referral rewards on purchases
DROP TRIGGER IF EXISTS trigger_process_referral_reward ON purchases;
CREATE TRIGGER trigger_process_referral_reward
  AFTER INSERT ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION process_referral_reward();

-- Add index for faster referral lookups
CREATE INDEX IF NOT EXISTS idx_referrals_referred_status ON referrals(referred_id, status);
