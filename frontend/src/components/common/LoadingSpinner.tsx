// src/components/common/LoadingSpinner.tsx
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  thickness?: 'thin' | 'regular' | 'thick';
  label?: string;
  className?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  thickness = 'regular',
  label,
  className = '',
  fullScreen = false,
}) => {
  // Size classes
  const sizeClasses = {
    xs: 'h-4 w-4',
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  }[size];

  // Color classes
  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    white: 'text-white',
    gray: 'text-gray-400',
  }[color];

  // Thickness classes
  const thicknessClasses = {
    thin: 'border-2',
    regular: 'border-3',
    thick: 'border-4',
  }[thickness];

  // Full screen container
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
        <div className="flex flex-col items-center">
          <div
            className={`rounded-full ${sizeClasses} ${colorClasses} ${thicknessClasses} border-t-transparent animate-spin ${className}`}
          />
          {label && <p className="mt-4 text-white font-medium">{label}</p>}
        </div>
      </div>
    );
  }

  // Regular spinner
  return (
    <div className="flex flex-col items-center">
      <div
        className={`rounded-full ${sizeClasses} ${colorClasses} ${thicknessClasses} border-t-transparent animate-spin ${className}`}
      />
      {label && <p className="mt-2 text-sm text-gray-500">{label}</p>}
    </div>
  );
};

export default LoadingSpinner;