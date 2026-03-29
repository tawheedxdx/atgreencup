import React, { useEffect } from 'react';
import { AppRouter } from './Router';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import i18n from '../lib/i18n';

const App: React.FC = () => {
  const init = useAuthStore((s) => s.init);
  const { theme, language } = useSettingsStore();

  useEffect(() => {
    const unsub = init();
    return unsub;
  }, [init]);

  useEffect(() => {
    // Apply theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    // Apply language
    i18n.changeLanguage(language);
  }, [language]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-300">
      <AppRouter />
    </div>
  );
};

export default App;
