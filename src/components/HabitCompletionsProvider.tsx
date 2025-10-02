import React, { createContext, useContext } from "react";
import { useHabitCompletions } from "@/hooks/useHabitCompletions";

const HabitCompletionsContext = createContext<ReturnType<typeof useHabitCompletions> | null>(null);

export const HabitCompletionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const completionsState = useHabitCompletions();

  return (
    <HabitCompletionsContext.Provider value={completionsState}>
      {children}
    </HabitCompletionsContext.Provider>
  );
};

export const useHabitCompletionsContext = () => {
  const ctx = useContext(HabitCompletionsContext);
  if (!ctx) {
    throw new Error("useHabitCompletionsContext must be used inside a HabitCompletionsProvider");
  }
  return ctx;
};


