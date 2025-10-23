-- Remember tri-checkbox undo state per habit per date
CREATE TABLE IF NOT EXISTS public.habit_undo_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state_date DATE NOT NULL,
  is_undo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (habit_id, state_date)
);

-- Enable RLS
ALTER TABLE public.habit_undo_states ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'habit_undo_states' AND policyname = 'Users can view their own undo states'
  ) THEN
    CREATE POLICY "Users can view their own undo states"
    ON public.habit_undo_states
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'habit_undo_states' AND policyname = 'Users can insert their own undo states'
  ) THEN
    CREATE POLICY "Users can insert their own undo states"
    ON public.habit_undo_states
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'habit_undo_states' AND policyname = 'Users can update their own undo states'
  ) THEN
    CREATE POLICY "Users can update their own undo states"
    ON public.habit_undo_states
    FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'habit_undo_states' AND policyname = 'Users can delete their own undo states'
  ) THEN
    CREATE POLICY "Users can delete their own undo states"
    ON public.habit_undo_states
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Trigger for updated_at maintenance
DROP TRIGGER IF EXISTS update_habit_undo_states_updated_at ON public.habit_undo_states;
CREATE TRIGGER update_habit_undo_states_updated_at
BEFORE UPDATE ON public.habit_undo_states
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_habit_undo_states_user_id ON public.habit_undo_states(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_undo_states_habit_date ON public.habit_undo_states(habit_id, state_date);


