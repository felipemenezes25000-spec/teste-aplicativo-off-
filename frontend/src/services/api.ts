/**
 * 🔌 RenoveJá+ API Service
 * Unified API client for all backend operations
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import secureStorage from './secureStorage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8001';

const axiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Helper to get token
export const getToken = async () => {
  return await secureStorage.getToken();
};

const getAuthParams = async () => {
  const token = await getToken();
  return token ? { token } : {};
};

// ============== UNIFIED API OBJECT ==============
// This is what the frontend imports and uses

export const api = {
  // ============== AUTH ==============
  login: async (email: string, password: string) => {
    const response = await axiosInstance.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (data: { name: string; email: string; password: string; phone?: string; cpf?: string }) => {
    const response = await axiosInstance.post('/auth/register', data);
    return response.data;
  },

  registerDoctor: async (data: { name: string; email: string; password: string; phone?: string; cpf?: string; crm: string; crm_state: string; specialty: string }) => {
    const response = await axiosInstance.post('/auth/register-doctor', data);
    return response.data;
  },

  registerNurse: async (data: { name: string; email: string; password: string; phone?: string; cpf?: string; coren: string; coren_state: string; specialty?: string }) => {
    const response = await axiosInstance.post('/auth/register-nurse', data);
    return response.data;
  },

  googleAuth: async (idToken: string) => {
    const response = await axiosInstance.post('/auth/google', { id_token: idToken });
    return response.data;
  },

  logout: async () => {
    const params = await getAuthParams();
    const response = await axiosInstance.post('/auth/logout', null, { params });
    return response.data;
  },

  getMe: async () => {
    const params = await getAuthParams();
    const response = await axiosInstance.get('/auth/me', { params });
    return response.data;
  },

  // ============== PUSH NOTIFICATIONS ==============
  updatePushToken: async (pushToken: string) => {
    const params = await getAuthParams();
    const response = await axiosInstance.post('/push-token', { push_token: pushToken }, { params });
    return response.data;
  },

  deletePushToken: async () => {
    const params = await getAuthParams();
    const response = await axiosInstance.delete('/push-token', { params });
    return response.data;
  },

  // ============== PROFILE ==============
  updateProfile: async (data: { name?: string; phone?: string; cpf?: string; birth_date?: string; avatar_url?: string; address?: object }) => {
    const params = await getAuthParams();
    const response = await axiosInstance.put('/profile', data, { params });
    return response.data;
  },

  // ============== REQUESTS ==============
  createPrescriptionRequest: async (data: { prescription_type: string; medications?: object[]; prescription_images?: string[]; notes?: string }) => {
    const params = await getAuthParams();
    const response = await axiosInstance.post('/requests/prescription', data, { params });
    return response.data;
  },

  createExamRequest: async (data: { description?: string; exam_images?: string[]; exam_type?: string; exams?: string[]; notes?: string }) => {
    const params = await getAuthParams();
    const response = await axiosInstance.post('/requests/exam', data, { params });
    return response.data;
  },

  createConsultationRequest: async (data: { specialty: string; duration?: number; scheduled_at?: string; schedule_type?: 'immediate' | 'scheduled'; notes?: string }) => {
    const params = await getAuthParams();
    const response = await axiosInstance.post('/requests/consultation', data, { params });
    return response.data;
  },

  getRequests: async (status?: string) => {
    const params: any = await getAuthParams();
    if (status) params.status = status;
    const response = await axiosInstance.get('/requests', { params });
    return response.data;
  },

  getRequest: async (id: string) => {
    const params = await getAuthParams();
    const response = await axiosInstance.get(`/requests/${id}`, { params });
    return response.data;
  },

  updateRequest: async (id: string, data: { status?: string; doctor_id?: string; doctor_name?: string; notes?: string; medications?: object[]; exams?: string[]; ai_validated?: boolean; ai_validated_at?: string }) => {
    const params = await getAuthParams();
    const response = await axiosInstance.put(`/requests/${id}`, data, { params });
    return response.data;
  },

  acceptRequest: async (id: string) => {
    const params = await getAuthParams();
    const response = await axiosInstance.post(`/requests/${id}/accept`, null, { params });
    return response.data;
  },

  approveRequest: async (id: string, price?: number, notes?: string) => {
    const params = await getAuthParams();
    const response = await axiosInstance.post(`/requests/${id}/approve`, { price, notes }, { params });
    return response.data;
  },

  rejectRequest: async (id: string, reason: string, notes?: string) => {
    const params = await getAuthParams();
    const response = await axiosInstance.post(`/requests/${id}/reject`, { reason, notes }, { params });
    return response.data;
  },

  signRequest: async (id: string) => {
    const params = await getAuthParams();
    const response = await axiosInstance.post(`/requests/${id}/sign`, null, { params });
    return response.data;
  },

  // ============== DOCTOR ==============
  getDoctorQueue: async () => {
    const params = await getAuthParams();
    const response = await axiosInstance.get('/doctors/queue', { params });
    return response.data;
  },

  getDoctors: async (specialty?: string) => {
    const params: any = {};
    if (specialty) params.specialty = specialty;
    const response = await axiosInstance.get('/doctors', { params });
    return response.data;
  },

  updateDoctorAvailability: async (available: boolean) => {
    const params = await getAuthParams();
    const response = await axiosInstance.put('/doctor/availability', null, { params: { ...(params as any), available } });
    return response.data;
  },

  // ============== NURSING ==============
  getNursingQueue: async () => {
    const params = await getAuthParams();
    const response = await axiosInstance.get('/nursing/queue', { params });
    return response.data;
  },

  nursingAccept: async (id: string) => {
    const params = await getAuthParams();
    const response = await axiosInstance.post(`/nursing/accept/${id}`, null, { params });
    return response.data;
  },

  nursingApprove: async (id: string, data: { price: number; exam_type?: string; exams?: string[]; notes?: string }) => {
    const params = await getAuthParams();
    const response = await axiosInstance.post(`/nursing/approve/${id}`, data, { params });
    return response.data;
  },

  nursingReject: async (id: string, reason: string, notes?: string) => {
    const params = await getAuthParams();
    const response = await axiosInstance.post(`/nursing/reject/${id}`, { reason, notes }, { params });
    return response.data;
  },

  nursingForwardToDoctor: async (id: string, reason?: string, notes?: string) => {
    const params = await getAuthParams();
    const response = await axiosInstance.post(`/nursing/forward-to-doctor/${id}`, { reason, notes }, { params });
    return response.data;
  },

  // ============== PAYMENTS ==============
  createPayment: async (data: { request_id: string; amount: number; method?: string }) => {
    const params = await getAuthParams();
    const response = await axiosInstance.post('/payments', data, { params });
    return response.data;
  },

  createPixPayment: async (requestId: string, amount: number) => {
    const params = await getAuthParams();
    const response = await axiosInstance.post('/payments', { request_id: requestId, amount, method: 'pix' }, { params });
    return response.data;
  },

  getPayment: async (id: string) => {
    const params = await getAuthParams();
    const response = await axiosInstance.get(`/payments/${id}`, { params });
    return response.data;
  },

  confirmPayment: async (id: string) => {
    const params = await getAuthParams();
    const response = await axiosInstance.post(`/payments/${id}/confirm`, null, { params });
    return response.data;
  },

  checkPaymentStatus: async (id: string) => {
    const params = await getAuthParams();
    const response = await axiosInstance.get(`/payments/${id}/status`, { params });
    return response.data;
  },

  // ============== CHAT ==============
  sendChatMessage: async (requestId: string, message: string) => {
    const params = await getAuthParams();
    const response = await axiosInstance.post('/chat', { request_id: requestId, message }, { params });
    return response.data;
  },

  getChatMessages: async (requestId: string) => {
    const params = await getAuthParams();
    const response = await axiosInstance.get(`/chat/${requestId}`, { params });
    return response.data;
  },

  markChatAsRead: async (requestId: string) => {
    const params = await getAuthParams();
    const response = await axiosInstance.post(`/chat/${requestId}/mark-read`, null, { params });
    return response.data;
  },

  getUnreadChatCount: async () => {
    const params = await getAuthParams();
    const response = await axiosInstance.get('/chat/unread-count', { params });
    return response.data;
  },

  // ============== NOTIFICATIONS ==============
  getNotifications: async () => {
    const params = await getAuthParams();
    const response = await axiosInstance.get('/notifications', { params });
    return response.data;
  },

  markNotificationAsRead: async (id: string) => {
    const params = await getAuthParams();
    const response = await axiosInstance.put(`/notifications/${id}/read`, null, { params });
    return response.data;
  },

  markAllNotificationsAsRead: async () => {
    const params = await getAuthParams();
    const response = await axiosInstance.put('/notifications/read-all', null, { params });
    return response.data;
  },

  // ============== VIDEO / CONSULTATION ==============
  createVideoRoom: async (requestId: string, roomName?: string) => {
    const params = await getAuthParams();
    const response = await axiosInstance.post('/video/create-room', { request_id: requestId, room_name: roomName }, { params });
    return response.data;
  },

  getVideoRoom: async (requestId: string) => {
    const params = await getAuthParams();
    const response = await axiosInstance.get(`/video/room/${requestId}`, { params });
    return response.data;
  },

  startConsultation: async (requestId: string) => {
    const params = await getAuthParams();
    const response = await axiosInstance.post(`/consultation/start/${requestId}`, null, { params });
    return response.data;
  },

  endConsultation: async (requestId: string, notes?: string) => {
    const params = await getAuthParams();
    const url = notes ? `/consultation/end/${requestId}?notes=${encodeURIComponent(notes)}` : `/consultation/end/${requestId}`;
    const response = await axiosInstance.post(url, null, { params });
    return response.data;
  },

  // Fila de teleconsultas para médicos
  getDoctorConsultationQueue: async () => {
    const params = await getAuthParams();
    const response = await axiosInstance.get('/doctor/consultation-queue', { params });
    return response.data;
  },

  // ============== ADMIN ==============
  getAdminStats: async () => {
    const params = await getAuthParams();
    const response = await axiosInstance.get('/admin/stats', { params });
    return response.data;
  },

  getAdminUsers: async (role?: string) => {
    const params: any = await getAuthParams();
    if (role) params.role = role;
    const response = await axiosInstance.get('/admin/users', { params });
    return response.data;
  },

  updateUserStatus: async (userId: string, active: boolean) => {
    const params = await getAuthParams();
    const response = await axiosInstance.put(`/admin/users/${userId}/status`, { active }, { params });
    return response.data;
  },

  // ============== REVIEWS ==============
  submitReview: async (requestId: string, data: { rating: number; tags?: string[]; comment?: string | null }) => {
    const params = await getAuthParams();
    const response = await axiosInstance.post(`/reviews/${requestId}`, data, { params });
    return response.data;
  },

  getDoctorReviews: async (doctorId: string) => {
    const response = await axiosInstance.get(`/reviews/doctor/${doctorId}`);
    return response.data;
  },

  // ============== ADMIN REPORTS ==============
  getAdminReports: async (period: string = 'month') => {
    const params: any = await getAuthParams();
    params.period = period;
    const response = await axiosInstance.get('/admin/reports', { params });
    return response.data;
  },

  // ============== SPECIALTIES ==============
  getSpecialties: async () => {
    const response = await axiosInstance.get('/specialties');
    return response.data;
  },

  // ============== HEALTH & INTEGRATIONS ==============
  getHealth: async () => {
    const response = await axiosInstance.get('/health');
    return response.data;
  },

  getIntegrationsStatus: async () => {
    const response = await axiosInstance.get('/integrations/status');
    return response.data;
  },

  // ============== QUEUE ==============
  getQueueStats: async () => {
    const params = await getAuthParams();
    const response = await axiosInstance.get('/queue/stats', { params });
    return response.data;
  },

  autoAssignQueue: async () => {
    const params = await getAuthParams();
    const response = await axiosInstance.post('/queue/auto-assign', null, { params });
    return response.data;
  },

  assignRequest: async (requestId: string, doctorId?: string) => {
    const params = await getAuthParams();
    const url = doctorId ? `/queue/assign/${requestId}?doctor_id=${doctorId}` : `/queue/assign/${requestId}`;
    const response = await axiosInstance.post(url, null, { params });
    return response.data;
  },

  // ============== AI MEDICAL DOCUMENT ANALYSIS ==============
  aiAnalyzeDocument: async (data: { request_id?: string; image_data: string; document_type?: string }) => {
    const params = await getAuthParams();
    const response = await axiosInstance.post('/ai/analyze-document', data, { params });
    return response.data;
  },

  aiAnalyzePrescription: async (data: { request_id?: string; image_data: string }) => {
    const params = await getAuthParams();
    const response = await axiosInstance.post('/ai/analyze-prescription', { ...data, document_type: 'prescription' }, { params });
    return response.data;
  },

  aiAnalyzeExam: async (data: { request_id?: string; image_data: string }) => {
    const params = await getAuthParams();
    const response = await axiosInstance.post('/ai/analyze-exam', { ...data, document_type: 'exam' }, { params });
    return response.data;
  },

  aiPrefillPrescription: async (requestId: string, imageData: string) => {
    const params: any = await getAuthParams();
    params.request_id = requestId;
    const response = await axiosInstance.post('/ai/prefill-prescription', { image_data: imageData }, { params });
    return response.data;
  },

  aiPrefillExam: async (requestId: string, imageData: string) => {
    const params: any = await getAuthParams();
    params.request_id = requestId;
    const response = await axiosInstance.post('/ai/prefill-exam', { image_data: imageData }, { params });
    return response.data;
  },
};

// ============== LEGACY EXPORTS (for backwards compatibility) ==============
// These are the old separate API objects - kept for any code that might still use them

export const authAPI = {
  login: api.login,
  register: api.register,
  registerDoctor: api.registerDoctor,
  registerNurse: api.registerNurse,
  googleAuth: api.googleAuth,
  logout: api.logout,
  getMe: api.getMe,
};

export const profileAPI = {
  update: api.updateProfile,
};

export const requestsAPI = {
  createPrescription: api.createPrescriptionRequest,
  createExam: api.createExamRequest,
  createConsultation: api.createConsultationRequest,
  getAll: api.getRequests,
  getById: api.getRequest,
  update: api.updateRequest,
  accept: api.acceptRequest,
  approve: api.approveRequest,
  reject: api.rejectRequest,
  sign: api.signRequest,
};

export const paymentsAPI = {
  create: api.createPayment,
  getById: api.getPayment,
  confirm: api.confirmPayment,
};

export const chatAPI = {
  sendMessage: api.sendChatMessage,
  getMessages: api.getChatMessages,
  markAsRead: api.markChatAsRead,
  getUnreadCount: api.getUnreadChatCount,
};

export const notificationsAPI = {
  getAll: api.getNotifications,
  markAsRead: api.markNotificationAsRead,
  markAllAsRead: api.markAllNotificationsAsRead,
};

export const doctorsAPI = {
  getAll: api.getDoctors,
  getQueue: api.getDoctorQueue,
  updateAvailability: api.updateDoctorAvailability,
};

export const consultationAPI = {
  start: api.startConsultation,
  end: api.endConsultation,
};

export const videoAPI = {
  createRoom: api.createVideoRoom,
  getRoom: api.getVideoRoom,
};

export const specialtiesAPI = {
  getAll: api.getSpecialties,
};

export const queueAPI = {
  getStats: api.getQueueStats,
  autoAssign: api.autoAssignQueue,
  assignRequest: api.assignRequest,
};

export default api;
