import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AppShell } from '../components/layout/AppShell';
import { ProtectedRoute } from '../routes/ProtectedRoute';
import { RoleRedirect } from '../routes/RoleRedirect';

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

// Admin screens & shell
import { AdminShell } from '../components/layout/AdminShell';
import { AdminDashboardPage } from '../features/admin/AdminDashboardPage';
import { AdminProductionPage } from '../features/admin/AdminProductionPage';
import { AdminAttendancePage } from '../features/admin/AdminAttendancePage';
import { AdminIssuesPage } from '../features/admin/AdminIssuesPage';
import { AdminEmployeesPage } from '../features/admin/AdminEmployeesPage';
import { AdminMorePage } from '../features/admin/AdminMorePage';
import { AdminProductsPage } from '../features/admin/AdminProductsPage';
import { AdminMachinesPage } from '../features/admin/AdminMachinesPage';
import { AdminSalaryPage } from '../features/admin/AdminSalaryPage';
import { AdminReportsPage } from '../features/admin/AdminReportsPage';
import { AdminSettingsPage } from '../features/admin/AdminSettingsPage';
import { AdminSearchPage } from '../features/admin/AdminSearchPage';

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

        {/* Protected operator routes with app shell (bottom nav) */}
        <Route element={
          <ProtectedRoute allowedRoles={['operator', 'employee']}><AppShell /></ProtectedRoute>
        }>
          <Route path="/operator/dashboard" element={<DashboardPage />} />
          <Route path="/operator/trends" element={<TrendsPage />} />
          <Route path="/operator/entries" element={<PastEntriesPage />} />
          <Route path="/operator/entries/new" element={<NewEntryPage />} />
          <Route path="/operator/entries/:id" element={<EntryDetailsPage />} />
          <Route path="/operator/entries/:id/edit" element={<EditEntryPage />} />
          <Route path="/operator/earnings" element={<EarningsPage />} />
          <Route path="/operator/profile" element={<ProfilePage />} />
          <Route path="/operator/issues" element={<IssuesPage />} />
          <Route path="/operator/issues/new" element={<ReportIssuePage />} />
          <Route path="/operator/issues/:id" element={<IssueDetailsPage />} />
          <Route path="/operator/issues/:id/edit" element={<ReportIssuePage />} />
        </Route>

        {/* Protected admin routes with admin shell (bottom nav) */}
        <Route element={
          <ProtectedRoute allowedRoles={['admin']}><AdminShell /></ProtectedRoute>
        }>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/production" element={<AdminProductionPage />} />
          <Route path="/admin/attendance" element={<AdminAttendancePage />} />
          <Route path="/admin/issues" element={<AdminIssuesPage />} />
          <Route path="/admin/employees" element={<AdminEmployeesPage />} />
          <Route path="/admin/more" element={<AdminMorePage />} />
          <Route path="/admin/products" element={<AdminProductsPage />} />
          <Route path="/admin/machines" element={<AdminMachinesPage />} />
          <Route path="/admin/salary" element={<AdminSalaryPage />} />
          <Route path="/admin/reports" element={<AdminReportsPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
          <Route path="/admin/search" element={<AdminSearchPage />} />
        </Route>

        {/* Top-level route redirects mapped to RoleRedirect */}
        <Route path="/dashboard" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />
        <Route path="/trends" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />
        <Route path="/entries" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />
        <Route path="/entries/*" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />
        <Route path="/earnings" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />
        <Route path="/issues" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />
        <Route path="/issues/*" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />

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
