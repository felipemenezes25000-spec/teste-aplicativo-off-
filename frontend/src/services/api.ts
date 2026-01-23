import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to get token and add to requests
const getAuthParams = async () => {
  const token = await AsyncStorage.getItem('token');
  return token ? { token } : {};
};

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  register: async (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    cpf?: string;
  }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  
  registerDoctor: async (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    cpf?: string;
    crm: string;
    crm_state: string;
    specialty: string;
  }) => {
    const response = await api.post('/auth/register-doctor', data);
    return response.data;
  },
  
  logout: async () => {
    const params = await getAuthParams();
    const response = await api.post('/auth/logout', null, { params });
    return response.data;
  },
  
  getMe: async () => {
    const params = await getAuthParams();
    const response = await api.get('/auth/me', { params });
    return response.data;
  },
};

// Profile API
export const profileAPI = {
  update: async (data: {
    name?: string;
    phone?: string;
    cpf?: string;
    birth_date?: string;
    avatar_url?: string;
    address?: object;
  }) => {
    const params = await getAuthParams();
    const response = await api.put('/profile', data, { params });
    return response.data;
  },
};

// Requests API
export const requestsAPI = {
  createPrescription: async (data: {
    prescription_type: string;
    medications?: object[];
    image_base64?: string;
    notes?: string;
  }) => {
    const params = await getAuthParams();
    const response = await api.post('/requests/prescription', data, { params });
    return response.data;
  },
  
  createExam: async (data: {
    exam_type: string;
    exams: string[];
    image_base64?: string;
    notes?: string;
  }) => {
    const params = await getAuthParams();
    const response = await api.post('/requests/exam', data, { params });
    return response.data;
  },
  
  createConsultation: async (data: {
    specialty: string;
    duration?: number;
    scheduled_at?: string;
    notes?: string;
  }) => {
    const params = await getAuthParams();
    const response = await api.post('/requests/consultation', data, { params });
    return response.data;
  },
  
  getAll: async (status?: string) => {
    const params = await getAuthParams();
    if (status) (params as any).status = status;
    const response = await api.get('/requests', { params });
    return response.data;
  },
  
  getById: async (id: string) => {
    const params = await getAuthParams();
    const response = await api.get(`/requests/${id}`, { params });
    return response.data;
  },
  
  update: async (id: string, data: {
    status?: string;
    doctor_id?: string;
    doctor_name?: string;
    notes?: string;
  }) => {
    const params = await getAuthParams();
    const response = await api.put(`/requests/${id}`, data, { params });
    return response.data;
  },
};

// Payments API
export const paymentsAPI = {
  create: async (data: {
    request_id: string;
    amount: number;
    method?: string;
  }) => {
    const params = await getAuthParams();
    const response = await api.post('/payments', data, { params });
    return response.data;
  },
  
  getById: async (id: string) => {
    const params = await getAuthParams();
    const response = await api.get(`/payments/${id}`, { params });
    return response.data;
  },
  
  confirm: async (id: string) => {
    const params = await getAuthParams();
    const response = await api.post(`/payments/${id}/confirm`, null, { params });
    return response.data;
  },
};

// Chat API
export const chatAPI = {
  sendMessage: async (data: { request_id: string; message: string }) => {
    const params = await getAuthParams();
    const response = await api.post('/chat', data, { params });
    return response.data;
  },
  
  getMessages: async (requestId: string) => {
    const params = await getAuthParams();
    const response = await api.get(`/chat/${requestId}`, { params });
    return response.data;
  },
  
  markAsRead: async (requestId: string) => {
    const params = await getAuthParams();
    const response = await api.post(`/chat/${requestId}/mark-read`, null, { params });
    return response.data;
  },
  
  getUnreadCount: async () => {
    const params = await getAuthParams();
    const response = await api.get('/chat/unread-count', { params });
    return response.data;
  },
};

// Notifications API
export const notificationsAPI = {
  getAll: async () => {
    const params = await getAuthParams();
    const response = await api.get('/notifications', { params });
    return response.data;
  },
  
  markAsRead: async (id: string) => {
    const params = await getAuthParams();
    const response = await api.put(`/notifications/${id}/read`, null, { params });
    return response.data;
  },
  
  markAllAsRead: async () => {
    const params = await getAuthParams();
    const response = await api.put('/notifications/read-all', null, { params });
    return response.data;
  },
};

// Doctors API
export const doctorsAPI = {
  getAll: async (specialty?: string) => {
    const params: any = {};
    if (specialty) params.specialty = specialty;
    const response = await api.get('/doctors', { params });
    return response.data;
  },
  
  getQueue: async () => {
    const params = await getAuthParams();
    const response = await api.get('/doctors/queue', { params });
    return response.data;
  },
};

// Specialties API
export const specialtiesAPI = {
  getAll: async () => {
    const response = await api.get('/specialties');
    return response.data;
  },
};

export default api;
