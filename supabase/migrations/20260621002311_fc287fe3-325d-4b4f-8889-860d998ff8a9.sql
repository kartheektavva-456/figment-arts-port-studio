-- Delete duplicate bricks at positions 16 and 17 (keep the earliest at each position)
DELETE FROM public.bricks
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY position_index ORDER BY created_at ASC) AS rn
    FROM public.bricks
  ) t
  WHERE t.rn > 1
);

-- Enforce one brick per slot
ALTER TABLE public.bricks ADD CONSTRAINT bricks_position_index_unique UNIQUE (position_index);