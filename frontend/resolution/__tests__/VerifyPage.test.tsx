// __tests__/app/auth/verify/page.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../src/app/contexts/AuthContext';
import VerifyPage from '../../src/app/auth/verify/page';
import { verifyUser } from '../../src/app/lib/api';

// Mock de los módulos
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: () => new URLSearchParams('?email=test@test.com')
}));

jest.mock('../../src/app/contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('../../src/app/lib/api', () => ({
  verifyUser: jest.fn()
}));

describe('VerifyPage', () => {
  const mockRouter = {
    push: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false
    });
  });

  it('muestra el formulario de verificación', () => {
    render(<VerifyPage />);
    
    expect(screen.getByText('Verificación de Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Código de verificación')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /verificar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reenviar código/i })).toBeInTheDocument();
  });

  it('maneja la verificación exitosa', async () => {
    (verifyUser as jest.Mock).mockResolvedValueOnce({ success: true });
    
    render(<VerifyPage />);
    
    const codeInput = screen.getByLabelText('Código de verificación');
    const verifyButton = screen.getByRole('button', { name: /verificar/i });
    
    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.click(verifyButton);
    
    await waitFor(() => {
      expect(verifyUser).toHaveBeenCalledWith('test@test.com', '123456');
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('maneja errores de verificación', async () => {
    (verifyUser as jest.Mock).mockRejectedValueOnce(new Error('Código inválido'));
    
    render(<VerifyPage />);
    
    const codeInput = screen.getByLabelText('Código de verificación');
    const verifyButton = screen.getByRole('button', { name: /verificar/i });
    
    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.click(verifyButton);
    
    await waitFor(() => {
      expect(screen.getByText('Código inválido')).toBeInTheDocument();
    });
  });

  it('muestra mensaje de carga durante la verificación', async () => {
    (verifyUser as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<VerifyPage />);
    
    const codeInput = screen.getByLabelText('Código de verificación');
    const verifyButton = screen.getByRole('button', { name: /verificar/i });
    
    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.click(verifyButton);
    
    expect(screen.getByText('Verificando...')).toBeInTheDocument();
  });

  it('valida el formato del código de verificación', async () => {
    render(<VerifyPage />);
    
    const codeInput = screen.getByLabelText('Código de verificación');
    const verifyButton = screen.getByRole('button', { name: /verificar/i });
    
    // Código muy corto
    fireEvent.change(codeInput, { target: { value: '123' } });
    fireEvent.click(verifyButton);
    expect(screen.getByText('El código debe tener 6 dígitos')).toBeInTheDocument();
    
    // Código con letras
    fireEvent.change(codeInput, { target: { value: '123abc' } });
    fireEvent.click(verifyButton);
    expect(screen.getByText('El código debe contener solo números')).toBeInTheDocument();
    
    // Código válido
    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.click(verifyButton);
    expect(screen.queryByText('El código debe tener 6 dígitos')).not.toBeInTheDocument();
    expect(screen.queryByText('El código debe contener solo números')).not.toBeInTheDocument();
  });

  it('maneja el caso de token no encontrado', () => {
    (useRouter as jest.Mock).mockReturnValue({
      ...mockRouter,
      useSearchParams: () => new URLSearchParams('')
    });
    
    render(<VerifyPage />);
    
    expect(screen.getByText('Token de verificación no encontrado')).toBeInTheDocument();
  });

  it('permite reenviar el código de verificación', async () => {
    (verifyUser as jest.Mock).mockResolvedValueOnce({ success: true });
    
    render(<VerifyPage />);
    
    const resendButton = screen.getByRole('button', { name: /reenviar código/i });
    fireEvent.click(resendButton);
    
    await waitFor(() => {
      expect(screen.getByText('Código reenviado')).toBeInTheDocument();
    });
  });

  it('maneja errores al reenviar el código', async () => {
    (verifyUser as jest.Mock).mockRejectedValueOnce(new Error('Error al reenviar'));
    
    render(<VerifyPage />);
    
    const resendButton = screen.getByRole('button', { name: /reenviar código/i });
    fireEvent.click(resendButton);
    
    await waitFor(() => {
      expect(screen.getByText('Error al reenviar')).toBeInTheDocument();
    });
  });

  it('muestra mensaje de carga al reenviar código', async () => {
    (verifyUser as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<VerifyPage />);
    
    const resendButton = screen.getByRole('button', { name: /reenviar código/i });
    fireEvent.click(resendButton);
    
    expect(screen.getByText('Reenviando...')).toBeInTheDocument();
  });

  it('redirige a usuarios ya autenticados', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, email: 'test@test.com' },
      loading: false
    });
    
    render(<VerifyPage />);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
  });

  it('muestra mensaje de carga mientras se verifica la autenticación', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: true
    });
    
    render(<VerifyPage />);
    
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });
});