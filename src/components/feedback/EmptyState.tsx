import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    {icon ? (
      <div className="text-gray-300 mb-3">{icon}</div>
    ) : (
      <svg className="w-16 h-16 text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    )}
    <h3 className="text-base font-semibold text-gray-600 mb-1">{title}</h3>
    {message && <p className="text-sm text-gray-400">{message}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
