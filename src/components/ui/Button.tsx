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
  primary:   'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 active:from-emerald-600 active:to-emerald-700 disabled:from-emerald-300 disabled:to-emerald-300 shadow-emerald-glow shadow-sm border border-emerald-400/20 dark:from-emerald-600 dark:to-emerald-700',
  secondary: 'bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md text-gray-800 dark:text-emerald-50 border border-gray-200/50 dark:border-dark-border hover:bg-gray-50/90 dark:hover:bg-dark-surface active:bg-gray-100 dark:active:bg-dark-card shadow-sm disabled:bg-gray-100 dark:disabled:bg-dark-surface/50',
  danger:    'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-400 hover:to-red-500 active:from-red-600 active:to-red-700 disabled:from-red-300 disabled:to-red-300 shadow-sm shadow-red-500/20 border border-red-400/20',
  ghost:     'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-white/5 active:bg-gray-200/50 dark:active:bg-white/10',
};

const sizes = {
  sm: 'h-9 px-4 text-[13px] rounded-xl font-bold',
  md: 'h-12 px-6 text-[15px] rounded-2xl font-bold tracking-tight',
  lg: 'h-14 px-8 text-[17px] rounded-[1.25rem] font-bold tracking-tight',
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
  <button
    className={`
      inline-flex items-center justify-center gap-2.5 font-sans
      transition-all duration-200 ease-out select-none active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:ring-offset-2 dark:focus:ring-offset-dark-bg
      ${variants[variant]} ${sizes[size]}
      ${fullWidth ? 'w-full flex' : 'inline-flex'}
      ${loading || disabled ? 'pointer-events-none opacity-70' : ''}
      ${className}
    `}
    disabled={disabled || loading}
    {...props as any}
  >
    {loading ? (
      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    ) : icon ? (
      <span className="opacity-90">{icon}</span>
    ) : null}
    <span className="truncate">{children}</span>
  </button>
);
