import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/60",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-button-outline-border rounded-full hover:bg-button-outline-hover hover:text-accent-foreground",
        outlinefilled: "bg-button-outline-filled border border-button-outline-filled-border rounded-full",
        outlineinactive: "border border-button-outline-inactive-border rounded-full hover:bg-button-outline-inactive-hover hover:text-button-outline-inactive-text text-button-outline-inactive-text font-normal",
        nooutline:
          "bg-muted hover:text-accent-foreground",
        secondary:
          "bg-button-secondary-bg rounded-full border-none text-button-secondary-text hover:bg-button-secondary-hover",
        tertiary:
          "bg-button-tertiary-bg rounded-full border-none text-button-tertiary-text hover:bg-button-tertiary-hover",
        ghost: "hover:bg-button-ghost-hover",
        link: "text-primary underline-offset-4 hover:underline",
        text: "text-muted-foreground hover:text-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-7 px-3",
        lg: "h-11 px-8",
        skinny: "px-5 py-2",
        icon: "h-8 w-8",
        smallicon: "h-8 w-8",
        frequency: "p-2",
        text: ""
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
