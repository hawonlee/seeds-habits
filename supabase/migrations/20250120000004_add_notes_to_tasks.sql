-- Add notes column to tasks table
ALTER TABLE tasks ADD COLUMN notes TEXT;

-- Add comment to document the column
COMMENT ON COLUMN tasks.notes IS 'Optional notes/description for the task';

