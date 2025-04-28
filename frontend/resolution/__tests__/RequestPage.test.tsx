// __tests__/app/dashboard/requests/page.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import RequestsPage from '../src/app/dashboard/requests/page';
import { useAuth } from '../src/app/components/dashboard/AuthContext';

// Mocks
jest.mock('../src/app/components/dashboard/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../src/app/lib/requests', () => ({
  requestsService: {
    getAllRequests: jest.fn(),
  },
}));

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

describe('RequestsPage', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ 
      user: { id: 1 } 
    });
    
    Storage.prototype.getItem = jest.fn(() => 'test-token');
  });

  it('muestra el botón de nueva solicitud', async () => {
    const { requestsService } = require('../src/app/lib/requests');
    requestsService.getAllRequests.mockResolvedValue([]);
    
    render(<RequestsPage />);
    expect(await screen.findByText('Nueva Solicitud')).toBeInTheDocument();
  });

  it('muestra la lista de solicitudes', async () => {
    const { requestsService } = require('../src/app/lib/requests');
    requestsService.getAllRequests.mockResolvedValue([
      { id: 1, subject: 'Test Request', description: 'Test Desc', status: 'pending', date: new Date() }
    ]);
    
    render(<RequestsPage />);
    expect(await screen.findByText('Test Request')).toBeInTheDocument();
  });

  it('muestra mensaje de error', async () => {
    const { requestsService } = require('../src/app/lib/requests');
    requestsService.getAllRequests.mockRejectedValue(new Error('Test Error'));
    
    render(<RequestsPage />);
    expect(await screen.findByText('Test Error')).toBeInTheDocument();
  });
});