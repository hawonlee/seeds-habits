-- Test if we can insert duplicate calendar items
-- Run this in your Supabase SQL editor to verify constraint is removed

-- Check current constraints on calendar_items
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.calendar_items'::regclass
AND contype = 'u'  -- unique constraints only
ORDER BY conname;

-- This should show no unique constraints if the migration worked
