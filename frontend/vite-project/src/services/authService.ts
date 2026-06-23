import apiClient from '../api/apiClient';
import { API_ENDPOINTS } from '../constance/Routes';

class AuthService {
  async login(email: string, password: string) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
    return response.data;
  }

  async register(email: string, password: string) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, { email, password });
    return response.data;
  }
}

export const authService = new AuthService();
