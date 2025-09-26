import { Badge } from "@/components/ui/badge";
import { CardTitle } from "@/components/ui/card";
import { MoveUpRight, Repeat } from "lucide-react";
import { Habit } from "@/hooks/useHabits";
import { getCategoryById, formatFrequency } from "@/lib/categories";

interface HabitMetaProps {
  habit: Habit;
  useCardTitle?: boolean;
  size?: "sm" | "md";
}

export const HabitMeta: React.FC<HabitMetaProps> = ({ habit, useCardTitle = false, size = "sm" }) => {
  const categoryName = getCategoryById(habit.category)?.name || habit.category;
  const iconSize = size === "md" ? "h-4 w-4" : "h-3 w-3";
  const titleTextSize = size === "md" ? "text-xs" : "text-xs";
  const statsTextSize = size === "md" ? "text-sm" : "text-xs";

  const TitleWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    useCardTitle ? (
      <CardTitle className="flex items-center gap-2 text-xs">{children}</CardTitle>
    ) : (
      <div className={`flex items-center gap-2 mb-1 ${titleTextSize}`}>{children}</div>
    );

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <TitleWrapper>
            <h3 className="font-medium truncate">{habit.title}</h3>
            {habit.category !== 'none' && (
              <Badge categoryId={habit.category} className={useCardTitle ? "border-0 px-2 py-0.5" : ""}>
                {categoryName}
              </Badge>
            )}
          </TitleWrapper>
          <div className={`flex items-center gap-4 ${statsTextSize} text-muted-foreground ${useCardTitle ? 'mt-2' : ''}`}>
            <span className="flex items-center gap-1">
              <MoveUpRight className={iconSize} />
              {habit.total_completions} total
            </span>
            <span className="flex items-center gap-1">
              <Repeat className={iconSize} />
              {formatFrequency({
                target_value: habit.target_value,
                target_unit: habit.target_unit,
                custom_days: habit.custom_days ?? undefined
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HabitMeta;


