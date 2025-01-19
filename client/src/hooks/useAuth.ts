import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      clearAuth: () => set({ user: null, token: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

export const useAuth = () => {
  const { user, token, setAuth, clearAuth } = useAuthStore();

  return {
    user,
    token,
    isAuthenticated: !!token,
    setAuth,
    clearAuth,
  };
}; 