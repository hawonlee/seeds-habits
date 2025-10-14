# Database Setup Instructions

## Supabase Database Migration

To connect the habit tracking operations with Supabase, you need to run the database migration to create the `habits` table.

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/qqnidhikbczcudesoisc
2. Navigate to the **SQL Editor** section
3. Copy and paste the following SQL script:

```sql
-- Create habits table
CREATE TABLE public.habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT,
  category TEXT NOT NULL DEFAULT 'personal',
  target_frequency INTEGER NOT NULL DEFAULT 1,
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
CREATE POLICY "Users can view their own habits" 
ON public.habits 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habits" 
ON public.habits 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits" 
ON public.habits 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits" 
ON public.habits 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_habits_updated_at
BEFORE UPDATE ON public.habits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_habits_user_id ON public.habits(user_id);
CREATE INDEX idx_habits_phase ON public.habits(phase);
```

4. Click **Run** to execute the migration

### Option 2: Using Supabase CLI

If you have Supabase CLI installed and are logged in:

1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link your project: `supabase link --project-ref qqnidhikbczcudesoisc`
4. Push migrations: `supabase db push`

## What This Migration Does

The migration creates a `habits` table with the following features:

- **User-specific data**: Each habit is linked to a user via `user_id`
- **Habit properties**: title, notes, category, target frequency, leniency threshold
- **Progress tracking**: streak, total completions, last completed date
- **Phase system**: future → current → adopted progression
- **Points system**: points awarded for adopted habits
- **Row Level Security**: Users can only access their own habits
- **Automatic timestamps**: created_at and updated_at fields
- **Performance indexes**: Optimized queries by user_id and phase

## After Running the Migration

Once the migration is complete, the application will:

1. **Load habits from database**: Instead of using sample data, habits will be fetched from Supabase
2. **Persist changes**: All habit operations (create, update, delete, check-in) will be saved to the database
3. **User isolation**: Each user will only see their own habits
4. **Real-time updates**: Changes will be reflected immediately across the application

## Testing the Integration

1. Start the development server: `npm run dev`
2. Sign in to the application
3. Try creating a new habit - it should be saved to the database
4. Check the Supabase dashboard to see the habit in the `habits` table
5. Test other operations like editing, deleting, and checking in habits
