// app/dashboard/page.tsx
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
        const token = localStorage.getItem('authToken');
        if (!token || !user) return;

        const [claimsData, requestsData] = await Promise.all([
          claimsService.getAllClaims(token),
          requestsService.getAllRequests(token)
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

  // Datos para las tarjetas de estadísticas
  const pendingClaims = claims.filter(c => c.status === 'pending').length;
  const pendingRequests = requests.filter(r => r.status === 'pending').length;

  // Elementos recientes (últimos 3 de cada tipo)
  const recentClaims = [...claims]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);
  
  const recentRequests = [...requests]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

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
        <QuickAction 
          title="Nuevo Reclamo" 
          icon="📝" 
          href="/dashboard/claims/new" 
        />
        <QuickAction 
          title="Nueva Solicitud" 
          icon="📋" 
          href="/dashboard/requests/new" 
        />
        <QuickAction 
          title="Mis Reclamos" 
          icon="📌" 
          href="/dashboard/claims" 
        />
        <QuickAction 
          title="Mis Solicitudes" 
          icon="📩" 
          href="/dashboard/requests" 
        />
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
          title="Reclamos Resueltos"
          count={claims.filter(c => c.status === 'completed').length}
          details={`${((claims.filter(c => c.status === 'completed').length / (claims.length || 1)) * 100).toFixed(0)}% completado`}
          link="/dashboard/claims?status=completed"
        />
        <StatsCard
          title="Total Solicitudes"
          count={requests.length}
          details={`${pendingRequests} pendientes`}
          link="/dashboard/requests"
        />
        <StatsCard
          title="Solicitudes Completadas"
          count={requests.filter(r => r.status === 'completed').length}
          details={`${((requests.filter(r => r.status === 'completed').length / (requests.length || 1)) * 100).toFixed(0)}% completado`}
          link="/dashboard/requests?status=completed"
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
                  status={claim.status === 'pending' ? 'pendiente' : 
                         claim.status === 'in-progress' ? 'en proceso' : 'completado'}
                  time={new Date(claim.date).toLocaleDateString()}
                  priority={
                    claim.status === 'pending' ? 'alta' : 
                    claim.status === 'in-progress' ? 'media' : 'baja'
                  }
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
                  status={request.status === 'pending' ? 'pendiente' : 
                         request.status === 'in-review' ? 'en revisión' : 'completado'}
                  time={new Date(request.date).toLocaleDateString()}
                  priority={
                    request.status === 'pending' ? 'alta' : 
                    request.status === 'in-review' ? 'media' : 'baja'
                  }
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
                <span className="text-sm font-medium">
                  {claims.filter(c => c.status === 'in-progress').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Completados</span>
                <span className="text-sm font-medium">
                  {claims.filter(c => c.status === 'completed').length}
                </span>
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
                <span className="text-sm text-gray-600">En Revisión</span>
                <span className="text-sm font-medium">
                  {requests.filter(r => r.status === 'in-review').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Completadas</span>
                <span className="text-sm font-medium">
                  {requests.filter(r => r.status === 'completed').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}