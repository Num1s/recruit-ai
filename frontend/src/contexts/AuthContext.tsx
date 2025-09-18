import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { message } from 'antd';
import { authAPI } from '../services/api.ts';

export interface CandidateProfile {
  id: number;
  user_id: number;
  summary?: string;
  experience_years?: number;
  current_position?: string;
  current_company?: string;
  location?: string;
  skills?: string[];
  preferred_salary_min?: number;
  preferred_salary_max?: number;
  preferred_locations?: string[];
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  education?: string;
  languages?: string[];
  achievements?: string;
  cv_filename?: string;
  cv_url?: string;
  cv_uploaded_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'candidate' | 'company' | 'admin';
  phone?: string;
  avatar_url?: string;
  company_profile?: {
    id: number;
    company_name: string;
  };
  candidate_profile?: CandidateProfile;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
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
      // Проверяем валидность токена
      authAPI.setAuthToken(savedToken);
      
      // Проверяем токен через API
      authAPI.getCurrentUser()
        .then(response => {
          setToken(savedToken);
          setUser(response.data);
        })
        .catch(error => {
          // Токен недействителен, очищаем данные
          console.log('Токен недействителен, очищаем данные авторизации');
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          authAPI.setAuthToken(null);
          setToken(null);
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
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
    setUser,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
