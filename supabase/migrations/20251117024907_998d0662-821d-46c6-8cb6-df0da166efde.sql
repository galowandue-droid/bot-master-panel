-- Fix RLS for public_bot_settings: ensure INSERT/UPSERT allowed for admins via WITH CHECK
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'public_bot_settings' 
      AND policyname = 'Admins can manage public settings'
  ) THEN
    DROP POLICY "Admins can manage public settings" ON public.public_bot_settings;
  END IF;
END $$;

CREATE POLICY "Admins can manage public settings"
ON public.public_bot_settings
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
