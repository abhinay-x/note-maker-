import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { APIResponse, AuthTokens, Note } from '@/types';

class ApiService {
  private api: AxiosInstance;
  private tokens: AuthTokens | null = null;

  // Normalize server note shape (_id, userId, createdAt, updatedAt) -> client shape (id, user_id, created_at, updated_at)
  private transformNote(note: any): Note {
    return {
      id: note.id || note._id,
      user_id: note.user_id || note.userId,
      title: note.title,
      content: note.content,
      tags: Array.isArray(note.tags) ? note.tags : [],
      created_at: note.created_at || note.createdAt,
      updated_at: note.updated_at || note.updatedAt,
    } as Note;
  }

  constructor() {
    const baseURL = (import.meta as any)?.env?.VITE_API_BASE || 'http://localhost:5000/api';
    this.api = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.loadTokensFromStorage();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        if (this.tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${this.tokens.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 403 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshTokens();
            originalRequest.headers.Authorization = `Bearer ${this.tokens?.accessToken}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            this.clearTokens();
            window.location.href = '/auth/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private loadTokensFromStorage() {
    const storedTokens = localStorage.getItem('auth_tokens');
    if (storedTokens) {
      this.tokens = JSON.parse(storedTokens);
    }
  }

  private saveTokensToStorage(tokens: AuthTokens) {
    this.tokens = tokens;
    localStorage.setItem('auth_tokens', JSON.stringify(tokens));
  }

  private clearTokens() {
    this.tokens = null;
    localStorage.removeItem('auth_tokens');
    localStorage.removeItem('user_data');
  }

  public setTokens(tokens: AuthTokens) {
    this.saveTokensToStorage(tokens);
  }

  public getTokens(): AuthTokens | null {
    return this.tokens;
  }

  private async refreshTokens(): Promise<void> {
    if (!this.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    // Use same base URL as the API instance to avoid hitting the client origin in production
    const response = await this.api.post('/auth/refresh', {
      refreshToken: this.tokens.refreshToken,
    });

    if (response.data.success) {
      this.saveTokensToStorage(response.data.data.tokens);
    } else {
      throw new Error('Token refresh failed');
    }
  }

  // Auth endpoints
  async signupEmail(data: { email: string; password: string; firstName: string; lastName: string }) {
    const response: AxiosResponse<APIResponse> = await this.api.post('/auth/signup/email', data);
    return response.data;
  }

  async verifyOTP(data: { email: string; otp: string; tempData: any }) {
    const response: AxiosResponse<APIResponse> = await this.api.post('/auth/verify-otp', data);
    if (response.data.success && response.data.data?.tokens) {
      this.setTokens(response.data.data.tokens);
      localStorage.setItem('user_data', JSON.stringify(response.data.data.user));
    }
    return response.data;
  }

  async loginEmail(data: { email: string; password: string }) {
    const response: AxiosResponse<APIResponse> = await this.api.post('/auth/login/email', data);
    if (response.data.success && response.data.data?.tokens) {
      this.setTokens(response.data.data.tokens);
      localStorage.setItem('user_data', JSON.stringify(response.data.data.user));
    }
    return response.data;
  }

  async forgotPassword(data: { email: string }) {
    const response: AxiosResponse<APIResponse> = await this.api.post('/auth/forgot-password', data);
    return response.data;
  }

  async resetPassword(data: { email: string; otp: string; newPassword: string }) {
    const response: AxiosResponse<APIResponse> = await this.api.post('/auth/reset-password', data);
    return response.data;
  }

  async logout() {
    try {
      await this.api.post('/auth/logout', {
        refreshToken: this.tokens?.refreshToken,
      });
    } finally {
      this.clearTokens();
    }
  }

  // Notes endpoints
  async getNotes(params?: { page?: number; limit?: number; search?: string; tags?: string }) {
    const response: AxiosResponse<APIResponse> = await this.api.get('/notes', { params });
    if (response.data.success && response.data.data?.notes) {
      response.data.data.notes = response.data.data.notes.map((n: any) => this.transformNote(n));
    }
    return response.data;
  }

  async getNoteById(id: string) {
    const response: AxiosResponse<APIResponse> = await this.api.get(`/notes/${id}`);
    if (response.data.success && response.data.data?.note) {
      response.data.data.note = this.transformNote(response.data.data.note);
    }
    return response.data;
  }

  async createNote(data: { title: string; content: string; tags: string[] }) {
    const response: AxiosResponse<APIResponse> = await this.api.post('/notes', data);
    if (response.data.success && response.data.data?.note) {
      response.data.data.note = this.transformNote(response.data.data.note);
    }
    return response.data;
  }

  async updateNote(id: string, data: { title: string; content: string; tags: string[] }) {
    const response: AxiosResponse<APIResponse> = await this.api.put(`/notes/${id}`, data);
    if (response.data.success && response.data.data?.note) {
      response.data.data.note = this.transformNote(response.data.data.note);
    }
    return response.data;
  }

  async deleteNote(id: string) {
    const response: AxiosResponse<APIResponse> = await this.api.delete(`/notes/${id}`);
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
