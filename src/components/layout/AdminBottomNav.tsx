import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

export const AdminBottomNav: React.FC = () => {
  const location = useLocation();

  const navItems = [
    {
      to: '/admin/dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5 z-10 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      ),
    },
    {
      to: '/admin/production',
      label: 'Production',
      icon: (
        <svg className="w-5 h-5 z-10 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      to: '/admin/attendance',
      label: 'Attendance',
      icon: (
        <svg className="w-5 h-5 z-10 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      to: '/admin/issues',
      label: 'Issues',
      icon: (
        <svg className="w-5 h-5 z-10 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.999L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16.001c-.77 1.332.192 2.999 1.732 2.999z" />
        </svg>
      ),
    },
    {
      to: '/admin/employees',
      label: 'Employees',
      icon: (
        <svg className="w-5 h-5 z-10 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      to: '/admin/more',
      label: 'More',
      icon: (
        <svg className="w-5 h-5 z-10 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-dark-surface/95 backdrop-blur-xl border-t border-gray-100 dark:border-dark-border pb-safe z-50 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] dark:shadow-none transition-colors duration-300">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto relative px-1">
        {navItems.map((item) => {
          // Highlight 'More' if active or on sub-routes under 'More' (like machines, products, salary)
          const isMoreTab = item.to === '/admin/more';
          const active = isMoreTab
            ? location.pathname === item.to ||
              ['/admin/products', '/admin/machines', '/admin/salary', '/admin/reports', '/admin/settings', '/admin/search'].some(path => location.pathname.startsWith(path))
            : location.pathname === item.to ||
              (item.to === '/admin/production' && location.pathname.startsWith('/admin/production/')) ||
              (item.to === '/admin/attendance' && location.pathname.startsWith('/admin/attendance/')) ||
              (item.to === '/admin/issues' && location.pathname.startsWith('/admin/issues/')) ||
              (item.to === '/admin/employees' && location.pathname.startsWith('/admin/employees/'));

          const isIssuesTab = item.to === '/admin/issues';

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex flex-col items-center justify-center flex-1 h-12 relative gap-1 mt-1 transition-all min-w-0"
            >
              {active && (
                <motion.div
                  layoutId="admin-bottom-nav-active"
                  className={`absolute inset-0 rounded-2xl ${
                    isIssuesTab
                      ? 'bg-red-50 dark:bg-red-600/20'
                      : 'bg-emerald-50 dark:bg-emerald-600/20'
                  }`}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                />
              )}
              <span className={`transition-all duration-300 z-10 ${
                active
                  ? isIssuesTab
                    ? 'text-red-600 dark:text-red-400 scale-110'
                    : 'text-emerald-600 dark:text-emerald-400 scale-110'
                  : 'text-gray-400 dark:text-gray-600'
              }`}>
                {item.icon}
              </span>
              <span className={`text-[8px] font-black z-10 transition-colors uppercase tracking-widest truncate max-w-full px-0.5 ${
                active
                  ? isIssuesTab
                    ? 'text-red-700 dark:text-red-400'
                    : 'text-emerald-700 dark:text-emerald-400'
                  : 'text-gray-400 dark:text-gray-600'
              }`}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
