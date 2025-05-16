const API_URL = 'http://localhost:8000/api'; // Ajusta esto a la URL de tu backend Django

interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

export const handleApiError = async (response: Response): Promise<ApiError> => {
  try {
    const errorData = await response.json();
    return {
      message: errorData.error || 'Algo salió mal',
      errors: errorData.errors,
    };
  } catch (e) {
    return {
      message: 'Error de conexión con el servidor',
    };
  }
};

export const fetchApi = async (
  endpoint: string,
  options: RequestInit = {},
  authToken?: string
): Promise<any> => {
  const url = `${API_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken && { Authorization: `Bearer ${authToken}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.detail || errorMessage;
      } catch {
        // Si no se puede parsear como JSON, usar el mensaje predeterminado
      }

      throw new Error(errorMessage);
    }

    // Para peticiones DELETE que pueden no devolver contenido
    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    return await response.text();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Función para manejar la autenticación
export const loginUser = async (email: string, password: string) => {
  try {
    const response = await fetchApi('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    // Retornar explícitamente user y token
    return {
      user: response.user,
      token: response.token,
      error: response.error
    };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

// Función para registrar usuario
export const registerUser = async (userData: any) => {
  try {
    const response = await fetchApi('/user', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    return response;
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
};

// Función para verificar usuario
export const verifyUser = async (email: string, code: string) => {
  try {
    // Primero obtenemos el usuario por email
    const users = await fetchApi('/user', { method: 'GET' });
    const user = users.find((u: any) => u.email === email);
    if (!user) throw new Error('Usuario no encontrado');

    // Hacemos POST a /auth/verify
    const response = await fetchApi('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ user_id: user.id, code }),
    });

    if (response.success) {
      // Actualizamos el estado de verificación del usuario
      await fetchApi(`/user/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ verified: 1 }),
      });
      return { success: true };
    } else {
      throw new Error(response.error || 'Código de verificación incorrecto');
    }
  } catch (error) {
    throw error;
  }
};
