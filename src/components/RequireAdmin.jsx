import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

// admin 전용 라우트 가드. 로그인 + role === 'admin' 일 때만 통과.
// 로그인 안 했으면 /login, 로그인했지만 admin 이 아니면 /dashboard 로 돌려보낸다.
// role 은 authStore 에 persist 되므로 새로고침 직후에도 즉시 판별 가능.
export default function RequireAdmin() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const isAdmin = useAuthStore((s) => s.role === 'admin');
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
