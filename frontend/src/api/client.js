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

// ============ Social ============
export const socialAPI = {
  getActivities: (params) => api.get('/social/activities/', { params }),
  getActivity: (id) => api.get(`/social/activities/${id}/`),
  createActivity: (data) => api.post('/social/activities/', data),
  updateActivity: (id, data) => api.patch(`/social/activities/${id}/`, data),
  deleteActivity: (id) => api.delete(`/social/activities/${id}/`),
  joinActivity: (id) => api.post(`/social/activities/${id}/join/`),
  getParticipations: (params) => api.get('/social/participations/', { params }),
  reviewParticipation: (id, data) => api.patch(`/social/participations/${id}/review/`, data),
};

// ============ Governance ============
export const governanceAPI = {
  getPolicies: (params) => api.get('/governance/policies/', { params }),
  getPolicy: (id) => api.get(`/governance/policies/${id}/`),
  createPolicy: (data) => api.post('/governance/policies/', data),
  deletePolicy: (id) => api.delete(`/governance/policies/${id}/`),
  getAcknowledgements: (params) => api.get('/governance/acknowledgements/', { params }),
  acknowledge: (id) => api.post(`/governance/acknowledgements/${id}/acknowledge/`),
  getAudits: (params) => api.get('/governance/audits/', { params }),
  createAudit: (data) => api.post('/governance/audits/', data),
  getComplianceIssues: (params) => api.get('/governance/compliance-issues/', { params }),
  createComplianceIssue: (data) => api.post('/governance/compliance-issues/', data),
  updateComplianceIssue: (id, data) => api.patch(`/governance/compliance-issues/${id}/`, data),
};

// ============ Gamification ============
export const gamificationAPI = {
  getChallenges: (params) => api.get('/gamification/challenges/', { params }),
  createChallenge: (data) => api.post('/gamification/challenges/', data),
  transitionChallenge: (id, data) => api.patch(`/gamification/challenges/${id}/transition/`, data),
  joinChallenge: (id) => api.post(`/gamification/challenges/${id}/join/`),
  getParticipations: (params) => api.get('/gamification/challenge-participations/', { params }),
  updateProgress: (id, data) => api.patch(`/gamification/challenge-participations/${id}/update_progress/`, data),
  getBadges: () => api.get('/gamification/badges/'),
  getRewards: () => api.get('/gamification/rewards/'),
  redeemReward: (id) => api.post(`/gamification/rewards/${id}/redeem/`),
  getLeaderboard: (params) => api.get('/gamification/leaderboard/', { params }),
  getDepartmentScores: (params) => api.get('/gamification/department-scores/', { params }),
};

// ============ Reports ============
export const reportsAPI = {
  getEnvironmental: (params, config) => api.get('/reports/environmental/', { params, ...config }),
  getSocial: (params, config) => api.get('/reports/social/', { params, ...config }),
  getGovernance: (params, config) => api.get('/reports/governance/', { params, ...config }),
  getSummary: (params, config) => api.get('/reports/summary/', { params, ...config }),
  getCustom: (params, config) => api.get('/reports/custom/', { params, ...config }),
};

// ============ Notifications ============
export const notificationsAPI = {
  getAll: () => api.get('/notifications/'),
  markRead: (id) => api.patch(`/notifications/${id}/read/`),
  markAllRead: () => api.post('/notifications/mark_all_read/'),
  getUnreadCount: () => api.get('/notifications/unread_count/'),
  delete: (id) => api.delete(`/notifications/${id}/`),
};

// ============ Super Admin ============
export const superadminAPI = {
  getDashboard: () => api.get('/core/superadmin/dashboard/'),
};
