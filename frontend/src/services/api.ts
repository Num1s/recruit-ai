import axios, { AxiosInstance, AxiosResponse } from 'axios';

const API_BASE_URL = (window as any).env?.REACT_APP_API_URL || 'http://localhost:8000/api';

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

  async updateUserProfile(userData: any): Promise<AxiosResponse> {
    return this.client.put('/users/profile', userData);
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
  async getJobs(params?: {
    skip?: number;
    limit?: number;
    status?: string;
    search?: string;
    experience_level?: string;
    job_type?: string;
    location?: string;
    company_id?: number;
  }): Promise<AxiosResponse> {
    return this.client.get('/jobs/', { params });
  }

  async getMyJobs(params?: {
    skip?: number;
    limit?: number;
    status?: string;
  }): Promise<AxiosResponse> {
    return this.client.get('/jobs/my', { params });
  }

  async getJob(jobId: string): Promise<AxiosResponse> {
    return this.client.get(`/jobs/${jobId}`);
  }

  async createJob(jobData: any): Promise<AxiosResponse> {
    return this.client.post('/jobs/', jobData);
  }

  async updateJob(jobId: string, jobData: any): Promise<AxiosResponse> {
    return this.client.put(`/jobs/${jobId}`, jobData);
  }

  async closeJob(jobId: string): Promise<AxiosResponse> {
    return this.client.patch(`/jobs/${jobId}/status`, { status: 'closed' });
  }

  async deleteJob(jobId: string): Promise<AxiosResponse> {
    return this.client.delete(`/jobs/${jobId}`);
  }

  async updateJobStatus(jobId: string, newStatus: string): Promise<AxiosResponse> {
    return this.client.patch(`/jobs/${jobId}/status`, { status: newStatus });
  }

  // Interview invitation endpoints
  async sendInterviewInvitation(invitationData: any): Promise<AxiosResponse> {
    return this.client.post('/interviews/invite', invitationData);
  }

  async getInterviewLink(invitationId: string): Promise<AxiosResponse> {
    return this.client.get(`/interviews/link/${invitationId}`);
  }

  async resendInvitation(invitationId: string): Promise<AxiosResponse> {
    return this.client.post(`/interviews/resend/${invitationId}`);
  }

  // Новые методы для работы с кандидатами и компаниями
  async getCandidates(params?: {
    skip?: number;
    limit?: number;
    search?: string;
    skills?: string;
    experience_min?: number;
    experience_max?: number;
    salary_min?: number;
    salary_max?: number;
    availability?: string;
  }): Promise<AxiosResponse> {
    return this.client.get('/users/candidates', { params });
  }

  async getCompanies(params?: {
    skip?: number;
    limit?: number;
    search?: string;
    industry?: string;
    size?: string;
    location?: string;
    technologies?: string;
    remote_work?: boolean;
  }): Promise<AxiosResponse> {
    return this.client.get('/users/companies', { params });
  }

  async inviteCandidate(candidateId: number): Promise<AxiosResponse> {
    return this.client.post(`/users/candidates/${candidateId}/invite`);
  }

  async inviteCandidateByRecruiter(candidateId: number): Promise<AxiosResponse> {
    return this.client.post(`/users/candidates/${candidateId}/invite-recruiter`);
  }

  async applyToCompany(companyId: number): Promise<AxiosResponse> {
    return this.client.post(`/users/companies/${companyId}/apply`);
  }

  // Job application endpoints
  async applyToJob(jobId: string, applicationData?: {
    cover_letter?: string;
    expected_salary?: number;
    availability_date?: string;
  }): Promise<AxiosResponse> {
    return this.client.post(`/jobs/${jobId}/apply`, applicationData || {});
  }

  async getJobApplications(jobId: string): Promise<AxiosResponse> {
    return this.client.get(`/jobs/${jobId}/applications`);
  }

  async updateApplicationStatus(applicationId: string, newStatus: string): Promise<AxiosResponse> {
    return this.client.patch(`/jobs/applications/${applicationId}/status?new_status=${newStatus}`);
  }

  async getCandidateApplications(): Promise<AxiosResponse> {
    return this.client.get('/jobs/candidate/applications');
  }

  // Методы для работы с приглашениями на интервью
  async createInterviewInvitation(invitationData: {
    job_id: number;
    candidate_id: number;
    application_id?: number;
    expires_at: string;
    scheduled_at?: string;
    interview_language?: string;
    custom_questions?: string[];
  }): Promise<AxiosResponse> {
    return this.client.post('/jobs/invitations', invitationData);
  }

  async getCandidateInvitations(): Promise<AxiosResponse> {
    return this.client.get('/jobs/invitations/candidate');
  }

  async updateInvitationStatus(invitationId: string, status: string): Promise<AxiosResponse> {
    return this.client.patch(`/jobs/invitations/${invitationId}/status`, { new_status: status });
  }

  // Методы для анализа интервью
  async analyzeInterview(invitationId: number, interviewDuration?: number, questionsAnswered?: number): Promise<AxiosResponse> {
    return this.client.post('/jobs/interviews/analyze', {
      invitation_id: invitationId,
      interview_duration: interviewDuration,
      questions_answered: questionsAnswered
    });
  }

  async getCompanyReports(): Promise<AxiosResponse> {
    return this.client.get('/jobs/reports/company');
  }

  // ========== NEW METHODS FOR STREAMS AND RECRUITER MANAGEMENT ==========

  async getStream(streamId: number): Promise<AxiosResponse> {
    return this.client.get(`/streams/${streamId}`);
  }

  async updateStream(streamId: number, streamData: {
    name?: string;
    senior_recruiter_id?: number;
  }): Promise<AxiosResponse> {
    return this.client.put(`/streams/${streamId}`, streamData);
  }

  async deleteStream(streamId: number): Promise<AxiosResponse> {
    return this.client.delete(`/streams/${streamId}`);
  }

  async addRecruiterToStream(streamId: number, recruiterId: number): Promise<AxiosResponse> {
    return this.client.post(`/streams/${streamId}/recruiters/${recruiterId}`);
  }

  async removeRecruiterFromStream(streamId: number, recruiterId: number): Promise<AxiosResponse> {
    return this.client.delete(`/streams/${streamId}/recruiters/${recruiterId}`);
  }

  async getAvailableRecruiters(): Promise<AxiosResponse> {
    return this.client.get('/streams/available/recruiters');
  }

  // User management endpoints for recruiters
  async getRecruiters(params?: {
    skip?: number;
    limit?: number;
    search?: string;
    stream_id?: number;
  }): Promise<AxiosResponse> {
    return this.client.get('/users/recruiters', { params });
  }

  async createUser(userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: string;
    phone?: string;
    stream_id?: number;
  }): Promise<AxiosResponse> {
    return this.client.post('/users/', userData);
  }


  async getAvailableStreams(): Promise<AxiosResponse> {
    return this.client.get('/users/streams/available');
  }

  // ========== STREAM MANAGEMENT ENDPOINTS ==========

  async getStreams(): Promise<AxiosResponse> {
    return this.client.get('/streams/');
  }

  async createStream(streamData: {
    name: string;
    senior_recruiter_id?: number;
    recruit_lead_id?: number;
  }): Promise<AxiosResponse> {
    return this.client.post('/streams/', streamData);
  }

  async getRecruiterProfile(): Promise<AxiosResponse> {
    return this.client.get('/users/profile/recruiter');
  }

  // ========== TEAM MANAGEMENT ENDPOINTS ==========

  async createTeamMember(userData: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    role: string;
    stream_id?: number;
  }): Promise<AxiosResponse> {
    return this.client.post('/users/', userData);
  }

  async getTeamMembers(): Promise<AxiosResponse> {
    return this.client.get('/users/recruiters');
  }

  async updateUserRole(userId: number, role: string, streamId?: number): Promise<AxiosResponse> {
    return this.client.put(`/users/${userId}/role`, { role, stream_id: streamId });
  }

  async deleteTeamMember(userId: number): Promise<AxiosResponse> {
    return this.client.delete(`/users/${userId}`);
  }

  // ========== ANALYTICS ENDPOINTS ==========

  async getAnalyticsDashboard(params?: {
    period_days?: number;
  }): Promise<AxiosResponse> {
    return this.client.get('/analytics/dashboard', { params });
  }

  async getStreamsAnalytics(): Promise<AxiosResponse> {
    return this.client.get('/analytics/streams');
  }

  async getRecruitersAnalytics(params?: {
    stream_id?: number;
  }): Promise<AxiosResponse> {
    return this.client.get('/analytics/recruiters', { params });
  }

  async getPerformanceAnalytics(params?: {
    period_days?: number;
    stream_id?: number;
  }): Promise<AxiosResponse> {
    return this.client.get('/analytics/performance', { params });
  }

  async exportAnalytics(params?: {
    format?: string;
    stream_id?: number;
  }): Promise<AxiosResponse> {
    return this.client.get('/analytics/export', { params });
  }

  // ========== INTEGRATIONS ENDPOINTS ==========

  async getIntegrations(): Promise<AxiosResponse> {
    return this.client.get('/integrations/');
  }

  async createIntegration(integrationData: any): Promise<AxiosResponse> {
    return this.client.post('/integrations/', integrationData);
  }

  async updateIntegration(integrationId: number, updateData: any): Promise<AxiosResponse> {
    return this.client.put(`/integrations/${integrationId}`, updateData);
  }

  async deleteIntegration(integrationId: number): Promise<AxiosResponse> {
    return this.client.delete(`/integrations/${integrationId}`);
  }

  async getIntegration(integrationId: number): Promise<AxiosResponse> {
    return this.client.get(`/integrations/${integrationId}`);
  }

  async searchCandidates(searchParams: {
    platform: string;
    keywords?: string[];
    locations?: string[];
    experience_min?: number;
    experience_max?: number;
    salary_min?: number;
    salary_max?: number;
    limit?: number;
  }): Promise<AxiosResponse> {
    return this.client.post('/integrations/search-candidates', searchParams);
  }

  async getExternalCandidates(params?: {
    platform?: string;
    is_imported?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<AxiosResponse> {
    return this.client.get('/integrations/candidates/', { params });
  }

  async getExternalCandidate(candidateId: number): Promise<AxiosResponse> {
    return this.client.get(`/integrations/candidates/${candidateId}`);
  }

  async importCandidate(importData: {
    external_candidate_id: number;
    create_internal_user?: boolean;
    import_notes?: string;
  }): Promise<AxiosResponse> {
    return this.client.post('/integrations/import-candidate', importData);
  }

  async syncIntegration(integrationId: number): Promise<AxiosResponse> {
    return this.client.post(`/integrations/${integrationId}/sync`);
  }

  async getSyncStatus(integrationId: number): Promise<AxiosResponse> {
    return this.client.get(`/integrations/${integrationId}/sync-status`);
  }

  async getIntegrationLogs(integrationId: number, limit?: number): Promise<AxiosResponse> {
    return this.client.get(`/integrations/${integrationId}/logs`, { 
      params: { limit } 
    });
  }

  async getIntegrationStats(): Promise<AxiosResponse> {
    return this.client.get('/integrations/stats/overview');
  }

  async getSupportedPlatforms(): Promise<AxiosResponse> {
    return this.client.get('/integrations/platforms/supported');
  }

}

// Создаем единственный экземпляр API сервиса
const authAPI = new APIService();
export { authAPI };
export default authAPI;



