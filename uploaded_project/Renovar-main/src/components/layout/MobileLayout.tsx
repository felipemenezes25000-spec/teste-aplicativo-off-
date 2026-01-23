import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, History, MessageCircle, User, Stethoscope, ChevronLeft, Shield, Users, LayoutDashboard, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/NotificationBell';

interface MobileLayoutProps {
  children: ReactNode;
  showNav?: boolean;
  userType?: 'patient' | 'doctor' | 'admin';
  title?: string;
  showBackButton?: boolean;
  showNotifications?: boolean;
}

const patientNavItems = [
  { path: '/dashboard', icon: Home, label: 'Início' },
  { path: '/history', icon: History, label: 'Histórico' },
  { path: '/chat', icon: MessageCircle, label: 'Chat' },
  { path: '/profile', icon: User, label: 'Perfil' },
];

const doctorNavItems = [
  { path: '/doctor', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/doctor/requests', icon: FileText, label: 'Solicitações' },
  { path: '/doctor/chat', icon: MessageCircle, label: 'Chat' },
  { path: '/doctor/profile', icon: User, label: 'Perfil' },
];

const adminNavItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/users', icon: Users, label: 'Usuários' },
  { path: '/admin/doctors', icon: Stethoscope, label: 'Médicos' },
  { path: '/admin/services', icon: Shield, label: 'Serviços' },
];

export function MobileLayout({ 
  children, 
  showNav = true, 
  userType = 'patient',
  title,
  showBackButton = false,
  showNotifications = true
}: MobileLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const getNavItems = () => {
    switch (userType) {
      case 'doctor':
        return doctorNavItems;
      case 'admin':
        return adminNavItems;
      default:
        return patientNavItems;
    }
  };
  
  const navItems = getNavItems();
  const hasHeader = title || showBackButton;

  return (
    <div className="min-h-[100dvh] bg-gradient-health flex flex-col">
      {/* Header with title and back button */}
      {hasHeader && (
        <header className="sticky top-0 z-40 glass-header border-b border-border/50">
          <div className="flex items-center justify-between px-4 h-16">
            <div className="flex items-center gap-3">
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl active:bg-muted"
                  onClick={() => navigate(-1)}
                  aria-label="Voltar"
                >
                  <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                </Button>
              )}
              {title && (
                <h1 className="text-lg font-display font-bold truncate" id="page-title">{title}</h1>
              )}
            </div>
            {showNotifications && <NotificationBell />}
          </div>
        </header>
      )}

      {/* Main content */}
      <main 
        className={cn(
          "flex-1 overflow-y-auto",
          showNav && "pb-24"
        )}
        aria-labelledby={title ? "page-title" : undefined}
      >
        {children}
      </main>

      {/* Bottom Navigation */}
      {showNav && (
        <nav 
          className="fixed bottom-0 left-0 right-0 glass border-t border-border/50 safe-bottom z-50"
          aria-label="Navegação principal"
        >
          <div className="flex items-center justify-around px-2 py-2" role="list">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path !== '/dashboard' && item.path !== '/doctor' && item.path !== '/admin' && location.pathname.startsWith(item.path));
              const Icon = item.icon;
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    "nav-item flex-1 min-w-0",
                    isActive ? "nav-item-active" : "nav-item-inactive"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                    isActive && "bg-primary/15"
                  )}>
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <span className="text-xs font-medium truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
