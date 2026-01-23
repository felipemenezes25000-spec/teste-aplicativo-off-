// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  birthDate: string;
  address: Address;
  avatar?: string;
  createdAt: string;
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface Patient extends User {
  type: 'patient';
}

export interface Doctor extends User {
  type: 'doctor';
  crm: string;
  crmState: string;
  specialty: string;
  bio?: string;
  rating: number;
  consultations: number;
}

// Request Types
export type RequestType = 'prescription' | 'exam' | 'consultation';
export type RequestStatus = 'pending' | 'analyzing' | 'approved' | 'rejected' | 'completed';
export type PrescriptionType = 'simple' | 'controlled' | 'blue';
export type ExamType = 'laboratory' | 'imaging';

export interface BaseRequest {
  id: string;
  patientId: string;
  patientName: string;
  patientPhoto?: string;
  type: RequestType;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  price: number;
  notes?: string;
}

export interface PrescriptionRequest extends BaseRequest {
  type: 'prescription';
  prescriptionType: PrescriptionType;
  medications?: Medication[];
  imageUrl?: string;
  doctorId?: string;
  doctorName?: string;
  validatedAt?: string;
}

export interface Medication {
  name: string;
  dosage: string;
  quantity: string;
  instructions: string;
}

export interface ExamRequest extends BaseRequest {
  type: 'exam';
  examType: ExamType;
  exams: string[];
  imageUrl?: string;
  doctorId?: string;
  doctorName?: string;
}

export interface ConsultationRequest extends BaseRequest {
  type: 'consultation';
  specialty: string;
  duration: number;
  pricePerMinute: number;
  scheduledAt?: string;
  doctorId?: string;
  doctorName?: string;
}

export type Request = PrescriptionRequest | ExamRequest | ConsultationRequest;

// Specialty Type
export interface Specialty {
  id: string;
  name: string;
  icon: string;
  pricePerMinute: number;
  description: string;
}

// Notification Type
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
  read: boolean;
  createdAt: string;
}

// Chat Types
export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'patient' | 'doctor' | 'support';
  message: string;
  createdAt: string;
  read: boolean;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage: ChatMessage;
  unreadCount: number;
}

// Payment Types
export type PaymentMethod = 'pix' | 'credit_card' | 'debit_card';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Payment {
  id: string;
  requestId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  createdAt: string;
  paidAt?: string;
}

// FAQ Type
export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

// Price configuration
export interface PriceConfig {
  prescriptionSimple: number;
  prescriptionControlled: number;
  prescriptionBlue: number;
  examLaboratory: number;
  examImaging: number;
  consultationMinMinutes: number;
}
