import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://military-asset-backend.onrender.com/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
let isRedirecting = false;
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && !isRedirecting) {
            isRedirecting = true;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Redirect after a short delay to allow cleanup
            setTimeout(() => {
                window.location.href = '/login';
            }, 100);
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    getMe: () => api.get('/auth/me'),
    changePassword: (data) => api.post('/auth/change-password', data)
};

// Dashboard API
export const dashboardAPI = {
    getMetrics: (params) => api.get('/dashboard/metrics', { params }),
    getMovementDetails: (params) => api.get('/dashboard/movement-details', { params }),
    getInventorySummary: (params) => api.get('/dashboard/inventory-summary', { params })
};

// Purchases API
export const purchasesAPI = {
    getAll: (params) => api.get('/purchases', { params }),
    create: (data) => api.post('/purchases', data),
    update: (id, data) => api.put(`/purchases/${id}`, data),
    delete: (id) => api.delete(`/purchases/${id}`)
};

// Transfers API
export const transfersAPI = {
    getAll: (params) => api.get('/transfers', { params }),
    create: (data) => api.post('/transfers', data),
    updateStatus: (id, data) => api.put(`/transfers/${id}/status`, data),
    delete: (id) => api.delete(`/transfers/${id}`)
};

// Assignments API
export const assignmentsAPI = {
    getAll: (params) => api.get('/assignments', { params }),
    create: (data) => api.post('/assignments', data),
    returnAssignment: (id, data) => api.put(`/assignments/${id}/return`, data),
    delete: (id) => api.delete(`/assignments/${id}`)
};

// Expenditures API
export const expendituresAPI = {
    getAll: (params) => api.get('/expenditures', { params }),
    create: (data) => api.post('/expenditures', data),
    delete: (id) => api.delete(`/expenditures/${id}`)
};

// Common API
export const commonAPI = {
    getBases: () => api.get('/common/bases'),
    getEquipmentTypes: (params) => api.get('/common/equipment-types', { params }),
    getUsers: () => api.get('/common/users'),
    getAuditLogs: (params) => api.get('/common/audit-logs', { params })
};

export default api;
