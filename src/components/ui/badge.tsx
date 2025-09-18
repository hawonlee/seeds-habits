import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { getCategoryPrimaryColor, getCategoryById } from "@/lib/categories"
import { findColorOptionByValue } from "@/lib/colorOptions"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border font-normal px-2.5 py-0.5 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  categoryId?: string;
}

function Badge({ className, variant, categoryId, ...props }: BadgeProps) {
  const primaryColor = categoryId ? getCategoryPrimaryColor(categoryId) : null;
  const palette = primaryColor ? findColorOptionByValue(primaryColor) : undefined;
  const bgHex = palette?.bgHex || '#F3F4F6';
  const textHex = palette?.textHex || primaryColor || '#1F2937';

  return (
    <div
      className={cn(
        badgeVariants({ variant }),
        categoryId && "border px-1.5 py-0.5 text-[10px]",
        className
      )}
      style={categoryId ? {
        backgroundColor: bgHex,
        color: textHex,
      } : undefined}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
