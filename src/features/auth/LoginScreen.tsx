import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PageTransition } from '../../components/layout/PageTransition';

export const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const { login, loading, error, setError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    await login(email.trim(), password);
    const state = useAuthStore.getState();
    if (state.user && state.profile) {
      navigate('/welcome', { replace: true });
    }
  };

  return (
    <PageTransition className="min-h-screen bg-gray-50 flex flex-col overflow-hidden relative">
      {/* Interactive Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[
          { color: 'bg-emerald-400/20', size: 'w-64 h-64', x: [20, 80, 20], y: [10, 40, 10], delay: 0 },
          { color: 'bg-teal-300/15', size: 'w-96 h-96', x: [80, 20, 80], y: [60, 20, 60], delay: 2 },
          { color: 'bg-emerald-500/10', size: 'w-80 h-80', x: [40, 60, 40], y: [80, 40, 80], delay: 4 },
        ].map((orb, i) => (
          <motion.div
            key={i}
            animate={{ 
              left: orb.x.map(v => `${v}%`),
              top: orb.y.map(v => `${v}%`),
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0]
            }}
            transition={{ 
              duration: 20 + i * 5, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: orb.delay
            }}
            className={`absolute ${orb.color} ${orb.size} rounded-full blur-3xl`}
          />
        ))}

        {/* Floating Particles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`p-${i}`}
            initial={{ 
              x: Math.random() * 100 + "%", 
              y: "110%", 
              opacity: 0,
              scale: Math.random() * 0.5 + 0.5
            }}
            animate={{ 
              y: "-10%", 
              opacity: [0, 0.5, 0],
              x: (Math.random() - 0.5) * 50 + "%" 
            }}
            transition={{ 
              duration: 10 + Math.random() * 10, 
              repeat: Infinity, 
              delay: Math.random() * 10,
              ease: "linear"
            }}
            className="absolute w-1 h-1 bg-emerald-300 rounded-full blur-[1px]"
          />
        ))}
      </div>

      {/* Top Brand Section */}
      <motion.div 
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 px-8 pt-[12vh] pb-20 rounded-b-[4rem] shadow-2xl relative z-0"
      >
        {/* Subtle inner-glow overlay */}
        <div className="absolute inset-0 bg-white/[0.03] pointer-events-none" />

        <div className="max-w-sm mx-auto flex flex-col items-center text-center">
          <motion.div 
            initial={{ scale: 0.5, rotate: -25, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ 
              delay: 0.3, 
              type: 'spring', 
              stiffness: 150, 
              damping: 15 
            }}
            className="w-24 h-24 bg-white/10 backdrop-blur-2xl rounded-[2.8rem] flex items-center justify-center mb-10 shadow-inner ring-1 ring-white/20 relative"
          >
            {/* Spinning ring glow */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-1 rounded-[3rem] border border-white/5 border-t-white/20"
            />
            
            <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none">
              <motion.path 
                d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
              />
            </svg>
          </motion.div>

          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-white text-5xl font-black tracking-tighter"
          >
            At GreenCup
          </motion.h1>
          <motion.p 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-emerald-100/90 text-sm font-black uppercase tracking-[0.2em] mt-3"
          >
            Production Hub
          </motion.p>
        </div>
      </motion.div>

      {/* Login Form Container */}
      <div className="flex-1 px-6 relative z-10 -mt-12">
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-sm mx-auto bg-white/95 backdrop-blur-3xl rounded-[3rem] shadow-2xl shadow-emerald-950/20 p-10 border border-white/80"
        >
          <div className="mb-10">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Sign In</h2>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">Access your workspace</p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="mb-8 p-5 bg-red-50/80 border border-red-100 rounded-2xl flex gap-4 items-start"
              >
                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                   <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-sm text-red-800 font-bold leading-snug">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field with focus glow */}
            <motion.div 
              animate={{ 
                scale: focusedField === 'email' ? 1.02 : 1,
                boxShadow: focusedField === 'email' ? '0 10px 30px -10px rgba(16, 185, 129, 0.2)' : 'none'
              }}
              className="rounded-2xl transition-all duration-300"
            >
              <Input
                label="Security Email"
                type="email"
                placeholder="operator@greencup.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                autoComplete="email"
                className="!h-14 !rounded-2xl !bg-gray-50/50 border-gray-100 focus:border-emerald-500/50"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />
            </motion.div>

            {/* Password Field with focus glow */}
            <motion.div 
              animate={{ 
                scale: focusedField === 'password' ? 1.02 : 1,
                boxShadow: focusedField === 'password' ? '0 10px 30px -10px rgba(16, 185, 129, 0.2)' : 'none'
              }}
              className="rounded-2xl transition-all duration-300"
            >
              <Input
                label="Access Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                autoComplete="current-password"
                className="!h-14 !rounded-2xl !bg-gray-50/50 border-gray-100 focus:border-emerald-500/50"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
                rightIcon={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-2 hover:bg-white rounded-xl transition-all">
                    {showPassword ? (
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                }
              />
            </motion.div>

            {/* Juicy Sign In Button */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              transition={{ delay: 0.9 }} 
              className="pt-6"
            >
              <Button 
                type="submit" 
                fullWidth 
                loading={loading} 
                size="lg" 
                whileHover={{ scale: 1.02, boxShadow: '0 20px 40px -10px rgba(16, 185, 129, 0.4)' }}
                whileTap={{ scale: 0.98 }}
                className="!h-16 !rounded-[1.5rem] !bg-emerald-600 hover:!bg-emerald-700 shadow-2xl shadow-emerald-600/30 text-xl font-black tracking-tight"
              >
                Sign In Portal
              </Button>
            </motion.div>
          </form>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 1.3, duration: 2 }}
          className="text-center mt-12 mb-10"
        >
          <p className="text-xs text-gray-400 font-black uppercase tracking-[0.3em]">
            Secured Infrastructure v3.0
          </p>
        </motion.div>
      </div>
    </PageTransition>
  );
};
