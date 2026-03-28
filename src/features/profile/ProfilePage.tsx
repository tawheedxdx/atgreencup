import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { MobileHeader } from '../../components/layout/MobileHeader';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';

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
  const { profile, logout } = useAuthStore();
  const [showLogout, setShowLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate('/login', { replace: true });
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileHeader title="Profile" />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="px-5 py-6 max-w-lg mx-auto"
      >
        {/* Avatar & Name */}
        <motion.div variants={itemVariants} className="flex flex-col items-center mb-8 relative">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-24 h-24 bg-gradient-to-tr from-emerald-500 to-emerald-300 rounded-full flex items-center justify-center mb-4 shadow-xl shadow-emerald-500/30 border-4 border-white z-10"
          >
            <span className="text-4xl font-extrabold text-white drop-shadow-md">
              {profile.name?.charAt(0)?.toUpperCase() || 'O'}
            </span>
          </motion.div>
          <motion.h2 variants={itemVariants} className="text-2xl font-bold text-gray-900 tracking-tight">{profile.name}</motion.h2>
          <motion.p variants={itemVariants} className="text-sm font-medium text-emerald-600 capitalize mt-0.5 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
            {profile.role}
          </motion.p>
        </motion.div>

        {/* Info Card */}
        <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-lg rounded-[2rem] p-6 shadow-sm shadow-gray-200/50 border border-white space-y-5 mb-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Account Details</h3>
          <InfoRow
            icon={
              <svg className="w-5 h-5 text-emerald-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
            label="Email Address"
            value={profile.email}
          />
          {profile.employeeId && (
            <InfoRow
              icon={
                <svg className="w-5 h-5 text-emerald-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
                </svg>
              }
              label="Employee ID"
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
              label="Assigned Machines"
              value={profile.assignedMachines.join(', ')}
            />
          )}
        </motion.div>

        {/* App Info */}
        <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-lg rounded-[2rem] p-6 shadow-sm shadow-gray-200/50 border border-white space-y-5 mb-8">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">System</h3>
          <InfoRow
            icon={
              <svg className="w-5 h-5 text-emerald-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label="App Version"
            value="1.0.0"
          />
          <InfoRow
            icon={
              <svg className="w-5 h-5 text-emerald-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label="Support Desk"
            value="Contact your administrator"
          />
        </motion.div>

        {/* Logout */}
        <motion.div variants={itemVariants} whileTap={{ scale: 0.98 }}>
          <Button
            variant="danger"
            fullWidth
            size="lg"
            className="!rounded-2xl shadow-lg shadow-red-500/20"
            onClick={() => setShowLogout(true)}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            }
          >
            Sign Out
          </Button>
        </motion.div>
      </motion.div>

      <ConfirmDialog
        open={showLogout}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmLabel="Sign Out"
        variant="danger"
        loading={loggingOut}
        onConfirm={handleLogout}
        onCancel={() => setShowLogout(false)}
      />
    </div>
  );
};

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-4 bg-gray-50/50 p-3 rounded-2xl border border-gray-100 transition-colors hover:bg-emerald-50/50">
    <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
    </div>
  </div>
);
