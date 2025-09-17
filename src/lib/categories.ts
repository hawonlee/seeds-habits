import { supabase } from '@/integrations/supabase/client';

export interface Category {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  textColor: string;
}

// Fallback categories in case database is not available
export const FALLBACK_CATEGORIES: Category[] = [
  {
    id: 'personal',
    name: 'Personal',
    color: '#3B82F6', // Blue
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800'
  },
  {
    id: 'health',
    name: 'Health',
    color: '#10B981', // Green
    bgColor: 'bg-green-100',
    textColor: 'text-green-800'
  },
  {
    id: 'learning',
    name: 'Learning',
    color: '#8B5CF6', // Purple
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800'
  },
  {
    id: 'work',
    name: 'Work',
    color: '#F59E0B', // Amber
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-800'
  },
  {
    id: 'social',
    name: 'Social',
    color: '#EF4444', // Red
    bgColor: 'bg-red-100',
    textColor: 'text-red-800'
  },
  {
    id: 'fitness',
    name: 'Fitness',
    color: '#06B6D4', // Cyan
    bgColor: 'bg-cyan-100',
    textColor: 'text-cyan-800'
  },
  {
    id: 'mindfulness',
    name: 'Mindfulness',
    color: '#84CC16', // Lime
    bgColor: 'bg-lime-100',
    textColor: 'text-lime-800'
  },
  {
    id: 'creative',
    name: 'Creative',
    color: '#EC4899', // Pink
    bgColor: 'bg-pink-100',
    textColor: 'text-pink-800'
  }
];

// Cache for categories
let categoriesCache: Category[] | null = null;

export const fetchCategories = async (): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
      return FALLBACK_CATEGORIES;
    }

    const categories = data?.map(cat => ({
      id: cat.id,
      name: cat.name,
      color: cat.color,
      bgColor: cat.bg_color,
      textColor: cat.text_color
    })) || FALLBACK_CATEGORIES;

    categoriesCache = categories;
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return FALLBACK_CATEGORIES;
  }
};

export const getCategories = (): Category[] => {
  return categoriesCache || FALLBACK_CATEGORIES;
};

export const getCategoryById = (id: string): Category | undefined => {
  const categories = getCategories();
  return categories.find(category => category.id === id);
};

export const getCategoryColor = (categoryId: string): string => {
  const category = getCategoryById(categoryId);
  return category?.color || '#6B7280'; // Default gray
};

export const getCategoryClasses = (categoryId: string): { bgColor: string; textColor: string } => {
  const category = getCategoryById(categoryId);
  return {
    bgColor: category?.bgColor || 'bg-gray-100',
    textColor: category?.textColor || 'text-gray-800'
  };
};

// Resolve a Tailwind bg-* class to a concrete color from Tailwind config overrides
export const resolveCategoryBgColor = (categoryId: string): string => {
  const cls = getCategoryClasses(categoryId).bgColor; // e.g., 'bg-red-100'
  // Map known bg classes to HSLA defined in tailwind.config.ts overrides
  const map: Record<string, string> = {
    'bg-red-100': 'hsla(0, 34%, 91%, 1)',
    'bg-orange-100': 'hsla(40, 30%, 90%, 1)',
    'bg-amber-100': 'hsla(40, 30%, 90%, 1)',
    'bg-yellow-100': 'hsla(57, 67%, 86%, 1)',
    'bg-green-100': 'hsla(94, 24%, 87%, 1)',
    'bg-blue-100': 'hsla(180, 11%, 89%, 1)',
    'bg-purple-100': 'hsla(300, 12%, 89%, 1)',
    'bg-pink-100': 'hsla(300, 12%, 89%, 1)',
    'bg-lime-100': 'hsla(94, 24%, 87%, 1)',
    'bg-cyan-100': 'hsla(180, 11%, 89%, 1)'
  };
  return map[cls] || '#e5e7eb';
};

// For backward compatibility
export const DEFAULT_CATEGORIES = FALLBACK_CATEGORIES;
