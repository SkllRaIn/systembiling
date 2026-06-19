import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth.js'

// Public pages
import LandingPage from './pages/public/LandingPage.jsx'
import LoginPage from './pages/public/LoginPage.jsx'
import RegisterPage from './pages/public/RegisterPage.jsx'
import ForgotPasswordPage from './pages/public/ForgotPasswordPage.jsx'
import ResetPasswordPage from './pages/public/ResetPasswordPage.jsx'
import VerifyEmailPage from './pages/public/VerifyEmailPage.jsx'
import PrivacyPage from './pages/public/PrivacyPage.jsx'

// Protected pages (сохранить из оригинала)
import AdminLayout from './pages/admin/AdminLayout.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AdminUsers from './pages/admin/AdminUsers.jsx'
import AdminInvoices from './pages/admin/AdminInvoices.jsx'
import AdminServices from './pages/admin/AdminServices.jsx'
import ClientLayout from './pages/client/ClientLayout.jsx'
import ClientDashboard from './pages/client/ClientDashboard.jsx'
import ClientInvoices from './pages/client/ClientInvoices.jsx'
import ClientTickets from './pages/client/ClientTickets.jsx'
import ClientTicketDetail from './pages/client/ClientTicketDetail.jsx'
import StaffLayout from './pages/sysadmin/StaffLayout.jsx'
import KanbanBoard from './pages/sysadmin/KanbanBoard.jsx'
import TicketQueue from './pages/sysadmin/TicketQueue.jsx'
import AdsLayout from './pages/ads/AdsLayout.jsx'
import AdsDashboard from './pages/ads/AdsDashboard.jsx'
import AdsCampaigns from './pages/ads/AdsCampaigns.jsx'
import AdsDeposit from './pages/ads/AdsDeposit.jsx'

function RequireAuth({ children, roles }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />

      {/* Client cabinet */}
      <Route path="/cabinet" element={
        <RequireAuth roles={['CLIENT']}>
          <ClientLayout />
        </RequireAuth>
      }>
        <Route index element={<ClientDashboard />} />
        <Route path="invoices" element={<ClientInvoices />} />
        <Route path="tickets" element={<ClientTickets />} />
        <Route path="tickets/:id" element={<ClientTicketDetail />} />
      </Route>

      {/* Staff */}
      <Route path="/staff" element={
        <RequireAuth roles={['SYSADMIN', 'ADMIN']}>
          <StaffLayout />
        </RequireAuth>
      }>
        <Route index element={<TicketQueue />} />
        <Route path="kanban" element={<KanbanBoard />} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={
        <RequireAuth roles={['ADMIN']}>
          <AdminLayout />
        </RequireAuth>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="invoices" element={<AdminInvoices />} />
        <Route path="services" element={<AdminServices />} />
      </Route>

      {/* Ads */}
      <Route path="/ads" element={
        <RequireAuth roles={['ADS_MANAGER', 'ADMIN']}>
          <AdsLayout />
        </RequireAuth>
      }>
        <Route index element={<AdsDashboard />} />
        <Route path="campaigns" element={<AdsCampaigns />} />
        <Route path="deposit" element={<AdsDeposit />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
