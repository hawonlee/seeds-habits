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
    id: 'none',
    name: 'None',
    color: 'transparent',
    bgColor: 'bg-transparent',
    textColor: 'text-black'
  },
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

export const fetchCategories = async (userId: string): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
      return FALLBACK_CATEGORIES;
    }

    const dbCategories = data?.map(cat => ({
      id: cat.id,
      name: cat.name,
      color: cat.color,
      bgColor: cat.bg_color,
      textColor: cat.text_color
    })) || [];

    // Always include the "none" category at the beginning
    const noneCategory = FALLBACK_CATEGORIES.find(cat => cat.id === 'none')!;
    const categories = [noneCategory, ...dbCategories];

    categoriesCache = categories;
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return FALLBACK_CATEGORIES;
  }
};

export const getCategories = (): Category[] => {
  return categoriesCache || [];
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

// Get actual color values for inline styles
export const getCategoryColors = (categoryId: string): { backgroundColor: string; color: string } => {
  const category = getCategoryById(categoryId);
  
  // Handle transparent case
  if (category?.bgColor === 'bg-transparent') {
    return {
      backgroundColor: 'transparent',
      color: '#000000'
    };
  }
  
  // Map Tailwind classes to actual color values
  const bgColorMap: Record<string, string> = {
    'bg-red-custom': '#EFDFDF',
    'bg-orange-custom': '#EDE8DE',
    'bg-yellow-custom': '#F3F1C3',
    'bg-green-custom': '#DCE5D5',
    'bg-blue-custom': '#E0E6E6',
    'bg-purple-custom': '#E6DFE6',
    'bg-gray-100': '#f3f4f6'
  };
  
  const textColorMap: Record<string, string> = {
    'text-red-custom-text': '#604544',
    'text-orange-custom-text': '#645A46',
    'text-yellow-custom-text': '#676546',
    'text-green-custom-text': '#5D6755',
    'text-blue-custom-text': '#566262',
    'text-purple-custom-text': '#5F565F',
    'text-black': '#000000',
    'text-gray-800': '#1f2937'
  };
  
  return {
    backgroundColor: bgColorMap[category?.bgColor || 'bg-gray-100'] || '#f3f4f6',
    color: textColorMap[category?.textColor || 'text-gray-800'] || '#1f2937'
  };
};

// Resolve a Tailwind bg-* class to a concrete color from Tailwind config overrides
export const resolveCategoryBgColor = (categoryId: string): string => {
  const cls = getCategoryClasses(categoryId).bgColor; // e.g., 'bg-red-100'
  
  // Handle transparent case
  if (cls === 'bg-transparent') {
    return 'transparent';
  }
  
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

// Resolve text color to a concrete color value
export const resolveCategoryTextColor = (categoryId: string): string => {
  const category = getCategoryById(categoryId);
  
  // Handle transparent case - use black text
  if (category?.bgColor === 'bg-transparent') {
    return '#000000';
  }
  
  // Map text color classes to actual color values
  const textColorMap: Record<string, string> = {
    'text-black': '#000000',
    'text-red-800': '#991b1b',
    'text-orange-800': '#9a3412',
    'text-amber-800': '#92400e',
    'text-yellow-800': '#854d0e',
    'text-green-800': '#166534',
    'text-blue-800': '#1e40af',
    'text-purple-800': '#6b21a8',
    'text-pink-800': '#9d174d',
    'text-lime-800': '#365314',
    'text-cyan-800': '#155e75',
    'text-indigo-800': '#3730a3',
    'text-gray-800': '#1f2937'
  };
  
  return textColorMap[category?.textColor || 'text-gray-800'] || '#1f2937';
};

// Resolve background color using the same colors as textColorMap
export const resolveCategoryBgColorFromText = (categoryId: string): string => {
  const category = getCategoryById(categoryId);
  
  // Handle transparent case - use transparent background
  if (category?.bgColor === 'bg-transparent') {
    return 'transparent';
  }
  
  // Use the exact same color values as textColorMap
  const textColorMap: Record<string, string> = {
    'text-black': '#000000',
    'text-red-800': '#991b1b',
    'text-orange-800': '#9a3412',
    'text-amber-800': '#92400e',
    'text-yellow-800': '#854d0e',
    'text-green-800': '#166534',
    'text-blue-800': '#1e40af',
    'text-purple-800': '#6b21a8',
    'text-pink-800': '#9d174d',
    'text-lime-800': '#365314',
    'text-cyan-800': '#155e75',
    'text-indigo-800': '#3730a3',
    'text-gray-800': '#1f2937'
  };
  
  return textColorMap[category?.textColor || 'text-gray-800'] || '#1f2937';
};

// For backward compatibility
export const DEFAULT_CATEGORIES = FALLBACK_CATEGORIES;
