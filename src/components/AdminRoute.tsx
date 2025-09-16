import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  console.log('🔐 [ADMIN ROUTE] isAuthenticated:', isAuthenticated, 'isLoading:', isLoading, 'user:', user);
  console.log('🔐 [ADMIN ROUTE] User role:', user?.role);
  console.log('🔐 [ADMIN ROUTE] Is admin?', user?.role === 'admin');
  console.log('🔍 [ADMIN ROUTE] location:', location.pathname);

  if (isLoading) {
    console.log('🔍 [ADMIN ROUTE] Still loading, showing loading screen');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('🔍 [ADMIN ROUTE] Not authenticated, redirecting to login');
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'admin') {
    console.log('🔍 [ADMIN ROUTE] User is not admin, redirecting to home');
    // Redirect to home page if not admin
    return <Navigate to="/" replace />;
  }

  console.log('🔍 [ADMIN ROUTE] All checks passed, rendering admin content');
  return <>{children}</>;
};

export default AdminRoute;