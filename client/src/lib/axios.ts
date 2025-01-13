import axios from 'axios';

const PUBLIC_ROUTES = ['/api/login', '/api/register', '/api/auth/login', '/api/auth/register'];
const API_URL = import.meta.env.VITE_API_URL || '';

console.log('Initializing axios with API_URL:', API_URL);

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
  console.log('Request Config:', {
    fullUrl,
    method: config.method,
    headers: config.headers,
    token,
    baseURL: config.baseURL,
    withCredentials: config.withCredentials
  });
  
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
  (response) => {
    console.log('Response:', {
      url: `${API_URL}${response.config.url}`,
      status: response.status,
      headers: response.headers,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('API Error Details:', {
      url: `${API_URL}${error.config?.url}`,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      headers: {
        request: error.config?.headers,
        response: error.response?.headers
      },
      fullError: error
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