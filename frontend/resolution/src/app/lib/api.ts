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
  
  // Configuración especial para Django CSRF
  const csrfOptions = {
    ...options,
    credentials: 'include' as RequestCredentials, // Para enviar y recibir cookies
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, csrfOptions);

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
    const response = await fetch(`${API_URL}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al iniciar sesión');
    }

    return await response.json();
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};
