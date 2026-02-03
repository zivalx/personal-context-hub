/**
 * Extension Configuration
 * Automatically uses production URLs when built for production
 */

// Check if we're in development or production
const isDevelopment = import.meta.env.DEV || false;

// API Configuration
export const API_BASE_URL = isDevelopment
  ? 'http://localhost:3001'
  : 'https://api.youtipical.com';

export const WEB_APP_URL = isDevelopment
  ? 'http://localhost:5173'
  : 'https://youtipical.com';

// Extension Configuration
export const CONFIG = {
  apiBaseUrl: API_BASE_URL,
  webAppUrl: WEB_APP_URL,
  isDevelopment,
  version: '1.0.0',
};

console.log('Extension running in:', isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION', 'mode');
console.log('API URL:', API_BASE_URL);
console.log('Web App URL:', WEB_APP_URL);
