import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from './store/authStore';

// Layout
import DashboardLayout from './components/DashboardLayout';
import RequireAuth from './components/RequireAuth';

// Public pages
import Login from './pages/public/Login';
import RegisterManager from './pages/public/RegisterManager';
import Signup from './pages/public/Signup';
import ConnectManager from './pages/public/ConnectManager';
import InviteValidation from './pages/public/InviteValidation';
import ClientOath from './pages/public/ClientOath';
import ManagerOath from './pages/public/ManagerOath';
import ClientForm from './pages/public/ClientForm';
import ApplyComplete from './pages/public/ApplyComplete';
import ExpiredLink from './pages/public/ExpiredLink';
import NotFound from './pages/public/NotFound';
import ProposalProfile from './pages/public/ProposalProfile';
import ProposalSchedule from './pages/public/ProposalSchedule';
import ProposalAfter from './pages/public/ProposalAfter';

// Dashboard pages
import DashboardHome from './pages/dashboard/DashboardHome';
import ClientList from './pages/dashboard/ClientList';
import ClientDetail from './pages/dashboard/ClientDetail';
import Connections from './pages/dashboard/Connections';
import InviteManagement from './pages/dashboard/InviteManagement';
import Settings from './pages/dashboard/Settings';
import MatchList from './pages/dashboard/MatchList';
import MatchDetail from './pages/dashboard/MatchDetail';
import ManagerGuide from './pages/dashboard/ManagerGuide';

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
        <Route path="/signup/oath" element={<ManagerOath />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/register/:token" element={<RegisterManager />} />
        <Route path="/connect/:token" element={<ConnectManager />} />
        <Route path="/invite/:token" element={<InviteValidation />} />
        <Route path="/apply/oath/:token" element={<ClientOath />} />
        <Route path="/apply/:token" element={<ClientForm />} />
        <Route path="/apply/complete" element={<ApplyComplete />} />
        <Route path="/expired" element={<ExpiredLink />} />
        <Route path="/proposal/:token" element={<ProposalProfile />} />
        <Route path="/proposal/:token/profile" element={<ProposalProfile />} />
        <Route path="/proposal/:token/available-times" element={<ProposalSchedule />} />
        <Route path="/proposal/:token/schedule" element={<ProposalSchedule />} />
        <Route path="/proposal/:token/after" element={<ProposalAfter />} />

        {/* Dashboard (auth required) */}
        <Route element={<RequireAuth />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/dashboard/clients" element={<ClientList />} />
            <Route path="/dashboard/clients/:clientId" element={<ClientDetail />} />
            <Route path="/dashboard/connections" element={<Connections />} />
            <Route path="/dashboard/invites" element={<InviteManagement />} />
            <Route path="/dashboard/matches" element={<MatchList />} />
            <Route path="/dashboard/matches/:matchId" element={<MatchDetail />} />
            <Route path="/dashboard/settings" element={<Settings />} />
            <Route path="/dashboard/guide" element={<ManagerGuide />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
