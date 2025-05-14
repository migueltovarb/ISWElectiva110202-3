// __tests__/app/dashboard/page.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardPage from '../src/app/dashboard/page';
import { useAuth } from '../src/app/components/dashboard/AuthContext';

// Mocks
jest.mock('../src/app/components/dashboard/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../src/app/lib/claims', () => ({
  claimsService: {
    getAllClaims: jest.fn(),
  },
}));

jest.mock('../src/app/lib/requests', () => ({
  requestsService: {
    getAllRequests: jest.fn(),
  },
}));

jest.mock('../src/app/components/dashboard/StatsCard', () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <div>{title}</div>,
}));

jest.mock('../src/app/components/dashboard/RecentItem', () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <div>{title}</div>,
}));

jest.mock('../src/app/components/dashboard/QuickAction', () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <div>{title}</div>,
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ 
      user: { id: 1, first_name: 'Test' } 
    });
    
    const { claimsService, requestsService } = require('../src/app/lib');
    claimsService.getAllClaims.mockResolvedValue([]);
    requestsService.getAllRequests.mockResolvedValue([]);
  });

  it('muestra el nombre del usuario', async () => {
    render(<DashboardPage />);
    expect(await screen.findByText('Test')).toBeInTheDocument();
  });

  it('muestra las acciones rápidas', async () => {
    render(<DashboardPage />);
    expect(await screen.findByText('Nuevo Reclamo')).toBeInTheDocument();
    expect(await screen.findByText('Nueva Solicitud')).toBeInTheDocument();
  });

  it('muestra estadísticas', async () => {
    const { claimsService, requestsService } = require('../src/app/lib');
    claimsService.getAllClaims.mockResolvedValue([
      { id: 1, subject: 'Claim 1', status: 'pending' }
    ]);
    requestsService.getAllRequests.mockResolvedValue([
      { id: 1, subject: 'Request 1', status: 'pending' }
    ]);
    
    render(<DashboardPage />);
    expect(await screen.findByText('Total Reclamos')).toBeInTheDocument();
    expect(await screen.findByText('Total Solicitudes')).toBeInTheDocument();
  });
});