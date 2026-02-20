export interface ColorOption {
  name: string;
  // value is the primary/text hex used for accents (checkbox/progress/border/text)
  value: string;

  // bgHex is the background hex used for badges and calendar item backgrounds
  bgHex: string;
  // textHex mirrors value for clarity
  textHex: string;
  
  // midHex is the intermediary hex used for calendar item backgrounds
  midHex: string;
}

// Centralized six-color palette. Change hexes here to update globally.
export const COLOR_OPTIONS: ColorOption[] = [
  { name: 'Red',    value: '#5B3E3F', bgHex: '#FFE1E2', textHex: '#5B3E3F', midHex: "#BE0006" },
  { name: 'Amber',  value: '#6C682D', bgHex: '#FFECD2', textHex: '#815F31', midHex: "#D77D00" },
  { name: 'Yellow', value: '#756B1F', bgHex: '#FFF9C4', textHex: '#756B1F', midHex: "#BCAA00" },
  { name: 'Green',  value: '#4B6039', bgHex: '#E8FEC6', textHex: '#4B6039', midHex: "#5FAB00" },
  { name: 'Blue',   value: '#3C4C5D', bgHex: '#D7ECFF', textHex: '#3C4C5D', midHex: "#268ED3" },
  { name: 'Purple', value: '#513B5E', bgHex: '#F5E9FF', textHex: '#513B5E', midHex: "#752E94" },
  { name: 'Neutral',value: '#4D4D4D', bgHex: '#E7E5E4', textHex: '#4D4D4D', midHex: "#767676" },

];

// Helper: find by the primary/text hex value
export const findColorOptionByValue = (value: string): ColorOption | undefined => {
  return COLOR_OPTIONS.find(color => color.value.toLowerCase() === value.toLowerCase());
};

// Helper: find by name
export const findColorOptionByName = (name: string): ColorOption | undefined => {
  return COLOR_OPTIONS.find(color => color.name.toLowerCase() === name.toLowerCase());
};
