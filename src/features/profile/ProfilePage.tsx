import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore, Language, Theme } from '../../store/settingsStore';
import { MobileHeader } from '../../components/layout/MobileHeader';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { getEfficiencyStats } from '../../services/entries.service';
import { uploadProfilePhoto } from '../../services/storage.service';
import { updateUserProfilePhoto } from '../../services/users.service';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profile, logout, updateProfile } = useAuthStore();
  const { theme, language, setTheme, setLanguage } = useSettingsStore();
  
  const [showLogout, setShowLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [efficiency, setEfficiency] = useState<{ percentage: number; total: number; approved: number; rejected: number } | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!profile) return;
    const fetchStats = async () => {
      try {
        const stats = await getEfficiencyStats(profile.uid);
        setEfficiency(stats);
      } catch (err) {
        console.error('Failed to fetch efficiency stats:', err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, [profile]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate('/login', { replace: true });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    
    // Basic validation
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('Image size should be less than 5MB');
      return;
    }

    try {
      setUploadingPhoto(true);
      setUploadProgress(0);
      const result = await uploadProfilePhoto(profile.uid, file, (pct) => {
        setUploadProgress(Math.round(pct));
      });
      
      await updateUserProfilePhoto(profile.uid, result.url);
      updateProfile({ photoUrl: result.url });
    } catch (err) {
      console.error('Failed to upload photo:', err);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!profile) return null;

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिंदी' },
    { code: 'bn', label: 'বাংলা' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-300 pb-20">
      <MobileHeader title={t('nav.profile')} />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="px-5 py-6 max-w-lg mx-auto"
      >
        {/* Avatar & Name */}
        <motion.div variants={itemVariants} className="flex flex-col items-center mb-8 relative">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handlePhotoUpload} 
            accept="image/*" 
            className="hidden" 
          />
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            className="w-24 h-24 bg-gradient-to-tr from-emerald-500 to-emerald-300 rounded-full flex items-center justify-center mb-4 shadow-xl shadow-emerald-500/30 border-4 border-white dark:border-dark-surface z-10 cursor-pointer relative overflow-hidden group"
          >
            {profile.photoUrl ? (
              <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-extrabold text-white drop-shadow-md">
                {profile.name?.charAt(0)?.toUpperCase() || 'O'}
              </span>
            )}
            
            {/* Upload Overlay */}
            <div className={`absolute inset-0 bg-black/40 items-center justify-center transition-opacity duration-200 ${uploadingPhoto ? 'flex opacity-100' : 'hidden group-hover:flex md:hidden'}`}>
              {uploadingPhoto ? (
                <span className="text-white text-xs font-bold">{uploadProgress}%</span>
              ) : (
                <svg className="w-8 h-8 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </div>
          </motion.div>
          <motion.h2 variants={itemVariants} className="text-2xl font-bold text-gray-900 dark:text-emerald-50 tracking-tight text-center">
            {profile.name}
          </motion.h2>
          <motion.p variants={itemVariants} className="text-sm font-medium text-emerald-600 dark:text-emerald-400 capitalize mt-2 px-4 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-full border border-emerald-100 dark:border-emerald-900/50">
            {profile.role}
          </motion.p>
        </motion.div>

        {/* Efficiency Card */}
        <motion.div variants={itemVariants} className="bg-white/80 dark:bg-dark-surface/60 backdrop-blur-lg rounded-[2.5rem] p-8 shadow-xl shadow-emerald-950/5 border border-white dark:border-dark-border mb-6 flex items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <svg className="w-24 h-24 text-emerald-900 dark:text-emerald-100" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          
          {/* Progress Ring */}
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle className="text-emerald-100 dark:text-emerald-900/20" strokeWidth="10" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
              <motion.circle
                className="text-emerald-500"
                strokeWidth="10"
                strokeDasharray="251.2"
                initial={{ strokeDashoffset: 251.2 }}
                animate={{ strokeDashoffset: 251.2 - (251.2 * (efficiency?.percentage || 0)) / 100 }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="40"
                cx="50"
                cy="50"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-black text-gray-900 dark:text-emerald-50">{efficiency?.percentage || 0}%</span>
            </div>
          </div>

          <div className="flex-1">
            <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-1">{t('profile.rating')}</h3>
            <p className="text-lg font-black text-emerald-900 dark:text-emerald-100 mb-2">{t('profile.quality_hub')}</p>
            <div className="flex gap-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">{t('profile.approved')}</p>
                <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{efficiency?.approved || 0}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">{t('profile.rejected')}</p>
                <p className="text-sm font-black text-red-500">{efficiency?.rejected || 0}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Info Card */}
        <motion.div variants={itemVariants} className="bg-white/80 dark:bg-dark-surface/60 backdrop-blur-lg rounded-[2rem] p-6 shadow-sm shadow-gray-200/50 border border-white dark:border-dark-border space-y-5 mb-6">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">{t('profile.details')}</h3>
          <InfoRow
            icon={
              <svg className="w-5 h-5 text-emerald-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
            label={t('profile.email')}
            value={profile.email}
          />
          {profile.employeeId && (
            <InfoRow
              icon={
                <svg className="w-5 h-5 text-emerald-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
                </svg>
              }
              label={t('profile.emp_id')}
              value={profile.employeeId}
            />
          )}
          {profile.assignedMachines && profile.assignedMachines.length > 0 && (
            <InfoRow
              icon={
                <svg className="w-5 h-5 text-emerald-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              }
              label={t('profile.machines')}
              value={profile.assignedMachines.join(', ')}
            />
          )}
        </motion.div>

        {/* Global Settings */}
        <motion.div variants={itemVariants} className="bg-white/80 dark:bg-dark-surface/60 backdrop-blur-lg rounded-[2rem] p-6 shadow-sm shadow-gray-200/50 border border-white dark:border-dark-border mb-6">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">{t('profile.settings')}</h3>
          
          {/* Language Selector */}
          <div className="mb-6">
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-1">{t('profile.language')}</p>
            <div className="bg-gray-100 dark:bg-dark-bg p-1 rounded-2xl flex gap-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${
                    language === lang.code 
                      ? 'bg-white dark:bg-emerald-600 dark:text-white shadow-sm text-emerald-700' 
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Selector */}
          <div>
            <div className="flex items-center justify-between px-1">
              <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('profile.appearance')}</p>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase ${theme === 'light' ? 'text-emerald-600' : 'text-gray-400'}`}>{t('profile.light_mode')}</span>
                <button 
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  className="w-12 h-6 bg-gray-200 dark:bg-emerald-900/50 rounded-full relative transition-colors"
                >
                  <motion.div 
                    animate={{ x: theme === 'light' ? 2 : 26 }}
                    className="absolute top-1 left-0 w-4 h-4 bg-white dark:bg-emerald-400 rounded-full shadow-sm"
                  />
                </button>
                <span className={`text-[10px] font-black uppercase ${theme === 'dark' ? 'text-emerald-400' : 'text-gray-400'}`}>{t('profile.dark_mode')}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* App Info */}
        <motion.div variants={itemVariants} className="bg-white/80 dark:bg-dark-surface/60 backdrop-blur-lg rounded-[2rem] p-6 shadow-sm shadow-gray-200/50 border border-white dark:border-dark-border space-y-5 mb-8">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">{t('profile.system')}</h3>
          <InfoRow
            icon={
              <svg className="w-5 h-5 text-emerald-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label={t('profile.version')}
            value="2.0.0 (Mega Update)"
          />
          <InfoRow
            icon={
              <svg className="w-5 h-5 text-emerald-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label={t('profile.support')}
            value="Contact your administrator"
          />
        </motion.div>

        {/* Logout */}
        <motion.div variants={itemVariants} whileTap={{ scale: 0.98 }}>
          <Button
            variant="danger"
            fullWidth
            size="lg"
            className="!rounded-[1.5rem] shadow-lg shadow-red-500/10"
            onClick={() => setShowLogout(true)}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            }
          >
            {t('profile.sign_out')}
          </Button>
        </motion.div>
      </motion.div>

      <ConfirmDialog
        open={showLogout}
        title={t('profile.sign_out')}
        message="Are you sure you want to sign out?"
        confirmLabel={t('profile.sign_out')}
        variant="danger"
        loading={loggingOut}
        onConfirm={handleLogout}
        onCancel={() => setShowLogout(false)}
      />
    </div>
  );
};

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-4 bg-gray-50/50 dark:bg-dark-bg/40 p-3 rounded-2xl border border-gray-100 dark:border-dark-border transition-colors hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20">
    <div className="w-10 h-10 rounded-xl bg-white dark:bg-dark-surface shadow-sm border border-gray-100 dark:border-dark-border flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm font-black text-gray-900 dark:text-emerald-50 truncate">{value}</p>
    </div>
  </div>
);
