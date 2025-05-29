'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../components/dashboard/AuthContext';
import { Claim, claimsService } from '../lib/claims';
import { Request, requestsService } from '../lib/requests';
import StatsCard from '../components/dashboard/StatsCard';
import RecentItem from '../components/dashboard/RecentItem';
import QuickAction from '../components/dashboard/QuickAction';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user) return;

        // Obtener datos específicos del usuario
        const [claimsData, requestsData] = await Promise.all([
          claimsService.getAllClaims(user.id),
          requestsService.getAllRequests(user.id)
        ]);

        setClaims(claimsData);
        setRequests(requestsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) return <div className="text-center py-8">Cargando dashboard...</div>;
  if (error) return <div className="text-red-500 text-center py-8">Error: {error}</div>;

  // Normalizar estados para comparación (case-insensitive)
  const normalizeStatus = (status: string) => status.toLowerCase();

  // Estadísticas de reclamos
  const pendingClaims = claims.filter(c => normalizeStatus(c.status) === 'pendiente').length;
  const inProgressClaims = claims.filter(c => normalizeStatus(c.status) === 'en proceso').length;
  const completedClaims = claims.filter(c => normalizeStatus(c.status) === 'completado').length;

  // Estadísticas de solicitudes
  const pendingRequests = requests.filter(r => normalizeStatus(r.status) === 'pendiente').length;
  const inProgressRequests = requests.filter(r => normalizeStatus(r.status) === 'en proceso').length;
  const completedRequests = requests.filter(r => normalizeStatus(r.status) === 'completado').length;

  // Elementos recientes (ordenados por fecha de creación)
  const recentClaims = claims
    .filter(claim => claim.created_at) // Filtrar elementos con fecha válida
    .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
    .slice(0, 3);
  
  const recentRequests = requests
    .filter(request => request.created_at) // Filtrar elementos con fecha válida
    .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
    .slice(0, 3);

  // Función para obtener el estado formateado
  const getStatusDisplay = (status: string) => {
    const normalized = normalizeStatus(status);
    switch (normalized) {
      case 'pendiente':
        return 'pendiente';
      case 'en proceso':
        return 'en proceso';
      case 'completado':
        return 'completado';
      default:
        return status;
    }
  };

  // Función para formatear fechas
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Función para obtener tiempo relativo
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Hace menos de 1 hora';
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) {
        return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
      } else {
        return formatDate(dateString);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Panel de Control</h1>
        <p className="text-sm text-gray-500">
          Bienvenido, <span className="font-medium">{user?.first_name} {user?.last_name}</span>
        </p>
      </div>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <QuickAction title="Nuevo Reclamo" icon="📝" href="/dashboard/claims/new" />
        <QuickAction title="Nueva Solicitud" icon="📋" href="/dashboard/requests/new" />
        <QuickAction title="Mis Reclamos" icon="📌" href="/dashboard/claims" />
        <QuickAction title="Mis Solicitudes" icon="📩" href="/dashboard/requests" />
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Reclamos"
          count={claims.length}
          details={`${pendingClaims} pendientes`}
          link="/dashboard/claims"
        />
        <StatsCard
          title="Reclamos Completados"
          count={completedClaims}
          details={`${claims.length > 0 ? ((completedClaims / claims.length) * 100).toFixed(0) : 0}% completado`}
          link="/dashboard/claims?status=completado"
        />
        <StatsCard
          title="Total Solicitudes"
          count={requests.length}
          details={`${pendingRequests} pendientes`}
          link="/dashboard/requests"
        />
        <StatsCard
          title="Solicitudes Completadas"
          count={completedRequests}
          details={`${requests.length > 0 ? ((completedRequests / requests.length) * 100).toFixed(0) : 0}% completado`}
          link="/dashboard/requests?status=completado"
        />
      </div>

      {/* Actividad Reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Reclamos Recientes</h3>
            <Link href="/dashboard/claims" className="text-sm text-blue-600 hover:text-blue-800">
              Ver todos → 
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {recentClaims.length > 0 ? (
              recentClaims.map((claim) => (
                <RecentItem
                  key={claim.id}
                  title={claim.subject}
                  status={getStatusDisplay(claim.status)}
                  time={getRelativeTime(claim.created_at!)}
                />
              ))
            ) : (
              <p className="text-gray-500 py-4">No hay reclamos recientes</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Solicitudes Recientes</h3>
            <Link href="/dashboard/requests" className="text-sm text-blue-600 hover:text-blue-800">
              Ver todos → 
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {recentRequests.length > 0 ? (
              recentRequests.map((request) => (
                <RecentItem
                  key={request.id}
                  title={request.subject}
                  status={getStatusDisplay(request.status)}
                  time={getRelativeTime(request.created_at!)}
                />
              ))
            ) : (
              <p className="text-gray-500 py-4">No hay solicitudes recientes</p>
            )}
          </div>
        </div>
      </div>

      {/* Resumen de estado */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen de Estado</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-2">Reclamos</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Pendientes</span>
                <span className="text-sm font-medium">{pendingClaims}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">En Proceso</span>
                <span className="text-sm font-medium">{inProgressClaims}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Completados</span>
                <span className="text-sm font-medium">{completedClaims}</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-2">Solicitudes</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Pendientes</span>
                <span className="text-sm font-medium">{pendingRequests}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">En Proceso</span>
                <span className="text-sm font-medium">{inProgressRequests}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Completadas</span>
                <span className="text-sm font-medium">{completedRequests}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
