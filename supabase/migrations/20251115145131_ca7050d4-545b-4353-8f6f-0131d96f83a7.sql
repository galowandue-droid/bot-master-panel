-- Trigger to notify referrers about rewards
CREATE OR REPLACE FUNCTION notify_referral_reward()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referrer_telegram_id BIGINT;
BEGIN
  -- Only process if status changed to completed and reward was just given
  IF NEW.status = 'completed' AND OLD.status = 'pending' AND NEW.reward_given_at IS NOT NULL THEN
    -- Get referrer's telegram_id
    SELECT telegram_id INTO referrer_telegram_id
    FROM profiles
    WHERE id = NEW.referrer_id;

    -- Log notification request
    INSERT INTO logs (level, message, metadata)
    VALUES (
      'info',
      'Referral reward notification queued',
      jsonb_build_object(
        'referrer_id', NEW.referrer_id,
        'referrer_telegram_id', referrer_telegram_id,
        'reward_amount', NEW.reward_amount
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for referral reward notifications
DROP TRIGGER IF EXISTS trigger_notify_referral_reward ON referrals;
CREATE TRIGGER trigger_notify_referral_reward
  AFTER UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION notify_referral_reward();

-- Function to check low stock and log warning
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  available_count INTEGER;
  position_name TEXT;
  low_stock_threshold INTEGER := 5; -- Alert when less than 5 items remain
BEGIN
  -- Count remaining items for this position
  SELECT COUNT(*), MAX(p.name)
  INTO available_count, position_name
  FROM items i
  JOIN positions p ON p.id = i.position_id
  WHERE i.position_id = NEW.position_id
    AND i.is_sold = false
  GROUP BY i.position_id;

  -- Log if stock is low
  IF available_count IS NOT NULL AND available_count <= low_stock_threshold THEN
    INSERT INTO logs (level, message, metadata)
    VALUES (
      'warn',
      'Low stock alert',
      jsonb_build_object(
        'position_id', NEW.position_id,
        'position_name', position_name,
        'available_count', available_count,
        'threshold', low_stock_threshold
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for low stock alerts
DROP TRIGGER IF EXISTS trigger_check_low_stock ON items;
CREATE TRIGGER trigger_check_low_stock
  AFTER UPDATE OF is_sold ON items
  FOR EACH ROW
  WHEN (NEW.is_sold = true)
  EXECUTE FUNCTION check_low_stock();
