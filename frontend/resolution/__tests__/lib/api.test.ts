import { fetchApi, handleApiError, loginUser, registerUser, verifyUser } from '../../src/app/lib/api';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('API Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('handleApiError', () => {
    it('maneja errores con mensaje de error', async () => {
      const response = new Response(JSON.stringify({ error: 'Error del servidor' }), { status: 500 });
      const error = await handleApiError(response);
      expect(error.message).toBe('Error del servidor');
    });

    it('maneja errores sin mensaje de error', async () => {
      const response = new Response(JSON.stringify({}), { status: 500 });
      const error = await handleApiError(response);
      expect(error.message).toBe('Algo salió mal');
    });

    it('maneja errores de conexión', async () => {
      const response = new Response(null, { status: 0 });
      const error = await handleApiError(response);
      expect(error.message).toBe('Error de conexión con el servidor');
    });

    it('maneja errores con detalles', async () => {
      const response = new Response(JSON.stringify({ detail: 'Detalle del error' }), { status: 500 });
      const error = await handleApiError(response);
      expect(error.message).toBe('Detalle del error');
    });

    it('maneja errores con errores de validación', async () => {
      const response = new Response(JSON.stringify({ 
        errors: { 
          email: ['Email inválido'],
          password: ['Contraseña muy corta']
        } 
      }), { status: 400 });
      const error = await handleApiError(response);
      expect(error.errors).toBeDefined();
      expect(error.errors?.email).toContain('Email inválido');
    });
  });

  describe('fetchApi', () => {
    it('realiza peticiones GET exitosas', async () => {
      const mockResponse = { data: 'test' };
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      }));

      const result = await fetchApi('/test', { method: 'GET' });
      expect(result).toEqual(mockResponse);
    });

    it('realiza peticiones POST exitosas', async () => {
      const mockData = { name: 'test' };
      const mockResponse = { data: 'created' };
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      }));

      const result = await fetchApi('/test', {
        method: 'POST',
        body: JSON.stringify(mockData)
      });
      expect(result).toEqual(mockResponse);
    });

    it('maneja respuestas sin contenido (204)', async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));
      const result = await fetchApi('/test', { method: 'DELETE' });
      expect(result).toBeNull();
    });

    it('maneja respuestas no JSON', async () => {
      mockFetch.mockResolvedValueOnce(new Response('plain text', {
        status: 200,
        headers: { 'content-type': 'text/plain' }
      }));
      const result = await fetchApi('/test', { method: 'GET' });
      expect(result).toBe('plain text');
    });

    it('maneja errores de red', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network Error'));
      await expect(fetchApi('/test', { method: 'GET' })).rejects.toThrow('Network Error');
    });

    it('maneja errores de respuesta con mensaje', async () => {
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Error del servidor' }), {
        status: 500,
        headers: { 'content-type': 'application/json' }
      }));
      await expect(fetchApi('/test', { method: 'GET' })).rejects.toThrow('Error del servidor');
    });

    it('maneja errores de respuesta sin mensaje', async () => {
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({}), {
        status: 500,
        headers: { 'content-type': 'application/json' }
      }));
      await expect(fetchApi('/test', { method: 'GET' })).rejects.toThrow('Error 500: ');
    });

    it('incluye token de autenticación cuando se proporciona', async () => {
      const mockResponse = { data: 'test' };
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      }));

      await fetchApi('/test', { method: 'GET' }, 'test-token');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token'
          })
        })
      );
    });
  });

  describe('loginUser', () => {
    it('realiza login exitoso', async () => {
      const mockResponse = {
        user: { id: 1, email: 'test@test.com' },
        token: 'test-token'
      };
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      }));

      const result = await loginUser('test@test.com', 'password');
      expect(result).toEqual({
        user: mockResponse.user,
        token: mockResponse.token,
        error: undefined
      });
    });

    it('maneja errores de login', async () => {
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Credenciales inválidas' }), {
        status: 401,
        headers: { 'content-type': 'application/json' }
      }));

      await expect(loginUser('test@test.com', 'wrong-password'))
        .rejects.toThrow('Credenciales inválidas');
    });
  });

  describe('registerUser', () => {
    it('realiza registro exitoso', async () => {
      const mockResponse = { user: { id: 1, email: 'test@test.com' } };
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      }));

      const result = await registerUser({
        email: 'test@test.com',
        password: 'password',
        name: 'Test User'
      });
      expect(result).toEqual(mockResponse);
    });

    it('maneja errores de registro', async () => {
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Email ya registrado' }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      }));

      await expect(registerUser({
        email: 'test@test.com',
        password: 'password',
        name: 'Test User'
      })).rejects.toThrow('Email ya registrado');
    });
  });

  describe('verifyUser', () => {
    it('realiza verificación exitosa', async () => {
      const mockUsers = [{ id: 1, email: 'test@test.com' }];
      mockFetch
        .mockResolvedValueOnce(new Response(JSON.stringify(mockUsers), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        }))
        .mockResolvedValueOnce(new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        }));

      const result = await verifyUser('test@test.com', '123456');
      expect(result).toEqual({ success: true });
    });

    it('maneja usuario no encontrado', async () => {
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      }));

      await expect(verifyUser('test@test.com', '123456'))
        .rejects.toThrow('Usuario no encontrado');
    });

    it('maneja código de verificación incorrecto', async () => {
      const mockUsers = [{ id: 1, email: 'test@test.com' }];
      mockFetch
        .mockResolvedValueOnce(new Response(JSON.stringify(mockUsers), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        }))
        .mockResolvedValueOnce(new Response(JSON.stringify({ 
          success: false,
          error: 'Código inválido'
        }), {
          status: 400,
          headers: { 'content-type': 'application/json' }
        }));

      await expect(verifyUser('test@test.com', '123456'))
        .rejects.toThrow('Código inválido');
    });
  });
}); 