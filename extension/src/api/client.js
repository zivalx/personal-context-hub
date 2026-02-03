/**
 * API Client for Chrome Extension
 * Uses chrome.storage for token management
 */

import { API_BASE_URL } from '../config.js';

/**
 * Get authentication token from chrome.storage
 */
const getToken = async () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['token'], (result) => {
      resolve(result.token);
    });
  });
};

/**
 * Set authentication token in chrome.storage
 */
export const setToken = (token) => {
  return new Promise((resolve) => {
    chrome.storage.local.set({ token }, resolve);
  });
};

/**
 * Remove authentication token from chrome.storage
 */
export const removeToken = () => {
  return new Promise((resolve) => {
    chrome.storage.local.remove(['token'], resolve);
  });
};

/**
 * Generic fetch wrapper with authentication
 */
const fetchWithAuth = async (endpoint, options = {}) => {
  const token = await getToken();

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
  login: async (email, password) => {
    const data = await fetchWithAuth('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.data.token) {
      await setToken(data.data.token);
    }
    return data;
  },

  getCurrentUser: async () => {
    return fetchWithAuth('/api/auth/me');
  },

  logout: async () => {
    await removeToken();
  },
};

// Captures API
export const capturesAPI = {
  create: async (captureData) => {
    return fetchWithAuth('/api/captures', {
      method: 'POST',
      body: JSON.stringify(captureData),
    });
  },

  getAll: async () => {
    return fetchWithAuth('/api/captures');
  },
};

// Resources API
export const resourcesAPI = {
  create: async (topicId, resourceData) => {
    return fetchWithAuth(`/api/topics/${topicId}/resources`, {
      method: 'POST',
      body: JSON.stringify(resourceData),
    });
  },
};
