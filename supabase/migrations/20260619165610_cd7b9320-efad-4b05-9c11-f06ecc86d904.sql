
CREATE TABLE public.bricks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Anonymous',
  message TEXT NOT NULL,
  color TEXT NOT NULL,
  position_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.bricks TO anon, authenticated;
GRANT ALL ON public.bricks TO service_role;
ALTER TABLE public.bricks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bricks are viewable by everyone" ON public.bricks FOR SELECT USING (true);
CREATE POLICY "Anyone can add a brick" ON public.bricks FOR INSERT WITH CHECK (
  length(message) > 0 AND length(message) <= 80 AND length(coalesce(name,'')) <= 60
);

CREATE TABLE public.campaign_stats (
  id INTEGER PRIMARY KEY,
  amount_raised NUMERIC NOT NULL DEFAULT 0,
  target NUMERIC NOT NULL DEFAULT 25000,
  supporters INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.campaign_stats TO anon, authenticated;
GRANT ALL ON public.campaign_stats TO service_role;
ALTER TABLE public.campaign_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Stats viewable by everyone" ON public.campaign_stats FOR SELECT USING (true);

INSERT INTO public.campaign_stats (id, amount_raised, target, supporters)
VALUES (1, 4280, 25000, 47);

-- Auto-update supporters count when bricks are added
CREATE OR REPLACE FUNCTION public.increment_supporters()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.campaign_stats SET supporters = supporters + 1, updated_at = now() WHERE id = 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER bricks_increment_supporters
AFTER INSERT ON public.bricks
FOR EACH ROW EXECUTE FUNCTION public.increment_supporters();
