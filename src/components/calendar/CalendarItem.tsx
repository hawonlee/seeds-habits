import React from 'react';
import { cn } from '@/lib/utils';
import {X} from 'lucide-react';

interface CalendarItemProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  title?: string;
  variant?: 'default' | 'interactive' | 'clickable';
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  showDeleteButton?: boolean;
  onDelete?: (e: React.MouseEvent) => void;
  // New composable slots for unified label rendering
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  label?: string;
  renderLabel?: (label: string) => React.ReactNode;
}

export const CalendarItem: React.FC<CalendarItemProps> = ({
  children,
  className,
  style,
  onClick,
  onContextMenu,
  title,
  variant = 'default',
  draggable,
  onDragStart,
  onDragEnd,
  showDeleteButton = false,
  onDelete,
  leading,
  trailing,
  label,
  renderLabel
}) => {
  const baseClasses = "text-xxs px-1 rounded flex items-center gap-1.5 truncate h-5";
  
  const variantClasses = {
    default: "",
    interactive: "cursor-pointer hover:bg-muted/50 transition-colors",
    clickable: "cursor-pointer hover:opacity-80 transition-opacity"
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(e);
    }
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
      style={style}
      onClick={onClick}
      onContextMenu={onContextMenu}
      title={title}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {leading || trailing || typeof label !== 'undefined' || renderLabel ? (
        <>
          {leading}
          {typeof label !== 'undefined' && (
            renderLabel ? (
              renderLabel(label)
            ) : (
              <span className="truncate flex-1 text-[10px]">{label}</span>
            )
          )}
          {trailing}
        </>
      ) : (
        children
      )}
      {showDeleteButton && onDelete && (
        <button
          className="opacity-0 group-hover:opacity-60 transition-opacity duration-200 rounded text-xs font-bold"
          onClick={handleDelete}
          aria-label="Delete"
          title="Delete"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default CalendarItem;
