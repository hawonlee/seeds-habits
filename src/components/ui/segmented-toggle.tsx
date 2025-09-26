import { cn } from "@/lib/utils";

interface SegmentedToggleProps {
  options: { value: string; label: string }[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export const SegmentedToggle = ({ 
  options, 
  value, 
  onValueChange, 
  className 
}: SegmentedToggleProps) => {
  return (
    <div className={cn("flex items-center", className)}>
      {options.map((option, index) => (
        <div key={option.value} className="flex items-center">
          <button
            onClick={() => onValueChange(option.value)}
            className={cn(
              "text-xs font-normal uppercase transition-colors duration-200 focus:outline-none",
              value === option.value
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
          {index < options.length - 1 && (
            <span className="mx-1 text-foreground font-medium">/</span>
          )}
        </div>
      ))}
    </div>
  );
};
