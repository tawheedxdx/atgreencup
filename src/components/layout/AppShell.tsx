import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { NetworkBanner } from '../feedback/NetworkBanner';
import { WhatsAppFAB } from '../ui/WhatsAppFAB';

export const AppShell: React.FC = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-dark-bg max-w-lg mx-auto relative transition-colors duration-300">
    <NetworkBanner />
    <main className="pb-24">
      <Outlet />
    </main>
    <WhatsAppFAB />
    <BottomNav />
  </div>
);
