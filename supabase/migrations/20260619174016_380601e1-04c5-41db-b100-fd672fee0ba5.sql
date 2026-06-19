DROP TRIGGER IF EXISTS increment_supporters_on_brick ON public.bricks;
DROP TRIGGER IF EXISTS bricks_increment_supporters ON public.bricks;
DROP FUNCTION IF EXISTS public.increment_supporters() CASCADE;