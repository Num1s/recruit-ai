import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { message } from 'antd';
import { authAPI } from '../services/api.ts';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'candidate' | 'company' | 'admin';
  company_profile?: {
    id: number;
    company_name: string;
  };
  candidate_profile?: {
    id: number;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'candidate' | 'company';
  phone?: string;
  company_name?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверяем сохраненный токен при загрузке приложения
    const savedToken = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      // Устанавливаем токен в API сервис
      authAPI.setAuthToken(savedToken);
    }

    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await authAPI.login(email, password);
      const { access_token, user: userData } = response.data;

      setToken(access_token);
      setUser(userData);

      // Сохраняем в localStorage
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));

      // Устанавливаем токен в API сервис
      authAPI.setAuthToken(access_token);

      message.success('Успешный вход в систему');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Ошибка входа в систему';
      message.error(errorMessage);
      throw error;
    }
  };

  const register = async (userData: RegisterData): Promise<void> => {
    try {
      const response = await authAPI.register(userData);
      const { access_token, user: newUser } = response.data;

      setToken(access_token);
      setUser(newUser);

      // Сохраняем в localStorage
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(newUser));

      // Устанавливаем токен в API сервис
      authAPI.setAuthToken(access_token);

      message.success('Регистрация прошла успешно');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Ошибка регистрации';
      message.error(errorMessage);
      throw error;
    }
  };

  const logout = (): void => {
    setUser(null);
    setToken(null);

    // Удаляем из localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');

    // Удаляем токен из API сервиса
    authAPI.setAuthToken(null);

    message.success('Вы вышли из системы');
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
