import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { getCategoryPrimaryColor } from "@/lib/categories"
import { findColorOptionByValue } from "@/lib/colorOptions"

interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  customColor?: string;
  categoryId?: string;
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, customColor, categoryId, style, ...props }, ref) => {
  const customStyle = React.useMemo(() => {
    const primary = customColor || (categoryId ? getCategoryPrimaryColor(categoryId) : null);
    if (!primary) return style;
    const palette = findColorOptionByValue(primary);
    const textHex = palette?.textHex || primary;
    
    return {
      ...style,
      color: 'inherit',
      borderColor: textHex,
      '--checkbox-checked-bg': textHex,
      '--checkbox-checked-border': textHex,
      ...(props.checked && {
        backgroundColor: textHex,
        borderColor: textHex,
      })
    } as React.CSSProperties;
  }, [customColor, categoryId, style, props.checked]);

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
