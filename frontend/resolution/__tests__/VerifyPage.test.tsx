// __tests__/app/auth/verify/page.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import VerifyPage from '../src/app/auth/verify/page';

// Mocks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('../src/app/lib/auth', () => ({
  authService: {
    verifyUser: jest.fn(),
    resendVerificationCode: jest.fn(),
  },
}));

jest.mock('../src/app/components/auth/AuthLayout', () => ({
  __esModule: true,
  default: ({ children, title, subtitle }: any) => (
    <div>
      <h1 data-testid="auth-layout-title">{title}</h1>
      <p data-testid="auth-layout-subtitle">{subtitle}</p>
      {children}
    </div>
  ),
}));

describe('VerifyPage', () => {
  const mockPush = jest.fn();
  const mockGet = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useSearchParams as jest.Mock).mockReturnValue({ get: mockGet });
    mockGet.mockReturnValue('test@example.com');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('redirige si no hay email', () => {
    mockGet.mockReturnValue(null);
    render(<VerifyPage />);
    expect(mockPush).toHaveBeenCalledWith('../src/app/auth/login');
  });

  it('muestra el título y subtítulo correctos', () => {
    render(<VerifyPage />);
    expect(screen.getByTestId('auth-layout-title')).toHaveTextContent('Verificación de identidad');
    expect(screen.getByTestId('auth-layout-subtitle')).toHaveTextContent('test@example.com');
  });

  it('maneja el envío del formulario correctamente', async () => {
    const { authService } = require('../src/app/lib/auth');
    authService.verifyUser.mockResolvedValue({ success: true });
    
    render(<VerifyPage />);
    fireEvent.change(screen.getByPlaceholderText('123456'), { target: { value: '123456' } });
    fireEvent.click(screen.getByText('Verificar'));
    
    await waitFor(() => {
      expect(authService.verifyUser).toHaveBeenCalledWith('test@example.com', '123456');
    });
  });

  it('maneja el reenvío de código', async () => {
    const { authService } = require('../src/app/lib/auth');
    authService.resendVerificationCode.mockResolvedValue({ success: true });
    
    render(<VerifyPage />);
    fireEvent.click(screen.getByText('Reenviar código'));
    
    await waitFor(() => {
      expect(authService.resendVerificationCode).toHaveBeenCalledWith('test@example.com');
    });
  });
});