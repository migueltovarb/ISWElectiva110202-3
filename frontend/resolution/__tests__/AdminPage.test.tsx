import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../src/app/contexts/AuthContext';
import AdminPage from '../../src/app/dashboard/admin/page';
import { getAllClaims, getAllRequests, updateClaimStatus, updateRequestStatus } from '../../src/app/lib/api';

// Mock de los módulos
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

jest.mock('../../src/app/contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('../../src/app/lib/api', () => ({
  getAllClaims: jest.fn(),
  getAllRequests: jest.fn(),
  updateClaimStatus: jest.fn(),
  updateRequestStatus: jest.fn()
}));

describe('AdminPage', () => {
  const mockRouter = {
    push: jest.fn()
  };

  const mockUser = {
    id: 1,
    name: 'Admin User',
    email: 'admin@test.com',
    role: 'admin'
  };

  const mockClaims = [
    {
      id: 1,
      title: 'Test Claim',
      description: 'Test Description',
      status: 'pending',
      createdAt: '2024-03-10T00:00:00.000Z',
      user: {
        id: 2,
        name: 'Test User',
        email: 'test@test.com'
      }
    }
  ];

  const mockRequests = [
    {
      id: 1,
      title: 'Test Request',
      description: 'Test Description',
      status: 'pending',
      createdAt: '2024-03-10T00:00:00.000Z',
      user: {
        id: 2,
        name: 'Test User',
        email: 'test@test.com'
      }
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

  it('muestra el panel de administración', async () => {
    render(<AdminPage />);
    
    expect(screen.getByText('Panel de Administración')).toBeInTheDocument();
    expect(screen.getByText('Reclamos')).toBeInTheDocument();
    expect(screen.getByText('Solicitudes')).toBeInTheDocument();
  });

  it('muestra mensaje de acceso denegado para usuarios no admin', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { ...mockUser, role: 'user' },
      loading: false
    });

    render(<AdminPage />);
    
    expect(screen.getByText('Acceso Denegado')).toBeInTheDocument();
    expect(screen.getByText('No tienes permisos para acceder a esta página')).toBeInTheDocument();
  });

  it('muestra la lista de reclamos', async () => {
    render(<AdminPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Claim')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('Pendiente')).toBeInTheDocument();
    });
  });

  it('muestra la lista de solicitudes', async () => {
    render(<AdminPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Request')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('Pendiente')).toBeInTheDocument();
    });
  });

  it('permite cambiar el estado de un reclamo', async () => {
    (updateClaimStatus as jest.Mock).mockResolvedValueOnce({ success: true });
    
    render(<AdminPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Claim')).toBeInTheDocument();
    });

    const statusButton = screen.getByRole('button', { name: /cambiar estado/i });
    fireEvent.click(statusButton);

    const newStatusButton = screen.getByRole('button', { name: /en progreso/i });
    fireEvent.click(newStatusButton);

    await waitFor(() => {
      expect(updateClaimStatus).toHaveBeenCalledWith(1, 'in_progress');
      expect(screen.getByText('En Progreso')).toBeInTheDocument();
    });
  });

  it('permite cambiar el estado de una solicitud', async () => {
    (updateRequestStatus as jest.Mock).mockResolvedValueOnce({ success: true });
    
    render(<AdminPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Request')).toBeInTheDocument();
    });

    const statusButton = screen.getByRole('button', { name: /cambiar estado/i });
    fireEvent.click(statusButton);

    const newStatusButton = screen.getByRole('button', { name: /en progreso/i });
    fireEvent.click(newStatusButton);

    await waitFor(() => {
      expect(updateRequestStatus).toHaveBeenCalledWith(1, 'in_progress');
      expect(screen.getByText('En Progreso')).toBeInTheDocument();
    });
  });

  it('muestra mensaje de carga mientras se obtienen los datos', () => {
    (getAllClaims as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    (getAllRequests as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<AdminPage />);
    
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('muestra mensaje cuando no hay reclamos ni solicitudes', async () => {
    (getAllClaims as jest.Mock).mockResolvedValue([]);
    (getAllRequests as jest.Mock).mockResolvedValue([]);

    render(<AdminPage />);
    
    await waitFor(() => {
      expect(screen.getByText('No hay reclamos pendientes')).toBeInTheDocument();
      expect(screen.getByText('No hay solicitudes pendientes')).toBeInTheDocument();
    });
  });

  it('maneja errores al cargar los datos', async () => {
    (getAllClaims as jest.Mock).mockRejectedValue(new Error('Error al cargar reclamos'));
    (getAllRequests as jest.Mock).mockRejectedValue(new Error('Error al cargar solicitudes'));

    render(<AdminPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Error al cargar los datos')).toBeInTheDocument();
    });
  });

  it('maneja errores al actualizar estados', async () => {
    (updateClaimStatus as jest.Mock).mockRejectedValueOnce(new Error('Error al actualizar estado'));
    
    render(<AdminPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Claim')).toBeInTheDocument();
    });

    const statusButton = screen.getByRole('button', { name: /cambiar estado/i });
    fireEvent.click(statusButton);

    const newStatusButton = screen.getByRole('button', { name: /en progreso/i });
    fireEvent.click(newStatusButton);

    await waitFor(() => {
      expect(screen.getByText('Error al actualizar estado')).toBeInTheDocument();
    });
  });

  it('redirige a login si no hay usuario autenticado', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false
    });

    render(<AdminPage />);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/auth/login');
  });

  it('muestra mensaje de carga mientras se verifica la autenticación', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: true
    });

    render(<AdminPage />);
    
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('actualiza los datos al hacer clic en actualizar', async () => {
    render(<AdminPage />);
    
    const updateButton = screen.getByRole('button', { name: /actualizar/i });
    fireEvent.click(updateButton);
    
    await waitFor(() => {
      expect(getAllClaims).toHaveBeenCalledTimes(2);
      expect(getAllRequests).toHaveBeenCalledTimes(2);
    });
  });

  it('muestra los detalles del usuario en los reclamos', async () => {
    render(<AdminPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@test.com')).toBeInTheDocument();
    });
  });

  it('muestra los detalles del usuario en las solicitudes', async () => {
    render(<AdminPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@test.com')).toBeInTheDocument();
    });
  });
}); 