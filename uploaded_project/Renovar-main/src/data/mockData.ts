import type {
  Patient,
  Doctor,
  PrescriptionRequest,
  ExamRequest,
  ConsultationRequest,
  Specialty,
  Notification,
  FAQ,
  PriceConfig,
  ChatMessage,
} from '@/types';

// Price Configuration - Updated to match design references
export const priceConfig: PriceConfig = {
  prescriptionSimple: 29.90,
  prescriptionControlled: 49.90,
  prescriptionBlue: 129.90,
  examLaboratory: 19.90,
  examImaging: 29.90,
  consultationMinMinutes: 5,
};

// Specialty prices per minute
export const specialtyPrices = {
  psychologist: 3.99,
  clinician: 6.99,
};

// WhatsApp numbers
export const whatsappNumbers = {
  primary: '(11) 98631-8000',
  secondary: '(11) 95340-8000',
};

// Mock Patient
export const mockPatient: Patient = {
  id: 'patient-001',
  type: 'patient',
  name: 'Maria Silva',
  email: 'maria.silva@email.com',
  phone: '(11) 98765-4321',
  cpf: '123.456.789-00',
  birthDate: '1985-03-15',
  address: {
    street: 'Rua das Flores',
    number: '123',
    complement: 'Apto 42',
    neighborhood: 'Jardim Paulista',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01310-100',
  },
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
  createdAt: '2024-01-15T10:30:00Z',
};

// Mock Doctor
export const mockDoctor: Doctor = {
  id: 'doctor-001',
  type: 'doctor',
  name: 'Dr. João Santos',
  email: 'joao.santos@renoveja.com',
  phone: '(11) 99876-5432',
  cpf: '987.654.321-00',
  birthDate: '1978-07-22',
  crm: '12345',
  crmState: 'SP',
  specialty: 'Clínico Geral',
  bio: 'Médico clínico geral com mais de 15 anos de experiência. Especialista em medicina preventiva e saúde da família.',
  rating: 4.9,
  consultations: 1523,
  address: {
    street: 'Av. Paulista',
    number: '1000',
    complement: 'Sala 501',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01310-000',
  },
  avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face',
  createdAt: '2023-06-01T08:00:00Z',
};

// Specialties for Consultation
export const specialties: Specialty[] = [
  {
    id: 'spec-1',
    name: 'Médico Clínico',
    icon: 'stethoscope',
    pricePerMinute: 6.99,
    description: 'Plantão de dúvidas em telemedicina para sanar dúvidas pontuais!',
  },
  {
    id: 'spec-2',
    name: 'Psicólogo',
    icon: 'brain',
    pricePerMinute: 3.99,
    description: 'Plantão de dúvidas em telemedicina para sanar dúvidas pontuais!',
  },
];

// Pending Requests (Doctor Panel)
export const pendingRequests: (PrescriptionRequest | ExamRequest)[] = [
  {
    id: 'req-001',
    patientId: 'patient-002',
    patientName: 'Ana Paula Oliveira',
    patientPhoto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    type: 'prescription',
    prescriptionType: 'simple',
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60000).toISOString(),
    price: 29.90,
    imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400',
    medications: [
      { name: 'Losartana 50mg', dosage: '1 comprimido', quantity: '30 comprimidos', instructions: 'Tomar 1x ao dia pela manhã' },
    ],
  },
  {
    id: 'req-002',
    patientId: 'patient-003',
    patientName: 'Carlos Eduardo Mendes',
    patientPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    type: 'prescription',
    prescriptionType: 'controlled',
    status: 'pending',
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60000).toISOString(),
    price: 49.90,
    imageUrl: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400',
    medications: [
      { name: 'Rivotril 2mg', dosage: '1 comprimido', quantity: '30 comprimidos', instructions: 'Tomar à noite antes de dormir' },
    ],
  },
  {
    id: 'req-003',
    patientId: 'patient-004',
    patientName: 'Fernanda Lima Costa',
    patientPhoto: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop&crop=face',
    type: 'exam',
    examType: 'laboratory',
    exams: ['Hemograma completo', 'Glicemia', 'TSH'],
    status: 'pending',
    createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 60000).toISOString(),
    price: 19.90,
    imageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400',
  },
  {
    id: 'req-004',
    patientId: 'patient-005',
    patientName: 'Roberto Alves Junior',
    patientPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    type: 'prescription',
    prescriptionType: 'blue',
    status: 'pending',
    createdAt: new Date(Date.now() - 12 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60000).toISOString(),
    price: 129.90,
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
    medications: [
      { name: 'Ritalina 10mg', dosage: '1 comprimido', quantity: '30 comprimidos', instructions: 'Tomar pela manhã' },
    ],
  },
  {
    id: 'req-005',
    patientId: 'patient-006',
    patientName: 'Juliana Costa Pereira',
    patientPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
    type: 'exam',
    examType: 'imaging',
    exams: ['Ultrassonografia abdominal'],
    status: 'pending',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    price: 29.90,
  },
];

