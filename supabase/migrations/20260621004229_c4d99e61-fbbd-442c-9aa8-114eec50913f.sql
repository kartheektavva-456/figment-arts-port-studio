DO $$
BEGIN
  SET CONSTRAINTS bricks_position_index_key DEFERRED;
  UPDATE public.bricks AS b
  SET position_index = sub.new_index
  FROM (
    SELECT id, (ROW_NUMBER() OVER (ORDER BY position_index ASC) - 1)::int AS new_index
    FROM public.bricks
  ) sub
  WHERE b.id = sub.id
    AND b.position_index IS DISTINCT FROM sub.new_index;
END $$;