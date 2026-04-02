import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { NetworkBanner } from '../feedback/NetworkBanner';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';

export const AppShell: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const { initChats, clearChats } = useChatStore();

  useEffect(() => {
    if (user?.uid) {
      initChats(user.uid);
    }
    return () => clearChats();
  }, [user?.uid, initChats, clearChats]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg max-w-lg mx-auto relative transition-colors duration-300">
      <NetworkBanner />
      <main className="pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};
