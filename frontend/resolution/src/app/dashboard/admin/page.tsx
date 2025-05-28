'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../components/dashboard/AuthContext';
import axios from 'axios';

interface UserInfo {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface Claim {
  id: number;
  user: number;
  subject: string;
  description: string;
  status: string;
  created_at: string;
  user_info: UserInfo;
}

interface Request {
  id: number;
  user: number;
  subject: string;
  description: string;
  status: string;
  created_at: string;
  user_info: UserInfo;
}

interface AdminData {
  claims: Claim[];
  requests: Request[];
  total_claims: number;
  total_requests: number;
}

export default function AdminPage() {
  const { user, refreshUser } = useAuth();
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'claims' | 'requests'>('claims');
  const [updating, setUpdating] = useState<number | null>(null);

  // Debug: Mostrar información del usuario
  console.log('Usuario actual:', user);
  console.log('is_admin:', user?.is_admin);

  useEffect(() => {
    if (!user) return;
    
    // Verificar si el usuario es administrador
    if (!user.is_admin) {
      setError('Acceso denegado. Solo administradores pueden acceder a este panel.');
      setLoading(false);
      return;
    }

    fetchAdminData();
  }, [user]);

  const fetchAdminData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin?user_id=${user.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAdminData(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError('Error al cargar los datos del panel de administrador');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (type: 'claim' | 'request', id: number, newStatus: string) => {
    if (!user) return;
    
    setUpdating(id);
    try {
      const token = localStorage.getItem('authToken');
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin`,
        {
          user_id: user.id,
          type: type,
          id: id,
          status: newStatus
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      // Recargar los datos después de la actualización
      await fetchAdminData();
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Error al actualizar el estado');
    } finally {
      setUpdating(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'en proceso':
        return 'bg-blue-100 text-blue-800';
      case 'completado':
        return 'bg-green-100 text-green-800';
      case 'rechazado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleRefreshUser = async () => {
    await refreshUser();
    window.location.reload(); // Recargar la página para aplicar los cambios
  };

  if (!user) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  if (!user.is_admin) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-xl mb-4">Acceso Denegado</div>
        <p className="mb-4">Solo los administradores pueden acceder a este panel.</p>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Si eres administrador, intenta refrescar tus datos:</p>
          <button
            onClick={handleRefreshUser}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Refrescar Datos de Usuario
          </button>
        </div>
        <div className="mt-4 p-4 bg-gray-100 rounded text-left text-sm">
          <p><strong>Debug Info:</strong></p>
          <p>User ID: {user?.id}</p>
          <p>is_admin: {user?.is_admin ? 'true' : 'false'}</p>
          <p>Email: {user?.email}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-8">Cargando panel de administrador...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-8">{error}</div>;
  }

  if (!adminData) {
    return <div className="text-center py-8">No hay datos disponibles.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Panel de Administrador</h1>
      
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Total de Reclamos</h3>
          <p className="text-3xl font-bold text-blue-600">{adminData.total_claims}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Total de Solicitudes</h3>
          <p className="text-3xl font-bold text-green-600">{adminData.total_requests}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('claims')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'claims'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Reclamos ({adminData.total_claims})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'requests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Solicitudes ({adminData.total_requests})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'claims' && (
            <div className="space-y-4">
              {adminData.claims.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay reclamos disponibles.</p>
              ) : (
                adminData.claims.map((claim) => (
                  <div key={claim.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800">{claim.subject}</h4>
                        <p className="text-sm text-gray-600">
                          Por: {claim.user_info.first_name} {claim.user_info.last_name} ({claim.user_info.email})
                        </p>
                        <p className="text-sm text-gray-500">{formatDate(claim.created_at)}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(claim.status)}`}>
                        {claim.status}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-4">{claim.description}</p>
                    <div className="flex gap-2">
                      {claim.status !== 'Completado' && (
                        <button
                          onClick={() => updateStatus('claim', claim.id, 'Completado')}
                          disabled={updating === claim.id}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
                        >
                          {updating === claim.id ? 'Actualizando...' : 'Marcar como Completado'}
                        </button>
                      )}
                      {claim.status === 'Pendiente' && (
                        <button
                          onClick={() => updateStatus('claim', claim.id, 'En Proceso')}
                          disabled={updating === claim.id}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
                        >
                          Marcar En Proceso
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="space-y-4">
              {adminData.requests.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay solicitudes disponibles.</p>
              ) : (
                adminData.requests.map((request) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800">{request.subject}</h4>
                        <p className="text-sm text-gray-600">
                          Por: {request.user_info.first_name} {request.user_info.last_name} ({request.user_info.email})
                        </p>
                        <p className="text-sm text-gray-500">{formatDate(request.created_at)}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-4">{request.description}</p>
                    <div className="flex gap-2">
                      {request.status !== 'Completado' && (
                        <button
                          onClick={() => updateStatus('request', request.id, 'Completado')}
                          disabled={updating === request.id}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
                        >
                          {updating === request.id ? 'Actualizando...' : 'Marcar como Completado'}
                        </button>
                      )}
                      {request.status === 'Pendiente' && (
                        <button
                          onClick={() => updateStatus('request', request.id, 'En Proceso')}
                          disabled={updating === request.id}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
                        >
                          Marcar En Proceso
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 