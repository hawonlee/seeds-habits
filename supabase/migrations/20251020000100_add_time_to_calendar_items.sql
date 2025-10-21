-- Add time fields to allow multiple schedules per day and timed entries
ALTER TABLE public.calendar_items
  ADD COLUMN IF NOT EXISTS start_minutes INTEGER NULL,
  ADD COLUMN IF NOT EXISTS end_minutes INTEGER NULL;

-- Drop old uniqueness (one item per date) and replace with uniqueness per start time
ALTER TABLE public.calendar_items
  DROP CONSTRAINT IF EXISTS calendar_items_item_type_item_id_scheduled_date_key;

ALTER TABLE public.calendar_items
  ADD CONSTRAINT calendar_items_unique_per_time
  UNIQUE (item_type, item_id, scheduled_date, start_minutes);

-- Optional helpful indexes
CREATE INDEX IF NOT EXISTS idx_calendar_items_start_minutes
  ON public.calendar_items(start_minutes);
CREATE INDEX IF NOT EXISTS idx_calendar_items_date_time
  ON public.calendar_items(scheduled_date, start_minutes);

