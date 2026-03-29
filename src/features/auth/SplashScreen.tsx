import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
    }, 2500); // Slightly longer to appreciate the animation
    return () => clearTimeout(timer);
  }, [initialized, user, profile, navigate]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 flex flex-col items-center justify-center px-8 overflow-hidden"
    >
      {/* Ambient background pulses */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: [1, 1.3, 1], 
              opacity: [0.05, 0.15, 0.05],
              rotate: [0, 45, 0]
            }}
            transition={{ 
              duration: 8 + i * 2, 
              repeat: Infinity, 
              ease: "linear",
              delay: i * 2
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] rounded-[40%] bg-white/5 blur-3xl"
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Animated Logo Container */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-[2rem] flex items-center justify-center mb-8 ring-1 ring-white/20 shadow-2xl"
        >
          <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none">
            <motion.path
              d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut", delay: 0.5 }}
            />
            <motion.path
              d="M12 14c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2z"
              fill="currentColor"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.5 }}
              transition={{ duration: 0.8, delay: 1.2 }}
            />
          </svg>
        </motion.div>

        {/* Staggered Text */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.2, delayChildren: 0.8 }
            }
          }}
          className="text-center"
        >
          <motion.h1
            variants={{
              hidden: { y: 20, opacity: 0 },
              visible: { y: 0, opacity: 1 }
            }}
            className="text-white text-4xl font-black tracking-tight mb-2"
          >
            At GreenCup
          </motion.h1>
          <motion.p
            variants={{
              hidden: { y: 10, opacity: 0 },
              visible: { y: 0, opacity: 0.8 }
            }}
            className="text-emerald-100 text-sm font-bold uppercase tracking-widest"
          >
            Production Hub
          </motion.p>
        </motion.div>

        {/* Elegant Progress bar instead of spinner */}
        <motion.div 
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 120, opacity: 1 }}
          transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
          className="h-1 bg-white/20 rounded-full mt-16 overflow-hidden relative"
        >
          <motion.div
            animate={{ x: [-120, 120] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 w-1/2 bg-white"
          />
        </motion.div>
      </div>
    </motion.div>
  );
};
