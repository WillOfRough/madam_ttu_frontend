import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from './store/authStore';

// Layout
import DashboardLayout from './components/DashboardLayout';
import RequireAuth from './components/RequireAuth';

// Public pages
import Login from './pages/public/Login';
import RegisterManager from './pages/public/RegisterManager';
import ConnectManager from './pages/public/ConnectManager';
import InviteValidation from './pages/public/InviteValidation';
import SeekerOath from './pages/public/SeekerOath';
import SeekerForm from './pages/public/SeekerForm';
import ApplyComplete from './pages/public/ApplyComplete';
import ExpiredLink from './pages/public/ExpiredLink';
import NotFound from './pages/public/NotFound';

// Dashboard pages
import DashboardHome from './pages/dashboard/DashboardHome';
import SeekerList from './pages/dashboard/SeekerList';
import SeekerDetail from './pages/dashboard/SeekerDetail';
import Connections from './pages/dashboard/Connections';
import InviteManagement from './pages/dashboard/InviteManagement';
import ExportPage from './pages/dashboard/ExportPage';
import Settings from './pages/dashboard/Settings';

function AuthListener() {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      navigate('/login', { state: { from: location } });
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [navigate, logout, location]);

  return null;
}

function RootRedirect() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  return <Navigate to={isLoggedIn ? '/dashboard' : '/login'} replace />;
}

export default function App() {
  const checkSession = useAuthStore((s) => s.checkSession);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <BrowserRouter>
      <AuthListener />
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register/:token" element={<RegisterManager />} />
        <Route path="/connect/:token" element={<ConnectManager />} />
        <Route path="/invite/:token" element={<InviteValidation />} />
        <Route path="/apply/oath/:token" element={<SeekerOath />} />
        <Route path="/apply/:token" element={<SeekerForm />} />
        <Route path="/apply/complete" element={<ApplyComplete />} />
        <Route path="/expired" element={<ExpiredLink />} />

        {/* Dashboard (auth required) */}
        <Route element={<RequireAuth />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/dashboard/seekers" element={<SeekerList />} />
            <Route path="/dashboard/seekers/:seekerId" element={<SeekerDetail />} />
            <Route path="/dashboard/connections" element={<Connections />} />
            <Route path="/dashboard/invites" element={<InviteManagement />} />
            <Route path="/dashboard/export" element={<ExportPage />} />
            <Route path="/dashboard/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
