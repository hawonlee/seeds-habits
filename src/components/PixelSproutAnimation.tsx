import React from 'react';

interface PixelSproutAnimationProps {
  className?: string;
}

export const PixelSproutAnimation: React.FC<PixelSproutAnimationProps> = ({ className = "" }) => {
  return (
    <div className={`pixel-sprout-container ${className}`}>
      <div className="pixel-sprout">
        <div className="pixel-stem"></div>
        <div className="pixel-leaf-left"></div>
        <div className="pixel-leaf-right"></div>
      </div>
    </div>
  );
};
