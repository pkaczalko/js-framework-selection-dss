'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from '@/lib/api/client';
import type { User } from '@/lib/api/types';

const JWT_KEY = 'jwt';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

function persistSession(user: User) {
  localStorage.setItem(JWT_KEY, user.token);
}

function clearSession() {
  localStorage.removeItem(JWT_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(JWT_KEY);
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .getCurrentUser()
      .then(({ user: currentUser }) => {
        setUserState({ ...currentUser, token });
      })
      .catch(() => {
        clearSession();
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user: loggedInUser } = await api.login({ email, password });
    persistSession(loggedInUser);
    setUserState(loggedInUser);
  }, []);

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const { user: registeredUser } = await api.register({
        username,
        email,
        password,
      });
      persistSession(registeredUser);
      setUserState(registeredUser);
    },
    [],
  );

  const logout = useCallback(() => {
    clearSession();
    setUserState(null);
  }, []);

  const setUser = useCallback((updatedUser: User) => {
    persistSession(updatedUser);
    setUserState(updatedUser);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      loading,
      login,
      register,
      logout,
      setUser,
    }),
    [user, loading, login, register, logout, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
