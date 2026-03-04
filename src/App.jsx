import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import FormContainer from './pages/form/FormContainer';
import AdminLogin from './pages/admin/AdminLogin';
import Dashboard from './pages/admin/Dashboard';
import useAuthStore from './store/authStore';
import useAdminStore from './store/adminStore';

function AuthListener() {
  const navigate = useNavigate();
  const authLogout = useAuthStore((s) => s.logout);
  const adminLogout = useAdminStore((s) => s.logout);

  useEffect(() => {
    const handleUnauthorized = () => {
      authLogout();
      adminLogout();
      navigate('/');
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [navigate, authLogout, adminLogout]);

  return null;
}

export default function App() {
  const checkSession = useAuthStore((s) => s.checkSession);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <BrowserRouter>
      <AuthListener />
      <Layout>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/form" element={<FormContainer />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<Dashboard />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
