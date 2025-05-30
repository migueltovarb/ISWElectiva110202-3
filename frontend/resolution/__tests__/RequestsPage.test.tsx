import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../src/app/components/dashboard/AuthContext';
import { requestsService } from '../src/app/lib/requests';
import RequestsPage from '../src/app/dashboard/requests/page';


jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

jest.mock('../src/app/components/dashboard/AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('../src/app/lib/requests', () => ({
  requestsService: {
    getAllRequests: jest.fn(),
    deleteRequest: jest.fn()
  }
}));

describe('RequestsPage', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User'
  };

  const mockRequests = [
    {
      id: 1,
      subject: 'Solicitud de prueba 1',
      description: 'Descripción de la solicitud 1',
      status: 'pendiente',
      created_at: '2024-03-10T00:00:00.000Z'
    },
    {
      id: 2,
      subject: 'Solicitud de prueba 2',
      description: 'Descripción de la solicitud 2',
      status: 'en proceso',
      created_at: '2024-03-11T00:00:00.000Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn()
    });
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser
    });
    (requestsService.getAllRequests as jest.Mock).mockResolvedValue(mockRequests);
    (requestsService.deleteRequest as jest.Mock).mockResolvedValue(undefined);
  });

  it('muestra el título y el botón de nueva solicitud', async () => {
    render(<RequestsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Solicitudes')).toBeInTheDocument();
      expect(screen.getByText('Nueva Solicitud')).toBeInTheDocument();
    });
  });

  it('carga y muestra las solicitudes correctamente', async () => {
    render(<RequestsPage />);
    
    await waitFor(() => {
      expect(requestsService.getAllRequests).toHaveBeenCalledWith(mockUser.id);
      expect(screen.getByText('Solicitud de prueba 1')).toBeInTheDocument();
      expect(screen.getByText('Solicitud de prueba 2')).toBeInTheDocument();
    });
  });

  it('muestra el estado de carga inicial', () => {
    render(<RequestsPage />);
    expect(screen.getByText('Cargando solicitudes...')).toBeInTheDocument();
  });

  it('muestra un mensaje de error cuando falla la carga', async () => {
    const errorMessage = 'Error al cargar solicitudes';
    (requestsService.getAllRequests as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    render(<RequestsPage />);
    
    await waitFor(() => {
      expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
    });
  });

  it('elimina una solicitud cuando se confirma', async () => {
    global.confirm = jest.fn(() => true);
    
    render(<RequestsPage />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Eliminar')).toHaveLength(2);
    });

    fireEvent.click(screen.getAllByText('Eliminar')[0]);
    
    await waitFor(() => {
      expect(requestsService.deleteRequest).toHaveBeenCalledWith(1);
      expect(screen.queryByText('Solicitud de prueba 1')).not.toBeInTheDocument();
    });
  });

  it('no elimina una solicitud cuando se cancela', async () => {
    global.confirm = jest.fn(() => false);
    
    render(<RequestsPage />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Eliminar')).toHaveLength(2);
    });

    fireEvent.click(screen.getAllByText('Eliminar')[0]);
    
    await waitFor(() => {
      expect(requestsService.deleteRequest).not.toHaveBeenCalled();
      expect(screen.getByText('Solicitud de prueba 1')).toBeInTheDocument();
    });
  });

  it('muestra el estado de eliminación mientras se procesa', async () => {
    global.confirm = jest.fn(() => true);
    (requestsService.deleteRequest as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<RequestsPage />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Eliminar')).toHaveLength(2);
    });

    fireEvent.click(screen.getAllByText('Eliminar')[0]);
    
    expect(screen.getByText('Eliminando...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('Eliminando...')).not.toBeInTheDocument();
    });
  });

  it('muestra el estado correcto para cada solicitud', async () => {
    render(<RequestsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('pendiente')).toBeInTheDocument();
      expect(screen.getByText('en proceso')).toBeInTheDocument();
    });
  });

  it('muestra la fecha de creación formateada', async () => {
    render(<RequestsPage />);
    
    await waitFor(() => {
      const fecha1 = new Date('2024-03-10T00:00:00.000Z').toLocaleDateString();
      const fecha2 = new Date('2024-03-11T00:00:00.000Z').toLocaleDateString();
      expect(screen.getByText(fecha1)).toBeInTheDocument();
      expect(screen.getByText(fecha2)).toBeInTheDocument();
    });
  });

  it('muestra "Sin fecha" cuando la fecha es inválida', async () => {
    const requestsConFechaInvalida = [{
      ...mockRequests[0],
      created_at: 'fecha-invalida'
    }];
    (requestsService.getAllRequests as jest.Mock).mockResolvedValue(requestsConFechaInvalida);
    
    render(<RequestsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Sin fecha')).toBeInTheDocument();
    });
  });

  it('no muestra el contenido cuando no hay usuario', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null
    });
    
    render(<RequestsPage />);
    
    expect(screen.getByText('Cargando solicitudes...')).toBeInTheDocument();
  });

  it('maneja errores al eliminar una solicitud', async () => {
    global.confirm = jest.fn(() => true);
    const errorMessage = 'Error al eliminar la solicitud';
    (requestsService.deleteRequest as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    render(<RequestsPage />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Eliminar')).toHaveLength(2);
    });

    fireEvent.click(screen.getAllByText('Eliminar')[0]);
    
    await waitFor(() => {
      expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
    });
  });
}); 