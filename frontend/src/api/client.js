import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to add JWT token
api.interceptors.request.use((config) => {
  const tokens = localStorage.getItem('ecosphere_tokens');
  if (tokens) {
    const { access } = JSON.parse(tokens);
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

// Intercept responses for 401 → auto-refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const tokens = JSON.parse(localStorage.getItem('ecosphere_tokens') || '{}');
        const response = await axios.post(`${API_BASE}/auth/refresh/`, {
          refresh: tokens.refresh,
        });
        const newTokens = { ...tokens, access: response.data.access };
        if (response.data.refresh) newTokens.refresh = response.data.refresh;
        localStorage.setItem('ecosphere_tokens', JSON.stringify(newTokens));
        originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('ecosphere_tokens');
        localStorage.removeItem('ecosphere_user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// ============ Auth ============
export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  register: (data) => api.post('/auth/register/', data),
  getProfile: () => api.get('/auth/me/'),
  updateProfile: (data) => api.patch('/auth/me/', data),
  getUsers: (params) => api.get('/auth/users/', { params }),
};

// ============ Core ============
export const coreAPI = {
  // Departments
  getDepartments: (params) => api.get('/core/departments/', { params }),
  getDepartment: (id) => api.get(`/core/departments/${id}/`),
  createDepartment: (data) => api.post('/core/departments/', data),
  updateDepartment: (id, data) => api.patch(`/core/departments/${id}/`, data),
  deleteDepartment: (id) => api.delete(`/core/departments/${id}/`),

  // Categories
  getCategories: (params) => api.get('/core/categories/', { params }),
  getCategory: (id) => api.get(`/core/categories/${id}/`),
  createCategory: (data) => api.post('/core/categories/', data),
  updateCategory: (id, data) => api.patch(`/core/categories/${id}/`, data),
  deleteCategory: (id) => api.delete(`/core/categories/${id}/`),

  // ESG Configuration
  getConfig: () => api.get('/core/config/'),
  updateConfig: (data) => api.patch('/core/config/', data),
};

// ============ Carbon / Environmental ============
export const carbonAPI = {
  // Emission Factors
  getEmissionFactors: (params) => api.get('/carbon/emission-factors/', { params }),
  getEmissionFactor: (id) => api.get(`/carbon/emission-factors/${id}/`),
  createEmissionFactor: (data) => api.post('/carbon/emission-factors/', data),
  updateEmissionFactor: (id, data) => api.patch(`/carbon/emission-factors/${id}/`, data),
  deleteEmissionFactor: (id) => api.delete(`/carbon/emission-factors/${id}/`),
  getActivityTypes: () => api.get('/carbon/emission-factors/activity_types/'),

  // Carbon Transactions
  getTransactions: (params) => api.get('/carbon/transactions/', { params }),
  createTransaction: (data) => api.post('/carbon/transactions/', data),
  deleteTransaction: (id) => api.delete(`/carbon/transactions/${id}/`),

  // Environmental Goals
  getGoals: (params) => api.get('/carbon/goals/', { params }),
  getGoal: (id) => api.get(`/carbon/goals/${id}/`),
  createGoal: (data) => api.post('/carbon/goals/', data),
  updateGoal: (id, data) => api.patch(`/carbon/goals/${id}/`, data),
  deleteGoal: (id) => api.delete(`/carbon/goals/${id}/`),

  // Dashboard
  getDashboard: (params) => api.get('/carbon/dashboard/', { params }),

  // ERP Records
  createPurchase: (data) => api.post('/carbon/erp/purchases/', data),
  createManufacturing: (data) => api.post('/carbon/erp/manufacturing/', data),
  createExpense: (data) => api.post('/carbon/erp/expenses/', data),
  createFleet: (data) => api.post('/carbon/erp/fleet/', data),
};

export default api;
