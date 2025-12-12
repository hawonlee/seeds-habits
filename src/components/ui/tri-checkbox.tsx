import * as React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCategoryCSSVariables } from "@/lib/categories";

type TriState = "empty" | "checked" | "undo" | "excused";

interface TriCheckboxProps {
  value?: TriState;
  defaultValue?: TriState;
  onChange?: (next: TriState) => void;
  // Visual sizing for root and icon
  size?: "sm" | "md" | "lg";
  // Color controls matching the existing Checkbox API
  customColor?: string;
  categoryId?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  // Day display
  dayNumber?: number;
  isToday?: boolean;
  // Background styling
  showBackground?: boolean;
  isCompleted?: boolean;
  // Optional persistence of undo state
  habitId?: string;
  stateDate?: string; // YYYY-MM-DD
}

const SIZE_MAP: Record<NonNullable<TriCheckboxProps["size"]>, { box: number; icon: number }> = {
  sm: { box: 24, icon: 10 },
  md: { box: 18, icon: 12 },
  lg: { box: 40, icon: 16 },
};

export const TriCheckbox = React.forwardRef<HTMLButtonElement, TriCheckboxProps>(
  (
    {
      value,
      defaultValue = "empty",
      onChange,
      size = "sm",
      customColor,
      categoryId,
      className,
      disabled,
      style,
      dayNumber,
      isToday,
      showBackground = false,
      isCompleted = false,
      habitId,
      stateDate,
      ...rest
    },
    ref
  ) => {
    const isControlled = value !== undefined;
    const [internal, setInternal] = React.useState<TriState>(defaultValue);
    const current: TriState = isControlled ? (value as TriState) : internal;

    // Load persisted undo state if identifiers are provided and component is uncontrolled
    React.useEffect(() => {
      let cancelled = false;
      async function loadUndo() {
        if (!habitId || !stateDate || isControlled) return;
        try {
          const { supabase } = await import("@/integrations/supabase/client");
          const res: any = await (supabase
            .from('habit_undo_states' as any)
            .select('is_undo')
            .eq('habit_id', habitId)
            .eq('state_date', stateDate)
            .maybeSingle() as any);
          const undoRow = res?.data as any;
          if (!cancelled && undoRow?.is_undo) {
            setInternal('undo');
          } else if (!cancelled) {
            // No undo state found, initialize based on completion status
            setInternal(isCompleted ? 'checked' : 'empty');
          }
        } catch {
          // ignore
        }
      }
      loadUndo();
      return () => { cancelled = true; };
    }, [habitId, stateDate, isControlled, isCompleted]);

    const cycle = React.useCallback(() => {
      let next: TriState;
      if (current === "empty") {
        next = "checked";
      } else if (current === "checked") {
        next = "undo";
      } else if (current === "undo") {
        // current === "undo"
        next = "excused";
      } else if (current === "excused") {
        next = "empty";
      }
      
      if (!isControlled) setInternal(next);
      onChange?.(next);

      // Persist undo state when identifiers are provided
      if (habitId && stateDate) {
        (async () => {
          try {
            const { supabase } = await import("@/integrations/supabase/client");
            if (next === 'undo') {
              // Insert or update undo flag; user_id will be injected by RLS check via auth if provided
              // We include user_id by selecting auth uid via RPC is not available; rely on policy WITH CHECK and explicit user_id
              // Simpler approach: fetch current user id from auth
              const { data: userData } = await supabase.auth.getUser();
              const userId = userData.user?.id;
              if (!userId) return;
              await supabase
                .from('habit_undo_states' as any)
                .upsert({ habit_id: habitId, state_date: stateDate, user_id: userId, is_undo: true })
                .select('id')
                .maybeSingle();
            } else {
              await supabase
                .from('habit_undo_states' as any)
                .delete()
                .eq('habit_id', habitId)
                .eq('state_date', stateDate);
            }
          } catch {
            // ignore
          }
        })();
      }
    }, [current, isControlled, onChange, habitId, stateDate]);

    const { box, icon } = SIZE_MAP[size];

    // Resolve colors consistent with existing Checkbox
    const cssVars = React.useMemo(() => {
      if (customColor) {
        return { primary: customColor };
      }
      if (categoryId) {
        const vars = getCategoryCSSVariables(categoryId);
        return { primary: vars.primary };
      }
      return { primary: "hsl(var(--ring))" };
    }, [customColor, categoryId]);

    const rootStyle: React.CSSProperties = {
      ...style,
      width: box,
      height: box,
      minWidth: box,
      minHeight: box,
      borderColor: cssVars.primary,
      // Handle background styling based on showBackground prop
      ...(showBackground ? {
        // Background mode: handle tri-state properly
        backgroundColor: current === "checked" 
          ? cssVars.primary 
          : current === "undo" 
          ? 'hsl(var(--accent))' 
          : 'hsl(var(--daycell-bg))',
        borderColor: current === "checked" || current === "undo"
          ? cssVars.primary
          : (isToday ? 'hsl(var(--border-today))' : 'hsl(var(--border-default))'),
        color: current === "checked" ? "#fff" : current === "undo" ? 'hsl(var(--accent-foreground))' : 'inherit',
      } : {
        // Checkbox mode: fill only when checked/undo
        ...(current === "checked"
          ? { backgroundColor: cssVars.primary, borderColor: cssVars.primary, color: "#fff" }
          : current === "undo"
          ? { backgroundColor: 'hsl(var(--accent))', borderColor: cssVars.primary, color: "hsl(var(--accent-foreground))" }
          : { backgroundColor: "transparent", color: cssVars.primary }),
      }),
    };

    const iconStyle: React.CSSProperties = {
      width: icon,
      height: icon,
    };

    return (
      <button
        ref={ref}
        type="button"
        role="checkbox"
        aria-checked={current === "checked"}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (disabled) return;
          cycle();
        }}
        onMouseDown={(e) => {
          // prevent parent clickable containers from triggering
          e.stopPropagation();
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
        }}
        className={cn(
          "inline-flex items-center justify-center rounded",
          "disabled:cursor-not-allowed disabled:opacity-50 select-none",
          className
        )}
        style={rootStyle}
        {...rest}
      >
        {dayNumber !== undefined && current === "empty" && (
          // Day display mode
          <div className="flex flex-col items-center justify-center w-full h-full">
            <div className="text-[10px]">
              {dayNumber}
            </div>
            {isToday && (
              <Check style={{ width: icon * 0.6, height: icon * 0.6 }} className="stroke-[2.5px]" />
            )}
          </div>
        )}
            {current === "checked" && (
              <Check style={iconStyle} className="stroke-[2.5px]" />
            )}
            {current === "undo" && (
              <X style={iconStyle} className="stroke-[2.5px]" />
            )}
            {current === "excused" && (
              <X style={iconStyle} className="stroke-[2.5px]" />
            )}
      </button>
    );
  }
);

TriCheckbox.displayName = "TriCheckbox";

export default TriCheckbox;


