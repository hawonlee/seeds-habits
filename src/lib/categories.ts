import { supabase } from '@/integrations/supabase/client';
import { COLOR_OPTIONS, findColorOptionByValue } from '@/lib/colorOptions';

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
    color: '#1E40AF',
    bgColor: 'bg-transparent',
    textColor: 'text-transparent'
  },
  {
    id: 'health',
    name: 'Health',
    color: '#166534',
    bgColor: 'bg-transparent',
    textColor: 'text-transparent'
  },
  {
    id: 'learning',
    name: 'Learning',
    color: '#6B21A8',
    bgColor: 'bg-transparent',
    textColor: 'text-transparent'
  },
  {
    id: 'work',
    name: 'Work',
    color: '#92400E',
    bgColor: 'bg-transparent',
    textColor: 'text-transparent'
  },
  {
    id: 'social',
    name: 'Social',
    color: '#991B1B',
    bgColor: 'bg-transparent',
    textColor: 'text-transparent'
  },
  {
    id: 'fitness',
    name: 'Fitness',
    color: '#155E75',
    bgColor: 'bg-transparent',
    textColor: 'text-transparent'
  },
  {
    id: 'mindfulness',
    name: 'Mindfulness',
    color: '#166534',
    bgColor: 'bg-transparent',
    textColor: 'text-transparent'
  },
  {
    id: 'creative',
    name: 'Creative',
    color: '#6B21A8',
    bgColor: 'bg-transparent',
    textColor: 'text-transparent'
  }
];

// Cache for categories
let categoriesCache: Category[] | null = null;

export const fetchCategories = async (userId: string): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, color, bg_color, text_color')
      .eq('user_id', userId)
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
      return FALLBACK_CATEGORIES;
    }

    const dbCategories: Category[] = (data || []).map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      color: cat.color,
      bgColor: cat.bg_color,
      textColor: cat.text_color
    }));

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

// Allow components to update the in-memory cache so UI reflects changes immediately
export const setCategoriesCache = (categories: Category[]): void => {
  categoriesCache = categories;
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

// UNIFIED COLOR SYSTEM - All components should use this function
// Returns the primary color from the database for consistent theming
export const getCategoryPrimaryColor = (categoryId: string): string => {
  const category = getCategoryById(categoryId);
  return category?.color || '#6B7280'; // Default gray
};

// New helpers for palette-based colors (inline hex)
export const getCategoryPalette = (categoryId: string): { bgHex: string; textHex: string } => {
  const primary = getCategoryPrimaryColor(categoryId);
  const palette = findColorOptionByValue(primary);
  if (!palette) {
    return { bgHex: '#F3F4F6', textHex: primary };
  }
  return { bgHex: palette.bgHex, textHex: palette.textHex };
};

// Helper function to determine if a color is light or dark
const isLightColor = (hex: string): boolean => {
  // Remove # if present
  const color = hex.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5;
};

// Get appropriate text color for a given background color
export const getCategoryTextColor = (categoryId: string): string => {
  const primaryColor = getCategoryPrimaryColor(categoryId);
  return isLightColor(primaryColor) ? '#000000' : '#ffffff';
};

// Get actual color values for inline styles - DEPRECATED, use getCategoryPrimaryColor
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
  
  // Prefer palette mapping based on the stored primary color
  const category = getCategoryById(categoryId);
  const palette = category ? findColorOptionByValue(category.color) : undefined;
  if (palette) return palette.bgHex;
  return '#e5e7eb';
};

// Resolve text color to a concrete color value
export const resolveCategoryTextColor = (categoryId: string): string => {
  const category = getCategoryById(categoryId);
  if (category?.bgColor === 'bg-transparent') {
    return '#000000';
  }
  const palette = category ? findColorOptionByValue(category.color) : undefined;
  return palette?.textHex || '#1f2937';
};

// Resolve background color using the same colors as textColorMap
export const resolveCategoryBgColorFromText = (categoryId: string): string => {
  const category = getCategoryById(categoryId);
  if (category?.bgColor === 'bg-transparent') {
    return 'transparent';
  }
  const palette = category ? findColorOptionByValue(category.color) : undefined;
  return palette?.textHex || '#1f2937';
};

// Helper function to format frequency display
export const formatFrequency = (targetFrequency: number): string => {
  if (targetFrequency === 7) {
    return '1x/day';
  } else if (targetFrequency >= 1 && targetFrequency <= 6) {
    return `${targetFrequency}x/week`;
  } else {
    return `${targetFrequency}x/week`;
  }
};

// For backward compatibility
export const DEFAULT_CATEGORIES = FALLBACK_CATEGORIES;
