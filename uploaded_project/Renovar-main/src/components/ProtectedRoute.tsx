import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';

type AppRole = 'patient' | 'doctor' | 'admin';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
  skipProfileCheck?: boolean;
}

export default function ProtectedRoute({ children, allowedRoles, skipProfileCheck = false }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, userRole } = useAuth();
  const { isProfileComplete, isLoading: isProfileLoading } = useProfile();
  const location = useLocation();

  if (isLoading || isProfileLoading) {
    return (
      <div className="min-h-[100dvh] bg-gradient-health flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if profile is complete (only for patients, skip for doctors/admins and specific routes)
  if (!skipProfileCheck && userRole === 'patient' && !isProfileComplete && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  // Check role if allowedRoles is specified
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard based on role
    if (userRole === 'doctor') {
      return <Navigate to="/doctor" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
