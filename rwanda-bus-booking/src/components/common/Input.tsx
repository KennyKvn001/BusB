// src/components/common/Input.tsx
import React, { forwardRef } from 'react';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'outline' | 'filled' | 'flushed';

type OmittedInputAttributes = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>;

interface InputProps extends OmittedInputAttributes {
  label?: string;
  helperText?: string;
  error?: string;
  size?: InputSize;
  variant?: InputVariant;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isFullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>((
  {
    label,
    helperText,
    error,
    size = 'md',
    variant = 'outline',
    leftIcon,
    rightIcon,
    isFullWidth = true,
    className = '',
    id,
    ...props
  },
  ref
) => {
  // Generate a unique ID if not provided
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;

  // Base classes
  const baseClasses = 'rounded-md transition-colors focus:outline-none';

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-4 py-3 text-lg',
  }[size];

  // Variant classes
  const variantClasses = {
    outline: 'border border-gray-300 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
    filled: 'border border-gray-100 bg-gray-100 focus:bg-white focus:border-blue-500',
    flushed: 'border-b border-gray-300 rounded-none px-0 focus:border-blue-500',
  }[variant];

  // Error classes
  const errorClasses = error
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500 text-red-900 placeholder-red-300'
    : '';

  // Width classes
  const widthClasses = isFullWidth ? 'w-full' : '';

  // Icon padding classes
  const iconPaddingClasses = {
    left: leftIcon ? 'pl-10' : '',
    right: rightIcon ? 'pr-10' : '',
  };

  // Combined classes
  const inputClasses = `
    ${baseClasses}
    ${sizeClasses}
    ${variantClasses}
    ${errorClasses}
    ${widthClasses}
    ${iconPaddingClasses.left}
    ${iconPaddingClasses.right}
    ${className}
  `.trim();

  return (
    <div className={`${isFullWidth ? 'w-full' : ''} mb-4`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          className={inputClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={`${inputId}-error ${inputId}-helper`}
          {...props}
        />

        {rightIcon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
            {rightIcon}
          </div>
        )}
      </div>

      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p id={`${inputId}-helper`} className="mt-1 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;