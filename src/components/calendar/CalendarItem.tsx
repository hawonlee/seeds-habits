import React from 'react';
import { cn } from '@/lib/utils';

interface CalendarItemProps {
  children: React.ReactNode;
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
  onDelete
}) => {
  const baseClasses = "text-xs px-1 rounded flex items-center gap-1.5 truncate h-5";
  
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
      {children}
      {showDeleteButton && onDelete && (
        <button
          className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-1 py-0.5 rounded hover:bg-red-100 hover:text-red-600 text-xs font-bold"
          onClick={handleDelete}
          aria-label="Delete"
          title="Delete"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default CalendarItem;
