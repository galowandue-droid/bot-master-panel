
-- Enable realtime for deposits table
ALTER TABLE public.deposits REPLICA IDENTITY FULL;

-- Add the deposits table to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.deposits;
