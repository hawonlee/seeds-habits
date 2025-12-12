-- Rename is_undo to is_excused for clarity
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'habit_undo_states' AND column_name = 'is_undo'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'habit_undo_states' AND column_name = 'is_excused'
  ) THEN
    ALTER TABLE public.habit_undo_states
      ADD COLUMN is_excused BOOLEAN;
    UPDATE public.habit_undo_states SET is_excused = is_undo;
    ALTER TABLE public.habit_undo_states
      ALTER COLUMN is_excused SET NOT NULL,
      ALTER COLUMN is_excused SET DEFAULT FALSE;
  END IF;
END $$;

-- Backfill default where null just in case
UPDATE public.habit_undo_states SET is_excused = COALESCE(is_excused, FALSE);

-- Optional: keep is_undo for backward compatibility for now
-- To drop later when UI is fully migrated:
-- ALTER TABLE public.habit_undo_states DROP COLUMN is_undo;


