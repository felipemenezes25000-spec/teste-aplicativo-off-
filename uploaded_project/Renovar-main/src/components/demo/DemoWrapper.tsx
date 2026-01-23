import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDemo, DemoRole } from '@/contexts/DemoContext';
import { DemoBadge } from './DemoBadge';

interface DemoWrapperProps {
  children: ReactNode;
  requiredRole: DemoRole;
}

export function DemoWrapper({ children, requiredRole }: DemoWrapperProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDemoMode, demoRole, enterDemoMode } = useDemo();

  useEffect(() => {
    // If not in demo mode but on a demo route, enter demo mode with the required role
    if (!isDemoMode && location.pathname.startsWith('/demo/')) {
      enterDemoMode(requiredRole);
    }
    
    // If in demo mode but wrong role for this route, redirect to correct demo dashboard
    if (isDemoMode && demoRole && demoRole !== requiredRole) {
      const roleRoutes: Record<DemoRole, string> = {
        patient: '/demo/patient',
        doctor: '/demo/doctor',
        admin: '/demo/admin',
      };
      navigate(roleRoutes[demoRole]);
    }
  }, [isDemoMode, demoRole, requiredRole, location.pathname, enterDemoMode, navigate]);

  return (
    <>
      <DemoBadge />
      {/* Demo mode visual indicator - subtle border */}
      <div className="min-h-[100dvh] relative">
        <div className="absolute inset-0 pointer-events-none border-2 border-health-purple/20 rounded-lg z-[90]" />
        {children}
      </div>
    </>
  );
}
