import React from 'react';

interface MobileHeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ title, onBack, rightAction }) => (
  <header className="sticky top-0 z-40 bg-white/95 dark:bg-dark-bg/95 backdrop-blur-xl border-b border-gray-100 dark:border-dark-border transition-all duration-300">
    <div className="flex items-center h-16 px-4 max-w-lg mx-auto">
      {onBack && (
        <button
          onClick={onBack}
          className="w-10 h-10 -ml-1 flex items-center justify-center rounded-2xl text-gray-600 dark:text-emerald-400 active:bg-gray-100 dark:active:bg-dark-surface transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      <h1 className="text-base font-black text-gray-900 dark:text-emerald-50 flex-1 truncate px-2 uppercase tracking-widest">{title}</h1>
      {rightAction && <div className="flex-shrink-0">{rightAction}</div>}
    </div>
  </header>
);