// Patient History
export const patientHistory: (PrescriptionRequest | ExamRequest | ConsultationRequest)[] = [
  {
    id: 'hist-001',
    patientId: 'patient-001',
    patientName: 'Maria Silva',
    type: 'prescription',
    prescriptionType: 'simple',
    status: 'approved',
    createdAt: '2024-01-10T14:30:00Z',
    updatedAt: '2024-01-10T14:35:00Z',
    price: 29.90,
    doctorId: 'doctor-001',
    doctorName: 'Dr. João Santos',
    validatedAt: '2024-01-10T14:35:00Z',
    medications: [
      { name: 'Dipirona 500mg', dosage: '1 comprimido', quantity: '20 comprimidos', instructions: 'Tomar de 6 em 6 horas se dor' },
    ],
  },
  {
    id: 'hist-002',
    patientId: 'patient-001',
    patientName: 'Maria Silva',
    type: 'prescription',
    prescriptionType: 'controlled',
    status: 'approved',
    createdAt: '2024-01-05T10:00:00Z',
    updatedAt: '2024-01-05T10:25:00Z',
    price: 49.90,
    doctorId: 'doctor-001',
    doctorName: 'Dr. João Santos',
    validatedAt: '2024-01-05T10:25:00Z',
    medications: [
      { name: 'Fluoxetina 20mg', dosage: '1 comprimido', quantity: '30 comprimidos', instructions: 'Tomar pela manhã' },
    ],
  },
  {
    id: 'hist-003',
    patientId: 'patient-001',
    patientName: 'Maria Silva',
    type: 'exam',
    examType: 'laboratory',
    exams: ['Hemograma', 'Glicemia', 'Colesterol total'],
    status: 'completed',
    createdAt: '2023-12-20T09:00:00Z',
    updatedAt: '2023-12-20T09:10:00Z',
    price: 19.90,
    doctorId: 'doctor-001',
    doctorName: 'Dr. João Santos',
  },
];

// Notifications
export const notifications: Notification[] = [
  {
    id: 'notif-001',
    title: 'Receita aprovada! ✅',
    message: 'Sua receita de Dipirona foi aprovada pelo Dr. João Santos.',
    type: 'success',
    read: false,
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: 'notif-002',
    title: 'Exame disponível',
    message: 'Seu pedido de exame laboratorial está pronto para retirada.',
    type: 'info',
    read: false,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
];

// FAQs
export const faqs: FAQ[] = [
  {
    id: 'faq-001',
    question: 'Como funciona a renovação de receitas?',
    answer: 'Você envia a foto da sua receita anterior, nosso médico analisa e, se aprovada, você recebe uma nova receita digital válida em até 5 minutos.',
    category: 'Receitas',
  },
  {
    id: 'faq-002',
    question: 'Quais tipos de receitas podem ser renovadas?',
    answer: 'Renovamos receitas simples, controladas (dupla via) e receitas azuis. Cada tipo tem um prazo de validação específico.',
    category: 'Receitas',
  },
];

// Mock Chat Messages
export const mockChatMessages: ChatMessage[] = [
  {
    id: 'msg-001',
    senderId: 'support-001',
    senderName: 'Suporte RenoveJá+',
    senderType: 'support',
    message: 'Olá! Bem-vindo ao RenoveJá+. Como posso ajudar você hoje?',
    createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
    read: true,
  },
];

// Doctor Stats
export const doctorStats = {
  pendingRequests: 5,
  approvedToday: 23,
  earningsToday: 1250.00,
  totalPatients: 156,
  averageRating: 4.9,
  responseTime: '4 min',
};

// Common Laboratory Exams
export const laboratoryExams = [
  'Hemograma completo',
  'Glicemia de jejum',
  'Colesterol total e frações',
  'Triglicerídeos',
  'TSH e T4 livre',
  'Creatinina',
  'Ureia',
  'TGO e TGP',
  'Ácido úrico',
  'Vitamina D',
  'Vitamina B12',
  'Ferritina',
  'PSA (homens)',
  'Beta HCG (mulheres)',
];

// Common Imaging Exams
export const imagingExams = [
  'Raio-X de tórax',
  'Raio-X de coluna',
  'Ultrassonografia abdominal',
  'Ultrassonografia pélvica',
  'Ultrassonografia de tireoide',
  'Ecocardiograma',
  'Eletrocardiograma',
  'Mamografia',
  'Densitometria óssea',
  'Ressonância magnética',
  'Tomografia computadorizada',
];
