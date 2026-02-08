import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { getCategoryCSSVariables } from "@/lib/categories"

interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  customColor?: string;
  categoryId?: string;
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, customColor, categoryId, style, ...props }, ref) => {
  const customStyle = React.useMemo(() => {
    if (customColor) {
      return {
        ...style,
        color: 'inherit',
        borderColor: customColor,
        '--checkbox-checked-bg': customColor,
        '--checkbox-checked-border': customColor,
        ...(props.checked && {
          backgroundColor: customColor,
          borderColor: customColor,
        })
      } as React.CSSProperties;
    }
    
    if (categoryId) {
      const cssVars = getCategoryCSSVariables(categoryId);
      return {
        ...style,
        color: 'inherit',
        borderColor: cssVars.primary,
        '--checkbox-checked-bg': cssVars.primary,
        '--checkbox-checked-border': cssVars.primary,
        ...(props.checked && {
          backgroundColor: cssVars.primary,
          borderColor: cssVars.primary,
        })
      } as React.CSSProperties;
    }
    
    return style;
  }, [customColor, categoryId, style, props.checked]);

  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        "peer h-[12px] w-[12px] min-h-[5px] min-w-[5px] shrink-0 rounded-[2px] border ring-offset-background focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      style={customStyle}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn("flex items-center justify-center text-current")}
      >
        <Check className="h-[10px] w-[10px] stroke-[2.5px] text-white" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
})
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
