import { fetchApi, loginUser, registerUser, verifyUser } from './api';

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  verified: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface VerificationResponse {
  success: boolean;
  error?: string;
}

export const authService = {
  register: async (userData: RegisterData): Promise<User> => {
    return registerUser(userData);
  },

  login: async (email: string, password: string): Promise<LoginResponse> => {
    return loginUser(email, password);
  },

  createAuthToken: async (userId: number): Promise<any> => {
    return fetchApi(`/auth?user_id=${userId}`, {
      method: 'GET',
    });
  },

  verifyUser: async (email: string, code: string): Promise<VerificationResponse> => {
    try {
      const response = await verifyUser(email, code);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error de verificación' 
      };
    }
  },

  resendVerificationCode: async (email: string): Promise<VerificationResponse> => {
    try {
      const users = await fetchApi('/user', { method: 'GET' });
      const user = users.find((u: User) => u.email === email);
      
      if (!user) {
        return { success: false, error: 'Usuario no encontrado' };
      }
      
      await fetchApi(`/auth?user_id=${user.id}`, {
        method: 'GET',
      });
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error al reenviar el código' 
      };
    }
  },

  getCurrentUser: async (token: string): Promise<User> => {
    try {
      const response = await fetchApi('/user', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response;
    } catch (error) {
      throw new Error('Error al obtener el usuario actual');
    }
  }
};