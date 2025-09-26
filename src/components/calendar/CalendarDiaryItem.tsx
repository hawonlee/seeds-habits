import { BookOpen } from "lucide-react";
import { getCategoryCSSVariables } from "@/lib/categories";
import React from "react";
import type { Database } from "@/integrations/supabase/types";

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
    <div
      className="group text-xs p-1 rounded flex items-center justify-center gap-1.5 truncate cursor-pointer hover:opacity-80 transition-opacity"
      title={`${entry.title} - Click to view`}
      onClick={handleClick}
      style={{
        backgroundColor: entry.category === 'none' ? 'transparent' : cssVars.bg,
        color: cssVars.primary
      }}
    >
      <BookOpen className="h-3.5 w-3.5 flex-shrink-0" />

      <span className="truncate flex-1">{entry.title}</span>
    </div>
  );
};

export default CalendarDiaryItem;
