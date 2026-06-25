import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh-token`, { refreshToken });
          useAuthStore.getState().setAuth(
            useAuthStore.getState().user!,
            data.accessToken,
            refreshToken
          );
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch {
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
      } else {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// API helpers
export const authApi = {
  sendPhoneOTP: (phone: string) => api.post('/api/auth/send-phone-otp', { phone }),
  verifyPhoneOTP: (phone: string, otp: string) => api.post('/api/auth/verify-phone-otp', { phone, otp }),
  sendEmailOTP: (email: string) => api.post('/api/auth/send-email-otp', { email }),
  verifyEmailOTP: (email: string, otp: string) => api.post('/api/auth/verify-email-otp', { email, otp }),
  completeProfile: (data: any) => api.post('/api/auth/complete-profile', data),
};

export const familyApi = {
  getTree: () => api.get('/api/family/tree'),
  getMember: (id: string) => api.get(`/api/family/member/${id}`),
  search: (q: string) => api.get(`/api/family/search?q=${q}`),
  getStats: () => api.get('/api/family/stats'),
  getBranch: (branch: string, params?: any) => api.get(`/api/family/branch/${branch}`, { params }),
  requestAddMember: (data: any) => api.post('/api/family/request', data),
  getPendingRequests: () => api.get('/api/family/requests'),
  reviewRequest: (id: string, data: any) => api.patch(`/api/family/requests/${id}/review`, data),
  addMember: (data: any) => api.post('/api/family/member', data),
  updateMember: (id: string, data: any) => api.put(`/api/family/member/${id}`, data),
};

export const newsApi = {
  getAll: (params?: any) => api.get('/api/news', { params }),
  getById: (id: string) => api.get(`/api/news/${id}`),
  create: (data: any) => api.post('/api/news', data),
  update: (id: string, data: any) => api.put(`/api/news/${id}`, data),
  delete: (id: string) => api.delete(`/api/news/${id}`),
};

export const marketApi = {
  getPrices: () => api.get('/api/market'),
  getTrends: (item: string, days?: number) => api.get('/api/market/trends', { params: { item, days } }),
  update: (data: any) => api.post('/api/market/update', data),
};

export const mosqueApi = {
  getAll: () => api.get('/api/mosque'),
  getNamaz: (mosqueId: string) => api.get(`/api/mosque/${mosqueId}/namaz`),
  getAnnouncements: () => api.get('/api/mosque/announcements'),
};

export const governanceApi = {
  getOfficials: () => api.get('/api/governance/officials'),
  createComplaint: (data: any) => api.post('/api/governance/complaints', data),
  getMyComplaints: () => api.get('/api/governance/complaints/mine'),
};

export const adminApi = {
  getDashboard: () => api.get('/api/admin/dashboard'),
  getPendingUsers: () => api.get('/api/admin/users/pending'),
  approveUser: (id: string, approved: boolean) => api.patch(`/api/admin/users/${id}/approve`, { approved }),
  getAnalytics: () => api.get('/api/admin/analytics'),
  getAllUsers: (params?: any) => api.get('/api/admin/users', { params }),
};
