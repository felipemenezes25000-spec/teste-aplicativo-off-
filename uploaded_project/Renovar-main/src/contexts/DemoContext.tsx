import { createContext, useContext, useState, ReactNode } from 'react';
import { mockPatient, mockDoctor, pendingRequests, patientHistory, notifications, doctorStats } from '@/data/mockData';

export type DemoRole = 'patient' | 'doctor' | 'admin';

interface DemoProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  birth_date: string;
  avatar_url: string;
  address: Record<string, string>;
}

interface DemoDoctorProfile {
  id: string;
  user_id: string;
  crm: string;
  crm_state: string;
  specialty: string;
  bio: string;
  rating: number;
  total_consultations: number;
  available: boolean;
}

interface DemoContextType {
  isDemoMode: boolean;
  demoRole: DemoRole | null;
  demoProfile: DemoProfile | null;
  demoDoctorProfile: DemoDoctorProfile | null;
  enterDemoMode: (role: DemoRole) => void;
  exitDemoMode: () => void;
  switchDemoRole: (role: DemoRole) => void;
  getDemoRequests: () => typeof pendingRequests;
  getDemoHistory: () => typeof patientHistory;
  getDemoNotifications: () => typeof notifications;
  getDemoStats: () => typeof doctorStats;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

// Demo profiles based on mock data
const demoPatientProfile: DemoProfile = {
  id: 'demo-patient-001',
  user_id: 'demo-patient-001',
  name: mockPatient.name,
  email: mockPatient.email,
  phone: mockPatient.phone || '',
  cpf: mockPatient.cpf || '',
  birth_date: mockPatient.birthDate || '',
  avatar_url: mockPatient.avatar || '',
  address: mockPatient.address as unknown as Record<string, string>,
};

const demoDoctorProfileData: DemoProfile = {
  id: 'demo-doctor-001',
  user_id: 'demo-doctor-001',
  name: mockDoctor.name,
  email: mockDoctor.email,
  phone: mockDoctor.phone || '',
  cpf: mockDoctor.cpf || '',
  birth_date: mockDoctor.birthDate || '',
  avatar_url: mockDoctor.avatar || '',
  address: mockDoctor.address as unknown as Record<string, string>,
};

const demoDoctorSpecificProfile: DemoDoctorProfile = {
  id: 'demo-doctor-profile-001',
  user_id: 'demo-doctor-001',
  crm: mockDoctor.crm || '12345',
  crm_state: mockDoctor.crmState || 'SP',
  specialty: mockDoctor.specialty || 'Clínico Geral',
  bio: mockDoctor.bio || '',
  rating: mockDoctor.rating || 4.9,
  total_consultations: mockDoctor.consultations || 1523,
  available: true,
};

const demoAdminProfile: DemoProfile = {
  id: 'demo-admin-001',
  user_id: 'demo-admin-001',
  name: 'Admin RenoveJá+',
  email: 'admin@renoveja.com',
  phone: '(11) 99999-0000',
  cpf: '000.000.000-00',
  birth_date: '1980-01-01',
  avatar_url: '',
  address: {
    street: 'Av. Paulista',
    number: '1000',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01310-000',
  },
};

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoRole, setDemoRole] = useState<DemoRole | null>(null);

  const getProfileForRole = (role: DemoRole): DemoProfile => {
    switch (role) {
      case 'patient':
        return demoPatientProfile;
      case 'doctor':
        return demoDoctorProfileData;
      case 'admin':
        return demoAdminProfile;
      default:
        return demoPatientProfile;
    }
  };

  const enterDemoMode = (role: DemoRole) => {
    setIsDemoMode(true);
    setDemoRole(role);
    sessionStorage.setItem('demoMode', 'true');
    sessionStorage.setItem('demoRole', role);
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
    setDemoRole(null);
    sessionStorage.removeItem('demoMode');
    sessionStorage.removeItem('demoRole');
  };

  const switchDemoRole = (role: DemoRole) => {
    setDemoRole(role);
    sessionStorage.setItem('demoRole', role);
  };

  const getDemoRequests = () => pendingRequests;
  const getDemoHistory = () => patientHistory;
  const getDemoNotifications = () => notifications;
  const getDemoStats = () => doctorStats;

  const demoProfile = demoRole ? getProfileForRole(demoRole) : null;
  const demoDoctorProfile = demoRole === 'doctor' ? demoDoctorSpecificProfile : null;

  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        demoRole,
        demoProfile,
        demoDoctorProfile,
        enterDemoMode,
        exitDemoMode,
        switchDemoRole,
        getDemoRequests,
        getDemoHistory,
        getDemoNotifications,
        getDemoStats,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}
