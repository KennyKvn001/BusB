// src/components/common/Card.tsx
import React from 'react';

interface CardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
  variant?: 'elevated' | 'outlined' | 'filled';
  isHoverable?: boolean;
}

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  footer,
  className = '',
  bodyClassName = '',
  headerClassName = '',
  footerClassName = '',
  variant = 'elevated',
  isHoverable = false,
}) => {
  // Base classes
  const baseClasses = 'rounded-lg overflow-hidden';

  // Variant classes
  const variantClasses = {
    elevated: 'bg-white shadow',
    outlined: 'bg-white border border-gray-200',
    filled: 'bg-gray-50',
  }[variant];

  // Hover classes
  const hoverClasses = isHoverable ? 'transition-shadow hover:shadow-md' : '';

  // Combined classes
  const cardClasses = `${baseClasses} ${variantClasses} ${hoverClasses} ${className}`;

  const hasHeader = title || subtitle;

  return (
    <div className={cardClasses}>
      {hasHeader && (
        <div className={`px-6 py-4 border-b border-gray-200 ${headerClassName}`}>
          {title && (
            typeof title === 'string'
              ? <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              : title
          )}
          {subtitle && (
            typeof subtitle === 'string'
              ? <p className="text-sm text-gray-500">{subtitle}</p>
              : subtitle
          )}
        </div>
      )}

      <div className={`px-6 py-4 ${bodyClassName}`}>
        {children}
      </div>

      {footer && (
        <div className={`px-6 py-4 bg-gray-50 border-t border-gray-200 ${footerClassName}`}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;