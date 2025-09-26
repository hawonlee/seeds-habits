import { Habit, HabitTargetUnit } from "@/hooks/useHabits";

export type HabitFrequencyMode = "daily" | "weekly" | "custom";

export interface HabitFrequencyConfig {
  mode: HabitFrequencyMode;
  targetsPerPeriod: number;
  customDays: number[];
}

const defaultDailyDays = [0, 1, 2, 3, 4, 5, 6];

export const resolveHabitFrequency = (habit: Habit): HabitFrequencyConfig => {
  const customDays = habit.custom_days ?? [];

  if (habit.target_unit === "day") {
    return {
      mode: "daily",
      targetsPerPeriod: Math.max(1, habit.target_value),
      customDays: defaultDailyDays,
    };
  }

  if (customDays.length > 0) {
    return {
      mode: "custom",
      targetsPerPeriod: customDays.length,
      customDays,
    };
  }

  return {
    mode: "weekly",
    targetsPerPeriod: Math.max(1, habit.target_value),
    customDays: [],
  };
};

export const shouldHabitBeScheduledOnDate = (habit: Habit, date: Date): boolean => {
  const { mode, customDays } = resolveHabitFrequency(habit);
  const dayOfWeek = date.getDay();

  if (mode === "daily") {
    return true;
  }

  if (mode === "custom") {
    return customDays.includes(dayOfWeek);
  }

  // Weekly habits only show when explicitly scheduled
  return false;
};

