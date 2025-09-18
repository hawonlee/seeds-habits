-- Add user scoping to categories
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Remove overly-permissive policies if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories' AND policyname = 'Anyone can view categories') THEN
    DROP POLICY "Anyone can view categories" ON public.categories;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories' AND policyname = 'Authenticated users can insert categories') THEN
    DROP POLICY "Authenticated users can insert categories" ON public.categories;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories' AND policyname = 'Authenticated users can update categories') THEN
    DROP POLICY "Authenticated users can update categories" ON public.categories;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories' AND policyname = 'Authenticated users can delete categories') THEN
    DROP POLICY "Authenticated users can delete categories" ON public.categories;
  END IF;
END$$;

-- Ensure RLS is enabled
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- New strict per-user policies
CREATE POLICY "Users can view their own categories"
ON public.categories
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own categories"
ON public.categories
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own categories"
ON public.categories
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own categories"
ON public.categories
FOR DELETE
USING (user_id = auth.uid());

-- Optional: index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);


