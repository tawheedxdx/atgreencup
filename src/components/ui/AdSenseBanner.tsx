import React, { useEffect } from 'react';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdSenseBannerProps {
  client?: string;
  slot?: string;
  format?: string;
  responsive?: boolean;
}

export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({
  client = import.meta.env.VITE_ADSENSE_CLIENT_ID,
  slot = import.meta.env.VITE_ADSENSE_SLOT_ID,
  format = 'auto',
  responsive = true,
}) => {
  useEffect(() => {
    if (!client) {
      console.warn('AdSenseBanner: client ID is not configured.');
      return;
    }

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.warn('AdSenseBanner: Failed to push adsbygoogle (normal in local dev):', err);
    }
  }, [client, slot]);

  // Render a placeholder card in local development if client/slot are missing or mock values are active
  const isLocalOrMock = !client || client === 'ca-pub-1234567890123456';

  if (isLocalOrMock) {
    return (
      <div className="w-full my-6 p-6 rounded-[1.5rem] border-2 border-dashed border-emerald-500/20 dark:border-emerald-500/10 flex flex-col items-center justify-center bg-emerald-500/5 dark:bg-emerald-500/5 text-center transition-all hover:bg-emerald-500/10">
        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
          <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-[0.2em]">
          AdSense Banner Placeholder
        </p>
        <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 max-w-xs font-semibold">
          Client: {client || 'ca-pub-XXXXXXXXXXXXXXXX'} <br />
          Slot: {slot || 'XXXXXXXXXX'}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full my-6 flex justify-center overflow-hidden">
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
};
