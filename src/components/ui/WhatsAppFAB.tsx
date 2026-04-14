import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const WHATSAPP_NUMBER = '919378160180'; // +91 9378160180 (no + or spaces)
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

export const WhatsAppFAB: React.FC = () => {
  const [pulse, setPulse] = useState(false);

  const handleClick = () => {
    setPulse(true);
    setTimeout(() => setPulse(false), 600);
    window.open(WHATSAPP_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    /* Positioned above the 64px bottom nav (h-16) with a little breathing room */
    <div className="fixed bottom-20 right-4 z-40 max-w-lg" style={{ right: 'max(1rem, calc((100vw - 512px) / 2 + 1rem))' }}>
      <AnimatePresence>
        {/* Ripple ring on click */}
        {pulse && (
          <motion.span
            key="ripple"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 2.4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="absolute inset-0 rounded-full bg-[#25D366] pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Idle pulse ring */}
      <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-30 animate-ping pointer-events-none" />

      <motion.button
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.92 }}
        onClick={handleClick}
        aria-label="Chat on WhatsApp"
        title="Chat on WhatsApp"
        className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/40 focus:outline-none"
        style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
      >
        {/* Official WhatsApp icon (SVG) */}
        <svg
          viewBox="0 0 32 32"
          className="w-8 h-8"
          fill="white"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M16.003 2.667C8.637 2.667 2.667 8.637 2.667 16c0 2.352.627 4.624 1.813 6.613L2.667 29.333l6.907-1.795A13.28 13.28 0 0 0 16.003 29.333C23.367 29.333 29.333 23.363 29.333 16S23.367 2.667 16.003 2.667Zm0 2.4c5.98 0 10.93 4.95 10.93 10.933s-4.95 10.933-10.93 10.933a10.89 10.89 0 0 1-5.567-1.527l-.4-.24-4.1 1.067 1.093-3.987-.267-.413A10.862 10.862 0 0 1 5.07 16c0-5.983 4.95-10.933 10.933-10.933Zm-3.853 5.6c-.213 0-.56.08-.853.4-.293.32-1.12 1.093-1.12 2.667s1.147 3.093 1.307 3.307c.16.213 2.24 3.573 5.52 4.867 2.72 1.08 3.28.867 3.867.813.587-.053 1.893-.773 2.16-1.52.267-.747.267-1.387.187-1.52-.08-.133-.293-.213-.613-.373-.32-.16-1.893-.933-2.187-1.04-.293-.107-.507-.16-.72.16-.213.32-.827 1.04-.987 1.227-.16.187-.333.213-.613.08-.32-.16-1.307-.48-2.48-1.52-.92-.813-1.547-1.813-1.72-2.133-.173-.32-.013-.493.133-.653.133-.133.32-.347.48-.52.16-.16.213-.28.32-.48.107-.213.053-.4-.027-.56-.08-.16-.68-1.76-.96-2.4-.24-.573-.493-.507-.693-.507l-.6-.013Z" />
        </svg>
      </motion.button>
    </div>
  );
};
