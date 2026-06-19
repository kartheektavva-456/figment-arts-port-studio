ALTER TABLE public.campaign_stats REPLICA IDENTITY FULL;
ALTER TABLE public.bricks REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bricks;