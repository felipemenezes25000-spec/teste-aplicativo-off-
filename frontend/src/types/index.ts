// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
  birth_date?: string;
  avatar_url?: string;
  role: 'patient' | 'doctor' | 'admin' | 'nurse';
  address?: Address;
  doctor_profile?: DoctorProfile;
}

export interface Address {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface DoctorProfile {
  id: string;
  user_id: string;
  crm: string;
  crm_state: string;
  specialty: string;
  bio?: string;
  rating: number;
  total_consultations: number;
  available: boolean;
}

// Request Types
export type RequestType = 'prescription' | 'exam' | 'consultation';
export type RequestStatus = 'pending' | 'analyzing' | 'approved' | 'rejected' | 'completed';
export type PrescriptionType = 'simple' | 'controlled' | 'blue';
export type ExamType = 'laboratory' | 'imaging';

export interface Request {
  id: string;
  patient_id: string;
  patient_name: string;
  request_type: RequestType;
  status: RequestStatus;
  price: number;
  notes?: string;
  doctor_id?: string;
  doctor_name?: string;
  // Prescription specific
  prescription_type?: PrescriptionType;
  medications?: Medication[];
  image_url?: string;
  // Exam specific
  exam_type?: ExamType;
  exams?: string[];
  // Consultation specific
  specialty?: string;
  duration?: number;
  scheduled_at?: string;
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface Medication {
  name: string;
  dosage: string;
  quantity: string;
  instructions: string;
}

// Payment Types
export type PaymentMethod = 'pix' | 'credit_card' | 'debit_card';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Payment {
  id: string;
  request_id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  pix_code?: string;
  pix_qr_base64?: string;
  created_at: string;
  paid_at?: string;
}

// Chat Types
export interface ChatMessage {
  id: string;
  request_id: string;
  sender_id: string;
  sender_name: string;
  sender_type: 'patient' | 'doctor' | 'support' | 'system';
  message: string;
  read: boolean;
  created_at: string;
}

// Notification Types
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: 'success' | 'warning' | 'info' | 'error';
  read: boolean;
  created_at: string;
}

// Specialty Types
export interface Specialty {
  id: string;
  name: string;
  icon: string;
  price_per_minute: number;
}

// Auth Types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
