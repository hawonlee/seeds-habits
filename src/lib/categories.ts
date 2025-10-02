import { supabase } from '@/integrations/supabase/client';
import { COLOR_OPTIONS, findColorOptionByValue, findColorOptionByName } from '@/lib/colorOptions';
import type { HabitTargetUnit } from '@/hooks/useHabits';

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
    color: '#4D4D4D', // Neutral color from palette
    bgColor: 'bg-transparent',
    textColor: 'text-transparent'
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

// Cache change listeners
let cacheChangeListeners: (() => void)[] = [];

export const addCacheChangeListener = (listener: () => void) => {
  cacheChangeListeners.push(listener);
  return () => {
    cacheChangeListeners = cacheChangeListeners.filter(l => l !== listener);
  };
};

const notifyCacheChange = () => {
  cacheChangeListeners.forEach(listener => listener());
};

// Force refresh all components using categories
export const refreshCategories = async (userId?: string): Promise<Category[]> => {
  if (userId) {
    const categories = await fetchCategories(userId);
    setCategoriesCache(categories);
    return categories;
  }
  // If no userId provided, just notify listeners of current cache
  notifyCacheChange();
  return getCategories();
};

export const fetchCategories = async (userId: string): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, color, bg_color, text_color')
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
  notifyCacheChange();
};

export const getCategoryById = (id: string): Category | undefined => {
  const categories = getCategories();
  return categories.find(category => category.id === id);
};

export const getCategoryColor = (categoryId: string): string => {
  const category = getCategoryById(categoryId);
  return category?.color || '#737373'; // Default neutral
};

export const getCategoryClasses = (categoryId: string): { bgColor: string; textColor: string } => {
  const category = getCategoryById(categoryId);
  return {
    bgColor: category?.bgColor || 'bg-neutral-100',
    textColor: category?.textColor || 'text-neutral-800'
  };
};

// UNIFIED COLOR SYSTEM - All components should use this function
// Returns the primary color from the database for consistent theming
export const getCategoryPrimaryColor = (categoryId: string): string => {
  const category = getCategoryById(categoryId);
  return category?.color || '#737373'; // Default neutral
};

