-- Create categories table
CREATE TABLE public.categories (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  bg_color TEXT NOT NULL,
  text_color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default categories
INSERT INTO public.categories (id, name, color, bg_color, text_color) VALUES
('personal', 'Personal', '#3B82F6', 'bg-blue-100', 'text-blue-800'),
('health', 'Health', '#10B981', 'bg-green-100', 'text-green-800'),
('learning', 'Learning', '#8B5CF6', 'bg-purple-100', 'text-purple-800'),
('work', 'Work', '#F59E0B', 'bg-amber-100', 'text-amber-800'),
('social', 'Social', '#EF4444', 'bg-red-100', 'text-red-800'),
('fitness', 'Fitness', '#06B6D4', 'bg-cyan-100', 'text-cyan-800'),
('mindfulness', 'Mindfulness', '#84CC16', 'bg-lime-100', 'text-lime-800'),
('creative', 'Creative', '#EC4899', 'bg-pink-100', 'text-pink-800');

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policies for categories (all users can read, but only authenticated users can modify)
CREATE POLICY "Anyone can view categories" 
ON public.categories 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert categories" 
ON public.categories 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update categories" 
ON public.categories 
FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete categories" 
ON public.categories 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_categories_id ON public.categories(id);
