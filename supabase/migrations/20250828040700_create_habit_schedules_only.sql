-- Create habit_schedules table to store habit assignments to specific dates
CREATE TABLE IF NOT EXISTS public.habit_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure a habit can only be scheduled once per date
    UNIQUE(habit_id, scheduled_date)
);

-- Enable Row Level Security
ALTER TABLE public.habit_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies for habit_schedules
CREATE POLICY "Users can view their own habit schedules" ON public.habit_schedules
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habit schedules" ON public.habit_schedules
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habit schedules" ON public.habit_schedules
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habit schedules" ON public.habit_schedules
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_habit_schedules_user_id ON public.habit_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_schedules_habit_id ON public.habit_schedules(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_schedules_scheduled_date ON public.habit_schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_habit_schedules_user_date ON public.habit_schedules(user_id, scheduled_date);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_habit_schedules_updated_at
    BEFORE UPDATE ON public.habit_schedules
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
