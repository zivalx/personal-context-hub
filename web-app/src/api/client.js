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

  markAsRead: async (id) => {
    return fetchWithAuth(`/api/captures/${id}/read`, {
      method: 'PUT',
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

  removeFromTopic: async (id) => {
    return fetchWithAuth(`/api/resources/${id}/remove-from-topic`, {
      method: 'DELETE',
    });
  },

  copyToTopic: async (id, topicId) => {
    return fetchWithAuth(`/api/resources/${id}/copy-to-topic`, {
      method: 'POST',
      body: JSON.stringify({ topicId }),
    });
  },

  moveToTopic: async (id, topicId) => {
    return fetchWithAuth(`/api/resources/${id}/move-to-topic`, {
      method: 'PUT',
      body: JSON.stringify({ topicId }),
    });
  },

  reorder: async (topicId, resourceOrders) => {
    return fetchWithAuth(`/api/topics/${topicId}/resources/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ resourceOrders }),
    });
  },

  markAsRead: async (id) => {
    return fetchWithAuth(`/api/resources/${id}/read`, {
      method: 'PUT',
    });
  },

  // Upload file resource
  uploadFile: async (topicId, file, title, description) => {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/topics/${topicId}/resources/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to upload file');
    }
    return data;
  },

  // Get file URL for viewing
  getFileViewUrl: (id) => {
    const token = localStorage.getItem('token');
    return `${API_BASE_URL}/api/resources/${id}/view?token=${token}`;
  },

  // Get file URL for downloading
  getFileDownloadUrl: (id) => {
    const token = localStorage.getItem('token');
    return `${API_BASE_URL}/api/resources/${id}/download?token=${token}`;
  },
};

// Search API
export const searchAPI = {
  globalSearch: async (query, limit = 20) => {
    const params = new URLSearchParams({ q: query, limit: limit.toString() });
    return fetchWithAuth(`/api/search?${params.toString()}`);
  },
};

// Bookmarks API
export const bookmarksAPI = {
  getAll: async () => {
    return fetchWithAuth('/api/bookmarks');
  },

  toggleTopic: async (id) => {
    return fetchWithAuth(`/api/bookmarks/topic/${id}`, {
      method: 'PUT',
    });
  },

  toggleCapture: async (id) => {
    return fetchWithAuth(`/api/bookmarks/capture/${id}`, {
      method: 'PUT',
    });
  },

  toggleResource: async (id) => {
    return fetchWithAuth(`/api/bookmarks/resource/${id}`, {
      method: 'PUT',
    });
  },
};

// Groups API
export const groupsAPI = {
  getByTopic: async (topicId) => {
    return fetchWithAuth(`/api/topics/${topicId}/groups`);
  },

  create: async (topicId, groupData) => {
    return fetchWithAuth(`/api/topics/${topicId}/groups`, {
      method: 'POST',
      body: JSON.stringify(groupData),
    });
  },

  update: async (id, groupData) => {
    return fetchWithAuth(`/api/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(groupData),
    });
  },

  delete: async (id) => {
    return fetchWithAuth(`/api/groups/${id}`, {
      method: 'DELETE',
    });
  },

  reorder: async (topicId, groupOrders) => {
    return fetchWithAuth(`/api/topics/${topicId}/groups/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ groupOrders }),
    });
  },
};

// Analytics API
export const analyticsAPI = {
  /**
   * Get user analytics overview
   * @param {number} days - Number of days to fetch (default: 30)
   */
  getOverview: async (days = 30) => {
    return fetchWithAuth(`/api/analytics/overview?days=${days}`);
  },

  /**
   * Get event history
   * @param {object} params - Query parameters (eventType, limit, offset, days)
   */
  getEventHistory: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return fetchWithAuth(`/api/analytics/events?${queryParams}`);
  },

  /**
   * Get user stats summary
   */
  getStats: async () => {
    return fetchWithAuth('/api/analytics/stats');
  },

  /**
   * Track an analytics event
   * @param {object} eventData - Event data (eventType, eventName, properties, source, sessionId)
   */
  trackEvent: async (eventData) => {
    return fetchWithAuth('/api/analytics/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  },
};

// Admin API
export const adminAPI = {
  /**
   * Get all users
   * @param {object} params - Query parameters (page, limit, sortBy, order)
   */
  getUsers: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return fetchWithAuth(`/api/admin/users?${queryParams}`);
  },

  /**
   * Get user detail
   * @param {string} userId - User ID
   * @param {number} days - Number of days for activity (default: 30)
   */
  getUserDetail: async (userId, days = 30) => {
    return fetchWithAuth(`/api/admin/users/${userId}?days=${days}`);
  },

  /**
   * Get all analytics events
   * @param {object} params - Query parameters (page, limit, userId, eventType, days, sortBy, order)
   */
  getAllEvents: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return fetchWithAuth(`/api/admin/events?${queryParams}`);
  },

  /**
   * Get platform analytics overview
   * @param {number} days - Number of days to fetch (default: 30)
   */
  getPlatformAnalytics: async (days = 30) => {
    return fetchWithAuth(`/api/admin/analytics?days=${days}`);
  },
};
