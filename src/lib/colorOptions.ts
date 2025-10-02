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
  { name: 'Red',    value: '#5B3E3F', bgHex: '#E9DFDF', textHex: '#5B3E3F' },
  { name: 'Amber',  value: '#6C682D', bgHex: '#E7E5C0', textHex: '#6C682D' },
  { name: 'Green',  value: '#4B6039', bgHex: '#DDE6D5', textHex: '#4B6039' },
  // { name: 'Cyan',   value: '#155E75', bgHex: '#E6F3F6', textHex: '#155E75' },
  { name: 'Blue',   value: '#3C4C5D', bgHex: '#D9DEE3', textHex: '#3C4C5D' },
  { name: 'Purple', value: '#513B5E', bgHex: '#E2DBE6', textHex: '#513B5E' },
  { name: 'Neutral',   value: '#4D4D4D', bgHex: '#DEDEDE', textHex: '#4D4D4D' },

];

// Helper: find by the primary/text hex value
export const findColorOptionByValue = (value: string): ColorOption | undefined => {
  return COLOR_OPTIONS.find(color => color.value.toLowerCase() === value.toLowerCase());
};

// Helper: find by name
export const findColorOptionByName = (name: string): ColorOption | undefined => {
  return COLOR_OPTIONS.find(color => color.name.toLowerCase() === name.toLowerCase());
};
