import { BookOpen } from "lucide-react";
import { getCategoryCSSVariables } from "@/lib/categories";
import React from "react";
import type { Database } from "@/integrations/supabase/types";
import { CalendarItem } from "./CalendarItem";

type DiaryEntry = Database['public']['Tables']['diary_entries']['Row'];

interface CalendarDiaryItemProps {
  entry: DiaryEntry;
  date: Date;
  onClick?: (entry: DiaryEntry) => void;
}

export const CalendarDiaryItem: React.FC<CalendarDiaryItemProps> = ({
  entry,
  date,
  onClick
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick(entry);
    }
  };

  const cssVars = getCategoryCSSVariables(entry.category);

  return (
    <CalendarItem
      variant="clickable"
      title={`${entry.title} - Click to view`}
      onClick={handleClick}
      style={{
        backgroundColor: entry.category === 'none' ? 'transparent' : cssVars.bg,
        color: cssVars.primary
      }}
    >
      <BookOpen className="h-3.5 w-3.5 flex-shrink-0" />
      <span className="truncate flex-1">{entry.title}</span>
    </CalendarItem>
  );
};

export default CalendarDiaryItem;
