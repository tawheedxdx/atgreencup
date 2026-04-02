import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useChatStore } from '../../store/chatStore';

export const BottomNav: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const unreadCount = useChatStore((s) => s.totalUnread);

  const navItems = [
    {
      to: '/dashboard',
      label: t('nav.dashboard', 'Home'),
      icon: (
        <svg className="w-6 h-6 z-10 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
        </svg>
      ),
    },
    {
      to: '/entries',
      label: t('nav.history', 'History'),
      icon: (
        <svg className="w-6 h-6 z-10 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      to: '/entries/new',
      label: t('nav.new_entry', 'New'),
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.8} d="M12 4v16m8-8H4" />
        </svg>
      ),
      primary: true,
    },
    {
      to: '/chats',
      label: 'Chats',
      badge: unreadCount > 0 ? unreadCount : undefined,
      icon: (
        <svg className="w-6 h-6 z-10 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
    },
    {
      to: '/profile',
      label: t('nav.profile', 'Profile'),
      icon: (
        <svg className="w-6 h-6 z-10 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-dark-surface/95 backdrop-blur-xl border-t border-gray-100 dark:border-dark-border pb-safe z-50 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] dark:shadow-none transition-colors duration-300">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto relative px-2">
        {navItems.map((item) => {
          const active = location.pathname === item.to ||
            (item.to === '/entries' && location.pathname.startsWith('/entries/') && location.pathname !== '/entries/new');

          if (item.primary) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex items-center justify-center -mt-8 z-30"
              >
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 border-4 border-white dark:border-dark-bg transition-colors"
                >
                  {item.icon}
                </motion.div>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex flex-col items-center justify-center w-16 h-12 relative gap-1 mt-1 transition-all"
            >
              {active && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute inset-0 bg-emerald-50 dark:bg-emerald-600/20 rounded-2xl"
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                />
              )}
              <div className="relative z-10">
                <span className={`transition-all duration-300 block ${active ? 'text-emerald-600 dark:text-emerald-400 scale-110' : 'text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400'}`}>
                  {item.icon}
                </span>
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] flex items-center justify-center px-1">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[9px] font-black z-10 transition-colors uppercase tracking-widest ${active ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-600'}`}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
