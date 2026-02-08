-- Add display_type column to calendar_items to distinguish between task and deadline views
ALTER TABLE public.calendar_items
  ADD COLUMN IF NOT EXISTS display_type TEXT NULL CHECK (display_type IN ('task', 'deadline'));

-- Set default to 'task' only for calendar items that still reference a task
-- (avoids trigger failure if orphaned calendar_items exist)
UPDATE public.calendar_items ci
SET display_type = 'task'
FROM public.tasks t
WHERE ci.item_type = 'task'
  AND ci.display_type IS NULL
  AND t.id = ci.item_id
  AND t.user_id = ci.user_id;

-- Add comment explaining the column purpose
COMMENT ON COLUMN public.calendar_items.display_type IS 'Display type for tasks: task (with checkbox) or deadline (rectangle with background color)';
