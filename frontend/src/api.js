// src/api.js
const API_BASE_URL = 'http://localhost:3001/api';

const getToken = () => localStorage.getItem('crms_token');
const setToken = (token) => localStorage.setItem('crms_token', token);
const removeToken = () => localStorage.removeItem('crms_token');

const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    let data;
    const text = await response.text();
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      throw new Error('Non-JSON server response: ' + text.substring(0, 200));
    }

    if (!response.ok) {
      throw new Error((data && data.error) || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const authAPI = {
  login: async (username, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    if (data.token) {
      setToken(data.token);
    }
    
    return data;
  },
  
  logout: () => {
    removeToken();
  },
};

export const casesAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/cases?${queryString}`);
  },

  getById: (id) => apiRequest(`/cases/${id}`),

  getActive: () => apiRequest('/cases/active'),

  update: (id, caseData) => apiRequest(`/cases/${id}`, {
    method: 'PUT',
    body: JSON.stringify(caseData),
  }),
};

export const criminalsAPI = {
  getAll: () => apiRequest('/criminals'),

  create: (criminalData) => apiRequest('/criminals', {
    method: 'POST',
    body: JSON.stringify(criminalData),
  }),

  update: (id, criminalData) => apiRequest(`/criminals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(criminalData),
  }),
};

export const investigationsAPI = {
  getAll: () => apiRequest('/investigations'),
  
  create: (investigationData) => apiRequest('/investigations', {
    method: 'POST',
    body: JSON.stringify(investigationData),
  }),
  
  update: (id, investigationData) => apiRequest(`/investigations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(investigationData),
  }),
};

export const staffAPI = {
  getAll: () => apiRequest('/staff'),
  
  create: (staffData) => apiRequest('/staff', {
    method: 'POST',
    body: JSON.stringify(staffData),
  }),
};

export const dashboardAPI = {
  getStats: () => apiRequest('/dashboard/stats'),
};

export const crimeCategoriesAPI = {
  getAll: () => apiRequest('/crime-categories'),
};

// Users API (Admin only)
export const usersAPI = {
  getAll: () => apiRequest('/users'),
  
  create: (userData) => apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  
  update: (id, userData) => apiRequest(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  }),
  
  delete: (id) => apiRequest(`/users/${id}`, {
    method: 'DELETE',
  }),
};

// Roles API
export const rolesAPI = {
  getAll: () => apiRequest('/roles'),
};

// Audit Logs API (Superintendent only)
export const auditAPI = {
  getLogs: () => apiRequest('/audit-logs'),
};

// FIR API
export const firAPI = {
  register: (firData) => apiRequest('/fir', {
    method: 'POST',
    body: JSON.stringify(firData),
  }),
};