// New helpers for palette-based colors (inline hex)
export const getCategoryPalette = (categoryId: string): { bgHex: string; textHex: string } => {
  // Special handling for "none" category - use neutral colors
  if (categoryId === 'none') {
    const neutralPalette = findColorOptionByName('Neutral');
    return { 
      bgHex: neutralPalette?.bgHex || '#C3C3C3', 
      textHex: neutralPalette?.textHex || '#4D4D4D' 
    };
  }
  
  const primary = getCategoryPrimaryColor(categoryId);
  const palette = findColorOptionByValue(primary);
  if (!palette) {
    return { bgHex: '#FAFAFA', textHex: primary };
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
    'bg-neutral-100': '#f3f4f6'
  };
  
  const textColorMap: Record<string, string> = {
    'text-red-custom-text': '#604544',
    'text-orange-custom-text': '#645A46',
    'text-yellow-custom-text': '#676546',
    'text-green-custom-text': '#5D6755',
    'text-blue-custom-text': '#566262',
    'text-purple-custom-text': '#5F565F',
    'text-black': '#000000',
    'text-neutral-800': '#1f2937'
  };
  
  return {
    backgroundColor: bgColorMap[category?.bgColor || 'bg-neutral-100'] || '#f3f4f6',
    color: textColorMap[category?.textColor || 'text-neutral-800'] || '#1f2937'
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
interface HabitFrequency {
  target_value: number;
  target_unit: HabitTargetUnit;
  custom_days?: number[] | null;
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const formatFrequency = ({ target_value, target_unit, custom_days }: HabitFrequency): string => {
  if (target_unit === 'day') {
    return `${target_value}/day`;
  }

  const base = `${target_value}/week`;

  if (target_unit === 'week' && custom_days && custom_days.length) {
    const sortedDays = [...custom_days].sort((a, b) => a - b);
    const dayLabels = sortedDays.map((d) => dayNames[d]);
    return `${base} (${dayLabels.join(', ')})`;
  }

  return base;
};

// Map category colors to CSS variables
export const getCategoryCSSVariables = (categoryId: string): { primary: string; intermediary: string; bg: string } => {
  const category = getCategoryById(categoryId);
  if (!category) {
    return { primary: 'hsl(var(--category-6-primary))', intermediary: 'hsl(var(--category-6-intermediary))', bg: 'hsl(var(--category-6-bg))' };
  }
  
  const primaryColor = category.color;
  const palette = findColorOptionByValue(primaryColor);
  
  if (!palette) {
    return { primary: 'hsl(var(--category-6-primary))', intermediary: 'hsl(var(--category-6-intermediary))', bg: 'hsl(var(--category-6-bg))' };
  }
  
  // Map palette colors to CSS variables based on order in COLOR_OPTIONS
  const colorIndex = COLOR_OPTIONS.findIndex(option => option.value === primaryColor);
  
  switch (colorIndex) {
    case 0: // Red
      return { primary: 'hsl(var(--category-1-primary))', intermediary: 'hsl(var(--category-1-intermediary))', bg: 'hsl(var(--category-1-bg))' };
    case 1: // Amber
      return { primary: 'hsl(var(--category-2-primary))', intermediary: 'hsl(var(--category-2-intermediary))', bg: 'hsl(var(--category-2-bg))' };
    case 2: // Green
      return { primary: 'hsl(var(--category-3-primary))', intermediary: 'hsl(var(--category-3-intermediary))', bg: 'hsl(var(--category-3-bg))' };
    case 3: // Blue
      return { primary: 'hsl(var(--category-4-primary))', intermediary: 'hsl(var(--category-4-intermediary))', bg: 'hsl(var(--category-4-bg))' };
    case 4: // Purple
      return { primary: 'hsl(var(--category-5-primary))', intermediary: 'hsl(var(--category-5-intermediary))', bg: 'hsl(var(--category-5-bg))' };
    case 5: // Neutral
      return { primary: 'hsl(var(--category-6-primary))', intermediary: 'hsl(var(--category-6-intermediary))', bg: 'hsl(var(--category-6-bg))' };
    default:
      return { primary: 'hsl(var(--category-6-primary))', intermediary: 'hsl(var(--category-6-intermediary))', bg: 'hsl(var(--category-6-bg))' };
  }
};

// Helper function to get intermediary color CSS variable from a hex color value
export const getIntermediaryColorFromHex = (hexColor: string): string => {
  const palette = findColorOptionByValue(hexColor);
  if (!palette) {
    return 'hsl(var(--category-6-intermediary))'; // Default to neutral
  }
  
  // Map palette colors to CSS variables based on order in COLOR_OPTIONS
  const colorIndex = COLOR_OPTIONS.findIndex(option => option.value === hexColor);
  
  switch (colorIndex) {
    case 0: // Red
      return 'hsl(var(--category-1-intermediary))';
    case 1: // Amber
      return 'hsl(var(--category-2-intermediary))';
    case 2: // Green
      return 'hsl(var(--category-3-intermediary))';
    case 3: // Blue
      return 'hsl(var(--category-4-intermediary))';
    case 4: // Purple
      return 'hsl(var(--category-5-intermediary))';
    case 5: // Neutral
      return 'hsl(var(--category-6-intermediary))';
    default:
      return 'hsl(var(--category-6-intermediary))';
  }
};

// Get category CSS class names for Tailwind
export const getCategoryCSSClasses = (categoryId: string): { primary: string; intermediary: string; bg: string } => {
  const category = getCategoryById(categoryId);
  if (!category) {
    return { primary: 'category-6-primary', intermediary: 'category-6-intermediary', bg: 'category-6-bg' };
  }
  
  const primaryColor = category.color;
  const palette = findColorOptionByValue(primaryColor);
  
  if (!palette) {
    return { primary: 'category-6-primary', intermediary: 'category-6-intermediary', bg: 'category-6-bg' };
  }
  
  // Map palette colors to CSS class names based on order in COLOR_OPTIONS
  const colorIndex = COLOR_OPTIONS.findIndex(option => option.value === primaryColor);
  
  switch (colorIndex) {
    case 0: // Red
      return { primary: 'category-1-primary', intermediary: 'category-1-intermediary', bg: 'category-1-bg' };
    case 1: // Amber
      return { primary: 'category-2-primary', intermediary: 'category-2-intermediary', bg: 'category-2-bg' };
    case 2: // Green
      return { primary: 'category-3-primary', intermediary: 'category-3-intermediary', bg: 'category-3-bg' };
    case 3: // Blue
      return { primary: 'category-4-primary', intermediary: 'category-4-intermediary', bg: 'category-4-bg' };
    case 4: // Purple
      return { primary: 'category-5-primary', intermediary: 'category-5-intermediary', bg: 'category-5-bg' };
    case 5: // Neutral
      return { primary: 'category-6-primary', intermediary: 'category-6-intermediary', bg: 'category-6-bg' };
    default:
      return { primary: 'category-6-primary', intermediary: 'category-6-intermediary', bg: 'category-6-bg' };
  }
};
