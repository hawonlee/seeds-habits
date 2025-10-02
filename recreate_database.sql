-- ==============================================
-- COMPLETE DATABASE RECREATION SCRIPT
-- This recreates all tables and their structure
-- ==============================================

-- Create the update_updated_at_column function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- PROFILES TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================
-- CATEGORIES TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT NOT NULL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  bg_color TEXT NOT NULL,
  text_color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policies for categories
DROP POLICY IF EXISTS "Users can view their own categories" ON public.categories;
CREATE POLICY "Users can view their own categories"
ON public.categories
FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own categories" ON public.categories;
CREATE POLICY "Users can insert their own categories"
ON public.categories
FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own categories" ON public.categories;
CREATE POLICY "Users can update their own categories"
ON public.categories
FOR UPDATE
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own categories" ON public.categories;
CREATE POLICY "Users can delete their own categories"
ON public.categories
FOR DELETE
USING (user_id = auth.uid());

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_id ON public.categories(id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);

-- ==============================================
-- HABITS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT,
  category TEXT NOT NULL DEFAULT 'personal',
  target_value INTEGER NOT NULL DEFAULT 1,
  target_unit TEXT NOT NULL DEFAULT 'week' CHECK (target_unit IN ('day', 'week')),
  custom_days SMALLINT[] DEFAULT ARRAY[]::SMALLINT[],
  leniency_threshold INTEGER NOT NULL DEFAULT 2,
  phase TEXT NOT NULL DEFAULT 'future' CHECK (phase IN ('future', 'current', 'adopted')),
  streak INTEGER NOT NULL DEFAULT 0,
  total_completions INTEGER NOT NULL DEFAULT 0,
  last_completed TIMESTAMP WITH TIME ZONE,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

-- Create policies for habits
DROP POLICY IF EXISTS "Users can view their own habits" ON public.habits;
CREATE POLICY "Users can view their own habits" 
ON public.habits 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own habits" ON public.habits;
CREATE POLICY "Users can insert their own habits" 
ON public.habits 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own habits" ON public.habits;
CREATE POLICY "Users can update their own habits" 
ON public.habits 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own habits" ON public.habits;
CREATE POLICY "Users can delete their own habits" 
ON public.habits 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_habits_updated_at ON public.habits;
CREATE TRIGGER update_habits_updated_at
BEFORE UPDATE ON public.habits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_phase ON public.habits(phase);

-- ==============================================
-- HABIT COMPLETIONS TABLE (WITH MULTIPLE COMPLETIONS SUPPORT)
-- ==============================================
CREATE TABLE IF NOT EXISTS public.habit_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL,
  completion_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;

-- Create policies for habit_completions
DROP POLICY IF EXISTS "Users can view their own habit completions" ON public.habit_completions;
CREATE POLICY "Users can view their own habit completions" 
ON public.habit_completions 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own habit completions" ON public.habit_completions;
CREATE POLICY "Users can insert their own habit completions" 
ON public.habit_completions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own habit completions" ON public.habit_completions;
CREATE POLICY "Users can update their own habit completions" 
ON public.habit_completions 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own habit completions" ON public.habit_completions;
CREATE POLICY "Users can delete their own habit completions" 
ON public.habit_completions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_habit_completions_updated_at ON public.habit_completions;
CREATE TRIGGER update_habit_completions_updated_at
BEFORE UPDATE ON public.habit_completions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_id ON public.habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_user_id ON public.habit_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_date ON public.habit_completions(completion_date);
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_date ON public.habit_completions(habit_id, completion_date);
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_date_count ON public.habit_completions(habit_id, completion_date, completion_count);

-- ==============================================
-- HABIT SCHEDULES TABLE
-- ==============================================
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
DROP POLICY IF EXISTS "Users can view their own habit schedules" ON public.habit_schedules;
CREATE POLICY "Users can view their own habit schedules" ON public.habit_schedules
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own habit schedules" ON public.habit_schedules;
CREATE POLICY "Users can insert their own habit schedules" ON public.habit_schedules
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own habit schedules" ON public.habit_schedules;
CREATE POLICY "Users can update their own habit schedules" ON public.habit_schedules
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own habit schedules" ON public.habit_schedules;
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

DROP TRIGGER IF EXISTS handle_habit_schedules_updated_at ON public.habit_schedules;
CREATE TRIGGER handle_habit_schedules_updated_at
    BEFORE UPDATE ON public.habit_schedules
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================
-- TASK LISTS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS task_lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT NOT NULL DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_lists_user_id ON task_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_task_lists_created_at ON task_lists(created_at DESC);

-- Enable Row Level Security
ALTER TABLE task_lists ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own task lists" ON task_lists;
CREATE POLICY "Users can view their own task lists" ON task_lists
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own task lists" ON task_lists;
CREATE POLICY "Users can insert their own task lists" ON task_lists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own task lists" ON task_lists;
CREATE POLICY "Users can update their own task lists" ON task_lists
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own task lists" ON task_lists;
CREATE POLICY "Users can delete their own task lists" ON task_lists
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_task_lists_updated_at ON task_lists;
CREATE TRIGGER update_task_lists_updated_at
    BEFORE UPDATE ON task_lists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- TASKS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    due_date DATE,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    task_list_id UUID NOT NULL REFERENCES task_lists(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_task_list_id ON tasks(task_list_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
CREATE POLICY "Users can view their own tasks" ON tasks
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
CREATE POLICY "Users can insert their own tasks" ON tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
CREATE POLICY "Users can update their own tasks" ON tasks
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;
CREATE POLICY "Users can delete their own tasks" ON tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to ensure task belongs to user's task list
CREATE OR REPLACE FUNCTION check_task_list_ownership()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the task_list_id belongs to the current user
    IF NOT EXISTS (
        SELECT 1 FROM task_lists 
        WHERE id = NEW.task_list_id 
        AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Task list does not belong to the current user';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check task list ownership
DROP TRIGGER IF EXISTS check_task_list_ownership_trigger ON tasks;
CREATE TRIGGER check_task_list_ownership_trigger
    BEFORE INSERT OR UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION check_task_list_ownership();

-- ==============================================
-- DIARY ENTRIES TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.diary_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'personal',
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for diary_entries
DROP POLICY IF EXISTS "Users can view their own diary entries" ON public.diary_entries;
CREATE POLICY "Users can view their own diary entries" 
ON public.diary_entries 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own diary entries" ON public.diary_entries;
CREATE POLICY "Users can insert their own diary entries" 
ON public.diary_entries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own diary entries" ON public.diary_entries;
CREATE POLICY "Users can update their own diary entries" 
ON public.diary_entries 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own diary entries" ON public.diary_entries;
CREATE POLICY "Users can delete their own diary entries" 
ON public.diary_entries 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_diary_entries_updated_at ON public.diary_entries;
CREATE TRIGGER update_diary_entries_updated_at
BEFORE UPDATE ON public.diary_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_diary_entries_user_id ON public.diary_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_diary_entries_entry_date ON public.diary_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_diary_entries_category ON public.diary_entries(category);
