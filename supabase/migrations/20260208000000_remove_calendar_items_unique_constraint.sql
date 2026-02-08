-- Remove all uniqueness constraints from calendar_items to allow copying tasks
-- This allows the same task to be scheduled multiple times on the same day

-- Drop the unique constraint if it exists
ALTER TABLE public.calendar_items
  DROP CONSTRAINT IF EXISTS calendar_items_unique_per_time;

-- Drop legacy constraint if still present
ALTER TABLE public.calendar_items
  DROP CONSTRAINT IF EXISTS calendar_items_item_type_item_id_scheduled_date_key;

-- Drop any other uniqueness constraints that might exist
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find and drop any UNIQUE constraints on calendar_items
    FOR constraint_name IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.calendar_items'::regclass
        AND contype = 'u'
    LOOP
        EXECUTE format('ALTER TABLE public.calendar_items DROP CONSTRAINT IF EXISTS %I', constraint_name);
    END LOOP;
END $$;

-- Keep indexes for performance, but remove any unique indexes
DROP INDEX IF EXISTS calendar_items_item_type_item_id_scheduled_date_idx;
DROP INDEX IF EXISTS calendar_items_item_type_item_id_scheduled_date_start_minute_idx;

-- Note: Regular indexes remain for performance
-- Multiple instances of the same task can now exist on the same date
