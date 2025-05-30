// request.ts

import { fetchApi } from './api';

export interface Request {
  id?: number;
  user: number;
  subject: string;
  description: string;
  status: string;
  created_at?: string;
}

export const requestsService = {
  createRequest: async (requestData: Omit<Request, 'id'>): Promise<Request> => {
    try {
      const response = await fetchApi('/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      return response;
    } catch (error) {
      console.error('Error creating request:', error);
      throw error;
    }
  },

  getAllRequests: async (userId: number): Promise<Request[]> => {
    try {
      const response = await fetchApi(`/request/user/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    } catch (error) {
      console.error('Error fetching requests:', error);
      throw error;
    }
  },

  getRequestById: async (id: number, token?: string) => {
    return await fetchApi(`/request/${id}`, { method: 'GET' }, token);
  },

  deleteRequest: async (id: number): Promise<void> => {
    try {
      await fetchApi(`/request/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error deleting request:', error);
      throw error;
    }
  },
};

//hola
