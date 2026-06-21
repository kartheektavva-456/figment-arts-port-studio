
ALTER TABLE public.bricks DROP CONSTRAINT IF EXISTS bricks_position_index_key;
ALTER TABLE public.bricks
  ADD CONSTRAINT bricks_position_index_key UNIQUE (position_index) DEFERRABLE INITIALLY IMMEDIATE;

CREATE OR REPLACE FUNCTION public.delete_brick_and_compact(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SET CONSTRAINTS bricks_position_index_key DEFERRED;

  DELETE FROM public.bricks WHERE id = _id;

  UPDATE public.bricks AS b
  SET position_index = sub.new_index
  FROM (
    SELECT id, (ROW_NUMBER() OVER (ORDER BY position_index ASC) - 1)::int AS new_index
    FROM public.bricks
  ) sub
  WHERE b.id = sub.id
    AND b.position_index IS DISTINCT FROM sub.new_index;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_brick_and_compact(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_brick_and_compact(uuid) TO service_role;
