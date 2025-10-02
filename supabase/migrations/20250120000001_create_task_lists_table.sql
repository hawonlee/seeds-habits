-- Create task_lists table
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
CREATE POLICY "Users can view their own task lists" ON task_lists
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own task lists" ON task_lists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task lists" ON task_lists
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own task lists" ON task_lists
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_task_lists_updated_at
    BEFORE UPDATE ON task_lists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
