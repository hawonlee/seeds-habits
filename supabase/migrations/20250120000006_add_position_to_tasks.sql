-- Add position field to tasks table for custom ordering
ALTER TABLE tasks 
ADD COLUMN position INTEGER;

-- Create index for position-based ordering
CREATE INDEX idx_tasks_position ON public.tasks(task_list_id, position);

-- Update existing tasks to have positions based on created_at order
-- This will give existing tasks sequential positions within each task list
UPDATE tasks 
SET position = subquery.row_number
FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY task_list_id ORDER BY created_at ASC) as row_number
    FROM tasks
) subquery
WHERE tasks.id = subquery.id;

-- Make position NOT NULL after setting values
ALTER TABLE tasks 
ALTER COLUMN position SET NOT NULL;
