import React, { HTMLAttributes, forwardRef } from 'react';
import { tokens } from '../../utils/design-tokens';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ 
    variant = 'text',
    width,
    height,
    animation = 'pulse',
    className = '',
    style,
    ...props 
  }, ref) => {
    const baseStyles = 'bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600';

    const variantStyles = {
      text: 'rounded',
      rectangular: 'rounded-lg',
      circular: 'rounded-full',
    };

    const animationStyles = {
      pulse: 'animate-pulse',
      wave: `
        relative overflow-hidden
        before:absolute before:inset-0
        before:-translate-x-full
        before:animate-[shimmer_2s_infinite]
        before:bg-gradient-to-r
        before:from-transparent
        before:via-white/20
        before:to-transparent
      `,
      none: '',
    };

    const defaultDimensions = {
      text: { width: '100%', height: '1em' },
      rectangular: { width: '100%', height: '100px' },
      circular: { width: '40px', height: '40px' },
    };

    const finalWidth = width || defaultDimensions[variant].width;
    const finalHeight = height || defaultDimensions[variant].height;

    return (
      <div
        ref={ref}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${animationStyles[animation]}
          ${className}
        `}
        style={{
          width: finalWidth,
          height: finalHeight,
          ...style,
        }}
        aria-busy="true"
        aria-live="polite"
        role="status"
        {...props}
      >
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
);

Skeleton.displayName = 'Skeleton';


// Utility component for common skeleton patterns
export interface SkeletonCardProps extends HTMLAttributes<HTMLDivElement> {
  lines?: number;
  showAvatar?: boolean;
  showImage?: boolean;
}

export const SkeletonCard = forwardRef<HTMLDivElement, SkeletonCardProps>(
  ({ lines = 3, showAvatar = false, showImage = false, className = '', ...props }, ref) => {
    return (
      <div ref={ref} className={`space-y-3 ${className}`} {...props}>
        {showImage && (
          <Skeleton variant="rectangular" height={200} className="mb-4" />
        )}
        
        {showAvatar && (
          <div className="flex items-center space-x-3">
            <Skeleton variant="circular" width={40} height={40} />
            <div className="flex-1">
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" className="mt-1" />
            </div>
          </div>
        )}
        
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton 
            key={index} 
            variant="text" 
            width={index === lines - 1 ? '80%' : '100%'}
          />
        ))}
      </div>
    );
  }
);

SkeletonCard.displayName = 'SkeletonCard';

// Skeleton for metric cards
export const SkeletonMetricCard = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => {
    return (
      <div ref={ref} className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md ${className}`} {...props}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Skeleton variant="text" width="60%" height="14px" className="mb-2" />
            <Skeleton variant="text" width="80px" height="32px" />
          </div>
          <Skeleton variant="circular" width={48} height={48} />
        </div>
      </div>
    );
  }
);

SkeletonMetricCard.displayName = 'SkeletonMetricCard';

