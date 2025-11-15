
-- Enable realtime for key tables (skip if already added)
DO $$
BEGIN
    -- Try to add purchases table
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.purchases;
    EXCEPTION WHEN duplicate_object THEN
        NULL; -- Table already added, skip
    END;
    
    -- Try to add broadcasts table
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcasts;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    -- Try to add statistics table
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.statistics;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;

-- Ensure tables have REPLICA IDENTITY FULL for complete update data
ALTER TABLE public.purchases REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.broadcasts REPLICA IDENTITY FULL;
ALTER TABLE public.statistics REPLICA IDENTITY FULL;
