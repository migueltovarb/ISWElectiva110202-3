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
  phone: string;
  verified: number;
  is_admin: boolean;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface VerificationResponse {
  success: boolean;
  error?: string;
  token?: string;
}

export const authService = {
  register: async (userData: RegisterData): Promise<User> => {
    return registerUser(userData);
  },

  login: async (email: string, password: string): Promise<LoginResponse> => {
    return loginUser(email, password);
  },

  createAuthToken: async (userId: number): Promise<{ token?: string }> => {
    const response = await fetchApi(`/auth?user_id=${userId}`, {
      method: 'GET',
    });
    
    // El backend devuelve el token en auth_code
    const token = response.auth_code || response.token;
    
    return { token };
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

  resetPassword: async (email: string, token: string, newPassword: string): Promise<{ message: string }> => {
    try {
      // First get the user by email
      const users = await fetchApi('/user', { method: 'GET' });
      const user = users.find((u: User) => u.email === email);
      if (!user) throw new Error('Usuario no encontrado');

      // Verify the token and update password
      const response = await fetchApi('/auth', {
        method: 'POST',
        body: JSON.stringify({ user_id: user.id, code: token }),
      });

      if (response.success) {
        // Update user password
        await fetchApi(`/user/${user.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ password: newPassword }),
        });
        return { message: 'Contraseña actualizada exitosamente' };
      } else {
        throw new Error('Código de verificación inválido');
      }
    } catch (error) {
      throw error;
    }
  },

  resendVerificationCode: async (email: string): Promise<VerificationResponse> => {
    try {
      const users = await fetchApi('/user', { method: 'GET' });
      const user = users.find((u: User) => u.email === email);
      
      if (!user) {
        return { success: false, error: 'Usuario no encontrado' };
      }
      
      const response = await fetchApi(`/auth?user_id=${user.id}`, {
        method: 'GET',
      });
      
      // El backend devuelve el token en auth_code
      const token = response.auth_code || response.token;
      
      return { 
        success: true, 
        token: token 
      };
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