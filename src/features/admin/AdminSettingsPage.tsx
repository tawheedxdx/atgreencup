import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MobileHeader } from '../../components/layout/MobileHeader';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useAdminSettingsStore } from '../../store/adminSettingsStore';
import { updateUserName, updateUserProfilePhoto } from '../../services/users.service';
import { uploadProfilePhoto } from '../../services/storage.service';

export const AdminSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, logout, updateProfile } = useAuthStore();
  const { theme, toggleTheme } = useSettingsStore();
  const { settings, updateSettings } = useAdminSettingsStore();

  const [showLogout, setShowLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Edit
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Factory Settings Form States
  const [factoryName, setFactoryName] = useState(settings.factoryName);
  const [factoryAddress, setFactoryAddress] = useState(settings.factoryAddress);
  const [contactNumber, setContactNumber] = useState(settings.contactNumber);
  const [managerEmail, setManagerEmail] = useState(settings.managerEmail);

  // Attendance Form States
  const [shiftStartTime, setShiftStartTime] = useState(settings.shiftStartTime);
  const [shiftEndTime, setShiftEndTime] = useState(settings.shiftEndTime);
  const [gracePeriod, setGracePeriod] = useState(settings.gracePeriodMinutes);
  
  const [savingFactory, setSavingFactory] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate('/login', { replace: true });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
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
      showToast('Profile photo updated successfully!');
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

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleSaveFactory = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingFactory(true);
    try {
      updateSettings({
        factoryName,
        factoryAddress,
        contactNumber,
        managerEmail,
      });
      showToast('Factory configuration updated successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setSavingFactory(false);
    }
  };

  const handleSaveAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAttendance(true);
    try {
      updateSettings({
        shiftStartTime,
        shiftEndTime,
        gracePeriodMinutes: Number(gracePeriod),
      });
      showToast('Attendance & shift rules saved!');
    } catch (err) {
      console.error(err);
    } finally {
      setSavingAttendance(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50 dark:bg-dark-bg pb-6">
      <MobileHeader title="Factory Settings" />

      <div className="px-4 mt-6 space-y-6">
        {/* Success Toast */}
        {successMsg && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white font-black text-xs uppercase tracking-widest px-4 py-3 rounded-full shadow-lg z-50 animate-bounce">
            {successMsg}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-3xl p-5 shadow-premium flex flex-col items-center relative overflow-hidden">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoUpload}
            accept="image/*"
            className="hidden"
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-24 h-24 bg-gradient-to-tr from-emerald-500 to-emerald-300 rounded-full flex items-center justify-center mb-4 shadow-xl shadow-emerald-500/30 border-4 border-white dark:border-dark-bg cursor-pointer relative overflow-hidden group"
          >
            {profile.photoUrl ? (
              <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-extrabold text-white">
                {profile.name?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            )}
            <div className="absolute inset-0 bg-black/40 items-center justify-center transition-opacity duration-200 hidden group-hover:flex">
              {uploadingPhoto ? (
                <span className="text-white text-xs font-bold">{uploadProgress}%</span>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </div>
          </div>

          {isEditingName ? (
            <div className="flex flex-col items-center gap-2 w-full max-w-[200px] mt-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-gray-50 dark:bg-dark-bg border border-emerald-500/50 rounded-xl px-3 py-1.5 text-center text-sm text-gray-900 dark:text-white font-bold focus:outline-none"
                autoFocus
              />
              <div className="flex gap-2 w-full">
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  className="flex-1 py-1 text-xs font-bold text-gray-400 bg-gray-100 dark:bg-dark-bg rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingName}
                  onClick={async () => {
                    if (!editName.trim()) return;
                    setSavingName(true);
                    try {
                      await updateUserName(profile.uid, editName.trim());
                      updateProfile({ name: editName.trim() });
                      setIsEditingName(false);
                      showToast('Profile name updated!');
                    } catch (err) {
                      console.error('Failed to update name:', err);
                    } finally {
                      setSavingName(false);
                    }
                  }}
                  className="flex-1 py-1 text-xs font-bold text-white bg-emerald-500 rounded-lg"
                >
                  {savingName ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-2">
              <h2 className="text-xl font-black text-gray-900 dark:text-emerald-50 tracking-tight">
                {profile.name || 'Admin'}
              </h2>
              <button
                onClick={() => {
                  setEditName(profile.name || '');
                  setIsEditingName(true);
                }}
                className="p-1 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 bg-gray-50 dark:bg-dark-bg rounded-full"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          )}

          <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-1 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            {profile.role}
          </p>
        </div>

        {/* Global Options */}
        <div className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-3xl p-5 shadow-premium space-y-4">
          <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2">System Appearance</h3>
          <div className="flex items-center justify-between border-b border-gray-50 dark:border-dark-border/50 pb-4">
            <span className="text-sm font-bold text-gray-800 dark:text-emerald-50">Theme Settings</span>
            <button
              onClick={toggleTheme}
              className="px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border text-xs font-black rounded-2xl text-emerald-600 dark:text-emerald-400 uppercase tracking-widest active:scale-95 transition-all flex items-center gap-2"
            >
              {theme === 'dark' ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                  </svg>
                  Light Mode
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  Dark Mode
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mockup Factory Settings */}
        <form onSubmit={handleSaveFactory} className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-3xl p-5 shadow-premium space-y-4">
          <div>
            <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Mockup Factory Config</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Configure mocked system details</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Factory Name</label>
              <input
                type="text"
                required
                value={factoryName}
                onChange={(e) => setFactoryName(e.target.value)}
                className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl px-4 py-3 text-sm text-gray-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Factory Address</label>
              <input
                type="text"
                required
                value={factoryAddress}
                onChange={(e) => setFactoryAddress(e.target.value)}
                className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl px-4 py-3 text-sm text-gray-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Contact Number</label>
                <input
                  type="text"
                  required
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl px-4 py-3 text-sm text-gray-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Manager Email</label>
                <input
                  type="email"
                  required
                  value={managerEmail}
                  onChange={(e) => setManagerEmail(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl px-4 py-3 text-sm text-gray-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            fullWidth
            loading={savingFactory}
            className="!rounded-2xl shadow-sm"
          >
            Save Factory Config
          </Button>
        </form>

        {/* Shift & Attendance Settings */}
        <form onSubmit={handleSaveAttendance} className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-3xl p-5 shadow-premium space-y-4">
          <div>
            <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Attendance & Shift Rules</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Configure grace periods & standard shift hours</p>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Shift Start Time</label>
                <input
                  type="time"
                  required
                  value={shiftStartTime}
                  onChange={(e) => setShiftStartTime(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl px-4 py-3 text-sm text-gray-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Shift End Time</label>
                <input
                  type="time"
                  required
                  value={shiftEndTime}
                  onChange={(e) => setShiftEndTime(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl px-4 py-3 text-sm text-gray-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                Grace Period (Minutes)
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="0"
                  max="120"
                  value={gracePeriod}
                  onChange={(e) => setGracePeriod(Number(e.target.value))}
                  className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl pl-4 pr-16 py-3 text-sm text-gray-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400 dark:text-gray-500 uppercase">
                  Mins
                </span>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            fullWidth
            loading={savingAttendance}
            className="!rounded-2xl shadow-sm"
          >
            Save Shift Rules
          </Button>
        </form>

        {/* Logout Button */}
        <button
          onClick={() => setShowLogout(true)}
          className="w-full bg-red-500/10 dark:bg-red-500/5 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-black uppercase text-xs tracking-widest py-4 px-6 rounded-3xl border border-red-500/20 active:opacity-85 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Log Out Admin Portal
        </button>
      </div>

      <ConfirmDialog
        open={showLogout}
        title="Sign Out"
        message="Are you sure you want to sign out of the Admin Portal?"
        confirmLabel="Sign Out"
        variant="danger"
        loading={loggingOut}
        onConfirm={handleLogout}
        onCancel={() => setShowLogout(false)}
      />
    </div>
  );
};
