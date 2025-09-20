export interface ColorOption {
  name: string;
  // value is the primary/text hex used for accents (checkbox/progress/border/text)
  value: string;
  // bgHex is the background hex used for badges and calendar item backgrounds
  bgHex: string;
  // textHex mirrors value for clarity
  textHex: string;
}

// Centralized six-color palette. Change hexes here to update globally.
export const COLOR_OPTIONS: ColorOption[] = [
  { name: 'Neutral',   value: '#4D4D4D', bgHex: '#DBDBDB', textHex: '#4D4D4D' },
  { name: 'Blue',   value: '#1E40AF', bgHex: '#E6F0FF', textHex: '#1E40AF' },
  { name: 'Green',  value: '#166534', bgHex: '#E8F3E6', textHex: '#166534' },
  { name: 'Purple', value: '#6B21A8', bgHex: '#EFE6F4', textHex: '#6B21A8' },
  { name: 'Amber',  value: '#92400E', bgHex: '#F7EFE2', textHex: '#92400E' },
  { name: 'Red',    value: '#991B1B', bgHex: '#F6EAEA', textHex: '#991B1B' },
  { name: 'Cyan',   value: '#155E75', bgHex: '#E6F3F6', textHex: '#155E75' },
];

// Helper: find by the primary/text hex value
export const findColorOptionByValue = (value: string): ColorOption | undefined => {
  return COLOR_OPTIONS.find(color => color.value.toLowerCase() === value.toLowerCase());
};

// Helper: find by name
export const findColorOptionByName = (name: string): ColorOption | undefined => {
  return COLOR_OPTIONS.find(color => color.name.toLowerCase() === name.toLowerCase());
};
