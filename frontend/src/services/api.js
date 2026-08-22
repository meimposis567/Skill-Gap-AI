import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // Set a global timeout for AI calls (60 seconds)
  config.timeout = 60000;
  return config;
});

// ─── Auth ────────────────────────────────────────────────
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser    = (data) => API.post('/auth/login', data);
export const getProfile   = (userId) => API.get(`/auth/profile/${userId}`);
export const updateProfile = (userId, data) => API.put(`/auth/profile/${userId}`, data);
export const updateResume  = (userId, formData) => API.put(`/auth/profile/${userId}/resume`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// ─── Skills ──────────────────────────────────────────────
export const analyzeSkills  = (data)   => {
  if (data instanceof FormData) {
    return API.post('/skills/analyze', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
  return API.post('/skills/analyze', data);
};
export const getRoles       = ()       => API.get('/skills/roles');
export const getProgress    = (userId) => API.get(`/skills/progress/${userId}`);
export const getDashboard   = (userId) => API.get(`/skills/dashboard/${userId}`);
export const getReports     = (userId, role) => {
  const url = role ? `/skills/reports/${userId}?role=${role}` : `/skills/reports/${userId}`;
  return API.get(url);
};
export const addRole        = (data)   => API.post('/skills/roles', data);
export const masterSkill    = (data)   => API.put('/skills/master-skill', data);
export const unmasterSkill  = (data)   => API.put('/skills/unmaster-skill', data);
export const generateMockInterview = (data) => API.post('/skills/mock-interview', data);

// ─── Notifications ──────────────────────────────────────
export const getNotifications = (userId) => API.get(`/notifications/${userId}`);
export const markNotificationRead = (id) => API.put(`/notifications/read/${id}`);
export const markAllNotificationsRead = (userId) => API.put(`/notifications/read-all/${userId}`);
export const deleteNotification = (id) => API.delete(`/notifications/${id}`);

// ─── External APIs ──────────────────────────────────────
export const fetchLiveNews = async (role) => {
  const KEY = import.meta.env.VITE_NEWS_API_KEY;
  if (!KEY) return { data: { articles: [] } };
  const query = role ? `${role} career news` : 'technology career trends';
  return axios.get(`https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=relevancy&pageSize=5&apiKey=${KEY}`);
};

export const fetchRealSalary = async (role, country = 'us') => {
  const ID = import.meta.env.VITE_ADZUNA_APP_ID;
  const KEY = import.meta.env.VITE_ADZUNA_APP_KEY;
  if (!ID || !KEY) return null;
  const query = role || 'Software Developer';
  return axios.get(`https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${ID}&app_key=${KEY}&what=${encodeURIComponent(query)}&results_per_page=1`);
};

export default API;
