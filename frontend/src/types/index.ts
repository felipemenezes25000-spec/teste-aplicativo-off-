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
  nurse_profile?: NurseProfile;
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

export interface NurseProfile {
  id: string;
  user_id: string;
  coren: string;
  coren_state: string;
  specialty?: string;
  bio?: string;
  total_triages: number;
  available: boolean;
}

// Request Types
export type RequestType = 'prescription' | 'exam' | 'consultation';
export type RequestStatus = 
  | 'submitted'
  | 'pending'
  | 'analyzing'
  | 'in_review'
  | 'in_nursing_review'
  | 'approved_by_nursing_pending_payment'
  | 'in_medical_review'
  | 'approved_pending_payment'
  | 'approved'
  | 'paid'
  | 'signed'
  | 'delivered'
  | 'rejected'
  | 'completed'
  | 'in_progress';
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
  rejection_reason?: string;
  doctor_id?: string;
  doctor_name?: string;
  nurse_id?: string;
  nurse_name?: string;
  approved_by?: 'nurse' | 'doctor';
  // Prescription specific
  prescription_type?: PrescriptionType;
  medications?: Medication[];
  image_url?: string;
  prescription_images?: string[];
  // Exam specific
  exam_type?: ExamType;
  exams?: string[];
  exam_images?: string[];
  exam_description?: string;
  // Consultation specific
  specialty?: string;
  duration?: number;
  scheduled_at?: string;
  // Signature
  signed_document_url?: string;
  signature_data?: object;
  // Timestamps
  created_at: string;
  updated_at: string;
  approved_at?: string;
  paid_at?: string;
  signed_at?: string;
  delivered_at?: string;
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
