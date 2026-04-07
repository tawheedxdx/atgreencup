import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, rightIcon, className = '', ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-bold text-gray-700 dark:text-emerald-100/80 mb-2 px-1 tracking-tight">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 transition-colors group-focus-within:text-emerald-500 z-10 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={`
            w-full h-14 bg-white/70 dark:bg-dark-surface/50 backdrop-blur-sm border border-gray-200/60 dark:border-dark-border rounded-[1.25rem]
            px-4 text-gray-900 dark:text-emerald-50 text-base font-medium placeholder:text-gray-400 dark:placeholder:text-gray-600
            focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 dark:focus:ring-emerald-500/20 dark:focus:bg-dark-card
            hover:border-gray-300 dark:hover:border-emerald-900/40 shadow-sm
            transition-all duration-200 ease-out
            ${icon ? 'pl-12' : ''}
            ${rightIcon ? 'pr-12' : ''}
            ${error ? 'border-red-400/60 focus:ring-red-500/20 focus:border-red-500/50 bg-red-50/30 dark:bg-red-950/20' : ''}
            ${props.disabled ? 'bg-gray-100/50 dark:bg-dark-bg/50 text-gray-400 cursor-not-allowed shadow-none border-dashed' : ''}
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 z-10 pointer-events-none">
            {rightIcon}
          </span>
        )}
      </div>
      {error && (
        <p className="mt-2 px-1 text-xs font-bold text-red-500 animate-fade-in">
          {error}
        </p>
      )}
    </div>
  )
);

Input.displayName = 'Input';
