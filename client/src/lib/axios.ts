import axios from 'axios';
import { toast } from '@/components/ui/use-toast';

const PUBLIC_ROUTES = ['/api/login', '/api/register', '/api/auth/login', '/api/auth/register'];
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
}, (error) => {
  console.error('Request interceptor error:', error);
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.log('Axios interceptor caught error:', {
      status: error.response?.status,
      originalMessage: error.response?.data?.message,
      errorObject: error
    });

    if (error.code === 'ERR_NETWORK') {
      toast({
        title: 'Connection Error',
        description: 'Unable to connect to the server. Please check your connection and try again.',
        variant: 'destructive',
      });
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized errors, but not for login/register routes
    const isPublicRoute = PUBLIC_ROUTES.some(route => error.config?.url?.includes(route));
    
    if (error.response?.status === 401) {
      if (!isPublicRoute) {
        // For protected routes, redirect to login
        console.log('Unauthorized request - redirecting to login');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        // For login/register routes, show error message
        toast({
          title: 'Authentication Error',
          description: error.response?.data?.message || 'Invalid credentials',
          variant: 'destructive',
        });
      }
    } else if (error.response) {
      // Handle other error responses
      toast({
        title: 'Error',
        description: error.response.data?.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    }

    return Promise.reject(error);
  }
);

export default api;