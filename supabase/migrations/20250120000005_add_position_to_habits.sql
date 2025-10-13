-- Add position field to habits table for custom ordering
ALTER TABLE public.habits 
ADD COLUMN position INTEGER;

-- Create index for position-based ordering
CREATE INDEX idx_habits_position ON public.habits(user_id, position);

-- Update existing habits to have positions based on created_at order
-- This will give existing habits sequential positions
UPDATE public.habits 
SET position = subquery.row_number
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as row_number
  FROM public.habits
) AS subquery
WHERE public.habits.id = subquery.id;

-- Make position NOT NULL after setting values
ALTER TABLE public.habits 
ALTER COLUMN position SET NOT NULL;
