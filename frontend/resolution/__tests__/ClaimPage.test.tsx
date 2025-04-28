// __tests__/app/dashboard/claims/page.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import ClaimsPage from '../src/app/dashboard/claims/page';
import { useAuth } from '../src/app/components/dashboard/AuthContext';

// Mocks
jest.mock('../src/app/components/dashboard/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/claims', () => ({
  claimsService: {
    getAllClaims: jest.fn(),
  },
}));

describe('ClaimsPage', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ 
      user: { id: 1 } 
    });
    
    Storage.prototype.getItem = jest.fn(() => 'test-token');
  });

  it('muestra el botón de nuevo reclamo', async () => {
    const { claimsService } = require('@/lib/claims');
    claimsService.getAllClaims.mockResolvedValue([]);
    
    render(<ClaimsPage />);
    expect(await screen.findByText('Nuevo Reclamo')).toBeInTheDocument();
  });

  it('muestra la lista de reclamos', async () => {
    const { claimsService } = require('@/lib/claims');
    claimsService.getAllClaims.mockResolvedValue([
      { id: 1, subject: 'Test Claim', description: 'Test Desc', status: 'pending', date: new Date() }
    ]);
    
    render(<ClaimsPage />);
    expect(await screen.findByText('Test Claim')).toBeInTheDocument();
  });
});