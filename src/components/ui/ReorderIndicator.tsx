import React from 'react';

interface ReorderIndicatorProps {
  className?: string;
}

export const ReorderIndicator: React.FC<ReorderIndicatorProps> = ({ className }) => {
  return (
    <div
      className={`pointer-events-none absolute left-0 right-0 h-0.5 rounded-full bg-foreground/50 z-20 ${className || ''}`}
      aria-hidden="true"
    />
  );
};

export default ReorderIndicator;


