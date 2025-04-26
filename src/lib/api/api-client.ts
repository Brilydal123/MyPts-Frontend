import axios from 'axios';
import { getAuthToken } from './auth-helper';

// Create axios instance with default config
const apiClientInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token - safely handle browser vs server
apiClientInstance.interceptors.request.use(
  async (config) => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      try {
        const token = await getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Error getting auth token:', error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClientInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle unauthorized errors (401)
    if (error.response?.status === 401) {
      // Only attempt to redirect if in browser context
      if (typeof window !== 'undefined') {
        console.log('Unauthorized, redirecting to login');
        // You can add logic here to redirect to login page
      }
    }
    return Promise.reject(error);
  }
);

// Export as a named export
export const apiClient = apiClientInstance;

// Also include a default export
export default apiClientInstance;
