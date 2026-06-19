ALTER TABLE public.campaign_stats ADD COLUMN IF NOT EXISTS deadline_date date;
UPDATE public.campaign_stats SET deadline_date = '2026-07-27' WHERE id = 1;