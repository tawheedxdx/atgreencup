import React, { forwardRef } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = '', ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-bold text-gray-700 dark:text-emerald-100/80 mb-2 px-1 tracking-tight">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={`
            w-full h-14 bg-white/70 dark:bg-dark-surface/50 backdrop-blur-sm border border-gray-200/60 dark:border-dark-border rounded-[1.25rem]
            px-4 text-gray-900 dark:text-emerald-50 text-base font-medium appearance-none
            focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 dark:focus:ring-emerald-500/20 dark:focus:bg-dark-card
            hover:border-gray-300 dark:hover:border-emerald-900/40 shadow-sm
            transition-all duration-200 ease-out
            ${error ? 'border-red-400/60 focus:ring-red-500/20 focus:border-red-500/50 bg-red-50/30 dark:bg-red-950/20' : ''}
            ${props.disabled ? 'bg-gray-100/50 dark:bg-dark-bg/50 text-gray-400 cursor-not-allowed shadow-none border-dashed' : ''}
            ${className}
          `}
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`, 
            backgroundRepeat: 'no-repeat', 
            backgroundPosition: 'right 1.25rem center' 
          }}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="dark:bg-dark-surface dark:text-gray-400">{placeholder}</option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="dark:bg-dark-surface">
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="mt-2 px-1 text-xs font-bold text-red-500 animate-fade-in">{error}</p>}
    </div>
  )
);

Select.displayName = 'Select';

