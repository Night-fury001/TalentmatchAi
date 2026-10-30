import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PageTransition from './components/PageTransition';
import ProtectedRoute from './components/ProtectedRoute';

import PublicLayout from './layouts/PublicLayout';
import ClientLayout from './layouts/ClientLayout';

import LandingPage from './pages/LandingPage';
import NotFoundPage from './pages/NotFoundPage';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';

import JobExplorerPage from './pages/client/JobExplorerPage';
import JobDetailPage from './pages/client/JobDetailPage';
import DashboardPage from './pages/client/DashboardPage';
import RecommendationsPage from './pages/client/RecommendationsPage';
import ApplicationsPage from './pages/client/ApplicationsPage';
import SavedJobsPage from './pages/client/SavedJobsPage';
import ProfilePage from './pages/client/ProfilePage';

import RecruiterLayout from './layouts/RecruiterLayout';
import RecruiterDashboardPage from './pages/recruiter/RecruiterDashboardPage';
import CompaniesPage from './pages/recruiter/CompaniesPage';
import JobsPage from './pages/recruiter/JobsPage';
import JobFormPage from './pages/recruiter/JobFormPage';
import JobPipelinePage from './pages/recruiter/JobPipelinePage';
import ApplicationsOverviewPage from './pages/recruiter/ApplicationsOverviewPage';

import AdminLayout from './layouts/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import UsersPage from './pages/admin/UsersPage';
import AdminCompaniesPage from './pages/admin/CompaniesPage';
import JobsModerationPage from './pages/admin/JobsModerationPage';
import TaxonomyPage from './pages/admin/TaxonomyPage';
import ActivityLogPage from './pages/admin/ActivityLogPage';

function withTransition(element) {
  return <PageTransition>{element}</PageTransition>;
}

export default function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public marketing + job browsing + auth */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={withTransition(<LandingPage />)} />
          <Route path="/jobs" element={withTransition(<JobExplorerPage />)} />
          <Route path="/jobs/:slug" element={withTransition(<JobDetailPage />)} />
          <Route path="/login" element={withTransition(<LoginPage />)} />
          <Route path="/register" element={withTransition(<RegisterPage />)} />
          <Route path="/forgot-password" element={withTransition(<ForgotPasswordPage />)} />
          <Route path="/reset-password/:token" element={withTransition(<ResetPasswordPage />)} />
          <Route path="/verify-email/:token" element={withTransition(<VerifyEmailPage />)} />
        </Route>

        {/* Client (job seeker) module */}
        <Route element={<ProtectedRoute allowedRoles={['CLIENT']} />}>
          <Route element={<ClientLayout />}>
            <Route path="/client/dashboard" element={withTransition(<DashboardPage />)} />
            <Route path="/client/recommendations" element={withTransition(<RecommendationsPage />)} />
            <Route path="/client/applications" element={withTransition(<ApplicationsPage />)} />
            <Route path="/client/saved-jobs" element={withTransition(<SavedJobsPage />)} />
            <Route path="/client/profile" element={withTransition(<ProfilePage />)} />
          </Route>
        </Route>

        {/* Recruiter (ATS) module */}
        <Route element={<ProtectedRoute allowedRoles={['RECRUITER']} />}>
          <Route element={<RecruiterLayout />}>
            <Route path="/recruiter/dashboard" element={withTransition(<RecruiterDashboardPage />)} />
            <Route path="/recruiter/companies" element={withTransition(<CompaniesPage />)} />
            <Route path="/recruiter/jobs" element={withTransition(<JobsPage />)} />
            <Route path="/recruiter/jobs/new" element={withTransition(<JobFormPage />)} />
            <Route path="/recruiter/jobs/:id/edit" element={withTransition(<JobFormPage />)} />
            <Route path="/recruiter/jobs/:jobId/pipeline" element={withTransition(<JobPipelinePage />)} />
            <Route path="/recruiter/applications" element={withTransition(<ApplicationsOverviewPage />)} />
          </Route>
        </Route>

        {/* Admin (Platform Command Center) module */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={withTransition(<AdminDashboardPage />)} />
            <Route path="/admin/users" element={withTransition(<UsersPage />)} />
            <Route path="/admin/companies" element={withTransition(<AdminCompaniesPage />)} />
            <Route path="/admin/jobs" element={withTransition(<JobsModerationPage />)} />
            <Route path="/admin/taxonomy" element={withTransition(<TaxonomyPage />)} />
            <Route path="/admin/activity-log" element={withTransition(<ActivityLogPage />)} />
          </Route>
        </Route>

        <Route path="*" element={withTransition(<NotFoundPage />)} />
      </Routes>
    </AnimatePresence>
  );
}
