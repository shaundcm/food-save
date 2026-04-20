import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedLayout, PublicLayout } from './components/shared/Layouts';

// Pages
import AuthPage           from './pages/AuthPage';
import DashboardPage      from './pages/DashboardPage';
import BrowsePage         from './pages/BrowsePage';
import CreateListingPage  from './pages/CreateListingPage';
import MyListingsPage     from './pages/MyListingsPage';
import MyClaimsPage       from './pages/MyClaimsPage';
import NotificationsPage  from './pages/NotificationsPage';
import AdminUsersPage     from './pages/AdminUsersPage';
import AdminListingsPage  from './pages/AdminListingsPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route path="/login"    element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
      </Route>

      {/* All authenticated users */}
      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard"     element={<DashboardPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>

      {/* Donor + Admin */}
      <Route element={<ProtectedLayout allowedRoles={['DONOR', 'ADMIN']} />}>
        <Route path="/listings/new" element={<CreateListingPage />} />
        <Route path="/my-listings"  element={<MyListingsPage />} />
      </Route>

      {/* Recipient + Admin */}
      <Route element={<ProtectedLayout allowedRoles={['RECIPIENT', 'ADMIN']} />}>
        <Route path="/browse"    element={<BrowsePage />} />
        <Route path="/my-claims" element={<MyClaimsPage />} />
      </Route>

      {/* Admin only */}
      <Route element={<ProtectedLayout allowedRoles={['ADMIN']} />}>
        <Route path="/admin/users"     element={<AdminUsersPage />} />
        <Route path="/admin/listings"  element={<AdminListingsPage />} />
        <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="/"   element={<Navigate to="/dashboard" replace />} />
      <Route path="*"   element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
