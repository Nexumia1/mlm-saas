import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

// Cliente Axios configurado
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor: agrega JWT a todas las peticiones
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: maneja token expirado con refresh automático
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);

        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;

// ── API Functions ──────────────────────────────────────────

export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data).then((r) => r.data),
  register: (data: any) =>
    api.post('/auth/register', data).then((r) => r.data),
  logout: (refreshToken?: string) =>
    api.post('/auth/logout', { refreshToken }).then((r) => r.data),
  getMe: () =>
    api.get('/auth/me').then((r) => r.data),
};

export const analyticsApi = {
  getDashboard: () =>
    api.get('/analytics/dashboard').then((r) => r.data),
};

export const crmApi = {
  getLeads: (params?: any) =>
    api.get('/crm/leads', { params }).then((r) => r.data),
  getLeadStats: () =>
    api.get('/crm/leads/stats').then((r) => r.data),
  getPipeline: () =>
    api.get('/crm/leads/pipeline').then((r) => r.data),
  createLead: (data: any) =>
    api.post('/crm/leads', data).then((r) => r.data),
  updateLead: (id: string, data: any) =>
    api.patch(`/crm/leads/${id}`, data).then((r) => r.data),
  getContacts: (params?: any) =>
    api.get('/crm/contacts', { params }).then((r) => r.data),
  createContact: (data: any) =>
    api.post('/crm/contacts', data).then((r) => r.data),
};

export const campaignsApi = {
  getCampaigns: (params?: any) =>
    api.get('/campaigns', { params }).then((r) => r.data),
  getStats: () =>
    api.get('/campaigns/stats').then((r) => r.data),
  createCampaign: (data: any) =>
    api.post('/campaigns', data).then((r) => r.data),
  updateCampaign: (id: string, data: any) =>
    api.patch(`/campaigns/${id}`, data).then((r) => r.data),
};

export const usersApi = {
  getUsers: () =>
    api.get('/users').then((r) => r.data),
  inviteUser: (data: any) =>
    api.post('/users/invite', data).then((r) => r.data),
};

export const whatsappApi = {
  getAccounts: () =>
    api.get('/whatsapp/accounts').then((r) => r.data),
  getConversations: (accountId: string) =>
    api.get(`/whatsapp/conversations/${accountId}`).then((r) => r.data),
  sendMessage: (data: any) =>
    api.post('/whatsapp/send', data).then((r) => r.data),
};
