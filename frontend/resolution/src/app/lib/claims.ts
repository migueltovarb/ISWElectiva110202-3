// lib/claims.ts
import { fetchApi } from './api';

// Definir la interfaz para los Claims
export interface Claim {
  id?: number;
  user: number;
  subject: string;
  description: string;
  status: string;
  date?: string; // Para mostrar en la UI
  requestType?: string; // Para mantener compatibilidad con la UI
  files?: string[]; // Para mantener compatibilidad con la UI
}

export const claimsService = {
  // Obtener todos los reclamos
  getAllClaims: async (token: string): Promise<Claim[]> => {
    try {
      const response = await fetchApi('/claim', {
        method: 'GET',
      }, token);
      
      // Adaptar la respuesta del backend a la estructura esperada por el frontend
      return response.map((claim: any) => ({
        ...claim,
        date: new Date().toISOString(), // El backend no tiene date, añadimos uno para la UI
        requestType: 'general', // Campo requerido por la UI
        files: [] // Campo requerido por la UI
      }));
    } catch (error) {
      console.error('Error fetching claims:', error);
      throw error;
    }
  },

  // Obtener un reclamo por ID
  getClaimById: async (id: number, token: string): Promise<Claim> => {
    try {
      // Como el endpoint específico por ID no existe en el backend,
      // obtenemos todos y filtramos
      const claims = await claimsService.getAllClaims(token);
      const claim = claims.find(c => c.id === id);
      
      if (!claim) {
        throw new Error('Reclamo no encontrado');
      }
      
      return claim;
    } catch (error) {
      console.error(`Error fetching claim with id ${id}:`, error);
      throw error;
    }
  },

  // Crear un nuevo reclamo
  createClaim: async (claimData: Omit<Claim, 'id' | 'date' | 'files'>, token: string): Promise<Claim> => {
    try {
      const response = await fetchApi('/claim', {
        method: 'POST',
        body: JSON.stringify({
          user: claimData.user,
          subject: claimData.subject,
          description: claimData.description,
          status: claimData.status || 'pending',
        }),
      }, token);
      
      // Adaptar la respuesta para que coincida con la estructura esperada
      return {
        ...response,
        date: new Date().toISOString(),
        requestType: claimData.requestType || 'general',
        files: []
      };
    } catch (error) {
      console.error('Error creating claim:', error);
      throw error;
    }
  },

  // Actualizar un reclamo existente
  updateClaim: async (id: number, claimData: Partial<Claim>, token: string): Promise<Claim> => {
    try {
      // Como el backend no tiene un endpoint específico para actualizar por ID,
      // simulamos la respuesta
      const claim = await claimsService.getClaimById(id, token);
      
      const updatedClaim = {
        ...claim,
        ...claimData,
      };
      
      // Aquí se implementaría la lógica real para actualizar en el backend
      // cuando esté disponible
      
      return updatedClaim;
    } catch (error) {
      console.error(`Error updating claim with id ${id}:`, error);
      throw error;
    }
  }
};