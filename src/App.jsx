import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from './store/authStore';

// Layout
import DashboardLayout from './components/DashboardLayout';
import RequireAuth from './components/RequireAuth';
import RequireAdmin from './components/RequireAdmin';

// Public pages
import Login from './pages/public/Login';
import ForgotPassword from './pages/public/ForgotPassword';
import RegisterManager from './pages/public/RegisterManager';
import ConnectManager from './pages/public/ConnectManager';
import InviteValidation from './pages/public/InviteValidation';
import ServiceIntro from './pages/public/ServiceIntro';
import EventIntro from './pages/public/EventIntro';
import About from './pages/public/About';
import AboutManager from './pages/public/AboutManager';
import ClientOath from './pages/public/ClientOath';
import ClientForm from './pages/public/ClientForm';
import ApplyComplete from './pages/public/ApplyComplete';
import ExpiredLink from './pages/public/ExpiredLink';
import NotFound from './pages/public/NotFound';
import ProposalProfile from './pages/public/ProposalProfile';
import ProposalSchedule from './pages/public/ProposalSchedule';
import ProposalAfter from './pages/public/ProposalAfter';
import ProposalAfterResult from './pages/public/ProposalAfterResult';
import MyProfile from './pages/public/MyProfile';
import ClientInquiry from './pages/public/ClientInquiry';

// Dashboard pages
import DashboardHome from './pages/dashboard/DashboardHome';
import ClientList from './pages/dashboard/ClientList';
import ClientDetail from './pages/dashboard/ClientDetail';
import Connections from './pages/dashboard/Connections';
import InviteManagement from './pages/dashboard/InviteManagement';
import Settings from './pages/dashboard/Settings';
import Settlement from './pages/dashboard/Settlement';
import MatchList from './pages/dashboard/MatchList';
import MatchDetail from './pages/dashboard/MatchDetail';
import ManagerGuide from './pages/dashboard/ManagerGuide';
import Notifications from './pages/dashboard/Notifications';
import InquiryList from './pages/dashboard/InquiryList';
import More from './pages/dashboard/More';

// Admin pages
import AdminDashboard from './pages/dashboard/admin/AdminDashboard';
import AdminSettlement from './pages/dashboard/admin/AdminSettlement';

function AuthListener() {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((s) => s.logout);
  const checkSession = useAuthStore((s) => s.checkSession);
  const locationRef = useRef(location);
  locationRef.current = location;

  useEffect(() => {
    let checking = false;
    let lastCheckTime = 0;
    const handleUnauthorized = async () => {
      if (checking) return;
      // 60초 내 중복 호출 방지
      const now = Date.now();
      if (now - lastCheckTime < 60000) return;
      lastCheckTime = now;
      checking = true;
      try {
        const valid = await checkSession();
        // valid === false 는 서버가 401 로 세션 만료를 확정한 경우만 해당.
        // null(네트워크 실패 등 판정 불가)은 멀쩡한 세션을 끊지 않도록 로그아웃하지 않는다.
        if (valid === false) {
          logout();
          navigate('/login', { state: { from: locationRef.current } });
        }
      } finally {
        checking = false;
      }
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [navigate, logout, checkSession]);

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

  // 탭 전환 복귀 시 세션 재검증
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && useAuthStore.getState().isLoggedIn) {
        checkSession();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [checkSession]);

  return (
    <BrowserRouter>
      <AuthListener />
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/signup/oath" element={<Navigate to="/login" replace />} />
        <Route path="/signup" element={<Navigate to="/login" replace />} />
        <Route path="/register/:token" element={<RegisterManager />} />
        <Route path="/connect/:token" element={<ConnectManager />} />
        <Route path="/invite/:token" element={<InviteValidation />} />
        <Route path="/apply/intro/:token" element={<ServiceIntro />} />
        <Route path="/event/:token" element={<EventIntro />} />
        <Route path="/about" element={<About />} />
        <Route path="/about/manager" element={<AboutManager />} />
        <Route path="/apply/oath/:token" element={<ClientOath />} />
        <Route path="/apply/:token" element={<ClientForm />} />
        <Route path="/apply/complete" element={<ApplyComplete />} />
        <Route path="/expired" element={<ExpiredLink />} />
        <Route path="/proposal/:token" element={<ProposalProfile />} />
        <Route path="/proposal/:token/profile" element={<ProposalProfile />} />
        <Route path="/proposal/:token/available-times" element={<ProposalSchedule />} />
        <Route path="/proposal/:token/schedule" element={<ProposalSchedule />} />
        <Route path="/proposal/:token/after" element={<ProposalAfter />} />
        <Route path="/proposal/:token/after/result" element={<ProposalAfterResult />} />
        <Route path="/my-profile" element={<MyProfile />} />
        <Route path="/inquiry" element={<ClientInquiry />} />

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
            <Route path="/dashboard/notifications" element={<Notifications />} />
            <Route path="/dashboard/settings" element={<Settings />} />
            <Route path="/dashboard/settlement" element={<Settlement />} />
            <Route path="/dashboard/guide" element={<ManagerGuide />} />
            <Route path="/dashboard/inquiries" element={<InquiryList />} />
            <Route path="/dashboard/more" element={<More />} />

            {/* 관리자(운영자) 전용 — role === 'admin' 게이트 */}
            <Route element={<RequireAdmin />}>
              <Route path="/dashboard/admin" element={<AdminDashboard />} />
              <Route path="/dashboard/admin/managers" element={<Navigate to="/dashboard/admin?tab=managers" replace />} />
              <Route path="/dashboard/admin/settlements" element={<AdminSettlement />} />
            </Route>
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
