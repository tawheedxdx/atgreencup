import React, { useEffect } from 'react';
import { AppRouter } from './Router';
import { useAuthStore } from '../store/authStore';

const App: React.FC = () => {
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    const unsub = init();
    return unsub;
  }, [init]);

  return <AppRouter />;
};

export default App;
