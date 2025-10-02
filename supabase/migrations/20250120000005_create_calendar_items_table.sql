-- Create calendar_items table to unify scheduling for habits and tasks
CREATE TABLE IF NOT EXISTS public.calendar_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('habit', 'task')),
    item_id UUID NOT NULL, -- References either habits.id or tasks.id
    scheduled_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure a calendar item can only be scheduled once per date per item
    UNIQUE(item_type, item_id, scheduled_date)
);

-- Enable Row Level Security
ALTER TABLE public.calendar_items ENABLE ROW LEVEL SECURITY;

-- Create policies for calendar_items
CREATE POLICY "Users can view their own calendar items" ON public.calendar_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar items" ON public.calendar_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar items" ON public.calendar_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar items" ON public.calendar_items
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_calendar_items_user_id ON public.calendar_items(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_items_item_type ON public.calendar_items(item_type);
CREATE INDEX IF NOT EXISTS idx_calendar_items_item_id ON public.calendar_items(item_id);
CREATE INDEX IF NOT EXISTS idx_calendar_items_scheduled_date ON public.calendar_items(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_calendar_items_user_date ON public.calendar_items(user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_calendar_items_type_date ON public.calendar_items(item_type, scheduled_date);

-- Create trigger to automatically update updated_at
CREATE TRIGGER handle_calendar_items_updated_at
    BEFORE UPDATE ON public.calendar_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create function to validate item_id references
CREATE OR REPLACE FUNCTION validate_calendar_item_reference()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate that the item_id exists in the appropriate table
    IF NEW.item_type = 'habit' THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.habits 
            WHERE id = NEW.item_id 
            AND user_id = NEW.user_id
        ) THEN
            RAISE EXCEPTION 'Habit with id % does not exist or does not belong to user', NEW.item_id;
        END IF;
    ELSIF NEW.item_type = 'task' THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.tasks 
            WHERE id = NEW.item_id 
            AND user_id = NEW.user_id
        ) THEN
            RAISE EXCEPTION 'Task with id % does not exist or does not belong to user', NEW.item_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate item references
CREATE TRIGGER validate_calendar_item_reference_trigger
    BEFORE INSERT OR UPDATE ON public.calendar_items
    FOR EACH ROW
    EXECUTE FUNCTION validate_calendar_item_reference();

-- Migrate existing habit_schedules data to calendar_items
INSERT INTO public.calendar_items (user_id, item_type, item_id, scheduled_date, created_at, updated_at)
SELECT 
    user_id,
    'habit' as item_type,
    habit_id as item_id,
    scheduled_date,
    created_at,
    updated_at
FROM public.habit_schedules
ON CONFLICT (item_type, item_id, scheduled_date) DO NOTHING;

-- Add comment explaining the table purpose
COMMENT ON TABLE public.calendar_items IS 'Unified table for scheduling habits and tasks on specific calendar dates';
COMMENT ON COLUMN public.calendar_items.item_type IS 'Type of item: habit or task';
COMMENT ON COLUMN public.calendar_items.item_id IS 'ID of the habit or task being scheduled';
COMMENT ON COLUMN public.calendar_items.scheduled_date IS 'Date when the item appears on the calendar';
