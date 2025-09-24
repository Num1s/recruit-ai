import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost';
  color?: 'default' | 'blue' | 'green' | 'red' | 'yellow' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'default',
  color = 'default',
  size = 'md',
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  const colorClasses = {
    default: {
      default: 'bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-500',
      outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
      ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
    },
    blue: {
      default: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      outline: 'border border-blue-300 text-blue-700 hover:bg-blue-50 focus:ring-blue-500',
      ghost: 'text-blue-700 hover:bg-blue-100 focus:ring-blue-500'
    },
    green: {
      default: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
      outline: 'border border-green-300 text-green-700 hover:bg-green-50 focus:ring-green-500',
      ghost: 'text-green-700 hover:bg-green-100 focus:ring-green-500'
    },
    red: {
      default: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      outline: 'border border-red-300 text-red-700 hover:bg-red-50 focus:ring-red-500',
      ghost: 'text-red-700 hover:bg-red-100 focus:ring-red-500'
    },
    yellow: {
      default: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500',
      outline: 'border border-yellow-300 text-yellow-700 hover:bg-yellow-50 focus:ring-yellow-500',
      ghost: 'text-yellow-700 hover:bg-yellow-100 focus:ring-yellow-500'
    },
    gray: {
      default: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
      outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
      ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
    }
  };
  
  const classes = `${baseClasses} ${sizeClasses[size]} ${colorClasses[color][variant]} ${className}`;
  
  return (
    <button className={classes} disabled={disabled} {...props}>
      {children}
    </button>
  );
};
