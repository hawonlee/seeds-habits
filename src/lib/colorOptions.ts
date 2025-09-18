export interface ColorOption {
  name: string;
  value: string;
  bg: string;
  text: string;
}

export const COLOR_OPTIONS: ColorOption[] = [
  { name: 'Blue', value: '#3B82F6', bg: 'bg-blue-100', text: 'text-blue-800' },
  { name: 'Green', value: '#10B981', bg: 'bg-green-100', text: 'text-green-800' },
  { name: 'Purple', value: '#8B5CF6', bg: 'bg-purple-100', text: 'text-purple-800' },
  { name: 'Amber', value: '#F59E0B', bg: 'bg-amber-100', text: 'text-amber-800' },
  { name: 'Red', value: '#EF4444', bg: 'bg-red-100', text: 'text-red-800' },
  { name: 'Cyan', value: '#06B6D4', bg: 'bg-cyan-100', text: 'text-cyan-800' },
  { name: 'Lime', value: '#84CC16', bg: 'bg-lime-100', text: 'text-lime-800' },
  { name: 'Pink', value: '#EC4899', bg: 'bg-pink-100', text: 'text-pink-800' },
  { name: 'Indigo', value: '#6366F1', bg: 'bg-indigo-100', text: 'text-indigo-800' },
  { name: 'Orange', value: '#F97316', bg: 'bg-orange-100', text: 'text-orange-800' }
];

// Helper function to find a color option by hex value
export const findColorOptionByValue = (value: string): ColorOption | undefined => {
  return COLOR_OPTIONS.find(color => color.value === value);
};

// Helper function to find a color option by name
export const findColorOptionByName = (name: string): ColorOption | undefined => {
  return COLOR_OPTIONS.find(color => color.name.toLowerCase() === name.toLowerCase());
};
