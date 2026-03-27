import React from 'react';

interface MobileHeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ title, onBack, rightAction }) => (
  <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100">
    <div className="flex items-center h-14 px-4 max-w-lg mx-auto">
      {onBack && (
        <button
          onClick={onBack}
          className="w-10 h-10 -ml-2 flex items-center justify-center rounded-xl text-gray-600 active:bg-gray-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      <h1 className="text-lg font-bold text-gray-900 flex-1 truncate">{title}</h1>
      {rightAction && <div>{rightAction}</div>}
    </div>
  </header>
);
