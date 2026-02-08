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
  { name: 'Red',    value: '#5B3E3F', bgHex: '#FFE1E2', textHex: '#5B3E3F' },
  { name: 'Amber',  value: '#6C682D', bgHex: '#FFECD2', textHex: '#462800' },
  { name: 'Yellow', value: '#756B1F', bgHex: '#FFF9C4', textHex: '#756B1F' },
  { name: 'Green',  value: '#4B6039', bgHex: '#E8FEC6', textHex: '#4B6039' },
  { name: 'Blue',   value: '#3C4C5D', bgHex: '#D7ECFF', textHex: '#3C4C5D' },
  { name: 'Purple', value: '#513B5E', bgHex: '#F5E9FF', textHex: '#513B5E' },
  { name: 'Neutral',   value: '#4D4D4D', bgHex: '#E7E5E4', textHex: '#4D4D4D' },

];

// Helper: find by the primary/text hex value
export const findColorOptionByValue = (value: string): ColorOption | undefined => {
  return COLOR_OPTIONS.find(color => color.value.toLowerCase() === value.toLowerCase());
};

// Helper: find by name
export const findColorOptionByName = (name: string): ColorOption | undefined => {
  return COLOR_OPTIONS.find(color => color.name.toLowerCase() === name.toLowerCase());
};
