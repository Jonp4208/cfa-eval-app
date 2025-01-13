import axios from 'axios';

const PUBLIC_ROUTES = ['/api/login', '/api/register', '/api/auth/login', '/api/auth/register'];
const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const fullUrl = `${API_URL}${config.url}`;
  console.log('Making request to:', fullUrl);
  console.log('With token:', token);
  
  // Don't redirect if accessing public routes
  const isPublicRoute = PUBLIC_ROUTES.some(route => config.url?.includes(route));
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (!isPublicRoute) {
    console.warn('No auth token found');
    window.location.href = '/login';
  }
  
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      url: `${API_URL}${error.config?.url}`,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      headers: error.config?.headers
    });

    // Handle 401 Unauthorized errors, but not for public routes
    const isPublicRoute = PUBLIC_ROUTES.some(route => error.config?.url?.includes(route));
    if (error.response?.status === 401 && !isPublicRoute) {
      console.log('Unauthorized request - redirecting to login');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    throw error;
  }
);

export default api;