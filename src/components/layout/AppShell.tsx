import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { NetworkBanner } from '../feedback/NetworkBanner';

export const AppShell: React.FC = () => (
  <div className="min-h-screen bg-gray-50 max-w-lg mx-auto relative">
    <NetworkBanner />
    <main className="pb-20">
      <Outlet />
    </main>
    <BottomNav />
  </div>
);
