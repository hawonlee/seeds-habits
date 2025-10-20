import { GripVertical } from "lucide-react"
import * as ResizablePrimitive from "react-resizable-panels"

import { cn } from "@/lib/utils"

const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    )}
    {...props}
  />
)

const ResizablePanel = ResizablePrimitive.Panel

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean
}) => (
  <ResizablePrimitive.PanelResizeHandle
    className={cn(
      // Base size + indicator line
      "relative flex w-px items-center justify-center bg-bordermuted  after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2",
      // Accessibility focus ring
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1",
      // Vertical mode sizing for the line
      "data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0",
      // Expand the interactive hit target using ::before so hover triggers easily
      "before:absolute before:inset-y-0 before:left-1/2 before:w-4 before:-translate-x-1/2 before:content-[''] before:bg-transparent before:pointer-events-auto",
      "data-[panel-group-direction=vertical]:before:inset-x-0 data-[panel-group-direction=vertical]:before:h-4 data-[panel-group-direction=vertical]:before:w-full data-[panel-group-direction=vertical]:before:-translate-y-1/2 data-[panel-group-direction=vertical]:before:translate-x-0",
      
      // Cursor + hover/active affordances (horizontal: ew-resize, vertical: ns-resize)
      "hover:border/50 hover:after:w-[2px] hover:after:bg-border",
      // Thicker/darker while dragging (best-effort data attribute from library) + keep resize cursor
      "data-[resize-handle-active=true]:bg-foreground/40 data-[resize-handle-active=true]:after:w-2 data-[resize-handle-active=true]:after:bg-foreground/60",
      // Vertical hover/active thickness
      "data-[panel-group-direction=vertical]:hover:after:h-2 data-[panel-group-direction=vertical]:data-[resize-handle-active=true]:after:h-2",
      // Keep grip icon rotated in vertical mode
      "[&[data-panel-group-direction=vertical]>div]:rotate-90",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    )}
  </ResizablePrimitive.PanelResizeHandle>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
