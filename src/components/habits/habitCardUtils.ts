import { Habit } from "@/hooks/useHabits";

interface HabitCardDates {
  todayDate: Date;
  lastCompletedKey: string | null;
  isCheckedInToday: boolean;
}

interface WeekUtilsOptions {
  habit: Habit;
  customIsCompleted?: (habitId: string, date: Date) => boolean;
  isHabitCompletedOnDate: (habitId: string, date: Date) => boolean;
  getCompletionCountForDate?: (habitId: string, date: Date) => number;
  lastCompletedKey: string | null;
}

interface CompletionHandlerOptions {
  habit: Habit;
  onCheckIn: (id: string) => void;
  onUndoCheckIn: (id: string) => void;
  onCheckInForDate?: (id: string, date: Date) => void;
  onUndoCheckInForDate?: (id: string, date: Date) => void;
  toggleCompletion: (habitId: string, date: Date) => Promise<boolean> | void;
  isHabitCompletedOnDate: (habitId: string, date: Date) => boolean;
  getCompletionCountForDate?: (habitId: string, date: Date) => number;
  customIsCompleted?: (habitId: string, date: Date) => boolean;
  lastCompletedKey: string | null;
}

export const getHabitDates = (habit: Habit): HabitCardDates => {
  const todayDate = new Date();
  const todayKey = toDateKey(todayDate);
  const lastCompletedKey = habit.last_completed ? toDateKey(new Date(habit.last_completed)) : null;

  return {
    todayDate,
    lastCompletedKey,
    isCheckedInToday: lastCompletedKey === todayKey
  };
};

export const createWeekUtils = ({ habit, customIsCompleted, isHabitCompletedOnDate, getCompletionCountForDate, lastCompletedKey }: WeekUtilsOptions) => {
  const isDoneOnDate = (date: Date) => {
    if (customIsCompleted) {
      return customIsCompleted(habit.id, date);
    }
    return isHabitCompletedOnDate(habit.id, date);
  };

  const getCompletionCountOnDate = (date: Date) => {
    if (getCompletionCountForDate) {
      return getCompletionCountForDate(habit.id, date);
    }
    return isDoneOnDate(date) ? 1 : 0;
  };

  const getWeekStart = (date: Date) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    start.setDate(date.getDate() - date.getDay());
    return start;
  };

  const getWeekDaysFromStart = (start?: Date) => {
    if (!start) return [];
    const normalized = getWeekStart(start);
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(normalized);
      day.setDate(normalized.getDate() + i);
      return day;
    });
  };

  const sharedCompletedCounts = (days: Date[]) =>
    days.reduce((count, d) => count + getCompletionCountOnDate(d), 0);

  return {
    isDoneOnDate,
    getCompletionCountOnDate,
    getWeekDaysFromStart,
    sharedCompletedCounts
  };
};

export const createProgressUtils = (
  habit: Habit,
  getWeekDaysFromStart: (start?: Date) => Date[],
  sharedCompletedCounts: (days: Date[]) => number
) => {
  const getDailyTarget = () => Math.max(1, habit.target_value || 1);
  const getWeeklyTarget = () => Math.max(1, habit.target_value || 1);
  const getCustomTarget = () => Math.max(1, habit.custom_days?.length || 1);

  const getTargetForMode = () => {
    if (habit.target_unit === "day") return getDailyTarget();
    if (habit.custom_days && habit.custom_days.length) return getCustomTarget();
    return getWeeklyTarget();
  };

  const getWeeklyProgressPct = (completed: number) => {
    const denominator = getTargetForMode();
    return Math.min(100, denominator ? (completed / denominator) * 100 : 0);
  };

  const getDaySummary = (date: Date) => {
    const dayCompleted = sharedCompletedCounts([date]);
    const dailyTarget = getDailyTarget();
    
    return {
      completed: dayCompleted,
      target: dailyTarget,
      progressPct: dailyTarget > 0 ? (dayCompleted / dailyTarget) * 100 : 0
    };
  };

  const getWeekSummary = (start?: Date) => {
    const days = getWeekDaysFromStart(start);
    const completed = sharedCompletedCounts(days);
    
    // For daily habits, weekly summary should still reflect the weekly goal (for calendar/table views)
    if (habit.target_unit === "day") {
      const dailyTarget = getDailyTarget();
      const weeklyTarget = dailyTarget * 7;
      const actualCompleted = Math.min(completed, weeklyTarget);
      return {
        days,
        completed: actualCompleted,
        target: weeklyTarget,
        progressPct: weeklyTarget > 0 ? (actualCompleted / weeklyTarget) * 100 : 0
      };
    }
    
    const target = getTargetForMode();
    return {
      days,
      completed,
      target,
      progressPct: getWeeklyProgressPct(completed)
    };
  };

  return {
    targetPerWeek: getTargetForMode(),
    getWeeklyProgressPct,
    getWeekSummary,
    getDaySummary
  };
};

export const createCompletionHandlers = ({
  habit,
  onCheckIn,
  onUndoCheckIn,
  onCheckInForDate,
  onUndoCheckInForDate,
  toggleCompletion,
  isHabitCompletedOnDate,
  getCompletionCountForDate,
  customIsCompleted,
  lastCompletedKey
}: CompletionHandlerOptions) => {
  const weekUtils = createWeekUtils({ habit, customIsCompleted, isHabitCompletedOnDate, getCompletionCountForDate, lastCompletedKey });

  const setDateCompletion = async (date: Date, next: boolean) => {
    const currentlyDone = weekUtils.isDoneOnDate(date);
    if (next === currentlyDone) return;

    const shouldToggleLocally = !onCheckInForDate && !onUndoCheckInForDate;

    if (shouldToggleLocally) {
      await toggleCompletion(habit.id, date);
    }

    const isToday = toDateKey(date) === toDateKey(new Date());

    if (next) {
      if (onCheckInForDate) {
        onCheckInForDate(habit.id, date);
      } else if (isToday && onCheckIn) {
        onCheckIn(habit.id);
      }
    } else {
      if (onUndoCheckInForDate) {
        onUndoCheckInForDate(habit.id, date);
      } else if (isToday && onUndoCheckIn) {
        onUndoCheckIn(habit.id);
      }
    }
  };

  const toggleDateCompletion = async (date: Date) => {
    await setDateCompletion(date, !weekUtils.isDoneOnDate(date));
  };

  const handleToggleToday = (next: boolean | 'indeterminate') => {
    if (next === true && !weekUtils.isDoneOnDate(new Date())) {
      onCheckIn(habit.id);
    } else if (next === false && weekUtils.isDoneOnDate(new Date())) {
      onUndoCheckIn(habit.id);
    }
  };

  return {
    ...weekUtils,
    setDateCompletion,
    toggleDateCompletion,
    handleToggleToday
  };
};

const toDateKey = (date: Date) => date.toISOString().split('T')[0];

