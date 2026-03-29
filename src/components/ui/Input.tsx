import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

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
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 transition-colors group-focus-within:text-emerald-500">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={`
            w-full h-14 bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl
            px-4 text-gray-900 dark:text-emerald-50 text-base font-medium placeholder:text-gray-400 dark:placeholder:text-gray-600
            focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:focus:ring-emerald-500/20 focus:border-emerald-500
            transition-all duration-200
            ${icon ? 'pl-12' : ''}
            ${rightIcon ? 'pr-12' : ''}
            ${error ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500' : ''}
            ${props.disabled ? 'bg-gray-100 dark:bg-dark-bg/50 text-gray-400 cursor-not-allowed' : ''}
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600">
            {rightIcon}
          </span>
        )}
      </div>
      {error && (
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1.5 px-1 text-xs font-bold text-red-500"
        >
          {error}
        </motion.p>
      )}
    </div>
  )
);

Input.displayName = 'Input';
