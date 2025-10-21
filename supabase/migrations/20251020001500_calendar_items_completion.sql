-- Add completion fields per occurrence
ALTER TABLE public.calendar_items
  ADD COLUMN IF NOT EXISTS completed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;

-- Helpful index for completed filtering
CREATE INDEX IF NOT EXISTS idx_calendar_items_completed
  ON public.calendar_items(user_id, scheduled_date, completed);

