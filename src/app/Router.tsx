import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AppShell } from '../components/layout/AppShell';
import { ProtectedRoute } from '../routes/ProtectedRoute';

// Auth screens
import { SplashScreen } from '../features/auth/SplashScreen';
import { LoginScreen } from '../features/auth/LoginScreen';
import { WelcomeScreen } from '../features/auth/WelcomeScreen';

// Feature screens
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { NewEntryPage } from '../features/entries/NewEntryPage';
import { PastEntriesPage } from '../features/entries/PastEntriesPage';
import { EntryDetailsPage } from '../features/entries/EntryDetailsPage';
import { EditEntryPage } from '../features/entries/EditEntryPage';
import { ProfilePage } from '../features/profile/ProfilePage';
import { TrendsPage } from '../features/trends/TrendsPage';
import { EarningsPage } from '../features/earnings/EarningsPage';
import { IssuesPage } from '../features/issues/IssuesPage';
import { ReportIssuePage } from '../features/issues/ReportIssuePage';
import { IssueDetailsPage } from '../features/issues/IssueDetailsPage';

export const AnimatedRoutes: React.FC = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/" element={<SplashScreen />} />
        <Route path="/login" element={<LoginScreen />} />

        {/* Protected routes without bottom nav */}
        <Route path="/welcome" element={
          <ProtectedRoute><WelcomeScreen /></ProtectedRoute>
        } />

        {/* Protected routes with app shell (bottom nav) */}
        <Route element={
          <ProtectedRoute><AppShell /></ProtectedRoute>
        }>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/trends" element={<TrendsPage />} />
          <Route path="/entries" element={<PastEntriesPage />} />
          <Route path="/entries/new" element={<NewEntryPage />} />
          <Route path="/entries/:id" element={<EntryDetailsPage />} />
          <Route path="/entries/:id/edit" element={<EditEntryPage />} />
          <Route path="/earnings" element={<EarningsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/issues" element={<IssuesPage />} />
          <Route path="/issues/new" element={<ReportIssuePage />} />
          <Route path="/issues/:id" element={<IssueDetailsPage />} />
          <Route path="/issues/:id/edit" element={<ReportIssuePage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

export const AppRouter: React.FC = () => (
  <BrowserRouter>
    <AnimatedRoutes />
  </BrowserRouter>
);
