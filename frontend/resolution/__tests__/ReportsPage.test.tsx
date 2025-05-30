import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../src/app/contexts/AuthContext';
import ReportsPage from '../../src/app/dashboard/admin/reports/page';
import { getReports } from '../../src/app/lib/api';

// Mock de los módulos
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

jest.mock('../../src/app/contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('../../src/app/lib/api', () => ({
  getReports: jest.fn()
}));

describe('ReportsPage', () => {
  const mockRouter = {
    push: jest.fn()
  };

  const mockUser = {
    id: 1,
    name: 'Admin User',
    email: 'admin@test.com',
    role: 'admin'
  };

  const mockReports = {
    claims: {
      total: 10,
      byStatus: {
        pending: 3,
        in_progress: 4,
        completed: 3
      },
      byMonth: {
        '2024-03': 5,
        '2024-02': 3,
        '2024-01': 2
      }
    },
    requests: {
      total: 8,
      byStatus: {
        pending: 2,
        in_progress: 3,
        completed: 3
      },
      byMonth: {
        '2024-03': 4,
        '2024-02': 2,
        '2024-01': 2
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false
    });
    (getReports as jest.Mock).mockResolvedValue(mockReports);
  });

  it('muestra el panel de reportes', async () => {
    render(<ReportsPage />);
    
    expect(screen.getByText('Reportes')).toBeInTheDocument();
    expect(screen.getByText('Estadísticas Generales')).toBeInTheDocument();
  });

  it('muestra mensaje de acceso denegado para usuarios no admin', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { ...mockUser, role: 'user' },
      loading: false
    });

    render(<ReportsPage />);
    
    expect(screen.getByText('Acceso Denegado')).toBeInTheDocument();
    expect(screen.getByText('No tienes permisos para acceder a esta página')).toBeInTheDocument();
  });

  it('muestra las estadísticas de reclamos', async () => {
    render(<ReportsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Reclamos')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument(); // Total
      expect(screen.getByText('3')).toBeInTheDocument(); // Pendientes
      expect(screen.getByText('4')).toBeInTheDocument(); // En Progreso
      expect(screen.getByText('3')).toBeInTheDocument(); // Completados
    });
  });

  it('muestra las estadísticas de solicitudes', async () => {
    render(<ReportsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Solicitudes')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument(); // Total
      expect(screen.getByText('2')).toBeInTheDocument(); // Pendientes
      expect(screen.getByText('3')).toBeInTheDocument(); // En Progreso
      expect(screen.getByText('3')).toBeInTheDocument(); // Completados
    });
  });

  it('muestra los gráficos de distribución por estado', async () => {
    render(<ReportsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Distribución por Estado')).toBeInTheDocument();
      expect(screen.getByText('Reclamos por Estado')).toBeInTheDocument();
      expect(screen.getByText('Solicitudes por Estado')).toBeInTheDocument();
    });
  });

  it('muestra los gráficos de tendencias mensuales', async () => {
    render(<ReportsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Tendencias Mensuales')).toBeInTheDocument();
      expect(screen.getByText('Reclamos por Mes')).toBeInTheDocument();
      expect(screen.getByText('Solicitudes por Mes')).toBeInTheDocument();
    });
  });

  it('muestra mensaje de carga mientras se obtienen los datos', () => {
    (getReports as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<ReportsPage />);
    
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('muestra mensaje cuando no hay datos', async () => {
    (getReports as jest.Mock).mockResolvedValue({
      claims: { total: 0, byStatus: {}, byMonth: {} },
      requests: { total: 0, byStatus: {}, byMonth: {} }
    });

    render(<ReportsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('No hay datos disponibles')).toBeInTheDocument();
    });
  });

  it('maneja errores al cargar los datos', async () => {
    (getReports as jest.Mock).mockRejectedValue(new Error('Error al cargar reportes'));

    render(<ReportsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Error al cargar los datos')).toBeInTheDocument();
    });
  });

  it('redirige a login si no hay usuario autenticado', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false
    });

    render(<ReportsPage />);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/auth/login');
  });

  it('muestra mensaje de carga mientras se verifica la autenticación', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: true
    });

    render(<ReportsPage />);
    
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('actualiza los datos al hacer clic en actualizar', async () => {
    render(<ReportsPage />);
    
    const updateButton = screen.getByRole('button', { name: /actualizar/i });
    fireEvent.click(updateButton);
    
    await waitFor(() => {
      expect(getReports).toHaveBeenCalledTimes(2);
    });
  });

  it('muestra el porcentaje de reclamos por estado', async () => {
    render(<ReportsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('30%')).toBeInTheDocument(); // Pendientes
      expect(screen.getByText('40%')).toBeInTheDocument(); // En Progreso
      expect(screen.getByText('30%')).toBeInTheDocument(); // Completados
    });
  });

  it('muestra el porcentaje de solicitudes por estado', async () => {
    render(<ReportsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('25%')).toBeInTheDocument(); // Pendientes
      expect(screen.getByText('37.5%')).toBeInTheDocument(); // En Progreso
      expect(screen.getByText('37.5%')).toBeInTheDocument(); // Completados
    });
  });

  it('muestra las fechas formateadas correctamente', async () => {
    render(<ReportsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Marzo 2024')).toBeInTheDocument();
      expect(screen.getByText('Febrero 2024')).toBeInTheDocument();
      expect(screen.getByText('Enero 2024')).toBeInTheDocument();
    });
  });
}); 