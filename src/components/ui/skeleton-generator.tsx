import React from 'react';
import { Skeleton } from './skeleton';

/**
 * Automatically generates skeleton placeholders from real components
 * This reduces the need to manually maintain skeleton components
 */

interface SkeletonGeneratorProps {
  children: React.ReactNode;
  isLoading: boolean;
  skeletonProps?: {
    className?: string;
    variant?: 'default' | 'card' | 'text' | 'button';
  };
}

export const SkeletonGenerator = ({ 
  children, 
  isLoading, 
  skeletonProps = {} 
}: SkeletonGeneratorProps) => {
  if (!isLoading) {
    return <>{children}</>;
  }

  // Generate skeleton based on component type
  const generateSkeleton = (element: React.ReactElement): React.ReactElement => {
    const { type, props } = element;
    
    // Handle different component types
    if (type === 'div' || type === 'span' || type === 'p') {
      return (
        <Skeleton 
          className={`h-4 w-full ${skeletonProps.className || ''}`}
          {...skeletonProps}
        />
      );
    }
    
    if (type === 'button') {
      return (
        <Skeleton 
          className={`h-8 w-20 rounded ${skeletonProps.className || ''}`}
          {...skeletonProps}
        />
      );
    }
    
    if (type === 'img') {
      return (
        <Skeleton 
          className={`h-6 w-6 rounded ${skeletonProps.className || ''}`}
          {...skeletonProps}
        />
      );
    }
    
    // Default skeleton
    return (
      <Skeleton 
        className={`h-4 w-full ${skeletonProps.className || ''}`}
        {...skeletonProps}
      />
    );
  };

  // Recursively process children
  const processChildren = (children: React.ReactNode): React.ReactNode => {
    return React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        return generateSkeleton(child);
      }
      return child;
    });
  };

  return <>{processChildren(children)}</>;
};

/**
 * Higher-order component that wraps any component with skeleton loading
 */
export const withSkeleton = <P extends object>(
  Component: React.ComponentType<P>,
  skeletonConfig?: {
    className?: string;
    variant?: 'default' | 'card' | 'text' | 'button';
  }
) => {
  return (props: P & { isLoading?: boolean }) => {
    const { isLoading, ...componentProps } = props;
    
    if (isLoading) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      );
    }
    
    return <Component {...(componentProps as P)} />;
  };
};

