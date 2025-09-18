-- Create categories table
CREATE TABLE public.categories (
  id TEXT NOT NULL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  bg_color TEXT NOT NULL,
  text_color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default categories
-- Optional: seed per-user defaults (example shown for a placeholder UUID)
-- INSERT INTO public.categories (id, user_id, name, color, bg_color, text_color) VALUES
-- ('personal', '00000000-0000-0000-0000-000000000000', 'Personal', '#3B82F6', 'bg-blue-100', 'text-blue-800');

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policies for categories (all users can read, but only authenticated users can modify)
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
CREATE POLICY "Users can view own categories" 
ON public.categories 
FOR SELECT 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can insert categories" ON public.categories;
CREATE POLICY "Users can insert own categories" 
ON public.categories 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can update categories" ON public.categories;
CREATE POLICY "Users can update own categories" 
ON public.categories 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can delete categories" ON public.categories;
CREATE POLICY "Users can delete own categories" 
ON public.categories 
FOR DELETE 
USING (user_id = auth.uid());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_categories_id ON public.categories(id);
CREATE INDEX idx_categories_user_id ON public.categories(user_id);
