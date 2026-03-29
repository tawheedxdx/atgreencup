import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

const variants = {
  primary:   'bg-emerald-600 text-white active:bg-emerald-700 disabled:bg-emerald-300',
  secondary: 'bg-white text-gray-700 border border-gray-300 active:bg-gray-50 disabled:bg-gray-100',
  danger:    'bg-red-600 text-white active:bg-red-700 disabled:bg-red-300',
  ghost:     'bg-transparent text-gray-600 active:bg-gray-100',
};

const sizes = {
  sm: 'h-9 px-3 text-sm rounded-lg',
  md: 'h-12 px-5 text-base rounded-xl',
  lg: 'h-14 px-6 text-lg rounded-xl',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => (
  <motion.button
    className={`
      inline-flex items-center justify-center gap-2 font-semibold
      transition-all duration-150 select-none
      ${variants[variant]} ${sizes[size]}
      ${fullWidth ? 'w-full' : ''}
      ${loading || disabled ? 'pointer-events-none opacity-70' : ''}
      ${className}
    `}
    disabled={disabled || loading}
    {...props}
  >
    {loading ? (
      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    ) : icon ? (
      icon
    ) : null}
    {children}
  </motion.button>
);
