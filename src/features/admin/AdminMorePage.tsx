import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { MobileHeader } from '../../components/layout/MobileHeader';

export const AdminMorePage: React.FC = () => {
  const navigate = useNavigate();
  const { logout, profile } = useAuthStore();

  const menuItems = [
    {
      title: 'Products',
      description: 'Manage packets per box & pricing',
      icon: (
        <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      onClick: () => navigate('/admin/products'),
    },
    {
      title: 'Machines',
      description: 'Configure assigned products & states',
      icon: (
        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      ),
      onClick: () => navigate('/admin/machines'),
    },
    {
      title: 'Salary Rules',
      description: 'Set rates per quantity for operators',
      icon: (
        <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      onClick: () => navigate('/admin/salary'),
    },
    {
      title: 'Reports',
      description: 'View custom performance summaries',
      icon: (
        <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
        </svg>
      ),
      onClick: () => navigate('/admin/reports'),
    },
    {
      title: 'Global Search',
      description: 'Find production, issues, or users',
      icon: (
        <svg className="w-6 h-6 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      onClick: () => navigate('/admin/search'),
    },
    {
      title: 'Settings',
      description: 'Factory configurations & options',
      icon: (
        <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      onClick: () => navigate('/admin/settings'),
    },
    {
      title: 'Profile Settings',
      description: 'View your profile & account info',
      icon: (
        <svg className="w-6 h-6 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      onClick: () => navigate('/operator/profile'),
    },
  ];

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50 dark:bg-dark-bg pb-6">
      <MobileHeader title="More Settings" />
      
      <div className="px-4 mt-6">
        {/* User Card */}
        <div className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-3xl p-5 mb-6 shadow-premium relative overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black text-xl uppercase">
            {profile?.name?.charAt(0) || 'A'}
          </div>
          <div>
            <h3 className="font-black text-gray-900 dark:text-emerald-50 text-base">{profile?.name || 'Administrator'}</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest mt-0.5">
              System Admin
            </p>
          </div>
        </div>

        {/* Bento-style menu */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              onClick={item.onClick}
              className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-3xl p-4 text-left shadow-premium active:scale-[0.98] active:bg-gray-50 dark:active:bg-dark-border/40 transition-all flex items-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-dark-bg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-gray-900 dark:text-emerald-50 text-sm">{item.title}</h4>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{item.description}</p>
              </div>
              <svg className="w-5 h-5 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="w-full bg-red-500/10 dark:bg-red-500/5 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-black uppercase text-xs tracking-widest py-4 px-6 rounded-3xl border border-red-500/20 active:opacity-85 transition-colors flex items-center justify-center gap-2 mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Log Out
        </button>
      </div>
    </div>
  );
};
