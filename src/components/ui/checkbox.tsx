import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  customColor?: string;
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, customColor, style, ...props }, ref) => {
  const customStyle = React.useMemo(() => {
    if (!customColor) return style;
    
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
  }, [customColor, style, props.checked]);

  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        "peer h-3.5 w-3.5 shrink-0 rounded-[2px] border ring-offset-background focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      style={customStyle}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn("flex items-center justify-center text-current")}
      >
        <Check className="h-3 w-3 stroke-[2.5px] text-white" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
})
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
