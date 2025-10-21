-- Allow multiple calendar items for the same task on the same day/time
-- Removes uniqueness constraints that prevented duplicates

-- Drop uniqueness per time if present
ALTER TABLE public.calendar_items
  DROP CONSTRAINT IF EXISTS calendar_items_unique_per_time;

-- Drop legacy uniqueness per date if still present
ALTER TABLE public.calendar_items
  DROP CONSTRAINT IF EXISTS calendar_items_item_type_item_id_scheduled_date_key;

-- Note: existing indexes remain for performance.
-- Queries that relied on uniqueness should handle multiple rows now.


