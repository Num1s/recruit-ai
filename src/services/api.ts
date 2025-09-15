import axios, { AxiosInstance, AxiosResponse } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class APIService {
  private client: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Добавляем interceptor для автоматического добавления токена
    this.client.interceptors.request.use(
      (config) => {
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor для обработки ошибок
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Токен истек или недействителен
          this.clearAuth();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  clearAuth(): void {
    this.authToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<AxiosResponse> {
    return this.client.post('/auth/login', { email, password });
  }

  async register(userData: any): Promise<AxiosResponse> {
    return this.client.post('/auth/register', userData);
  }

  async logout(): Promise<AxiosResponse> {
    return this.client.post('/auth/logout');
  }

  async getCurrentUser(): Promise<AxiosResponse> {
    return this.client.get('/auth/me');
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<AxiosResponse> {
    return this.client.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  }

  // User profile endpoints
  async getCandidateProfile(): Promise<AxiosResponse> {
    return this.client.get('/users/profile/candidate');
  }

  async updateCandidateProfile(profileData: any): Promise<AxiosResponse> {
    return this.client.put('/users/profile/candidate', profileData);
  }

  async getCompanyProfile(): Promise<AxiosResponse> {
    return this.client.get('/users/profile/company');
  }

  async updateCompanyProfile(profileData: any): Promise<AxiosResponse> {
    return this.client.put('/users/profile/company', profileData);
  }

  async uploadCV(file: File): Promise<AxiosResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.client.post('/users/upload/cv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async uploadAvatar(file: File): Promise<AxiosResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.client.post('/users/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Interview endpoints
  async getInterviewInvitations(): Promise<AxiosResponse> {
    return this.client.get('/interviews/invitations');
  }

  async startInterview(invitationId: string): Promise<AxiosResponse> {
    return this.client.post('/interviews/start', { invitation_id: invitationId });
  }

  async submitInterview(sessionId: string, data: any): Promise<AxiosResponse> {
    return this.client.post(`/interviews/${sessionId}/submit`, data);
  }

  // Company endpoints
  async getCompanyDashboard(): Promise<AxiosResponse> {
    return this.client.get('/companies/dashboard');
  }

  async getCompanyCandidates(): Promise<AxiosResponse> {
    return this.client.get('/companies/candidates');
  }

  // Reports endpoints
  async getCandidateReport(candidateId: string): Promise<AxiosResponse> {
    return this.client.get(`/reports/${candidateId}`);
  }

  // Jobs endpoints
  async getJobs(): Promise<AxiosResponse> {
    return this.client.get('/jobs');
  }

  async createJob(jobData: any): Promise<AxiosResponse> {
    return this.client.post('/jobs', jobData);
  }

  async updateJob(jobId: string, jobData: any): Promise<AxiosResponse> {
    return this.client.put(`/jobs/${jobId}`, jobData);
  }

  async deleteJob(jobId: string): Promise<AxiosResponse> {
    return this.client.delete(`/jobs/${jobId}`);
  }
}

// Создаем единственный экземпляр API сервиса
export const authAPI = new APIService();
export default authAPI;
