import React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/axios';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'evaluator' | 'manager' | 'admin';
  store?: {
    _id: string;
    name: string;
    storeNumber: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/api/auth/profile');
          console.log('Auth profile response:', response.data);
          setUser(response.data.user);
        } catch (error) {
          console.error('Auth profile error:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    // Clear any existing auth state before attempting login
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);

    try {
      console.log('Attempting login for:', email);
      const response = await api.post('/api/auth/login', { email, password });
      console.log('Login response:', response.data);
      
      if (!response.data.token || !response.data.user) {
        throw new Error('Invalid login response from server');
      }

      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      return response.data;
    } catch (error: any) {
      console.log('AuthContext login error:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        error: error
      });
      
      // Ensure auth state is cleared on login error
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};