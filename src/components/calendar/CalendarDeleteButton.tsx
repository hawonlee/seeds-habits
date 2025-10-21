import React from 'react';
import { X } from 'lucide-react';

interface CalendarDeleteButtonProps {
  onClick?: (e: React.MouseEvent) => void;
  title?: string;
}

export const CalendarDeleteButton: React.FC<CalendarDeleteButtonProps> = ({ onClick, title = 'Delete' }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) onClick(e);
  };

  return (
    <button
      className="opacity-0 group-hover:opacity-60 transition-opacity duration-200 rounded text-xs font-bold"
      onClick={handleClick}
      aria-label={title}
      title={title}
    >
      <X className="w-3.5 h-3.5" />
    </button>
  );
};

export default CalendarDeleteButton;


