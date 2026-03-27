import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, initialized } = useAuthStore();

  useEffect(() => {
    if (!initialized) return;
    const timer = setTimeout(() => {
      if (user && profile) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [initialized, user, profile, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 flex flex-col items-center justify-center px-8">
      {/* Logo placeholder */}
      <div className="w-20 h-20 bg-white/15 backdrop-blur rounded-3xl flex items-center justify-center mb-6 animate-pulse">
        <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
        </svg>
      </div>

      {/* Brand text */}
      <h1 className="text-white text-3xl font-bold tracking-tight mb-1">At GreenCup</h1>
      <p className="text-emerald-200 text-sm font-medium">Production Hub</p>

      {/* Loading spinner */}
      <div className="mt-12">
        <div className="w-8 h-8 border-3 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    </div>
  );
};
