import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { PageTransition } from '../../components/layout/PageTransition';

export const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/dashboard', { replace: true });
    }, 2800);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <PageTransition className="min-h-screen bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 flex flex-col items-center justify-center px-8 relative overflow-hidden text-center">
      {/* Ambient background pulses */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: [1, 1.4, 1], 
              opacity: [0.05, 0.1, 0.05],
              rotate: [0, -30, 0]
            }}
            transition={{ 
              duration: 10 + i * 2, 
              repeat: Infinity, 
              ease: "linear",
              delay: i * 1.5
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160%] h-[160%] rounded-[45%] bg-white/5 blur-3xl"
          />
        ))}
      </div>

      <div className="relative z-10">
        {/* Animated Check Container */}
        <motion.div
          initial={{ scale: 0, opacity: 0, rotate: -45 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 15, 
            delay: 0.2 
          }}
          className="w-28 h-28 bg-white/10 backdrop-blur-2xl rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl ring-1 ring-white/20"
        >
          <svg className="w-14 h-14 text-white" viewBox="0 0 24 24" fill="none">
            <motion.path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.6 }}
            />
          </svg>
        </motion.div>

        {/* Staggered Welcome Text */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.3, delayChildren: 0.8 }
            }
          }}
        >
          <motion.h1 
            variants={{
              hidden: { y: 20, opacity: 0 },
              visible: { y: 0, opacity: 1 }
            }}
            className="text-white text-4xl font-black tracking-tight mb-3"
          >
            Welcome, {profile?.name?.split(' ')[0] || 'Operator'}!
          </motion.h1>

          <motion.p 
            variants={{
              hidden: { y: 10, opacity: 0 },
              visible: { y: 0, opacity: 0.9 }
            }}
            className="text-emerald-100 text-base font-bold"
          >
            Redirecting to your production dashboard...
          </motion.p>
        </motion.div>

        {/* Loading Indicator */}
        <motion.div 
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 2, delay: 1, ease: "easeInOut" }}
          className="h-1 bg-white/20 rounded-full mt-16 max-w-[200px] mx-auto overflow-hidden relative"
        >
          <motion.div
            animate={{ x: [-200, 200] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 w-full bg-white origin-left"
          />
        </motion.div>
      </div>
    </PageTransition>
  );
};
