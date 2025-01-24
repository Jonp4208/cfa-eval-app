import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/axios';
import { useEffect } from 'react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'employee' | 'manager' | 'admin';
  position?: string;
  department?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User | null, token: string | null) => void;
  clearAuth: () => void;
  initAuth: () => Promise<void>;
  isInitialized: boolean;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isInitialized: false,
      setAuth: (user, token) => set({ user, token }),
      clearAuth: () => set({ user: null, token: null }),
      initAuth: async () => {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const response = await api.get('/api/auth/profile');
            console.log('Auth profile response:', response.data);
            set({ user: response.data.user, token, isInitialized: true });
          } catch (error) {
            console.error('Auth profile error:', error);
            localStorage.removeItem('token');
            set({ user: null, token: null, isInitialized: true });
          }
        } else {
          set({ isInitialized: true });
        }
      }
    }),
    {
      name: 'auth-storage',
    }
  )
);

export const useAuth = () => {
  const { user, token, setAuth, clearAuth, initAuth, isInitialized } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) {
      console.log('Initializing auth state...');
      initAuth();
    }
  }, [isInitialized, initAuth]);

  return {
    user,
    token,
    isAuthenticated: !!token,
    setAuth,
    clearAuth,
  };
}; 