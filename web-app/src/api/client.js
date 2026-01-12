/**
 * API Client for Personal Context Hub
 * Handles all HTTP requests to the backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/**
 * Get authentication token from localStorage
 */
const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Set authentication token in localStorage
 */
export const setToken = (token) => {
  localStorage.setItem('token', token);
};

/**
 * Remove authentication token from localStorage
 */
export const removeToken = () => {
  localStorage.removeItem('token');
};

/**
 * Generic fetch wrapper with authentication
 */
const fetchWithAuth = async (endpoint, options = {}) => {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'An error occurred');
  }

  return data;
};

// Auth API
export const authAPI = {
  register: async (email, password, name) => {
    const data = await fetchWithAuth('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    if (data.data.token) {
      setToken(data.data.token);
    }
    return data;
  },

  login: async (email, password) => {
    const data = await fetchWithAuth('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.data.token) {
      setToken(data.data.token);
    }
    return data;
  },

  getCurrentUser: async () => {
    return fetchWithAuth('/api/auth/me');
  },

  logout: () => {
    removeToken();
  },
};

// Topics API
export const topicsAPI = {
  getAll: async () => {
    return fetchWithAuth('/api/topics');
  },

  getById: async (id) => {
    return fetchWithAuth(`/api/topics/${id}`);
  },

  create: async (topicData) => {
    return fetchWithAuth('/api/topics', {
      method: 'POST',
      body: JSON.stringify(topicData),
    });
  },

  update: async (id, topicData) => {
    return fetchWithAuth(`/api/topics/${id}`, {
      method: 'PUT',
      body: JSON.stringify(topicData),
    });
  },

  delete: async (id) => {
    return fetchWithAuth(`/api/topics/${id}`, {
      method: 'DELETE',
    });
  },
};

// Captures API
export const capturesAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/api/captures${queryString ? `?${queryString}` : ''}`);
  },

  getById: async (id) => {
    return fetchWithAuth(`/api/captures/${id}`);
  },

  create: async (captureData) => {
    return fetchWithAuth('/api/captures', {
      method: 'POST',
      body: JSON.stringify(captureData),
    });
  },

  update: async (id, captureData) => {
    return fetchWithAuth(`/api/captures/${id}`, {
      method: 'PUT',
      body: JSON.stringify(captureData),
    });
  },

  delete: async (id) => {
    return fetchWithAuth(`/api/captures/${id}`, {
      method: 'DELETE',
    });
  },
};

// Resources API
export const resourcesAPI = {
  getByTopic: async (topicId) => {
    return fetchWithAuth(`/api/topics/${topicId}/resources`);
  },

  create: async (topicId, resourceData) => {
    return fetchWithAuth(`/api/topics/${topicId}/resources`, {
      method: 'POST',
      body: JSON.stringify(resourceData),
    });
  },

  update: async (id, resourceData) => {
    return fetchWithAuth(`/api/resources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(resourceData),
    });
  },

  delete: async (id) => {
    return fetchWithAuth(`/api/resources/${id}`, {
      method: 'DELETE',
    });
  },

  reorder: async (topicId, resourceOrders) => {
    return fetchWithAuth(`/api/topics/${topicId}/resources/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ resourceOrders }),
    });
  },
};
