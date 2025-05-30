import { claimsService } from '../../src/app/lib/claims';
import { fetchApi } from '../../src/app/lib/api';

// Mock de fetchApi
jest.mock('../../src/app/lib/api', () => ({
  fetchApi: jest.fn()
}));

describe('Claims Service', () => {
  const mockClaim = {
    id: 1,
    title: 'Test Claim',
    description: 'Test Description',
    status: 'pending',
    createdAt: '2024-03-10T00:00:00.000Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllClaims', () => {
    it('obtiene todos los reclamos exitosamente', async () => {
      const mockClaims = [mockClaim];
      (fetchApi as jest.Mock).mockResolvedValueOnce(mockClaims);

      const result = await claimsService.getAllClaims();
      
      expect(fetchApi).toHaveBeenCalledWith('GET', '/claims');
      expect(result).toEqual(mockClaims);
    });

    it('maneja errores al obtener reclamos', async () => {
      (fetchApi as jest.Mock).mockRejectedValueOnce(new Error('Error al cargar reclamos'));

      await expect(claimsService.getAllClaims()).rejects.toThrow('Error al cargar reclamos');
    });
  });

  describe('getClaimById', () => {
    it('obtiene un reclamo por ID exitosamente', async () => {
      (fetchApi as jest.Mock).mockResolvedValueOnce(mockClaim);

      const result = await claimsService.getClaimById(1);
      
      expect(fetchApi).toHaveBeenCalledWith('GET', '/claims/1');
      expect(result).toEqual(mockClaim);
    });

    it('maneja errores al obtener un reclamo por ID', async () => {
      (fetchApi as jest.Mock).mockRejectedValueOnce(new Error('Reclamo no encontrado'));

      await expect(claimsService.getClaimById(1)).rejects.toThrow('Reclamo no encontrado');
    });
  });

  describe('createClaim', () => {
    const newClaim = {
      title: 'New Claim',
      description: 'New Description'
    };

    it('crea un reclamo exitosamente', async () => {
      const createdClaim = { ...newClaim, id: 1, status: 'pending', createdAt: '2024-03-10T00:00:00.000Z' };
      (fetchApi as jest.Mock).mockResolvedValueOnce(createdClaim);

      const result = await claimsService.createClaim(newClaim);
      
      expect(fetchApi).toHaveBeenCalledWith('POST', '/claims', newClaim);
      expect(result).toEqual(createdClaim);
    });

    it('maneja errores al crear un reclamo', async () => {
      (fetchApi as jest.Mock).mockRejectedValueOnce(new Error('Error al crear reclamo'));

      await expect(claimsService.createClaim(newClaim)).rejects.toThrow('Error al crear reclamo');
    });
  });

  describe('updateClaim', () => {
    const updatedClaim = {
      title: 'Updated Claim',
      description: 'Updated Description'
    };

    it('actualiza un reclamo exitosamente', async () => {
      const resultClaim = { ...updatedClaim, id: 1, status: 'pending', createdAt: '2024-03-10T00:00:00.000Z' };
      (fetchApi as jest.Mock).mockResolvedValueOnce(resultClaim);

      const result = await claimsService.updateClaim(1, updatedClaim);
      
      expect(fetchApi).toHaveBeenCalledWith('PUT', '/claims/1', updatedClaim);
      expect(result).toEqual(resultClaim);
    });

    it('maneja errores al actualizar un reclamo', async () => {
      (fetchApi as jest.Mock).mockRejectedValueOnce(new Error('Error al actualizar reclamo'));

      await expect(claimsService.updateClaim(1, updatedClaim)).rejects.toThrow('Error al actualizar reclamo');
    });
  });

  describe('deleteClaim', () => {
    it('elimina un reclamo exitosamente', async () => {
      (fetchApi as jest.Mock).mockResolvedValueOnce({ success: true });

      const result = await claimsService.deleteClaim(1);
      
      expect(fetchApi).toHaveBeenCalledWith('DELETE', '/claims/1');
      expect(result).toEqual({ success: true });
    });

    it('maneja errores al eliminar un reclamo', async () => {
      (fetchApi as jest.Mock).mockRejectedValueOnce(new Error('Error al eliminar reclamo'));

      await expect(claimsService.deleteClaim(1)).rejects.toThrow('Error al eliminar reclamo');
    });
  });

  describe('updateClaimStatus', () => {
    it('actualiza el estado de un reclamo exitosamente', async () => {
      const updatedClaim = { ...mockClaim, status: 'in_progress' };
      (fetchApi as jest.Mock).mockResolvedValueOnce(updatedClaim);

      const result = await claimsService.updateClaimStatus(1, 'in_progress');
      
      expect(fetchApi).toHaveBeenCalledWith('PATCH', '/claims/1/status', { status: 'in_progress' });
      expect(result).toEqual(updatedClaim);
    });

    it('maneja errores al actualizar el estado de un reclamo', async () => {
      (fetchApi as jest.Mock).mockRejectedValueOnce(new Error('Error al actualizar estado'));

      await expect(claimsService.updateClaimStatus(1, 'in_progress')).rejects.toThrow('Error al actualizar estado');
    });
  });
}); 