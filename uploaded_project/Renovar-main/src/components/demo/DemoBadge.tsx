import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, X, User, Stethoscope, Shield, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDemo, DemoRole } from '@/contexts/DemoContext';

const roleConfig = {
  patient: { label: 'Paciente', icon: User, path: '/demo/patient', color: 'text-primary' },
  doctor: { label: 'Médico', icon: Stethoscope, path: '/demo/doctor', color: 'text-health-green' },
  admin: { label: 'Admin', icon: Shield, path: '/demo/admin', color: 'text-health-purple' },
};

export function DemoBadge() {
  const navigate = useNavigate();
  const { isDemoMode, demoRole, exitDemoMode, switchDemoRole } = useDemo();
  const [isOpen, setIsOpen] = useState(false);

  if (!isDemoMode || !demoRole) return null;

  const currentRole = roleConfig[demoRole];
  const CurrentIcon = currentRole.icon;

  const handleSwitchRole = (role: DemoRole) => {
    switchDemoRole(role);
    navigate(roleConfig[role].path);
    setIsOpen(false);
  };

  const handleExit = () => {
    exitDemoMode();
    navigate('/login');
  };

  return (
    <div className="fixed top-4 right-4 z-[100]">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-10 px-3 rounded-full bg-health-purple/10 border-health-purple/30 hover:bg-health-purple/20 shadow-lg backdrop-blur-sm"
          >
            <Eye className="w-4 h-4 text-health-purple mr-2" />
            <span className="text-sm font-semibold text-health-purple">DEMO</span>
            <span className="mx-2 w-px h-4 bg-health-purple/30" />
            <CurrentIcon className={`w-4 h-4 ${currentRole.color}`} />
            <span className={`text-sm font-medium ml-1 ${currentRole.color}`}>
              {currentRole.label}
            </span>
            <ChevronDown className="w-4 h-4 ml-1 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">
            Trocar perfil
          </div>
          
          {Object.entries(roleConfig).map(([role, config]) => {
            const Icon = config.icon;
            const isActive = role === demoRole;
            return (
              <DropdownMenuItem
                key={role}
                onClick={() => handleSwitchRole(role as DemoRole)}
                className={isActive ? 'bg-muted' : ''}
              >
                <Icon className={`w-4 h-4 mr-2 ${config.color}`} />
                <span>{config.label}</span>
                {isActive && (
                  <span className="ml-auto text-xs text-muted-foreground">Ativo</span>
                )}
              </DropdownMenuItem>
            );
          })}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleExit} className="text-destructive focus:text-destructive">
            <X className="w-4 h-4 mr-2" />
            <span>Sair do Demo</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
