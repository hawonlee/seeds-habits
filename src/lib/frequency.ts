export type FrequencyPeriod = 'daily' | 'weekly' | 'monthly' | 'custom';

export const createEmptyCustomDays = (): boolean[] => Array(7).fill(false);

export const calculateWeeklyTarget = (value: number, period: FrequencyPeriod): number => {
  const safeValue = Math.max(1, Math.floor(value));

  switch (period) {
    case 'daily':
      return safeValue * 7;
    case 'weekly':
      return safeValue;
    case 'monthly':
      return Math.max(1, Math.round(safeValue / 4));
    case 'custom':
    default:
      return safeValue;
  }
};

export const deriveStandardFrequencyFromWeekly = (
  weeklyTarget: number
): { value: number; period: FrequencyPeriod } => {
  const safeWeekly = Math.max(1, Math.floor(weeklyTarget));

  if (safeWeekly % 7 === 0) {
    return { value: safeWeekly / 7, period: 'daily' };
  }

  if (safeWeekly > 7) {
    return { value: Math.ceil(safeWeekly / 7), period: 'daily' };
  }

  return { value: safeWeekly, period: 'weekly' };
};

