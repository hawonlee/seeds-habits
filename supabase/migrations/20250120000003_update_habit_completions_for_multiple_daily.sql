-- Update habit_completions table to support multiple completions per day
-- This migration removes the unique constraint and adds a completion_count field

-- First, check if the unique constraint exists and remove it
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'habit_completions_habit_id_completion_date_key'
        AND table_name = 'habit_completions'
    ) THEN
        ALTER TABLE public.habit_completions DROP CONSTRAINT habit_completions_habit_id_completion_date_key;
    END IF;
END $$;

-- Add completion_count column to track multiple completions per day
ALTER TABLE public.habit_completions ADD COLUMN IF NOT EXISTS completion_count INTEGER NOT NULL DEFAULT 1;

-- Update existing records to have completion_count = 1
UPDATE public.habit_completions SET completion_count = 1 WHERE completion_count IS NULL;

-- Add an index for better performance on habit_id, completion_date, completion_count queries
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_date_count 
ON public.habit_completions(habit_id, completion_date, completion_count);

-- Update the existing index to include completion_count
DROP INDEX IF EXISTS idx_habit_completions_habit_date;
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_date_count_optimized 
ON public.habit_completions(habit_id, completion_date);
