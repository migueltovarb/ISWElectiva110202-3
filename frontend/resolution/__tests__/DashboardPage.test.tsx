// __tests__/app/dashboard/page.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../src/app/contexts/AuthContext';
import DashboardPage from '../../src/app/dashboard/page';
import { getAllClaims, getAllRequests } from '../../src/app/lib/api';

// Mock de los módulos
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

jest.mock('../../src/app/contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('../../src/app/lib/api', () => ({
  getAllClaims: jest.fn(),
  getAllRequests: jest.fn()
}));

describe('DashboardPage', () => {
  const mockRouter = {
    push: jest.fn()
  };

  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@test.com',
    role: 'user'
  };

  const mockClaims = [
    {
      id: 1,
      title: 'Test Claim',
      description: 'Test Description',
      status: 'pending',
      createdAt: '2024-03-10T00:00:00.000Z'
    }
  ];

  const mockRequests = [
    {
      id: 1,
      title: 'Test Request',
      description: 'Test Description',
      status: 'pending',
      createdAt: '2024-03-10T00:00:00.000Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false
    });
    (getAllClaims as jest.Mock).mockResolvedValue(mockClaims);
    (getAllRequests as jest.Mock).mockResolvedValue(mockRequests);
  });

  it('muestra el dashboard con los datos del usuario', async () => {
    render(<DashboardPage />);
    
    expect(screen.getByText(`Bienvenido, ${mockUser.name}`)).toBeInTheDocument();
    expect(screen.getByText('Panel de Control')).toBeInTheDocument();
  });

  it('muestra las acciones rápidas', async () => {
    render(<DashboardPage />);
    
    expect(screen.getByText('Acciones Rápidas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nuevo reclamo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nueva solicitud/i })).toBeInTheDocument();
  });

  it('muestra las estadísticas', async () => {
    render(<DashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Estadísticas')).toBeInTheDocument();
      expect(screen.getByText('Reclamos')).toBeInTheDocument();
      expect(screen.getByText('Solicitudes')).toBeInTheDocument();
    });
  });

  it('muestra enlaces de administración para usuarios admin', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { ...mockUser, role: 'admin' },
      loading: false
    });

    render(<DashboardPage />);
    
    expect(screen.getByText('Administración')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /panel de administración/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /reportes/i })).toBeInTheDocument();
  });

  it('no muestra enlaces de administración para usuarios normales', async () => {
    render(<DashboardPage />);
    
    expect(screen.queryByText('Administración')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /panel de administración/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /reportes/i })).not.toBeInTheDocument();
  });

  it('muestra mensaje de carga mientras se obtienen los datos', () => {
    (getAllClaims as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    (getAllRequests as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<DashboardPage />);
    
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('muestra mensaje cuando no hay reclamos ni solicitudes', async () => {
    (getAllClaims as jest.Mock).mockResolvedValue([]);
    (getAllRequests as jest.Mock).mockResolvedValue([]);

    render(<DashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('No hay reclamos recientes')).toBeInTheDocument();
      expect(screen.getByText('No hay solicitudes recientes')).toBeInTheDocument();
    });
  });

  it('maneja errores al cargar los datos', async () => {
    (getAllClaims as jest.Mock).mockRejectedValue(new Error('Error al cargar reclamos'));
    (getAllRequests as jest.Mock).mockRejectedValue(new Error('Error al cargar solicitudes'));

    render(<DashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Error al cargar los datos')).toBeInTheDocument();
    });
  });

  it('redirige a login si no hay usuario autenticado', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false
    });

    render(<DashboardPage />);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/auth/login');
  });

  it('muestra mensaje de carga mientras se verifica la autenticación', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: true
    });

    render(<DashboardPage />);
    
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('navega a la página de nuevo reclamo', async () => {
    render(<DashboardPage />);
    
    const newClaimButton = screen.getByRole('button', { name: /nuevo reclamo/i });
    fireEvent.click(newClaimButton);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/claims/new');
  });

  it('navega a la página de nueva solicitud', async () => {
    render(<DashboardPage />);
    
    const newRequestButton = screen.getByRole('button', { name: /nueva solicitud/i });
    fireEvent.click(newRequestButton);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/requests/new');
  });

  it('muestra el contador correcto de reclamos y solicitudes', async () => {
    render(<DashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument(); // Contador de reclamos
      expect(screen.getByText('1')).toBeInTheDocument(); // Contador de solicitudes
    });
  });

  it('actualiza los datos al hacer clic en actualizar', async () => {
    render(<DashboardPage />);
    
    const updateButton = screen.getByRole('button', { name: /actualizar/i });
    fireEvent.click(updateButton);
    
    await waitFor(() => {
      expect(getAllClaims).toHaveBeenCalledTimes(2);
      expect(getAllRequests).toHaveBeenCalledTimes(2);
    });
  });
});
});