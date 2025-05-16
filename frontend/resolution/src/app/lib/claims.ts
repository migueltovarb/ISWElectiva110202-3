// claims.ts

import { fetchApi } from './api';

export interface Claim {
  id?: number;
  user: number;
  subject: string;
  description: string;
  status: string;
  created_at?: string;
}

export const claimsService = {
  createClaim: async (claimData: Omit<Claim, 'id'>): Promise<Claim> => {
    try {
      const response = await fetchApi('/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(claimData),
      });

      return response;
    } catch (error) {
      console.error('Error creating claim:', error);
      throw error;
    }
  },

  getAllClaims: async (userId: number): Promise<Claim[]> => {
    try {
      const response = await fetchApi(`/claim/user/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    } catch (error) {
      console.error('Error fetching claims:', error);
      throw error;
    }
  },

  getClaimById: async (id: number, token?: string) => {
    return await fetchApi(`/claim/${id}`, { method: 'GET' }, token);
  },
};
