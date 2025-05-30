import { requestsService } from '../../src/app/lib/requests';
import { fetchApi } from '../../src/app/lib/api';

jest.mock('../../src/app/lib/api');

describe('Requests Service', () => {
  const mockRequest = {
    id: 1,
    user: 1,
    subject: 'Test Request',
    description: 'Test Description',
    status: 'pendiente'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllRequests', () => {
    it('obtiene todas las solicitudes exitosamente', async () => {
      const mockResponse = [mockRequest];
      (fetchApi as jest.Mock).mockResolvedValue(mockResponse);

      const result = await requestsService.getAllRequests(1);
      
      expect(fetchApi).toHaveBeenCalledWith(
        '/request/user/1',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('maneja errores al obtener solicitudes', async () => {
      const error = new Error('Network error');
      (fetchApi as jest.Mock).mockRejectedValue(error);

      await expect(requestsService.getAllRequests(1)).rejects.toThrow('Network error');
    });
  });

  describe('getRequestById', () => {
    it('obtiene una solicitud por ID exitosamente', async () => {
      const mockResponse = mockRequest;
      (fetchApi as jest.Mock).mockResolvedValue(mockResponse);

      const result = await requestsService.getRequestById(1);
      
      expect(fetchApi).toHaveBeenCalledWith('/request/1', { method: 'GET' });
      expect(result).toEqual(mockResponse);
    });

    it('maneja errores al obtener una solicitud por ID', async () => {
      const error = new Error('Network error');
      (fetchApi as jest.Mock).mockRejectedValue(error);

      await expect(requestsService.getRequestById(1)).rejects.toThrow('Network error');
    });
  });

  describe('createRequest', () => {
    it('crea una solicitud exitosamente', async () => {
      const newRequest = {
        user: 1,
        subject: 'New Request',
        description: 'New Description',
        status: 'pendiente'
      };
      const mockResponse = { ...newRequest, id: 1 };
      (fetchApi as jest.Mock).mockResolvedValue(mockResponse);

      const result = await requestsService.createRequest(newRequest);
      
      expect(fetchApi).toHaveBeenCalledWith(
        '/request',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(newRequest)
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('maneja errores al crear una solicitud', async () => {
      const error = new Error('Network error');
      (fetchApi as jest.Mock).mockRejectedValue(error);

      await expect(requestsService.createRequest({
        user: 1,
        subject: 'Test',
        description: 'Test',
        status: 'pendiente'
      })).rejects.toThrow('Network error');
    });
  });

  describe('deleteRequest', () => {
    it('elimina una solicitud exitosamente', async () => {
      (fetchApi as jest.Mock).mockResolvedValue(null);

      await requestsService.deleteRequest(1);
      
      expect(fetchApi).toHaveBeenCalledWith(
        '/request/1',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('maneja errores al eliminar una solicitud', async () => {
      const error = new Error('Network error');
      (fetchApi as jest.Mock).mockRejectedValue(error);

      await expect(requestsService.deleteRequest(1)).rejects.toThrow('Network error');
    });
  });
}); 