  import { fetchApi } from './api';

  export interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    verified: boolean;
  }

  interface VerificationResponse {
    success: boolean;
    error?: string;
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

  export const authService = {
    register: async (userData: RegisterData): Promise<User> => {
      return fetchApi('/user', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    },

    login: async (email: string, password: string): Promise<LoginResponse> => {
      try {
        const users = await fetchApi('/user', { method: 'GET' });
        
        const user = users.find((u: User) => u.email === email);
        
        if (!user) {
          throw new Error('Usuario no encontrado');
        }
        const token = btoa(`${user.id}:${user.email}`);
        
        return {
          user,
          token
        };
      } catch (error) {
        throw new Error('Credenciales inválidas');
      }
    },

    createAuthToken: async (userId: number): Promise<any> => {
      return fetchApi('/auth', {
        method: 'POST',
        body: JSON.stringify([{ user: userId }]),
      });
      },

      verifyUser: async (email: string, code: string): Promise<VerificationResponse> => {
      try {
        // 1. Encontrar al usuario
        const users = await fetchApi('/user', { method: 'GET' });
        const user = users.find((u: User) => u.email === email);
        
        if (!user) {
        return { success: false, error: 'Usuario no encontrado' };
        }
        
        // 2. Verificar el código
        const authRecords = await fetchApi('/auth', { method: 'GET' });
        const userAuth = authRecords.find((auth: any) => auth.user === user.id);
        
        if (!userAuth) {
        return { success: false, error: 'No hay código de verificación para este usuario' };
        }
        
        if (userAuth.token !== code) {
        return { success: false, error: 'Código de verificación incorrecto' };
        }
        
        // 3. Actualizar el estado de verificación del usuario
        await fetchApi(`/user/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ verified:1}),
        });
        
        return { success: true };
      } catch (error) {
        return { success: false, error: 'Error de verificación' };
      }
      },

    // Resend verification code
    resendVerificationCode: async (email: string): Promise<VerificationResponse> => {
      try {
        // Find the user with the given email
        const users = await fetchApi('/user', { method: 'GET' });
        const user = users.find((u: User) => u.email === email);
        
        if (!user) {
          return { success: false, error: 'Usuario no encontrado' };
        }
        
        // Check if user already has an auth record
        const authRecords = await fetchApi('/auth', { method: 'GET' });
        const userAuth = authRecords.find((auth: any) => auth.user === user.id);
        
        if (userAuth) {
          // Update existing auth record with new token
          await fetchApi(`/auth/${userAuth.id}`, {
            method: 'PUT',
            body: JSON.stringify([{ user: user.id }]),
          });
        } else {
          // Create new auth record
          await fetchApi('/auth', {
            method: 'POST',
            body: JSON.stringify([{ user: user.id }]),
          });
        }
        
        return { success: true };
      } catch (error) {
        return { success: false, error: 'Error al reenviar el código' };
      }
    },

    // Get current user (requires authentication)
    getCurrentUser: async (token: string): Promise<User> => {
      try {
        // In a real implementation, you would have a dedicated endpoint
        // Here we're parsing the token to get the user ID
        const [userId] = atob(token).split(':');
        
        // Get all users
        const users = await fetchApi('/user', { method: 'GET' });
        
        // Find the user with the matching ID
        const user = users.find((u: User) => u.id === parseInt(userId));
        
        if (!user) {
          throw new Error('Usuario no encontrado');
        }
        
        return user;
      } catch (error) {
        throw new Error('Sesión inválida');
      }
    }
  };