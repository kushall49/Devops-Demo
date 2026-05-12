// ============================================================
// API LIBRARY - Centralized Axios instance
// All API calls go through this file.
//
// HOW IT WORKS:
//  - Creates an Axios instance with base URL set to backend
//  - Interceptor automatically adds JWT token to every request
//  - Response interceptor handles 401 (session expired) globally
// ============================================================

import axios from 'axios';

// The base URL comes from .env.local (or environment variables in Docker)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Create a pre-configured Axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000, // 10 second timeout
});

// ---- REQUEST INTERCEPTOR ----
// Runs before every request - adds auth token automatically
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage (set after login)
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---- RESPONSE INTERCEPTOR ----
// Runs after every response - handles auth errors globally
api.interceptors.response.use(
  (response) => response, // Pass through successful responses
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// ============================================================
// AUTH API CALLS
// ============================================================
export const authAPI = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  getMe: () => api.get('/auth/me'),
};

// ============================================================
// EVENTS API CALLS
// ============================================================
export const eventsAPI = {
  getAll: (params?: { month?: string; category?: string }) =>
    api.get('/events', { params }),

  create: (data: {
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    color?: string;
    category?: string;
    allDay?: boolean;
    location?: string;
  }) => api.post('/events', data),

  update: (id: string, data: Partial<{
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    color: string;
    category: string;
    allDay: boolean;
    location: string;
  }>) => api.put(`/events/${id}`, data),

  delete: (id: string) => api.delete(`/events/${id}`),
};

// ============================================================
// TASKS API CALLS
// ============================================================
export const tasksAPI = {
  getAll: (params?: { completed?: boolean; priority?: string }) =>
    api.get('/tasks', { params }),

  getStats: () => api.get('/tasks/stats'),

  create: (data: {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: string;
    category?: string;
  }) => api.post('/tasks', data),

  update: (id: string, data: Partial<{
    title: string;
    description: string;
    completed: boolean;
    priority: string;
    dueDate: string;
  }>) => api.put(`/tasks/${id}`, data),

  delete: (id: string) => api.delete(`/tasks/${id}`),
};

// ============================================================
// HEALTH API CALLS
// ============================================================
export const healthAPI = {
  getStatus: () => api.get('/health'),
  ping: () => api.get('/health/ping'),
};

export default api;
